import { Controller, Post, Param, UseGuards, Body, Req, Headers } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DealerContextGuard } from '../../common/guards/dealer-context.guard';

@Controller('api/v1/automation')
export class AutomationController {
  constructor(private automationService: AutomationService) {}

  @Post('test/:id')
  @UseGuards(JwtAuthGuard, DealerContextGuard)
  async testRule(@Param('id') id: string) {
    const data = await this.automationService.testRule(id);
    return { success: true, data };
  }

  @Post('facebook/webhook')
  async facebookWebhook(
    @Headers('x-hub-signature-256') signature: string,
    @Body() body: any,
  ) {
    const rawBody = JSON.stringify(body);
    const data = await this.automationService.processFacebookWebhook(rawBody, signature, body);
    return { success: true, data };
  }

  @Post('whatsapp/webhook')
  async whatsappWebhook(
    @Headers('x-hub-signature-256') signature: string,
    @Body() body: any,
  ) {
    const rawBody = JSON.stringify(body);
    const data = await this.automationService.processWhatsappWebhook(rawBody, signature, body);
    return { success: true, data };
  }

  @Post('sms/stop')
  async smsStopCallback(@Body() body: any) {
    const data = await this.automationService.processSmsStopCallback(body);
    return { success: true, data };
  }

  @Post('connect-test-dealer')
  async connectTestDealer(@Body() body: { dealerId: string; phone: string; whatsappNumber?: string }) {
    const data = await this.automationService.connectTestDealer(body.dealerId, body.phone, body.whatsappNumber);
    return { success: true, data };
  }

  @Post('test-real-send')
  async testRealSend(@Body() body: { to: string; message: string; channel: 'sms' | 'whatsapp'; templateName?: string }) {
    if (body.channel === 'sms') {
      await this.automationService.handleSendSms({
        to: body.to,
        body: body.message,
      });
    } else {
      await this.automationService.handleSendWhatsapp({
        to: body.to,
        body: body.message,
        template_name: body.templateName,
      });
    }
    return { success: true };
  }
}
