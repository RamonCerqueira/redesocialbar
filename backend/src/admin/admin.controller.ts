import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { Actor } from '../auth/access.service';
import { AdminPostDto, AdvertisementDto, EventDto, PromotionDto, RestaurantSettingsDto, RestaurantGalleryDto } from './admin.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.RESTAURANT_ADMIN, Role.SUPERADMIN)
export class AdminController {
  constructor(private service: AdminService) {}
  @Get('restaurants') restaurants(@CurrentUser() actor: Actor) { return this.service.restaurants(actor); }
  @Get('dashboard/:slug') dashboard(@Param('slug') slug: string, @CurrentUser() actor: Actor) { return this.service.dashboard(actor, slug); }
  @Get(':slug/settings') settings(@Param('slug') slug: string, @CurrentUser() actor: Actor) { return this.service.settings(actor, slug); }
  @Put(':slug/gallery') saveGallery(@Param('slug') slug: string, @CurrentUser() actor: Actor, @Body() dto: RestaurantGalleryDto) { return this.service.saveGallery(actor, slug, dto.photos); }
  @Put(':slug/settings') saveSettings(@Param('slug') slug: string, @CurrentUser() actor: Actor, @Body() dto: RestaurantSettingsDto) { return this.service.saveSettings(actor, slug, dto); }
  @Get(':slug/coupons') coupons(@Param('slug') slug: string, @CurrentUser() actor: Actor, @Query('cursor') cursor?: string) { return this.service.coupons(actor, slug, cursor); }
  @Get(':slug/posts') posts(@Param('slug') slug: string, @CurrentUser() actor: Actor) { return this.service.posts(actor, slug); }
  @Post(':slug/posts') createPost(@Param('slug') slug: string, @CurrentUser() actor: Actor, @Body() dto: AdminPostDto) { return this.service.savePost(actor, slug, dto); }
  @Put(':slug/posts/:id') editPost(@Param('slug') slug: string, @Param('id') id: string, @CurrentUser() actor: Actor, @Body() dto: AdminPostDto) { return this.service.savePost(actor, slug, dto, id); }
  @Delete(':slug/posts/:id') archivePost(@Param('slug') slug: string, @Param('id') id: string, @CurrentUser() actor: Actor) { return this.service.archive(actor, slug, 'post', id); }
  @Get(':slug/promotions') promotions(@Param('slug') slug: string, @CurrentUser() actor: Actor) { return this.service.promotions(actor, slug); }
  @Post(':slug/promotions') createPromotion(@Param('slug') slug: string, @CurrentUser() actor: Actor, @Body() dto: PromotionDto) { return this.service.savePromotion(actor, slug, dto); }
  @Put(':slug/promotions/:id') editPromotion(@Param('slug') slug: string, @Param('id') id: string, @CurrentUser() actor: Actor, @Body() dto: PromotionDto) { return this.service.savePromotion(actor, slug, dto, id); }
  @Delete(':slug/promotions/:id') archivePromotion(@Param('slug') slug: string, @Param('id') id: string, @CurrentUser() actor: Actor) { return this.service.archive(actor, slug, 'promotion', id); }
  @Get(':slug/ads') ads(@Param('slug') slug: string, @CurrentUser() actor: Actor) { return this.service.ads(actor, slug); }
  @Post(':slug/ads') createAd(@Param('slug') slug: string, @CurrentUser() actor: Actor, @Body() dto: AdvertisementDto) { return this.service.saveAd(actor, slug, dto); }
  @Put(':slug/ads/:id') editAd(@Param('slug') slug: string, @Param('id') id: string, @CurrentUser() actor: Actor, @Body() dto: AdvertisementDto) { return this.service.saveAd(actor, slug, dto, id); }
  @Delete(':slug/ads/:id') archiveAd(@Param('slug') slug: string, @Param('id') id: string, @CurrentUser() actor: Actor) { return this.service.archive(actor, slug, 'advertisement', id); }
  @Get(':slug/events') events(@Param('slug') slug: string, @CurrentUser() actor: Actor) { return this.service.events(actor, slug); }
  @Post(':slug/events') createEvent(@Param('slug') slug: string, @CurrentUser() actor: Actor, @Body() dto: EventDto) { return this.service.saveEvent(actor, slug, dto); }
  @Put(':slug/events/:id') editEvent(@Param('slug') slug: string, @Param('id') id: string, @CurrentUser() actor: Actor, @Body() dto: EventDto) { return this.service.saveEvent(actor, slug, dto, id); }
  @Delete(':slug/events/:id') archiveEvent(@Param('slug') slug: string, @Param('id') id: string, @CurrentUser() actor: Actor) { return this.service.archive(actor, slug, 'event', id); }
}
