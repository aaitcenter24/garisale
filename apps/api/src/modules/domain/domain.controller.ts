import { Controller, Get, Query } from '@nestjs/common';
import { DomainService } from './domain.service';

@Controller('api/v1/domains')
export class DomainController {
  constructor(private readonly domainService: DomainService) {}

  @Get('lookup')
  async lookup(@Query('domain') domain: string) {
    const data = await this.domainService.lookup(domain);
    return { success: true, data };
  }
}
