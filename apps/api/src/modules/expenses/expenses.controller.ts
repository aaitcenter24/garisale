import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DealerContextGuard } from '../../common/guards/dealer-context.guard';

@Controller('api/v1/expenses')
@UseGuards(JwtAuthGuard, DealerContextGuard)
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Post('vehicle')
  async createVehicleExpense(@Body() body: any, @Req() req: any) {
    const data = await this.expensesService.createVehicleExpense(req.dealerId, req.user.sub, req.user.role, body);
    return { success: true, data };
  }

  @Post('operational')
  async createOperationalExpense(@Body() body: any, @Req() req: any) {
    const data = await this.expensesService.createOperationalExpense(req.dealerId, req.user.sub, req.user.role, body);
    return { success: true, data };
  }

  @Get('operational')
  async getOperationalExpenses(@Req() req: any) {
    const data = await this.expensesService.getOperationalExpenses(req.dealerId, req.user.role);
    return { success: true, data };
  }
}
