import { Controller, Get, Post, Body, Param, UseGuards, Req, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAdminGuard } from '../../common/guards/jwt-admin.guard';
import { AdminIpGuard } from '../../common/guards/admin-ip.guard';

@Controller('api/v1/admin')
@UseGuards(JwtAdminGuard, AdminIpGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dealers')
  async getDealers() {
    const data = await this.adminService.getDealers();
    return { success: true, data };
  }

  @Post('dealers/:id/approve')
  @HttpCode(HttpStatus.OK)
  async approveDealer(@Param('id') id: string, @Req() req: any) {
    const actorIp = req.headers['cf-connecting-ip'] || req.ip || '127.0.0.1';
    const data = await this.adminService.approveDealer(id, req.user.role, req.user.user_id, actorIp);
    return { success: true, data };
  }

  @Post('dealers/:id/suspend')
  @HttpCode(HttpStatus.OK)
  async suspendDealer(@Param('id') id: string, @Req() req: any, @Body('reason') reason: string) {
    const actorIp = req.headers['cf-connecting-ip'] || req.ip || '127.0.0.1';
    const data = await this.adminService.suspendDealer(id, req.user.role, req.user.user_id, actorIp, reason || 'No reason provided');
    return { success: true, data };
  }

  @Post('dealers/:id/reinstate')
  @HttpCode(HttpStatus.OK)
  async reinstateDealer(@Param('id') id: string, @Req() req: any) {
    const actorIp = req.headers['cf-connecting-ip'] || req.ip || '127.0.0.1';
    const data = await this.adminService.reinstateDealer(id, req.user.role, req.user.user_id, actorIp);
    return { success: true, data };
  }

  @Post('dealers/:id/terminate')
  @HttpCode(HttpStatus.OK)
  async terminateDealer(@Param('id') id: string, @Req() req: any, @Body('totp_code') totpCode: string) {
    const actorIp = req.headers['cf-connecting-ip'] || req.ip || '127.0.0.1';
    const data = await this.adminService.terminateDealer(id, req.user.role, req.user.user_id, actorIp, totpCode);
    return { success: true, data };
  }

  @Get('dealers/:id/billing')
  async getDealerBilling(@Param('id') id: string, @Req() req: any) {
    const data = await this.adminService.getDealerBilling(id, req.user.role);
    return { success: true, data };
  }

  @Get('c2c/listings')
  async getC2cModerationQueue(@Req() req: any) {
    const data = await this.adminService.getC2cModerationQueue(req.user.role);
    return { success: true, data };
  }

  @Post('c2c/listings/:id/approve')
  @HttpCode(HttpStatus.OK)
  async approveC2cListing(@Param('id') id: string, @Req() req: any) {
    const actorIp = req.headers['cf-connecting-ip'] || req.ip || '127.0.0.1';
    const data = await this.adminService.approveC2cListing(id, req.user.role, req.user.user_id, actorIp);
    return { success: true, data };
  }

  @Post('c2c/listings/:id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectC2cListing(@Param('id') id: string, @Req() req: any, @Body('reason_code') reasonCode: string) {
    const actorIp = req.headers['cf-connecting-ip'] || req.ip || '127.0.0.1';
    const data = await this.adminService.rejectC2cListing(id, req.user.role, reasonCode, req.user.user_id, actorIp);
    return { success: true, data };
  }

  @Post('imv/override')
  async submitImvOverride(@Req() req: any, @Body() body: any) {
    const data = await this.adminService.submitImvOverride(req.user.role, body);
    return { success: true, data };
  }

  @Post('imv/override/approve')
  @HttpCode(HttpStatus.OK)
  async approveImvOverride(@Req() req: any) {
    const data = await this.adminService.approveImvOverride(req.user.role);
    return { success: true, data };
  }

  @Post('feature-flags')
  async toggleFeatureFlag(@Req() req: any, @Body() body: any) {
    const data = await this.adminService.toggleFeatureFlag(req.user.role, body);
    return { success: true, data };
  }

  @Post('impersonate')
  async impersonateDealer(@Req() req: any, @Body('dealer_id') dealerId: string) {
    const actorIp = req.headers['cf-connecting-ip'] || req.ip || '127.0.0.1';
    const data = await this.adminService.impersonateDealer(dealerId, req.user.role, req.user.user_id, actorIp);
    return { success: true, data };
  }

  @Get('revenue')
  async getRevenueDashboard(@Req() req: any) {
    const data = await this.adminService.getRevenueDashboard(req.user.role);
    return { success: true, data };
  }

  @Post('failed-invoices/:id/action')
  @HttpCode(HttpStatus.OK)
  async failedInvoiceAction(@Param('id') id: string, @Req() req: any, @Body('action') action: string) {
    const actorIp = req.headers['cf-connecting-ip'] || req.ip || '127.0.0.1';
    const data = await this.adminService.handleFailedInvoiceAction(req.user.role, id, action, req.user.user_id, actorIp);
    return { success: true, data };
  }

  @Post('refund')
  @HttpCode(HttpStatus.OK)
  async refundPayment(@Req() req: any, @Body('payment_id') paymentId: string, @Body('amount') amount: number, @Body('totp_code') totpCode: string) {
    const data = await this.adminService.refundPayment(req.user.user_id, req.user.role, paymentId, amount, totpCode);
    return { success: true, data };
  }

  @Get('broadcast/recipient-count')
  async getBroadcastRecipientCount(@Req() req: any, @Query('target_type') targetType: string, @Query('target_val') targetVal: string) {
    const data = await this.adminService.getBroadcastRecipientCount(req.user.role, targetType, targetVal);
    return { success: true, data };
  }

  @Post('broadcast/send')
  @HttpCode(HttpStatus.OK)
  async sendBroadcast(@Req() req: any, @Body('target_type') targetType: string, @Body('target_val') targetVal: string, @Body('message') message: string) {
    const actorIp = req.headers['cf-connecting-ip'] || req.ip || '127.0.0.1';
    const data = await this.adminService.sendBroadcast(req.user.role, targetType, targetVal, message, req.user.user_id, actorIp);
    return { success: true, data };
  }
}

