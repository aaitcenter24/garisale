import { Injectable, NotFoundException, ForbiddenException, UnprocessableEntityException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PdfService } from '../../common/services/pdf.service';
import { R2Service } from '../../common/services/r2.service';
import { DealStatus, VehicleStatus, UserRole } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
    private r2Service: R2Service,
    private eventEmitter: EventEmitter2,
  ) {}

  maskDealFields(deal: any, role: string) {
    if (!deal) return deal;
    const masked = { ...deal };

    if (masked.sale_price) masked.sale_price = Number(masked.sale_price);
    if (masked.list_price) masked.list_price = Number(masked.list_price);
    if (masked.discount_amount) masked.discount_amount = Number(masked.discount_amount);
    if (masked.gross_profit) masked.gross_profit = Number(masked.gross_profit);
    if (masked.balance_due) masked.balance_due = Number(masked.balance_due);
    if (masked.total_paid) masked.total_paid = Number(masked.total_paid);

    if (role === UserRole.manager as string || role === UserRole.salesperson as string) {
      masked.gross_profit = null;
    }
    return masked;
  }

  async findOne(id: string, dealerId: string, userId: string, role: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        vehicle: true,
        customer: true,
        salesperson: true,
        payments: true,
      },
    });

    if (!deal || deal.dealership_id !== dealerId) {
      throw new NotFoundException('DEAL_NOT_FOUND');
    }

    if (role === UserRole.salesperson as string && deal.salesperson_id !== userId) {
      // Salesperson views own deals only
      throw new ForbiddenException('Access denied to other salespeople deals.');
    }

    return this.maskDealFields(deal, role);
  }

  async createDeal(dealerId: string, userId: string, role: string, data: any) {
    const { lead_id, vehicle_id, sale_price, list_price, deal_type, trade_in_vehicle_id, trade_in_value } = data;

    // Verify lead and vehicle belong to dealership
    const lead = await this.prisma.lead.findUnique({ where: { id: lead_id } });
    if (!lead || lead.dealership_id !== dealerId) {
      throw new NotFoundException('Lead not found.');
    }

    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicle_id } });
    if (!vehicle || vehicle.dealership_id !== dealerId) {
      throw new NotFoundException('Vehicle not found.');
    }

    if (vehicle.status === VehicleStatus.sold || vehicle.status === VehicleStatus.scrapped) {
      throw new UnprocessableEntityException('Vehicle is not available.');
    }

    const discountAmount = Number(list_price) - Number(sale_price);

    // Reserve vehicle
    await this.prisma.vehicle.update({
      where: { id: vehicle_id },
      data: { status: VehicleStatus.reserved },
    });

    const deal = await this.prisma.deal.create({
      data: {
        dealership_id: dealerId,
        lead_id,
        vehicle_id,
        customer_id: lead.customer_id as string,
        salesperson_id: userId, // Created by salesperson/user
        sale_price,
        list_price,
        discount_amount: discountAmount,
        deal_type: deal_type || 'cash',
        trade_in_vehicle_id,
        trade_in_value: trade_in_value || 0,
        balance_due: sale_price,
        status: DealStatus.draft,
      },
    });

    this.eventEmitter.emit('sales.deal.created', {
      dealId: deal.id,
      dealershipId: dealerId,
      vehicleId: vehicle_id,
    });

    return this.maskDealFields(deal, role);
  }

  async approveDeal(id: string, dealerId: string, userId: string, role: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
    });
    if (!deal || deal.dealership_id !== dealerId) {
      throw new NotFoundException('Deal not found.');
    }

    const dealership = await this.prisma.dealership.findUnique({
      where: { id: dealerId },
    });
    if (!dealership) {
      throw new NotFoundException('Dealership not found.');
    }

    const salePrice = Number(deal.sale_price);
    const listPrice = Number(deal.list_price);
    const discountPct = (listPrice - salePrice) / listPrice;
    const thresholdPct = Number(dealership.discount_threshold_pct || 10) / 100;

    if (discountPct > thresholdPct) {
      // Above threshold: Only Owner can approve
      if (role !== UserRole.dealer_owner as string) {
        throw new ForbiddenException('Only Owners can approve deals with discounts above the threshold.');
      }
    } else {
      // Within threshold: Manager or Owner can approve
      if (role !== UserRole.dealer_owner as string && role !== UserRole.manager as string) {
        throw new ForbiddenException('Only Owners and Managers can approve deals.');
      }
    }

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: deal.vehicle_id },
    });
    const acqCost = Number(vehicle?.acquisition_cost || 0);
    const reconTotal = Number(vehicle?.recon_total || 0);
    const grossProfit = salePrice - acqCost - reconTotal;

    const updated = await this.prisma.deal.update({
      where: { id },
      data: {
        status: DealStatus.approved,
        approved_at: new Date(),
        manager_approval_id: userId,
        gross_profit: grossProfit,
      },
    });

    return this.maskDealFields(updated, role);
  }

  async deliverDeal(id: string, dealerId: string, userId: string, role: string) {
    if (role !== UserRole.dealer_owner as string && role !== UserRole.manager as string) {
      throw new ForbiddenException('Only Owners and Managers can deliver deals.');
    }

    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
      },
    });
    if (!deal || deal.dealership_id !== dealerId) {
      throw new NotFoundException('Deal not found.');
    }

    if (deal.status !== DealStatus.approved) {
      throw new UnprocessableEntityException('Deal must be approved before delivery.');
    }

    // Set vehicle status to sold
    await this.prisma.vehicle.update({
      where: { id: deal.vehicle_id },
      data: {
        status: VehicleStatus.sold,
        sold_at: new Date(),
      },
    });

    // Generate Bill of Sale PDF
    const nextVersion = deal.bill_of_sale_version + 1;
    const pdfUrl = await this.generateAndStoreBillOfSale(deal, nextVersion);

    const updated = await this.prisma.deal.update({
      where: { id },
      data: {
        status: DealStatus.delivered,
        delivered_at: new Date(),
        bill_of_sale_url: pdfUrl,
        bill_of_sale_version: nextVersion,
      },
    });

    this.eventEmitter.emit('sales.deal.delivered', {
      dealId: updated.id,
      dealershipId: dealerId,
      vehicleId: updated.vehicle_id,
    });

    return this.maskDealFields(updated, role);
  }

  async cancelDeal(id: string, dealerId: string, userId: string, role: string, reason: string) {
    if (role !== UserRole.dealer_owner as string && role !== UserRole.manager as string) {
      throw new ForbiddenException('Only Owners and Managers can cancel deals.');
    }

    const deal = await this.prisma.deal.findUnique({
      where: { id },
    });
    if (!deal || deal.dealership_id !== dealerId) {
      throw new NotFoundException('Deal not found.');
    }

    // Restore vehicle to available
    await this.prisma.vehicle.update({
      where: { id: deal.vehicle_id },
      data: { status: VehicleStatus.available },
    });

    const updated = await this.prisma.deal.update({
      where: { id },
      data: {
        status: DealStatus.cancelled,
        cancelled_at: new Date(),
        cancellation_reason: reason || 'Deal cancelled',
      },
    });

    this.eventEmitter.emit('sales.deal.cancelled', {
      dealId: updated.id,
      dealershipId: dealerId,
      vehicleId: updated.vehicle_id,
    });

    return this.maskDealFields(updated, role);
  }

  async recordPayment(id: string, dealerId: string, userId: string, role: string, data: any) {
    if (role !== UserRole.dealer_owner as string && role !== UserRole.manager as string) {
      throw new ForbiddenException('Only Owners and Managers can record payments.');
    }

    const deal = await this.prisma.deal.findUnique({
      where: { id },
    });
    if (!deal || deal.dealership_id !== dealerId) {
      throw new NotFoundException('Deal not found.');
    }

    const amount = Number(data.amount);

    await this.prisma.dealPayment.create({
      data: {
        dealership_id: dealerId,
        deal_id: id,
        amount,
        payment_method: data.payment_method || 'cash',
        reference_no: data.reference_no,
        recorded_by: userId,
      },
    });

    // Recompute total paid and balance due
    const payments = await this.prisma.dealPayment.findMany({
      where: { deal_id: id },
    });

    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const balanceDue = Number(deal.sale_price) - totalPaid;

    const updated = await this.prisma.deal.update({
      where: { id },
      data: {
        total_paid: totalPaid,
        balance_due: balanceDue,
      },
    });

    return this.maskDealFields(updated, role);
  }

  private async generateAndStoreBillOfSale(deal: any, version: number): Promise<string> {
    const dealership = await this.prisma.dealership.findUnique({
      where: { id: deal.dealership_id },
    });

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .section { margin-top: 30px; }
            .section-title { font-size: 16px; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .label { font-weight: bold; }
            .totals { margin-top: 40px; border-top: 2px solid #333; padding-top: 10px; text-align: right; }
            .total-line { font-size: 16px; margin-bottom: 5px; }
            .grand-total { font-size: 20px; font-weight: bold; color: #111; }
            .signatures { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 50px; }
            .sig-line { border-top: 1px solid #333; text-align: center; margin-top: 40px; padding-top: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${dealership?.business_name || 'Garisale Dealer'}</div>
            <div>Phone: ${dealership?.phone || ''} | Address: ${dealership?.district || ''}, Bangladesh</div>
            <div style="margin-top: 15px; font-size: 18px; font-weight: bold;">BILL OF SALE</div>
            <div>Deal Reference: ${deal.id} | Version: ${version}</div>
          </div>
          
          <div class="section grid">
            <div>
              <div class="section-title">BUYER INFORMATION</div>
              <div><span class="label">Name:</span> ${deal.customer?.full_name || ''}</div>
              <div><span class="label">Phone:</span> ${deal.customer?.phone || ''}</div>
              <div><span class="label">Email:</span> ${deal.customer?.email || ''}</div>
            </div>
            <div>
              <div class="section-title">DEALERSHIP DETAILS</div>
              <div><span class="label">Dealer:</span> ${dealership?.business_name || ''}</div>
              <div><span class="label">Date:</span> ${new Date().toLocaleDateString()}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">VEHICLE DETAILS</div>
            <div class="grid">
              <div><span class="label">Make/Model:</span> ${deal.vehicle?.make || ''} ${deal.vehicle?.model || ''}</div>
              <div><span class="label">Year:</span> ${deal.vehicle?.year || ''}</div>
              <div><span class="label">VIN:</span> ${deal.vehicle?.vin || ''}</div>
              <div><span class="label">Stock No:</span> ${deal.vehicle?.stock_no || ''}</div>
            </div>
          </div>

          <div class="section totals">
            <div class="total-line"><span class="label">List Price:</span> BDT ${Number(deal.list_price).toLocaleString()}</div>
            <div class="total-line"><span class="label">Discount:</span> BDT ${Number(deal.discount_amount).toLocaleString()}</div>
            <div class="total-line grand-total"><span class="label">Sale Price:</span> BDT ${Number(deal.sale_price).toLocaleString()}</div>
          </div>

          <div class="signatures">
            <div class="sig-line">Buyer Signature</div>
            <div class="sig-line">Authorized Dealer Signature</div>
          </div>
        </body>
      </html>
    `;

    const pdfBuffer = await this.pdfService.generatePdfFromHtml(htmlContent);
    const key = `invoices/${deal.dealership_id}/deals/${deal.id}/bill_of_sale_${version}.pdf`;
    
    return this.r2Service.uploadFile(pdfBuffer, key, 'application/pdf');
  }

  async listDeals(dealerId: string, userId: string, role: string) {
    if (role === UserRole.dealer_owner as string || role === UserRole.manager as string) {
      const deals = await this.prisma.deal.findMany({
        where: { dealership_id: dealerId },
      });
      return deals.map(deal => this.maskDealFields(deal, role));
    }

    // Salesperson: own deals only
    const deals = await this.prisma.deal.findMany({
      where: { dealership_id: dealerId, salesperson_id: userId },
    });
    return deals.map(deal => this.maskDealFields(deal, role));
  }
}
