import { BadRequestException, Body, Controller, Get, Module, NotFoundException, Param, Post, Query, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, IsUrl, MaxLength, IsIn } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
class StoryDto {
  @IsString() restaurantSlug!: string;
  @IsUrl({ require_tld: false, protocols: ['http', 'https'], require_protocol: true }) mediaUrl!: string;
  @IsOptional() @IsIn(['IMAGE']) mediaType?: string;
  @IsOptional() @IsString() @MaxLength(500) caption?: string;
}
class ReplyDto { @IsString() @MaxLength(1000) content!: string; }
class StoryPageDto { @IsOptional() @IsString() @MaxLength(100) cursor?: string; }

@Controller('stories')
export class StoriesController {
  constructor(private prisma: PrismaService) {}
  @Get('restaurant/:slug') @UseGuards(OptionalJwtAuthGuard)
  async list(@Param('slug') slug: string, @CurrentUser('id') userId?: string, @Query() page: StoryPageDto = {}) {
    const blocked = userId ? await this.prisma.block.findMany({ where: { OR: [{ blockerId: userId }, { blockedId: userId }] } }) : [];
    const ids = blocked.map(b => b.blockerId === userId ? b.blockedId : b.blockerId);
    const stories = await this.prisma.story.findMany({
      where: { restaurant: { slug }, expiresAt: { gt: new Date() }, authorId: { notIn: ids }, author: { status: 'ACTIVE', profile: { invisibleMode: false, isPrivate: false } } },
      include: { author: { select: { id: true, profile: true, restaurantMembers: true, role: true } } }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 100,
      ...(page.cursor ? { cursor: { id: page.cursor }, skip: 1 } : {}),
    });
    return stories.map(({ author, ...story }) => ({ ...story, mediaType: 'IMAGE', author: {
      id: author.id, name: author.profile?.name, username: author.profile?.username, avatarUrl: author.profile?.avatarUrl,
      isOfficial: author.role === 'SUPERADMIN' || (author.role === 'RESTAURANT_ADMIN' && author.restaurantMembers.some(m => m.restaurantId === story.restaurantId && ['OWNER','MANAGER'].includes(m.role))),
    } }));
  }
  @Post() @UseGuards(JwtAuthGuard)
  async create(@CurrentUser('id') authorId: string, @Body() dto: StoryDto) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { slug: dto.restaurantSlug } });
    if (!restaurant) throw new NotFoundException('Restaurante não encontrado.');
    const created = await this.prisma.story.create({ data: { restaurantId: restaurant.id, authorId, mediaUrl: dto.mediaUrl, caption: dto.caption, expiresAt: new Date(Date.now() + 24 * 3600000) } });
    const profile = await this.prisma.profile.findUnique({ where: { userId: authorId } });
    return { ...created, mediaType: 'IMAGE', author: { id: authorId, name: profile?.name, username: profile?.username, avatarUrl: profile?.avatarUrl } };
  }
  @Post(':id/reply') @UseGuards(JwtAuthGuard)
  async reply(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: ReplyDto) {
    if (!dto.content.trim()) throw new BadRequestException('Escreva uma resposta.');
    const story = await this.prisma.story.findFirst({ where: { id, expiresAt: { gt: new Date() }, author: { status: 'ACTIVE', profile: { invisibleMode: false, isPrivate: false } } } });
    if (!story) throw new NotFoundException('Publicação indisponível.');
    const blocked = await this.prisma.block.findFirst({ where: { OR: [{ blockerId: userId, blockedId: story.authorId }, { blockerId: story.authorId, blockedId: userId }] } });
    if (blocked) throw new BadRequestException('Interação indisponível.');
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    await this.prisma.notification.create({ data: { userId: story.authorId, type: 'STORY_REPLY', title: (profile?.name || 'Alguém') + ' respondeu ao seu De Agora', body: dto.content.trim(), link: '/perfil/' + profile?.username } });
    return { success: true };
  }
}
@Module({ controllers: [StoriesController] })
export class StoriesModule {}
