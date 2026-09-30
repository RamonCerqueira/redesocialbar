import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMeetupDto } from './dto/create-meetup.dto';
import { MeetupStatus } from '@prisma/client';
import { assertSocialAccess, blockedIds } from '../auth/social-access';

@Injectable()
export class MeetupsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateMeetupDto) {
    if (new Date(dto.scheduledFor).getTime() <= Date.now()) throw new BadRequestException('Escolha uma data futura para o encontro.');
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

    return { id: meetup.id, title: meetup.title, description: meetup.description, scheduledFor: meetup.scheduledFor, status: meetup.status };
  }

  async findAll(restaurantSlug: string, currentUserId?: string) {
    const blocked = await blockedIds(this.prisma, currentUserId);
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
        creatorId: { notIn: blocked },
        creator: { status: 'ACTIVE', profile: { isPrivate: false } },
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
        participants: m.participants.filter(p => !blocked.includes(p.userId) && p.user.status === 'ACTIVE' && !p.user.profile?.invisibleMode && !p.user.profile?.isPrivate).map((p) => ({
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

    if (!meetup || meetup.status === MeetupStatus.CANCELLED || meetup.scheduledFor < new Date(Date.now() - 6 * 3600000)) {
      throw new NotFoundException('Encontro não encontrado.');
    }
    await assertSocialAccess(this.prisma, userId, meetup.creatorId);

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
