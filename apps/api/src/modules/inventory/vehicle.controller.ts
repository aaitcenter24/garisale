import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, UseInterceptors, UploadedFile, HttpStatus, HttpCode } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { ExpensesService } from '../expenses/expenses.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DealerContextGuard } from '../../common/guards/dealer-context.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('api/v1/vehicles')
@UseGuards(JwtAuthGuard, DealerContextGuard)
export class VehicleController {
  constructor(
    private vehicleService: VehicleService,
    private expensesService: ExpensesService,
  ) {}

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const data = await this.vehicleService.findOne(id, req.user.role);
    return { success: true, data };
  }

  @Post()
  async create(@Body() body: any, @Req() req: any) {
    const data = await this.vehicleService.create(req.dealerId, req.user.sub, req.user.role, body);
    return { success: true, data };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const data = await this.vehicleService.update(id, req.dealerId, req.user.sub, req.user.role, body);
    return { success: true, data };
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    const data = await this.vehicleService.delete(id, req.dealerId, req.user.role);
    return { success: true, data };
  }

  @Post(':id/photos')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Req() req: any,
  ) {
    const data = await this.vehicleService.uploadPhoto(id, req.dealerId, file.buffer, file.originalname, req.user.role);
    return { success: true, data };
  }

  @Post(':id/force-sync')
  @HttpCode(HttpStatus.OK)
  async forceSync(@Param('id') id: string, @Req() req: any) {
    const data = await this.vehicleService.forceSync(id, req.dealerId);
    return { success: true, data };
  }

  @Get(':id/expenses')
  async getExpenses(@Param('id') id: string, @Req() req: any) {
    const data = await this.expensesService.getVehicleExpenses(req.dealerId, id, req.user.role);
    return { success: true, data };
  }

  @Get(':id/profit')
  async getProfitCalculator(@Param('id') id: string, @Req() req: any) {
    const data = await this.expensesService.getProfitCalculator(req.dealerId, id, req.user.role);
    return { success: true, data };
  }

  @Post(':id/recon-tasks')
  async createReconTask(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const data = await this.vehicleService.createReconTask(req.dealerId, id, body, req.user.sub);
    return { success: true, data };
  }

  @Put('recon-tasks/:taskId/complete')
  @HttpCode(HttpStatus.OK)
  async completeReconTask(@Param('taskId') taskId: string, @Body('actual_cost') actualCost: number, @Req() req: any) {
    const data = await this.vehicleService.completeReconTask(req.dealerId, req.user.sub, taskId, actualCost);
    return { success: true, data };
  }
}
