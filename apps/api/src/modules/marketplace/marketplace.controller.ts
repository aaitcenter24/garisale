import { Controller, Get, Post, Param, Query, Body, HttpCode, HttpStatus, Header } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';

@Controller('api/v1/public/marketplace')
export class MarketplaceController {
  constructor(private marketplaceService: MarketplaceService) {}

  @Get('search')
  async search(@Query() query: any) {
    const data = await this.marketplaceService.search(query);
    return { success: true, data };
  }

  @Get('listings/:slug')
  async findOneBySlug(@Param('slug') slug: string) {
    const data = await this.marketplaceService.findOneBySlug(slug);
    return { success: true, data };
  }

  @Get('dealers/:slug')
  async findOneDealerBySlug(@Param('slug') slug: string) {
    const data = await this.marketplaceService.findOneDealerBySlug(slug);
    return { success: true, data };
  }

  @Post('leads')
  @HttpCode(HttpStatus.CREATED)
  async createLead(@Body() body: any) {
    const data = await this.marketplaceService.createLead(body);
    return { success: true, data };
  }

  @Post('c2c/listings')
  @HttpCode(HttpStatus.CREATED)
  async createC2cListing(@Body() body: any) {
    const data = await this.marketplaceService.createC2cListing(body);
    return { success: true, data };
  }

  @Get('imv/trends')
  async getPriceTrends(
    @Query('make') make: string,
    @Query('model') model: string,
    @Query('district') district?: string,
    @Query('months') months?: string,
  ) {
    const data = await this.marketplaceService.getPriceTrends(make, model, district, months ? Number(months) : 6);
    return { success: true, data };
  }

  @Get('c2c/imv-valuation')
  async getImvValuation(
    @Query('make') make: string,
    @Query('model') model: string,
    @Query('year') year: string,
    @Query('asking_price') askingPrice: string,
  ) {
    const data = await this.marketplaceService.getImvValuation(make, model, Number(year), Number(askingPrice));
    return { success: true, data };
  }

  @Get('feeds/gmc/:dealership_id')
  @Header('Content-Type', 'application/xml')
  async getGmcFeed(@Param('dealership_id') dealershipId: string) {
    return this.marketplaceService.getGmcFeed(dealershipId);
  }

  @Get('feeds/facebook/:dealership_id')
  @Header('Content-Type', 'application/xml')
  async getFacebookFeed(@Param('dealership_id') dealershipId: string) {
    return this.marketplaceService.getFacebookFeed(dealershipId);
  }

  @Post('listings/:id/flag')
  @HttpCode(HttpStatus.OK)
  async flagListing(@Param('id') id: string) {
    const data = await this.marketplaceService.flagListing(id);
    return { success: true, data };
  }
}

