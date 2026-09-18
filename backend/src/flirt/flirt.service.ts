import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExpressInterestDto } from './dto/express-interest.dto';
import { InterestStatus, PostType } from '@prisma/client';

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

    if (!targetUser || !targetUser.profile) {
      throw new NotFoundException('Usuário de destino não encontrado.');
    }

    // Verificar se o usuário alvo permite paquera
    if (!targetUser.profile.showInFlirtRadar || targetUser.profile.invisibleMode) {
      throw new BadRequestException('Este usuário optou por não participar da paquera.');
    }

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
        // Criar conversa privada desbloqueada pelo match
        const conversation = await this.prisma.conversation.create({
          data: {
            restaurantId: restaurant.id,
            type: 'MATCH',
            participants: {
              create: [{ userId: fromUserId }, { userId: dto.targetUserId }],
            },
          },
        });

        const match = await this.prisma.match.create({
          data: {
            user1Id: fromUserId,
            user2Id: dto.targetUserId,
            restaurantId: restaurant.id,
            conversationId: conversation.id,
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
              body: `Você e ${sender?.profile?.name || 'alguém'} demonstraram interesse mútuo! A conversa foi liberada.`,
              link: `/chat/${conversation.id}`,
            },
            {
              userId: fromUserId,
              type: 'MATCH',
              title: '✨ Deu Match no Piramba!',
              body: `Você e ${targetUser.profile.name} demonstraram interesse mútuo! A conversa foi liberada.`,
              link: `/chat/${conversation.id}`,
            },
          ],
        });

        return {
          isMatch: true,
          matchId: match.id,
          conversationId: conversation.id,
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
    const matches = await this.prisma.match.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
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
        conversationId: m.conversationId,
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

  async getFlirtNotes(restaurantSlug: string) {
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
      },
      include: {
        author: { include: { profile: true } },
        _count: { select: { reactions: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 25,
    });

    return notes.map((n) => ({
      id: n.id,
      content: n.content,
      flirtContext: n.flirtContext || 'No estabelecimento',
      createdAt: n.createdAt,
      likesCount: n._count.reactions,
      commentsCount: n._count.comments,
      author: {
        id: n.author.id,
        name: n.author.profile?.name || 'Alguém misterioso',
        username: n.author.profile?.username,
        avatarUrl: n.author.profile?.avatarUrl,
      },
    }));
  }
}
