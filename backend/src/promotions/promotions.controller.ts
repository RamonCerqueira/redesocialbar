import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get('restaurant/:slug')
  @UseGuards(OptionalJwtAuthGuard)
  async findAll(@Param('slug') slug: string, @CurrentUser('id') userId?: string) {
    return this.promotionsService.findAll(slug, userId);
  }

  @Post(':id/claim')
  @UseGuards(JwtAuthGuard)
  async claimCoupon(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.promotionsService.claimCoupon(id, userId);
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT_ADMIN, Role.SUPERADMIN)
  async validateCoupon(
    @Body('code') code: string,
    @Body('restaurantSlug') restaurantSlug: string,
  ) {
    return this.promotionsService.validateCoupon(code, restaurantSlug);
  }
}
