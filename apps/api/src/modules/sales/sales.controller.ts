import { Controller, Get, Post, Put, Body, Param, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DealerContextGuard } from '../../common/guards/dealer-context.guard';

@Controller('api/v1/deals')
@UseGuards(JwtAuthGuard, DealerContextGuard)
export class SalesController {
  constructor(private salesService: SalesService) {}

  @Post()
  async createDeal(@Body() body: any, @Req() req: any) {
    const data = await this.salesService.createDeal(req.dealerId, req.user.sub, req.user.role, body);
    return { success: true, data };
  }

  @Get()
  async listDeals(@Req() req: any) {
    const data = await this.salesService.listDeals(req.dealerId, req.user.sub, req.user.role);
    return { success: true, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const data = await this.salesService.findOne(id, req.dealerId, req.user.sub, req.user.role);
    return { success: true, data };
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approveDeal(@Param('id') id: string, @Req() req: any) {
    const data = await this.salesService.approveDeal(id, req.dealerId, req.user.sub, req.user.role);
    return { success: true, data };
  }

  @Post(':id/deliver')
  @HttpCode(HttpStatus.OK)
  async deliverDeal(@Param('id') id: string, @Req() req: any) {
    const data = await this.salesService.deliverDeal(id, req.dealerId, req.user.sub, req.user.role);
    return { success: true, data };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelDeal(@Param('id') id: string, @Body('reason') reason: string, @Req() req: any) {
    const data = await this.salesService.cancelDeal(id, req.dealerId, req.user.sub, req.user.role, reason);
    return { success: true, data };
  }

  @Post(':id/payments')
  @HttpCode(HttpStatus.OK)
  async recordPayment(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const data = await this.salesService.recordPayment(id, req.dealerId, req.user.sub, req.user.role, body);
    return { success: true, data };
  }
}
