import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { TokenService } from '../auth/token.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RedisService } from '../redis/redis.service';
import { authenticator } from 'otplib';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private tokenService: TokenService,
    private eventEmitter: EventEmitter2,
    private redis: RedisService,
  ) {}

  async getDealers() {
    return this.prisma.dealership.findMany();
  }

  async verifyFreshTotp(userId: string, totpCode: string): Promise<void> {
    if (!totpCode) {
      throw new BadRequestException('TOTP_REQUIRED');
    }

    const usedKey = `totp_used:${totpCode}`;
    const alreadyUsed = await this.redis.get(usedKey);
    if (alreadyUsed) {
      throw new ForbiddenException('TOTP_ALREADY_USED');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.totp_secret || !user.totp_enabled) {
      throw new ForbiddenException('TOTP_NOT_ENABLED');
    }

    const isValid = authenticator.verify({
      token: totpCode,
      secret: user.totp_secret,
    });

    if (!isValid) {
      throw new ForbiddenException('INVALID_TOTP');
    }

    // Lock code for 90s to prevent replay
    await this.redis.set(usedKey, 'used', 90);
  }

  async approveDealer(id: string, role: string, actorId: string, actorIp: string) {
    const allowed = ['super_admin', 'operations_manager'];
    if (!allowed.includes(role)) {
      throw new ForbiddenException('Insufficient role permissions.');
    }
    const dealer = await this.prisma.dealership.findUnique({ where: { id } });
    if (!dealer) throw new NotFoundException('Dealer not found');

    const updated = await this.prisma.dealership.update({
      where: { id },
      data: { status: 'active' },
    });

    // Send welcome SMS
    await this.eventEmitter.emit('automation.send_sms', {
      to: updated.phone,
      body: `Welcome to Garisale Dealer OS! Your account has been approved. Log in at app.garisale.com`,
      dealership_id: updated.id,
    });

    this.eventEmitter.emit('dealer.status_changed', {
      dealershipId: updated.id,
      status: 'active',
    });

    await this.prisma.platformAuditLog.create({
      data: {
        actor_id: actorId,
        actor_ip: actorIp,
        action: 'approve_dealer',
        before_state: JSON.stringify(dealer),
        after_state: JSON.stringify(updated),
      },
    });

    return updated;
  }

  async suspendDealer(id: string, role: string, actorId: string, actorIp: string, reason: string) {
    const allowed = ['super_admin', 'operations_manager'];
    if (!allowed.includes(role)) {
      throw new ForbiddenException('Insufficient role permissions.');
    }
    const dealer = await this.prisma.dealership.findUnique({ where: { id } });
    if (!dealer) throw new NotFoundException('Dealer not found');

    const updated = await this.prisma.dealership.update({
      where: { id },
      data: { status: 'suspended' },
    });

    // Hide marketplace listings immediately
    await this.prisma.marketplaceListing.updateMany({
      where: { dealership_id: id },
      data: { status: 'hidden' as any },
    });

    this.eventEmitter.emit('dealer.status_changed', {
      dealershipId: updated.id,
      status: 'suspended',
      reason,
    });

    await this.prisma.platformAuditLog.create({
      data: {
        actor_id: actorId,
        actor_ip: actorIp,
        action: 'suspend_dealer',
        before_state: JSON.stringify(dealer),
        after_state: JSON.stringify(updated),
      },
    });

    return updated;
  }

  async reinstateDealer(id: string, role: string, actorId: string, actorIp: string) {
    const allowed = ['super_admin', 'operations_manager'];
    if (!allowed.includes(role)) {
      throw new ForbiddenException('Insufficient role permissions.');
    }
    const dealer = await this.prisma.dealership.findUnique({ where: { id } });
    if (!dealer) throw new NotFoundException('Dealer not found');

    const updated = await this.prisma.dealership.update({
      where: { id },
      data: { status: 'active' },
    });

    // Restore marketplace listings immediately
    await this.prisma.marketplaceListing.updateMany({
      where: { dealership_id: id },
      data: { status: 'active' as any },
    });

    this.eventEmitter.emit('dealer.status_changed', {
      dealershipId: updated.id,
      status: 'active',
    });

    await this.prisma.platformAuditLog.create({
      data: {
        actor_id: actorId,
        actor_ip: actorIp,
        action: 'reinstate_dealer',
        before_state: JSON.stringify(dealer),
        after_state: JSON.stringify(updated),
      },
    });

    return updated;
  }

  async terminateDealer(id: string, role: string, actorId: string, actorIp: string, totpCode: string) {
    if (role !== 'super_admin') {
      throw new ForbiddenException('Only Super Admin can terminate a dealer.');
    }

    // Enforce fresh TOTP re-authentication
    await this.verifyFreshTotp(actorId, totpCode);

    const dealer = await this.prisma.dealership.findUnique({ where: { id } });
    if (!dealer) throw new NotFoundException('Dealer not found');

    const updated = await this.prisma.dealership.update({
      where: { id },
      data: { status: 'terminated' },
    });

    // Hide marketplace listings immediately
    await this.prisma.marketplaceListing.updateMany({
      where: { dealership_id: id },
      data: { status: 'hidden' as any },
    });

    this.eventEmitter.emit('dealer.status_changed', {
      dealershipId: updated.id,
      status: 'terminated',
    });

    await this.prisma.platformAuditLog.create({
      data: {
        actor_id: actorId,
        actor_ip: actorIp,
        action: 'terminate_dealer',
        before_state: JSON.stringify(dealer),
        after_state: JSON.stringify(updated),
      },
    });

    return updated;
  }

  async getC2cModerationQueue(role: string) {
    const allowed = ['super_admin', 'operations_manager', 'content_moderator'];
    if (!allowed.includes(role)) {
      throw new ForbiddenException('Insufficient role permissions.');
    }

    const listings = await this.prisma.marketplaceListing.findMany({
      where: { seller_type: 'private', status: 'under_review' },
      include: { vehicle: true },
    });

    return listings.map(listing => {
      const checks = {
        photos: listing.photo_count >= 4,
        priceSanity: Number(listing.asking_price) >= 10000 && Number(listing.asking_price) <= 500000000,
        specsMatch: !!(listing.make && listing.model && listing.year > 1900),
        noDuplicateVin: true,
      };

      const autoPassed = checks.photos && checks.priceSanity && checks.specsMatch && checks.noDuplicateVin;

      return {
        listing,
        checks,
        autoPassed,
      };
    });
  }

  async approveC2cListing(id: string, role: string, actorId: string, actorIp: string) {
    const allowed = ['super_admin', 'operations_manager', 'content_moderator'];
    if (!allowed.includes(role)) {
      throw new ForbiddenException('Insufficient role permissions.');
    }
    const listing = await this.prisma.marketplaceListing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');

    const updated = await this.prisma.marketplaceListing.update({
      where: { id },
      data: { status: 'active' },
    });

    await this.prisma.platformAuditLog.create({
      data: {
        actor_id: actorId,
        actor_ip: actorIp,
        action: 'approve_c2c_listing',
        before_state: JSON.stringify(listing),
        after_state: JSON.stringify(updated),
      },
    });

    return updated;
  }

  async rejectC2cListing(id: string, role: string, reasonCode: string, actorId: string, actorIp: string) {
    const allowed = ['super_admin', 'operations_manager', 'content_moderator'];
    if (!allowed.includes(role)) {
      throw new ForbiddenException('Insufficient role permissions.');
    }

    const listing = await this.prisma.marketplaceListing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');

    const updated = await this.prisma.marketplaceListing.update({
      where: { id },
      data: { status: 'rejected' as any },
    });

    await this.prisma.platformAuditLog.create({
      data: {
        actor_id: actorId,
        actor_ip: actorIp,
        action: `reject_c2c_listing:${reasonCode}`,
        before_state: JSON.stringify(listing),
        after_state: JSON.stringify(updated),
      },
    });

    return updated;
  }

  async getDealerBilling(id: string, role: string) {
    if (role === 'content_moderator') {
      throw new ForbiddenException('Content moderators cannot view dealer billing.');
    }
    return { dealership_id: id, billing_status: 'paid', invoice_total: 15000 };
  }

  async submitImvOverride(role: string, data: any) {
    const allowed = ['super_admin', 'operations_manager', 'marketing_admin'];
    if (!allowed.includes(role)) {
      throw new ForbiddenException('Insufficient role permissions.');
    }
    return { success: true, message: 'IMV override request submitted.' };
  }

  async approveImvOverride(role: string) {
    if (role !== 'super_admin') {
      throw new ForbiddenException('Only Super Admin can approve IMV overrides.');
    }
    return { success: true, message: 'IMV override approved.' };
  }

  async toggleFeatureFlag(role: string, data: any) {
    const allowed = ['super_admin', 'system_admin'];
    if (!allowed.includes(role)) {
      throw new ForbiddenException('Insufficient role permissions.');
    }
    const key = `feature_flag:${data.flag}`;
    await this.redis.set(key, data.enabled ? 'true' : 'false');
    return { success: true, flag: data.flag, enabled: data.enabled };
  }

  async impersonateDealer(dealerId: string, role: string, actorId: string, actorIp: string) {
    if (role !== 'super_admin') {
      throw new ForbiddenException('Only Super Admin can impersonate a dealer.');
    }

    const dealer = await this.prisma.dealership.findUnique({ where: { id: dealerId } });
    if (!dealer) {
      throw new NotFoundException('DEALER_NOT_FOUND');
    }

    const token = await this.tokenService.issueDealerAccessToken({
      user_id: dealer.owner_id,
      dealer_id: dealerId,
      role: 'dealer_owner',
    }, actorId);

    await this.prisma.platformAuditLog.create({
      data: {
        actor_id: actorId,
        actor_ip: actorIp,
        action: 'impersonate_start',
        before_state: '{}',
        after_state: JSON.stringify({ impersonated_dealer_id: dealerId }),
      },
    });

    return { access_token: token };
  }

  async getRevenueDashboard(role: string) {
    const allowed = ['super_admin', 'finance_admin'];
    if (!allowed.includes(role)) {
      throw new ForbiddenException('Insufficient role permissions.');
    }

    const subscriptions = await this.prisma.subscription.findMany({
      where: { status: { in: ['active', 'grace_period'] } },
    });

    const mrr = subscriptions.reduce((sum, sub) => sum + Number(sub.monthly_price_bdt), 0);
    const arr = mrr * 12;

    const planDistribution: Record<string, number> = {};
    subscriptions.forEach(sub => {
      planDistribution[sub.tier] = (planDistribution[sub.tier] || 0) + 1;
    });

    const failedInvoices = await this.prisma.invoice.findMany({
      where: { status: 'failed' },
    });

    return {
      mrr,
      arr,
      planDistribution,
      failedInvoices,
    };
  }

  async handleFailedInvoiceAction(role: string, invoiceId: string, action: string, actorId: string, actorIp: string) {
    if (role !== 'finance_admin' && role !== 'super_admin') {
      throw new ForbiddenException('Insufficient role permissions.');
    }

    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    let updatedStatus = invoice.status;
    if (action === 'Retry') {
      updatedStatus = 'pending';
    } else if (action === 'Waive') {
      updatedStatus = 'waived';
    } else if (action === 'Mark Bad Debt') {
      updatedStatus = 'bad_debt';
    }

    const updated = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: updatedStatus },
    });

    await this.prisma.platformAuditLog.create({
      data: {
        actor_id: actorId,
        actor_ip: actorIp,
        action: `failed_invoice_action:${action}:${invoiceId}`,
        before_state: JSON.stringify(invoice),
        after_state: JSON.stringify(updated),
      },
    });

    return updated;
  }

  async refundPayment(actorId: string, role: string, paymentId: string, amount: number, totpCode: string) {
    if (role !== 'super_admin' && role !== 'finance_admin') {
      throw new ForbiddenException('Insufficient role permissions.');
    }

    if (amount > 10000) {
      await this.verifyFreshTotp(actorId, totpCode);
    }

    return { success: true, refund_id: `REFUND-${crypto.randomUUID()}`, amount };
  }

  async getBroadcastRecipientCount(role: string, targetType: string, targetVal?: string) {
    const allowed = ['super_admin', 'marketing_admin', 'operations_manager'];
    if (!allowed.includes(role)) {
      throw new ForbiddenException('Insufficient role permissions.');
    }

    let query: any = { status: 'active' };
    if (targetType === 'plan' && targetVal) {
      query.subscription_tier = targetVal;
    } else if (targetType === 'district' && targetVal) {
      query.district = targetVal;
    } else if (targetType === 'specific' && targetVal) {
      query.id = targetVal;
    }

    const count = await this.prisma.dealership.count({ where: query });
    return { recipient_count: count };
  }

  async sendBroadcast(role: string, targetType: string, targetVal: string, message: string, actorId: string, actorIp: string) {
    const allowed = ['super_admin', 'marketing_admin', 'operations_manager'];
    if (!allowed.includes(role)) {
      throw new ForbiddenException('Insufficient role permissions.');
    }

    let query: any = { status: 'active' };
    if (targetType === 'plan' && targetVal) {
      query.subscription_tier = targetVal;
    } else if (targetType === 'district' && targetVal) {
      query.district = targetVal;
    } else if (targetType === 'specific' && targetVal) {
      query.id = targetVal;
    }

    const dealers = await this.prisma.dealership.findMany({ where: query });

    for (const dealer of dealers) {
      await this.eventEmitter.emit('automation.send_sms', {
        to: dealer.phone,
        body: message,
        dealership_id: dealer.id,
      });
    }

    await this.prisma.platformAuditLog.create({
      data: {
        actor_id: actorId,
        actor_ip: actorIp,
        action: `send_broadcast:${targetType}`,
        before_state: '{}',
        after_state: JSON.stringify({ recipient_count: dealers.length, message }),
      },
    });

    return { success: true, recipient_count: dealers.length };
  }
}
