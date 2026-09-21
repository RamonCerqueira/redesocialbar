import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ReactionType, PostType } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreatePostDto) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug: dto.restaurantSlug },
    });

    if (!restaurant) {
      throw new NotFoundException(`Estabelecimento "${dto.restaurantSlug}" não encontrado.`);
    }

    const post = await this.prisma.post.create({
      data: {
        content: dto.content,
        type: dto.type || PostType.FEED,
        flirtContext: dto.flirtContext,
        restaurantId: restaurant.id,
        authorId: userId,
        media: dto.mediaUrls && dto.mediaUrls.length > 0
          ? {
              create: dto.mediaUrls.map((url, idx) => ({
                url,
                type: 'IMAGE',
                sortOrder: idx,
              })),
            }
          : undefined,
      },
      include: {
        author: {
          include: { profile: true },
        },
        media: true,
        reactions: true,
        _count: { select: { comments: true, reactions: true } },
      },
    });

    return post;
  }

  async getFeed(restaurantSlug: string, currentUserId?: string, postType?: PostType) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug: restaurantSlug },
    });

    if (!restaurant) {
      throw new NotFoundException(`Estabelecimento "${restaurantSlug}" não encontrado.`);
    }

    // Identificar usuários bloqueados
    let blockedUserIds: string[] = [];
    if (currentUserId) {
      const blocks = await this.prisma.block.findMany({
        where: {
          OR: [{ blockerId: currentUserId }, { blockedId: currentUserId }],
        },
      });
      blockedUserIds = blocks.map((b) => (b.blockerId === currentUserId ? b.blockedId : b.blockerId));
    }

    const posts = await this.prisma.post.findMany({
      where: {
        restaurantId: restaurant.id,
        isDeleted: false,
        authorId: { notIn: blockedUserIds },
        ...(postType ? { type: postType } : {}),
      },
      include: {
        author: {
          include: { profile: true },
        },
        media: {
          orderBy: { sortOrder: 'asc' },
        },
        reactions: true,
        comments: {
          where: { isDeleted: false },
          include: {
            author: { include: { profile: true } },
          },
          orderBy: { createdAt: 'asc' },
          take: 5,
        },
        _count: {
          select: { comments: true, reactions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    // Mapear se o usuário logado reagiu ao post
    return posts.map((post) => {
      const userReaction = currentUserId
        ? post.reactions.find((r) => r.userId === currentUserId)?.type || null
        : null;

      return {
        id: post.id,
        content: post.content,
        type: post.type,
        flirtContext: post.flirtContext,
        createdAt: post.createdAt,
        likesCount: post._count.reactions,
        commentsCount: post._count.comments,
        userReaction,
        media: post.media.map((m) => m.url),
        author: {
          id: post.author.id,
          name: post.author.profile?.name || 'Frequentador',
          username: post.author.profile?.username || 'usuario',
          avatarUrl: post.author.profile?.avatarUrl,
          checkInCount: post.author.profile?.checkInCount || 1,
        },
        comments: post.comments.map((c) => ({
          id: c.id,
          content: c.content,
          createdAt: c.createdAt,
          author: {
            id: c.author.id,
            name: c.author.profile?.name || 'Frequentador',
            username: c.author.profile?.username || 'usuario',
            avatarUrl: c.author.profile?.avatarUrl,
          },
        })),
      };
    });
  }

  async getBarOfficialPosts(restaurantSlug: string, currentUserId?: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug: restaurantSlug },
    });

    if (!restaurant) {
      throw new NotFoundException(`Estabelecimento "${restaurantSlug}" não encontrado.`);
    }

    const posts = await this.prisma.post.findMany({
      where: {
        restaurantId: restaurant.id,
        isDeleted: false,
        OR: [
          { author: { role: { in: ['RESTAURANT_ADMIN', 'SUPERADMIN'] } } },
          { author: { restaurantMembers: { some: { restaurantId: restaurant.id } } } },
          { author: { profile: { username: { contains: 'pirambeira' } } } },
        ],
      },
      include: {
        author: {
          include: { profile: true },
        },
        media: {
          orderBy: { sortOrder: 'asc' },
        },
        reactions: true,
        comments: {
          where: { isDeleted: false },
          include: {
            author: { include: { profile: true } },
          },
          orderBy: { createdAt: 'asc' },
          take: 5,
        },
        _count: {
          select: { comments: true, reactions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return posts.map((post) => {
      const userReaction = currentUserId
        ? post.reactions.find((r) => r.userId === currentUserId)?.type || null
        : null;

      const isVideo = post.media.some((m) => m.type === 'VIDEO' || m.url.endsWith('.mp4'));
      const videoMedia = isVideo ? post.media.find((m) => m.type === 'VIDEO' || m.url.endsWith('.mp4')) : null;

      return {
        id: post.id,
        content: post.content,
        type: post.type,
        flirtContext: post.flirtContext,
        createdAt: post.createdAt,
        likesCount: post._count.reactions,
        commentsCount: post._count.comments,
        userReaction,
        media: post.media.map((m) => m.url),
        isVideo,
        videoUrl: videoMedia?.url,
        videoDuration: '0:30',
        isBarOfficial: true,
        author: {
          id: post.author.id,
          name: post.author.profile?.name || 'Pirambeira Bar',
          username: post.author.profile?.username || 'pirambeira.bar',
          avatarUrl: post.author.profile?.avatarUrl || '/LogoPirambeiraSemFundo.png',
          checkInCount: post.author.profile?.checkInCount || 100,
          isOfficial: true,
        },
        comments: post.comments.map((c) => ({
          id: c.id,
          content: c.content,
          createdAt: c.createdAt,
          author: {
            id: c.author.id,
            name: c.author.profile?.name || 'Frequentador',
            username: c.author.profile?.username || 'usuario',
            avatarUrl: c.author.profile?.avatarUrl,
          },
        })),
      };
    });
  }

  async toggleReaction(postId: string, userId: string, type: ReactionType = ReactionType.CHEERS) {

    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.isDeleted) {
      throw new NotFoundException('Publicação não encontrada.');
    }

    const existing = await this.prisma.reaction.findUnique({
      where: {
        postId_userId: { postId, userId },
      },
    });

    if (existing) {
      if (existing.type === type) {
        // Remover reação
        await this.prisma.reaction.delete({
          where: { id: existing.id },
        });
        return { reacted: false, type: null };
      } else {
        // Atualizar tipo de reação (ex: trocou coração por brinde 🍻)
        const updated = await this.prisma.reaction.update({
          where: { id: existing.id },
          data: { type },
        });
        return { reacted: true, type: updated.type };
      }
    }

    const reaction = await this.prisma.reaction.create({
      data: {
        postId,
        userId,
        type,
      },
    });

    // Notificar autor do post se não for ele mesmo
    if (post.authorId !== userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });
      await this.prisma.notification.create({
        data: {
          userId: post.authorId,
          type: 'REACTION',
          title: 'Nova reação no seu post',
          body: `${user?.profile?.name || 'Alguém'} reagiu ao seu post no bar.`,
          link: '/',
        },
      });
    }

    return { reacted: true, type: reaction.type };
  }

  async addComment(postId: string, userId: string, dto: CreateCommentDto) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.isDeleted) {
      throw new NotFoundException('Publicação não encontrada.');
    }

    const comment = await this.prisma.comment.create({
      data: {
        postId,
        authorId: userId,
        content: dto.content,
        parentId: dto.parentId,
      },
      include: {
        author: {
          include: { profile: true },
        },
      },
    });

    // Notificar autor do post
    if (post.authorId !== userId) {
      await this.prisma.notification.create({
        data: {
          userId: post.authorId,
          type: 'COMMENT',
          title: 'Novo comentário na sua foto',
          body: `${comment.author.profile?.name || 'Alguém'} comentou: "${dto.content.substring(0, 40)}..."`,
          link: '/',
        },
      });
    }

    return {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: {
        id: comment.author.id,
        name: comment.author.profile?.name || 'Frequentador',
        username: comment.author.profile?.username || 'usuario',
        avatarUrl: comment.author.profile?.avatarUrl,
      },
    };
  }

  async deletePost(postId: string, userId: string, role: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Publicação não encontrada.');
    }

    const isAuthor = post.authorId === userId;
    const isAdmin = role === 'RESTAURANT_ADMIN' || role === 'SUPERADMIN';

    if (!isAuthor && !isAdmin) {
      throw new ForbiddenException('Sem permissão para remover esta publicação.');
    }

    await this.prisma.post.update({
      where: { id: postId },
      data: { isDeleted: true },
    });

    return { message: 'Publicação removida com sucesso.' };
  }
}
