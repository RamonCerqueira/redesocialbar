import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('restaurant/:slug')
  @UseGuards(OptionalJwtAuthGuard)
  async findAll(@Param('slug') slug: string, @CurrentUser('id') userId?: string) {
    return this.eventsService.findAll(slug, userId);
  }

  @Post(':id/rsvp')
  @UseGuards(JwtAuthGuard)
  async toggleRsvp(@Param('id') eventId: string, @CurrentUser('id') userId: string) {
    return this.eventsService.toggleRsvp(eventId, userId);
  }
}
