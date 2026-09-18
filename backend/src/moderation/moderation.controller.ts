import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role, ReportStatus } from '@prisma/client';

@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('reports')
  @UseGuards(JwtAuthGuard)
  async createReport(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReportDto,
  ) {
    return this.moderationService.createReport(userId, dto);
  }

  @Get('reports')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT_ADMIN, Role.SUPERADMIN)
  async getReports(@Query('status') status?: ReportStatus) {
    return this.moderationService.getReports(status);
  }

  @Post('reports/:id/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT_ADMIN, Role.SUPERADMIN)
  async resolveReport(
    @Param('id') id: string,
    @Body('action') action: 'DISMISS' | 'REMOVE_CONTENT' | 'BAN_USER',
  ) {
    return this.moderationService.resolveReport(id, action);
  }
}
