import { Controller, Post, Body, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CheckInsService } from './check-ins.service';
import { CreateCheckInDto } from './dto/create-checkin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('check-ins')
export class CheckInsController {
  constructor(private readonly checkInsService: CheckInsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async checkIn(@CurrentUser('id') userId: string, @Body() dto: CreateCheckInDto) {
    return this.checkInsService.checkIn(userId, dto);
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  async checkOut(@CurrentUser('id') userId: string) {
    return this.checkInsService.checkOut(userId);
  }

  @Get('active')
  @UseGuards(JwtAuthGuard)
  async getActive(@CurrentUser('id') userId: string) {
    return this.checkInsService.getActiveCheckIn(userId);
  }

  @Get('who-is-here/:slug')
  @UseGuards(OptionalJwtAuthGuard)
  async getWhoIsHere(
    @Param('slug') slug: string,
    @CurrentUser('id') userId?: string,
    @Query('filter') filter?: 'all' | 'new' | 'friends' | 'flirt',
  ) {
    return this.checkInsService.getWhoIsHere(slug, userId, filter);
  }
}
