import { Controller, Get, Put, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile/:username')
  @UseGuards(OptionalJwtAuthGuard)
  async getProfile(
    @Param('username') username: string,
    @CurrentUser('id') currentUserId?: string,
  ) {
    return this.usersService.getProfileByUsername(username, currentUserId);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  async toggleFollow(
    @Param('id') targetUserId: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.usersService.toggleFollow(targetUserId, currentUserId);
  }

  @Get('profile/:username/posts')
  @UseGuards(OptionalJwtAuthGuard)
  profilePosts(@Param('username') username: string, @Query('cursor') cursor: string | undefined, @CurrentUser('id') userId?: string) {
    return this.usersService.profilePosts(username, userId, cursor);
  }

  @Post(':id/block')
  @UseGuards(JwtAuthGuard)
  async toggleBlock(
    @Param('id') targetUserId: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.usersService.toggleBlock(targetUserId, currentUserId);
  }
}
