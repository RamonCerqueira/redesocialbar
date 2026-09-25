import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RestaurantsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const restaurants = await this.prisma.restaurant.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            checkIns: {
              where: {
                status: 'ACTIVE',
                expiresAt: { gt: new Date() },
              },
            },
            events: true,
            promotions: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return restaurants.map((r) => ({
      ...r,
      activePeopleCount: r._count.checkIns,
    }));
  }

  async findBySlug(slug: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug },
      include: {
        events: {
          where: {
            isActive: true,
            date: { gte: new Date(Date.now() - 24 * 3600000) },
          },
          orderBy: { date: 'asc' },
          take: 4,
          include: {
            _count: { select: { participants: true } },
          },
        },
        promotions: {
          where: {
            isActive: true,
            validUntil: { gt: new Date() },
          },
          orderBy: { createdAt: 'desc' },
          take: 4,
        },
        _count: {
          select: {
            checkIns: {
              where: {
                status: 'ACTIVE',
                expiresAt: { gt: new Date() },
              },
            },
            posts: true,
          },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException(`Estabelecimento "${slug}" não encontrado.`);
    }

    return {
      ...restaurant,
      activePeopleCount: restaurant._count.checkIns,
      totalPostsCount: restaurant._count.posts,
    };
  }
}
