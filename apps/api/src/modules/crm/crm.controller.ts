import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DealerContextGuard } from '../../common/guards/dealer-context.guard';

@Controller('api/v1')
@UseGuards(JwtAuthGuard, DealerContextGuard)
export class CrmController {
  constructor(private crmService: CrmService) {}

  @Post('leads')
  async createLead(@Body() body: any, @Req() req: any) {
    const data = await this.crmService.createLead(req.dealerId, body);
    return { success: true, data };
  }

  @Get('leads')
  async listLeads(@Req() req: any) {
    const data = await this.crmService.listLeads(req.dealerId, req.user.sub, req.user.role);
    return { success: true, data };
  }

  @Put('leads/:id/stage')
  async updateLeadStage(
    @Param('id') id: string,
    @Req() req: any,
    @Body('stage') stage: string,
    @Body('lost_reason') lostReason?: string,
    @Body('lost_reason_detail') lostReasonDetail?: string,
  ) {
    const data = await this.crmService.updateLeadStage(id, req.dealerId, req.user.sub, req.user.role, stage, lostReason, lostReasonDetail);
    return { success: true, data };
  }

  @Post('leads/:id/reassign')
  @HttpCode(HttpStatus.OK)
  async reassignLead(
    @Param('id') id: string,
    @Body('assigned_to') newSalespersonId: string,
    @Req() req: any,
  ) {
    const data = await this.crmService.reassignLead(id, req.dealerId, req.user.role, newSalespersonId);
    return { success: true, data };
  }

  @Post('leads/:id/score-signal')
  @HttpCode(HttpStatus.OK)
  async addLeadScoreSignal(
    @Param('id') id: string,
    @Body('signal') signalName: string,
    @Req() req: any,
  ) {
    const data = await this.crmService.addLeadScoreSignal(id, req.dealerId, signalName);
    return { success: true, data };
  }

  @Get('customers/lookup')
  async lookupCustomerPhone(@Query('phone') phone: string) {
    const data = await this.crmService.lookupCustomerPhone(phone);
    return { success: true, data };
  }
}
