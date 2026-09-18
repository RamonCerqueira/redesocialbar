import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { MeetupsService } from './meetups.service';
import { CreateMeetupDto } from './dto/create-meetup.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('meetups')
export class MeetupsController {
  constructor(private readonly meetupsService: MeetupsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateMeetupDto) {
    return this.meetupsService.create(userId, dto);
  }

  @Get('restaurant/:slug')
  @UseGuards(OptionalJwtAuthGuard)
  async findAll(@Param('slug') slug: string, @CurrentUser('id') userId?: string) {
    return this.meetupsService.findAll(slug, userId);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  async toggleJoin(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.meetupsService.toggleJoin(id, userId);
  }
}
