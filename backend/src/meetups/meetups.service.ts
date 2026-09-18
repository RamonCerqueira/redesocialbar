import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMeetupDto } from './dto/create-meetup.dto';
import { MeetupStatus } from '@prisma/client';

@Injectable()
export class MeetupsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateMeetupDto) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug: dto.restaurantSlug },
    });

    if (!restaurant) {
      throw new NotFoundException(`Estabelecimento "${dto.restaurantSlug}" não encontrado.`);
    }

    const meetup = await this.prisma.meetup.create({
      data: {
        title: dto.title,
        description: dto.description,
        scheduledFor: new Date(dto.scheduledFor),
        creatorId: userId,
        restaurantId: restaurant.id,
        status: MeetupStatus.SCHEDULED,
        participants: {
          create: [{ userId }],
        },
      },
      include: {
        creator: { include: { profile: true } },
        participants: {
          include: {
            user: { include: { profile: true } },
          },
        },
      },
    });

    return meetup;
  }

  async findAll(restaurantSlug: string, currentUserId?: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug: restaurantSlug },
    });

    if (!restaurant) {
      throw new NotFoundException(`Estabelecimento "${restaurantSlug}" não encontrado.`);
    }

    const meetups = await this.prisma.meetup.findMany({
      where: {
        restaurantId: restaurant.id,
        status: { not: MeetupStatus.CANCELLED },
        scheduledFor: { gte: new Date(Date.now() - 3600000 * 6) }, // últimas 6 horas ou futuro
      },
      include: {
        creator: { include: { profile: true } },
        participants: {
          include: {
            user: { include: { profile: true } },
          },
        },
      },
      orderBy: { scheduledFor: 'asc' },
    });

    return meetups.map((m) => {
      const isJoined = currentUserId
        ? m.participants.some((p) => p.userId === currentUserId)
        : false;

      return {
        id: m.id,
        title: m.title,
        description: m.description,
        scheduledFor: m.scheduledFor,
        status: m.status,
        participantsCount: m.participants.length,
        isJoined,
        creator: {
          id: m.creator.id,
          name: m.creator.profile?.name || 'Frequentador',
          username: m.creator.profile?.username,
          avatarUrl: m.creator.profile?.avatarUrl,
        },
        participants: m.participants.map((p) => ({
          userId: p.user.id,
          name: p.user.profile?.name,
          avatarUrl: p.user.profile?.avatarUrl,
        })),
      };
    });
  }

  async toggleJoin(meetupId: string, userId: string) {
    const meetup = await this.prisma.meetup.findUnique({
      where: { id: meetupId },
    });

    if (!meetup) {
      throw new NotFoundException('Encontro não encontrado.');
    }

    const existing = await this.prisma.meetupParticipant.findUnique({
      where: {
        meetupId_userId: { meetupId, userId },
      },
    });

    if (existing) {
      if (meetup.creatorId === userId) {
        throw new ConflictException('O criador do encontro não pode sair da lista.');
      }
      await this.prisma.meetupParticipant.delete({
        where: { id: existing.id },
      });
      return { joined: false, message: 'Você saiu deste encontro.' };
    }

    await this.prisma.meetupParticipant.create({
      data: {
        meetupId,
        userId,
      },
    });

    // Notificar criador do meetup
    if (meetup.creatorId !== userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });
      await this.prisma.notification.create({
        data: {
          userId: meetup.creatorId,
          type: 'MEETUP',
          title: 'Novo participante no seu encontro!',
          body: `${user?.profile?.name || 'Alguém'} confirmou presença no seu encontro: "${meetup.title}".`,
          link: '/encontros',
        },
      });
    }

    return { joined: true, message: 'Presença confirmada no encontro!' };
  }
}
