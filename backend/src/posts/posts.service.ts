import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AccessService } from '../auth/access.service';
import { ReactionType, PostType } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService, private access: AccessService) {}

  async create(userId: string, dto: CreatePostDto) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug: dto.restaurantSlug },
    });

    if (!restaurant) {
      throw new NotFoundException(`Estabelecimento "${dto.restaurantSlug}" não encontrado.`);
    }

    let flirtContext = dto.flirtContext;
    if (dto.tableNumber || dto.targetPatron || dto.isAnonymous !== undefined) {
      flirtContext = JSON.stringify({
        table: dto.tableNumber,
        target: dto.targetPatron,
        isAnonymous: dto.isAnonymous,
        context: dto.flirtContext || dto.tableNumber || 'No Piramba',
      });
    }

    const post = await this.prisma.post.create({
      data: {
        content: dto.content,
        type: dto.type || PostType.FEED,
        flirtContext,
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

    // Se marcou um pirambeiro, disparar notificação automática
    if (dto.targetPatron) {
      const cleanTarget = dto.targetPatron.replace(/^@/, '').trim();
      if (cleanTarget) {
        try {
          const targetUser = await this.prisma.user.findFirst({
            where: {
              profile: {
                username: {
                  equals: cleanTarget,
                  mode: 'insensitive',
                },
              },
            },
            include: { profile: true },
          });

          if (targetUser && targetUser.id !== userId) {
            const sender = await this.prisma.user.findUnique({
              where: { id: userId },
              include: { profile: true },
            });
            const senderName = dto.isAnonymous ? 'Um pirambeiro secreto 🤫' : sender?.profile?.name || 'Alguém';
            const tableSuffix = dto.tableNumber ? ` da ${dto.tableNumber}` : '';

            await this.prisma.notification.create({
              data: {
                userId: targetUser.id,
                type: 'FLIRT',
                title: '💌 Recado no guardanapo pra você!',
                body: `${senderName} marcou você em um recadinho no guardanapo${tableSuffix}! 🍻`,
                link: '/paquera',
              },
            });
          }
        } catch (notifErr) {
          console.warn('Erro ao notificar usuário marcado no recado:', notifErr);
        }
      }
    }

    const { author, ...result } = post;
    return { ...result, author: { id: author.id, name: author.profile?.name, username: author.profile?.username, avatarUrl: author.profile?.avatarUrl } };
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
        type: postType && postType !== PostType.FLIRT ? postType : { not: PostType.FLIRT },
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
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: 30,
    });

    // Mapear se o usuário logado reagiu ao post
    return posts.map((post) => {
      const userReaction = currentUserId
        ? post.reactions.find((r) => r.userId === currentUserId)?.type || null
        : null;

      const isVideo = post.media.some((m) => m.type === 'VIDEO' || m.url.endsWith('.mp4'));
      const videoMedia = isVideo ? post.media.find((m) => m.type === 'VIDEO' || m.url.endsWith('.mp4')) : null;
      const isOfficial = post.isOfficial;

      return {
        id: post.id,
        content: post.content,
        type: post.type,
        flirtContext: post.flirtContext,
        buttonText: post.buttonText,
        buttonUrl: post.buttonUrl,
        createdAt: post.createdAt,
        likesCount: post._count.reactions,
        commentsCount: post._count.comments,
        userReaction,
        media: post.media.map((m) => m.url),
        isVideo,
        videoUrl: videoMedia?.url,
        videoDuration: isVideo ? '0:30' : undefined,
        isBarOfficial: isOfficial,
        author: {
          id: post.author.id,
          name: post.author.profile?.name || 'Frequentador',
          username: post.author.profile?.username || 'usuario',
          avatarUrl: post.author.profile?.avatarUrl,
          checkInCount: post.author.profile?.checkInCount || 1,
          isOfficial,
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
        isOfficial: true,
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
        buttonText: post.buttonText,
        buttonUrl: post.buttonUrl,
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
          checkInCount: post.author.profile?.checkInCount ?? 0,
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

      const isFlirt = post.type === PostType.FLIRT;
      const isCheers = type === ReactionType.CHEERS;
      const senderName = user?.profile?.name || 'Alguém no bar';

      let notifTitle = 'Nova reação no seu post';
      let notifBody = `${senderName} reagiu ao seu post no bar.`;
      let notifLink = '/';

      if (isFlirt) {
        notifTitle = '🍻 Brindaram no seu guardanapo!';
        notifBody = `${senderName} mandou um brinde para o seu recado no guardanapo! Saúde! 🍻`;
        notifLink = '/paquera';
      } else if (isCheers) {
        notifTitle = '🍻 Brindaram com você!';
        notifBody = `${senderName} brindou com você no bar! Saúde! 🍻`;
      }

      await this.prisma.notification.create({
        data: {
          userId: post.authorId,
          type: isFlirt ? 'FLIRT' : 'REACTION',
          title: notifTitle,
          body: notifBody,
          link: notifLink,
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
    if (!isAuthor && isAdmin) await this.access.restaurantId({ id: userId, role }, post.restaurantId);

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
