import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getUserConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        restaurant: true,
        participants: {
          include: {
            user: { include: { profile: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: { select: { messages: { where: { isRead:false, senderId:{not:userId} } } } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversations.map((c) => {
      const otherParticipants = c.participants.filter((p) => p.userId !== userId);
      const otherUser = otherParticipants[0]?.user;
      const lastMessage = c.messages[0];

      return {
        id: c.id,
        unreadCount: c._count.messages,
        type: c.type,
        restaurantName: c.restaurant.name,
        restaurantSlug: c.restaurant.slug,
        updatedAt: c.updatedAt,
        otherUser: otherUser
          ? {
              id: otherUser.id,
              name: otherUser.profile?.name || 'Frequentador',
              username: otherUser.profile?.username,
              avatarUrl: otherUser.profile?.avatarUrl,
            }
          : null,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              isMine: lastMessage.senderId === userId,
              isRead: lastMessage.isRead,
            }
          : null,
      };
    });
  }

  async getConversationMessages(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: { include: { profile: true } },
          },
        },
        restaurant: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada.');
    }

    const isParticipant = conversation.participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      throw new ForbiddenException('Você não tem acesso a esta conversa.');
    }

    // Marcar mensagens recebidas como lidas
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          include: { profile: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const otherParticipants = conversation.participants.filter((p) => p.userId !== userId);
    const otherUser = otherParticipants[0]?.user;

    return {
      conversationId: conversation.id,
      story: conversation.type.startsWith('STORY:') ? await this.prisma.story.findUnique({ where: { id: conversation.type.slice(6) }, select: { mediaUrl: true, caption: true, expiresAt: true } }) : null,
      type: conversation.type,
      restaurant: {
        name: conversation.restaurant.name,
        slug: conversation.restaurant.slug,
      },
      otherUser: otherUser
        ? {
            id: otherUser.id,
            name: otherUser.profile?.name || 'Frequentador',
            username: otherUser.profile?.username,
            avatarUrl: otherUser.profile?.avatarUrl,
          }
        : null,
      messages: messages.map((m) => ({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt,
        isMine: m.senderId === userId,
        isRead: m.isRead,
        senderName: m.sender.profile?.name,
        senderAvatar: m.sender.profile?.avatarUrl,
      })),
    };
  }

  async sendMessage(conversationId: string, userId: string, dto: SendMessageDto) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada.');
    }

    const isParticipant = conversation.participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      throw new ForbiddenException('Você não pode enviar mensagens nesta conversa.');
    }

    // Verificar se algum outro participante bloqueou o usuário
    const otherParticipants = conversation.participants.filter((p) => p.userId !== userId);
    for (const p of otherParticipants) {
      const block = await this.prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: userId, blockedId: p.userId },
            { blockerId: p.userId, blockedId: userId },
          ],
        },
      });
      if (block) {
        throw new ForbiddenException('Não é possível enviar mensagens devido a bloqueio.');
      }
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: dto.content,
      },
      include: {
        sender: { include: { profile: true } },
      },
    });

    // Atualizar updatedAt da conversa
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Notificar os outros participantes
    for (const p of otherParticipants) {
      await this.prisma.notification.create({
        data: {
          userId: p.userId,
          type: 'MESSAGE',
          title: `Nova mensagem de ${message.sender.profile?.name || 'alguém'}`,
          body: dto.content.length > 50 ? `${dto.content.substring(0, 47)}...` : dto.content,
          link: `/chat/${conversationId}`,
        },
      });
    }

    return {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      isMine: true,
      isRead: false,
      senderName: message.sender.profile?.name,
      senderAvatar: message.sender.profile?.avatarUrl,
    };
  }
}
