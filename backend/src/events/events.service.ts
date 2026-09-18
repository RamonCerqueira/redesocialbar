import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventRsvpStatus } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async findAll(restaurantSlug: string, currentUserId?: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug: restaurantSlug },
    });

    if (!restaurant) {
      throw new NotFoundException(`Estabelecimento "${restaurantSlug}" não encontrado.`);
    }

    const events = await this.prisma.event.findMany({
      where: {
        restaurantId: restaurant.id,
        date: { gte: new Date(Date.now() - 3600000 * 24) },
      },
      include: {
        participants: true,
        _count: { select: { participants: true } },
      },
      orderBy: { date: 'asc' },
    });

    return events.map((e) => {
      const isRsvpd = currentUserId
        ? e.participants.some((p) => p.userId === currentUserId)
        : false;

      return {
        id: e.id,
        title: e.title,
        category: e.category,
        description: e.description,
        date: e.date,
        startTime: e.startTime,
        coverImageUrl: e.coverImageUrl,
        participantsCount: e._count.participants,
        isRsvpd,
      };
    });
  }

  async toggleRsvp(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado.');
    }

    const existing = await this.prisma.eventParticipant.findUnique({
      where: {
        eventId_userId: { eventId, userId },
      },
    });

    if (existing) {
      await this.prisma.eventParticipant.delete({
        where: { id: existing.id },
      });
      return { rsvpd: false, message: 'Presença cancelada.' };
    }

    await this.prisma.eventParticipant.create({
      data: {
        eventId,
        userId,
        status: EventRsvpStatus.GOING,
      },
    });

    return { rsvpd: true, message: 'Presença confirmada no evento!' };
  }
}
