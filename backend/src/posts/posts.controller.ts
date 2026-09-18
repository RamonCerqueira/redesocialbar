import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReactionType, PostType } from '@prisma/client';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser('id') userId: string, @Body() dto: CreatePostDto) {
    return this.postsService.create(userId, dto);
  }

  @Get('feed/:slug')
  @UseGuards(OptionalJwtAuthGuard)
  async getFeed(
    @Param('slug') slug: string,
    @CurrentUser('id') userId?: string,
    @Query('type') postType?: PostType,
  ) {
    return this.postsService.getFeed(slug, userId, postType);
  }

  @Post(':id/react')
  @UseGuards(JwtAuthGuard)
  async react(
    @Param('id') postId: string,
    @CurrentUser('id') userId: string,
    @Body('type') type?: ReactionType,
  ) {
    return this.postsService.toggleReaction(postId, userId, type);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  async addComment(
    @Param('id') postId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.postsService.addComment(postId, userId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deletePost(
    @Param('id') postId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.postsService.deletePost(postId, userId, role);
  }
}
