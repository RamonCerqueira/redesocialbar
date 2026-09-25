import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { Role, ReportStatus } from '@prisma/client';
import { ModerationService } from './moderation.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Actor } from '../auth/access.service';

class ReportQuery {
  @IsString() restaurantSlug!: string;
  @IsOptional() @IsEnum(ReportStatus) status?: ReportStatus;
}
class ResolveDto {
  @IsIn(['DISMISS', 'REMOVE_CONTENT', 'BAN_USER']) action!: 'DISMISS' | 'REMOVE_CONTENT' | 'BAN_USER';
}
@Controller('moderation')
export class ModerationController {
  constructor(private service: ModerationService) {}
  @Post('reports') @UseGuards(JwtAuthGuard)
  create(@CurrentUser('id') id: string, @Body() dto: CreateReportDto) { return this.service.createReport(id, dto); }
  @Get('reports') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.RESTAURANT_ADMIN, Role.SUPERADMIN)
  list(@CurrentUser() actor: Actor, @Query() query: ReportQuery) { return this.service.getReports(actor, query.restaurantSlug, query.status); }
  @Post('reports/:id/resolve') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.RESTAURANT_ADMIN, Role.SUPERADMIN)
  resolve(@Param('id') id: string, @Body() dto: ResolveDto, @CurrentUser() actor: Actor) { return this.service.resolveReport(id, dto.action, actor); }
}
