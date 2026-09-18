import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { FlirtService } from './flirt.service';
import { ExpressInterestDto } from './dto/express-interest.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('flirt')
export class FlirtController {
  constructor(private readonly flirtService: FlirtService) {}

  @Post('interest')
  @UseGuards(JwtAuthGuard)
  async expressInterest(@CurrentUser('id') userId: string, @Body() dto: ExpressInterestDto) {
    return this.flirtService.expressInterest(userId, dto);
  }

  @Get('matches')
  @UseGuards(JwtAuthGuard)
  async getMyMatches(@CurrentUser('id') userId: string) {
    return this.flirtService.getMyMatches(userId);
  }

  @Get('notes/:slug')
  async getNotes(@Param('slug') slug: string) {
    return this.flirtService.getFlirtNotes(slug);
  }
}
