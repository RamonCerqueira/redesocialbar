import { Controller, Get, Post, Param } from '@nestjs/common';
import { AdsService } from './ads.service';

@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @Get('restaurant/:slug')
  async getActiveAds(@Param('slug') slug: string) {
    return this.adsService.getActiveAds(slug);
  }

  @Post(':id/click')
  async recordClick(@Param('id') id: string) {
    return this.adsService.recordClick(id);
  }
  @Post(':id/impression')
  async recordImpression(@Param('id') id: string) { return this.adsService.recordImpression(id); }
}
