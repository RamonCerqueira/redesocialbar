import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { IsEmail, IsIn, IsString, MaxLength, MinLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TeamService } from './team.service';

export class CreateTeamUserDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail() @MaxLength(254) email!: string;
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString() @MinLength(2) @MaxLength(100) name!: string;
  @IsIn(['USER', 'RESTAURANT_ADMIN']) role!: 'USER' | 'RESTAURANT_ADMIN';
  @IsString() @MaxLength(100) @Matches(/^[a-z0-9-]+$/) restaurantSlug!: string;
}

@Controller('admin/team')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN)
export class TeamController {
  constructor(private readonly service: TeamService) {}
  @Get() list(@CurrentUser('id') id: string, @Query('cursor') cursor?: string) { return this.service.list(id, cursor); }
  @Post() create(@CurrentUser('id') id: string, @Body() dto: CreateTeamUserDto) { return this.service.create(id, dto); }
  @Post(':id/reset-password') reset(@CurrentUser('id') actorId: string, @Param('id') id: string) { return this.service.resetPassword(actorId, id); }
}
