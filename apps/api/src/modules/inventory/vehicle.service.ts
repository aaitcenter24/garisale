import { Injectable, NotFoundException, UnprocessableEntityException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { VinService } from '../../common/services/vin.service';
import { R2Service } from '../../common/services/r2.service';
import { RedisService } from '../redis/redis.service';
import { VehicleStatus, UserRole, VehicleCondition } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as sharp from 'sharp';
import * as crypto from 'crypto';

@Injectable()
export class VehicleService {
  private readonly logger = new Logger(VehicleService.name);

  constructor(
    private prisma: PrismaService,
    private vinService: VinService,
    private r2Service: R2Service,
    private redis: RedisService,
    private eventEmitter: EventEmitter2,
  ) {}

  // Helper to mask fields based on role
  maskVehicleFields(vehicle: any, role: string) {
    if (!vehicle) return vehicle;
    const masked = { ...vehicle };

    // Format Decimal values to numbers or format strings if needed
    masked.asking_price = masked.asking_price !== undefined && masked.asking_price !== null ? Number(masked.asking_price) : null;
    masked.acquisition_cost = masked.acquisition_cost !== undefined && masked.acquisition_cost !== null ? Number(masked.acquisition_cost) : null;
    masked.recon_total = masked.recon_total !== undefined && masked.recon_total !== null ? Number(masked.recon_total) : 0;
    masked.net_profit_estimate = masked.net_profit_estimate !== undefined && masked.net_profit_estimate !== null ? Number(masked.net_profit_estimate) : null;
    masked.floor_plan_cost = masked.floor_plan_cost !== undefined && masked.floor_plan_cost !== null ? Number(masked.floor_plan_cost) : null;

    if (role === UserRole.manager as string) {
      masked.acquisition_cost = null;
    } else if (role === UserRole.salesperson as string) {
      masked.acquisition_cost = null;
      masked.recon_total = null;
      masked.net_profit_estimate = null;
      masked.floor_plan_cost = null;
      masked.gross_profit = null;
    }
    return masked;
  }

  async findOne(id: string, role: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: { expenses: true },
    });
    if (!vehicle) {
      throw new NotFoundException('VEHICLE_NOT_FOUND');
    }
    return this.maskVehicleFields(vehicle, role);
  }

  async create(dealerId: string, userId: string, role: string, data: any) {
    if (role === UserRole.salesperson as string) {
      // Salesperson CAN create vehicles according to Test #3: "Salesperson creates vehicle -> 201"
      // So we allow all roles to create.
    }

    const { vin, photos, ...vehicleData } = data;

    // 1. VIN Decode & Validation
    let make = data.make || 'Unknown';
    let model = data.model || 'Unknown';
    let year = data.year || 2018;
    if (vin) {
      // Verify duplicate VIN per dealer
      const duplicate = await this.prisma.vehicle.findFirst({
        where: { vin, dealership_id: dealerId },
      });
      if (duplicate) {
        throw new UnprocessableEntityException('VIN_ALREADY_EXISTS_FOR_DEALER');
      }

      const decoded = await this.vinService.decodeVin(vin);
      make = decoded.make;
      model = decoded.model;
      year = decoded.year;
    }

    // 2. Auto-generate Stock Number (SK-YYYYMM-XXXX)
    const now = new Date();
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const counterKey = `stock_counter:${dealerId}:${yyyymm}`;
    const counter = await this.redis.incr(counterKey);
    const stockNo = `SK-${yyyymm}-${String(counter).padStart(4, '0')}`;

    // 3. Insert Vehicle record
    const vehicle = await this.prisma.vehicle.create({
      data: {
        ...vehicleData,
        vin,
        make,
        model,
        year,
        stock_no: stockNo,
        dealership_id: dealerId,
        photos: photos || [],
        photo_count: photos ? photos.length : 0,
        status: VehicleStatus.acquired,
      },
    });

    this.eventEmitter.emit('inventory.vehicle.created', {
      vehicleId: vehicle.id,
      dealershipId: dealerId,
    });

    return this.maskVehicleFields(vehicle, role);
  }

  async update(id: string, dealerId: string, userId: string, role: string, data: any) {
    if (role === UserRole.salesperson as string) {
      // Salespersons are forbidden from modifying asking_price, status, etc.
      // Throw 403
      throw new ForbiddenException('Salespersons cannot modify vehicle details.');
    }

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });
    if (!vehicle || vehicle.dealership_id !== dealerId) {
      throw new NotFoundException('VEHICLE_NOT_FOUND');
    }

    // Check status transition
    if (data.status && data.status !== vehicle.status) {
      this.validateStatusTransition(vehicle.status, data.status);

      // Log status transition history
      await this.prisma.vehicleStatusHistory.create({
        data: {
          vehicle_id: id,
          dealership_id: dealerId,
          from_status: vehicle.status,
          to_status: data.status,
          changed_by: userId,
          reason: data.status_transition_reason || 'Status updated via API',
        },
      });
    }

    // Check marketplace publication conditions (min 4 photos)
    const photosCount = Array.isArray(vehicle.photos) ? vehicle.photos.length : 0;
    if (data.marketplace_published === true && photosCount < 4) {
      throw new UnprocessableEntityException('MIN_PHOTOS_REQUIRED');
    }

    const updated = await this.prisma.vehicle.update({
      where: { id },
      data,
    });

    this.eventEmitter.emit('inventory.vehicle.updated', {
      vehicleId: updated.id,
      dealershipId: dealerId,
    });

    return this.maskVehicleFields(updated, role);
  }

  private validateStatusTransition(oldStatus: VehicleStatus, newStatus: VehicleStatus) {
    if (oldStatus === newStatus) return;

    if (oldStatus === VehicleStatus.sold || oldStatus === VehicleStatus.scrapped) {
      throw new UnprocessableEntityException({
        code: 'VEHICLE_SOLD_IMMUTABLE',
        message: 'Cannot change status of a sold or scrapped vehicle',
      });
    }

    const VALID_TRANSITIONS: { [key in VehicleStatus]?: VehicleStatus[] } = {
      [VehicleStatus.acquired]: [VehicleStatus.in_recon, VehicleStatus.available],
      [VehicleStatus.in_recon]: [VehicleStatus.available, VehicleStatus.acquired],
      [VehicleStatus.available]: [VehicleStatus.reserved, VehicleStatus.in_recon, VehicleStatus.scrapped],
      [VehicleStatus.reserved]: [VehicleStatus.available, VehicleStatus.sold],
    };

    const allowed = VALID_TRANSITIONS[oldStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new UnprocessableEntityException({
        code: 'VEHICLE_STATUS_TRANSITION_INVALID',
        message: `Invalid status transition from ${oldStatus} to ${newStatus}`,
      });
    }
  }

  async uploadPhoto(id: string, dealerId: string, fileBuffer: Buffer, originalName: string, role: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });
    if (!vehicle || vehicle.dealership_id !== dealerId) {
      throw new NotFoundException('VEHICLE_NOT_FOUND');
    }

    const currentPhotos = Array.isArray(vehicle.photos) ? [...vehicle.photos] : [];
    if (currentPhotos.length >= 30) {
      throw new UnprocessableEntityException('MAX_PHOTOS_EXCEEDED');
    }

    // Compress photo using Sharp (WebP, max width 1200px, quality 82)
    let processedBuffer = fileBuffer;
    try {
      processedBuffer = await ((sharp.default || sharp) as any)(fileBuffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
    } catch (err: any) {
      this.logger.error(`Sharp compression failed: ${err.message}. Retaining original format.`);
    }

    const key = `inventory/${dealerId}/vehicles/${id}/photos/${crypto.randomUUID()}.webp`;
    const photoUrl = await this.r2Service.uploadFile(processedBuffer, key, 'image/webp');

    currentPhotos.push(photoUrl);

    const updated = await this.prisma.vehicle.update({
      where: { id },
      data: {
        photos: currentPhotos,
        photo_count: currentPhotos.length,
      },
    });

    this.eventEmitter.emit('inventory.vehicle.updated', {
      vehicleId: updated.id,
      dealershipId: dealerId,
    });

    return this.maskVehicleFields(updated, role);
  }

  async delete(id: string, dealerId: string, role: string) {
    if (role === UserRole.salesperson as string) {
      throw new ForbiddenException('Salespersons cannot delete vehicles.');
    }

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });
    if (!vehicle || vehicle.dealership_id !== dealerId) {
      throw new NotFoundException('VEHICLE_NOT_FOUND');
    }

    const deleted = await this.prisma.vehicle.delete({
      where: { id },
    });

    this.eventEmitter.emit('inventory.vehicle.deleted', {
      vehicleId: deleted.id,
      dealershipId: dealerId,
    });

    return this.maskVehicleFields(deleted, role);
  }

  async forceSync(id: string, dealerId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });
    if (!vehicle || vehicle.dealership_id !== dealerId) {
      throw new NotFoundException('Vehicle not found');
    }
    
    this.eventEmitter.emit('inventory.vehicle.updated', {
      vehicleId: id,
      dealershipId: dealerId,
    });

    return { synced: true, vehicle_id: id };
  }

  async createReconAssessment(dealerId: string, vehicleId: string, data: any, userId: string) {
    return this.prisma.reconAssessment.create({
      data: {
        dealership_id: dealerId,
        vehicle_id: vehicleId,
        assessed_by: userId,
        ...data,
      },
    });
  }

  async createReconTask(dealerId: string, vehicleId: string, data: any, userId: string) {
    let assessment = await this.prisma.reconAssessment.findUnique({
      where: { vehicle_id: vehicleId },
    });

    if (!assessment) {
      assessment = await this.prisma.reconAssessment.create({
        data: {
          dealership_id: dealerId,
          vehicle_id: vehicleId,
          assessed_by: userId,
        },
      });
    }

    const task = await this.prisma.reconTask.create({
      data: {
        dealership_id: dealerId,
        vehicle_id: vehicleId,
        assessment_id: assessment.id,
        category: data.category,
        description: data.description,
        estimated_cost: data.estimated_cost || 0,
        status: 'pending',
        created_by: userId,
      },
    });
    return task;
  }

  async completeReconTask(dealerId: string, userId: string, taskId: string, actualCost: number) {
    const task = await this.prisma.reconTask.findUnique({
      where: { id: taskId },
    });
    if (!task || task.dealership_id !== dealerId) {
      throw new NotFoundException('Task not found.');
    }

    const updatedTask = await this.prisma.reconTask.update({
      where: { id: taskId },
      data: {
        status: 'complete',
        actual_cost: actualCost,
        completed_at: new Date(),
      },
    });

    // Auto-create Type 1 vehicle_expense
    // Fetch a default Category for maintenance
    let category = await this.prisma.expenseCategory.findFirst({
      where: { type: 'vehicle', slug: 'reconditioning' },
    });

    if (!category) {
      category = await this.prisma.expenseCategory.create({
        data: {
          type: 'vehicle',
          name: 'Reconditioning',
          slug: 'reconditioning',
        },
      });
    }

    await this.prisma.vehicleExpense.create({
      data: {
        dealership_id: dealerId,
        vehicle_id: task.vehicle_id,
        recon_task_id: taskId,
        category_id: category.id,
        amount: actualCost,
        notes: `Auto-generated from completed task: ${task.description}`,
        created_by: userId,
      },
    });

    // Check if all tasks for this vehicle are complete
    const incompleteTasks = await this.prisma.reconTask.findMany({
      where: {
        vehicle_id: task.vehicle_id,
        status: { not: 'complete' },
      },
    });

    if (incompleteTasks.length === 0) {
      this.logger.log(`All reconditioning tasks completed for vehicle: ${task.vehicle_id}`);
    }

    return updatedTask;
  }
}
