import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExpressInterestDto } from './dto/express-interest.dto';
import { InterestStatus, PostType } from '@prisma/client';
import { blockedIds } from '../auth/social-access';

@Injectable()
export class FlirtService {
  constructor(private prisma: PrismaService) {}

  async expressInterest(fromUserId: string, dto: ExpressInterestDto) {
    if (fromUserId === dto.targetUserId) {
      throw new BadRequestException('Você não pode demonstrar interesse por você mesmo.');
    }

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug: dto.restaurantSlug },
    });

    if (!restaurant) {
      throw new NotFoundException(`Estabelecimento "${dto.restaurantSlug}" não encontrado.`);
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: dto.targetUserId },
      include: { profile: true },
    });

    if (!targetUser || targetUser.status !== 'ACTIVE' || !targetUser.profile) {
      throw new NotFoundException('Usuário de destino não encontrado.');
    }

    // Verificar se o usuário alvo permite paquera
    if (!targetUser.profile.showInFlirtRadar || targetUser.profile.invisibleMode || targetUser.profile.isPrivate || targetUser.profile.allowFlirtFrom === 'NONE') {
      throw new BadRequestException('Este usuário optou por não participar da paquera.');
    }
    if (targetUser.profile.allowFlirtFrom === 'FOLLOWERS' && !await this.prisma.follow.findUnique({ where: { followerId_followingId: { followerId: fromUserId, followingId: dto.targetUserId } } })) throw new BadRequestException('Este usuário permite interesse somente de seguidores.');

    // Verificar se há bloqueio mútuo
    const block = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: fromUserId, blockedId: dto.targetUserId },
          { blockerId: dto.targetUserId, blockedId: fromUserId },
        ],
      },
    });
    if (block) {
      throw new BadRequestException('Não é possível interagir com este usuário.');
    }

    // Verificar se o usuário alvo já havia demonstrado interesse pelo usuário atual (MATCH!)
    const reciprocalInterest = await this.prisma.interest.findUnique({
      where: {
        fromUserId_toUserId_restaurantId: {
          fromUserId: dto.targetUserId,
          toUserId: fromUserId,
          restaurantId: restaurant.id,
        },
      },
    });

    // Registrar o interesse do usuário atual
    await this.prisma.interest.upsert({
      where: {
        fromUserId_toUserId_restaurantId: {
          fromUserId,
          toUserId: dto.targetUserId,
          restaurantId: restaurant.id,
        },
      },
      update: {
        status: reciprocalInterest ? InterestStatus.MATCHED : InterestStatus.PENDING,
      },
      create: {
        fromUserId,
        toUserId: dto.targetUserId,
        restaurantId: restaurant.id,
        status: reciprocalInterest ? InterestStatus.MATCHED : InterestStatus.PENDING,
      },
    });

    // Se houver interesse recíproco: É UM MATCH! ✨
    if (reciprocalInterest) {
      // Atualizar o interesse anterior para MATCHED
      await this.prisma.interest.update({
        where: { id: reciprocalInterest.id },
        data: { status: InterestStatus.MATCHED },
      });

      // Verificar se o match já existe
      const existingMatch = await this.prisma.match.findFirst({
        where: {
          restaurantId: restaurant.id,
          OR: [
            { user1Id: fromUserId, user2Id: dto.targetUserId },
            { user1Id: dto.targetUserId, user2Id: fromUserId },
          ],
        },
      });

      if (!existingMatch) {
        const match = await this.prisma.match.create({
          data: {
            user1Id: fromUserId,
            user2Id: dto.targetUserId,
            restaurantId: restaurant.id,
          },
        });

        // Buscar dados do usuário atual para notificação
        const sender = await this.prisma.user.findUnique({
          where: { id: fromUserId },
          include: { profile: true },
        });

        // Disparar notificação para ambos
        await this.prisma.notification.createMany({
          data: [
            {
              userId: dto.targetUserId,
              type: 'MATCH',
              title: '✨ Deu Match no Piramba!',
              body: `Você e ${sender?.profile?.name || 'alguém'} demonstraram interesse mútuo!`,
              link: '/paquera',
            },
            {
              userId: fromUserId,
              type: 'MATCH',
              title: '✨ Deu Match no Piramba!',
              body: `Você e ${targetUser.profile.name} demonstraram interesse mútuo!`,
              link: '/paquera',
            },
          ],
        });

        return {
          isMatch: true,
          matchId: match.id,
          matchedUser: {
            id: targetUser.id,
            name: targetUser.profile.name,
            username: targetUser.profile.username,
            avatarUrl: targetUser.profile.avatarUrl,
          },
        };
      }
    }

    return {
      isMatch: false,
      message: 'Interesse registrado com discrição. Se a pessoa também demonstrar interesse, vocês darão match!',
    };
  }

  async getMyMatches(userId: string) {
    const blocked = await blockedIds(this.prisma, userId);
    const matches = await this.prisma.match.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
        user1Id: { notIn: blocked }, user2Id: { notIn: blocked },
        user1: { status: 'ACTIVE' }, user2: { status: 'ACTIVE' },
      },
      include: {
        user1: { include: { profile: true } },
        user2: { include: { profile: true } },
        restaurant: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return matches.map((m) => {
      const partner = m.user1Id === userId ? m.user2 : m.user1;
      return {
        id: m.id,
        restaurantName: m.restaurant.name,
        createdAt: m.createdAt,
        partner: {
          id: partner.id,
          name: partner.profile?.name || 'Parceiro de Match',
          username: partner.profile?.username,
          avatarUrl: partner.profile?.avatarUrl,
          bio: partner.profile?.bio,
        },
      };
    });
  }

  async getFlirtNotes(restaurantSlug: string, currentUserId?: string) {
    const blocked = await blockedIds(this.prisma, currentUserId);
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug: restaurantSlug },
    });

    if (!restaurant) {
      throw new NotFoundException(`Estabelecimento "${restaurantSlug}" não encontrado.`);
    }

    const notes = await this.prisma.post.findMany({
      where: {
        restaurantId: restaurant.id,
        type: PostType.FLIRT,
        isDeleted: false,
        authorId: { notIn: blocked },
        author: { status: 'ACTIVE', profile: { isPrivate: false } },
      },
      include: {
        author: { include: { profile: true } },
        reactions: true,
        _count: { select: { reactions: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 40,
    });

    return notes.map((n) => {
      let tableNumber: string | undefined = undefined;
      let targetPatron: string | undefined = undefined;
      let isAnonymous = false;
      let rawContext = n.flirtContext || 'No bar';

      if (n.flirtContext && n.flirtContext.startsWith('{')) {
        try {
          const parsed = JSON.parse(n.flirtContext);
          tableNumber = parsed.table || undefined;
          targetPatron = parsed.target || undefined;
          isAnonymous = Boolean(parsed.isAnonymous);
          rawContext = parsed.context || tableNumber || 'No bar';
        } catch {}
      } else if (n.flirtContext) {
        tableNumber = n.flirtContext;
      }

      const hasCheered = currentUserId
        ? n.reactions.some((r) => r.userId === currentUserId)
        : false;

      return {
        id: n.id,
        content: n.content,
        flirtContext: rawContext,
        tableNumber,
        targetPatron,
        isAnonymous,
        hasCheered,
        createdAt: n.createdAt,
        likesCount: n._count.reactions,
        commentsCount: n._count.comments,
        author: {
          id: isAnonymous ? 'anon' : n.author.id,
          name: isAnonymous ? 'Pirambeiro Secreto' : n.author.profile?.name || 'Alguém misterioso',
          username: isAnonymous ? 'anonimo' : n.author.profile?.username || 'pirambeiro',
          avatarUrl: isAnonymous ? undefined : n.author.profile?.avatarUrl,
        },
      };
    });
  }
}
