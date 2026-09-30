import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards, ParseEnumPipe } from '@nestjs/common';
import { IsEnum, IsOptional } from 'class-validator';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReactionType, PostType } from '@prisma/client';
class ReactionDto { @IsOptional() @IsEnum(ReactionType) type?: ReactionType; }

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
    @Query('type', new ParseEnumPipe(PostType, { optional: true })) postType?: PostType,
  ) {
    return this.postsService.getFeed(slug, userId, postType);
  }

  @Get('bar/:slug')
  @UseGuards(OptionalJwtAuthGuard)
  async getBarPosts(
    @Param('slug') slug: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.postsService.getBarOfficialPosts(slug, userId);
  }


  @Post(':id/react')
  @UseGuards(JwtAuthGuard)
  async react(
    @Param('id') postId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ReactionDto,
  ) {
    return this.postsService.toggleReaction(postId, userId, dto.type);
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
