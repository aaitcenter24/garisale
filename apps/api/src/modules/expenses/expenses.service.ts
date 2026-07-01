import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async createVehicleExpense(dealerId: string, userId: string, role: string, data: any) {
    if (role !== UserRole.dealer_owner && role !== UserRole.manager) {
      throw new ForbiddenException('Only Owners and Managers can add vehicle expenses.');
    }

    const { vehicle_id, category_id, amount, vendor, invoice_no, receipt_url, notes } = data;

    // Verify vehicle exists and belongs to dealership
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicle_id },
    });
    if (!vehicle || vehicle.dealership_id !== dealerId) {
      throw new NotFoundException('Vehicle not found.');
    }

    const expense = await this.prisma.vehicleExpense.create({
      data: {
        dealership_id: dealerId,
        vehicle_id,
        category_id,
        amount,
        vendor,
        invoice_no,
        receipt_url,
        notes,
        created_by: userId,
      },
    });

    return expense;
  }

  async createOperationalExpense(dealerId: string, userId: string, role: string, data: any) {
    if (role !== UserRole.dealer_owner) {
      throw new ForbiddenException('Only Owners can add operational expenses.');
    }

    const { category_id, amount, payment_method, reference_no, receipt_url, notes, recurring, recur_cycle } = data;

    const expense = await this.prisma.operationalExpense.create({
      data: {
        dealership_id: dealerId,
        category_id,
        amount,
        payment_method: payment_method || 'cash',
        reference_no,
        receipt_url,
        notes,
        recurring: recurring || false,
        recur_cycle,
        created_by: userId,
      },
    });

    return expense;
  }

  async getVehicleExpenses(dealerId: string, vehicleId: string, role: string) {
    if (role === UserRole.salesperson as string) {
      // Hidden from Salesperson (return null/empty array depending on context, we will return null to prevent access)
      return null;
    }

    // Verify vehicle exists first
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle || vehicle.dealership_id !== dealerId) {
      throw new NotFoundException('Vehicle not found.');
    }

    return this.prisma.vehicleExpense.findMany({
      where: { vehicle_id: vehicleId },
    });
  }

  async getOperationalExpenses(dealerId: string, role: string) {
    if (role === UserRole.salesperson as string) {
      throw new ForbiddenException('Salespersons cannot access operational expenses.');
    }

    if (role === UserRole.manager as string) {
      // Manager views totals only (no line items, no vendors, no receipts)
      // Group by category_id and sum amount
      const list = await this.prisma.operationalExpense.findMany({
        where: { dealership_id: dealerId },
      });

      const grouped: { [key: string]: number } = {};
      list.forEach((item: any) => {
        const catId = item.category_id;
        const amt = Number(item.amount);
        grouped[catId] = (grouped[catId] || 0) + amt;
      });

      return Object.entries(grouped).map(([category_id, total]) => ({
        category_id,
        total,
      }));
    }

    // Owner views full detail
    return this.prisma.operationalExpense.findMany({
      where: { dealership_id: dealerId },
    });
  }

  async getProfitCalculator(dealerId: string, vehicleId: string, role: string) {
    if (role !== UserRole.dealer_owner) {
      // Visible only to Owner
      return null;
    }

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle || vehicle.dealership_id !== dealerId) {
      throw new NotFoundException('Vehicle not found.');
    }

    // Fetch all deals for this vehicle that are not cancelled
    const deals = await this.prisma.deal.findMany({
      where: {
        vehicle_id: vehicleId,
        status: { not: 'cancelled' },
      },
    });

    const askingPrice = Number(vehicle.asking_price) || 0;
    const acqCost = Number(vehicle.acquisition_cost) || 0;
    const reconTotal = Number(vehicle.recon_total) || 0;

    // Deal level costs (discounts or additional deal level costs)
    let dealLevelCosts = 0;
    deals.forEach((deal: any) => {
      const listPrice = Number(deal.list_price) || 0;
      const salePrice = Number(deal.sale_price) || 0;
      if (listPrice > salePrice) {
        dealLevelCosts += (listPrice - salePrice);
      }
    });

    const netProfitEstimate = askingPrice - acqCost - reconTotal - dealLevelCosts;

    return {
      asking_price: askingPrice,
      acquisition_cost: acqCost,
      recon_total: reconTotal,
      deal_level_costs: dealLevelCosts,
      net_profit_estimate: netProfitEstimate,
    };
  }
}
