import { Controller, Post, Body, HttpCode, HttpStatus, Param, Req, UseGuards, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DealerContextGuard } from '../../common/guards/dealer-context.guard';

@Controller('api/v1/payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('initiate')
  @UseGuards(JwtAuthGuard, DealerContextGuard)
  async initiatePayment(
    @Body('invoice_id') invoiceId: string,
    @Body('gateway') gateway: string,
    @Req() req: any,
  ) {
    const result = await this.paymentsService.initiatePayment(invoiceId, req.dealerId, gateway);
    return { success: true, ...result };
  }

  @Post('bkash/callback')
  @HttpCode(HttpStatus.OK)
  async handleCallback(
    @Body('paymentID') paymentID: string,
    @Body('status') status: string,
    @Body('tran_id') tran_id: string,
    @Query('scenario') queryScenario: string,
  ) {
    const amount = 2999.00;
    const result = await this.paymentsService.handleCallback(tran_id, amount, paymentID, status, queryScenario);
    return { ...result };
  }

  @Post('sslcommerz/ipn')
  @HttpCode(HttpStatus.OK)
  async handleSSLCommerzIPN(@Body() body: any) {
    const result = await this.paymentsService.handleSSLCommerzIPN(body);
    return { ...result };
  }

  @Post('leads/:id/dispute')
  @UseGuards(JwtAuthGuard, DealerContextGuard)
  async disputeLead(@Param('id') leadId: string, @Req() req: any) {
    const result = await this.paymentsService.disputeLead(req.dealerId, leadId);
    return { ...result };
  }
}
