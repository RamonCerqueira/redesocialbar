import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdsService {
  constructor(private prisma: PrismaService) {}

  async getActiveAds(restaurantSlug: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug: restaurantSlug },
    });

    if (!restaurant) {
      throw new NotFoundException(`Estabelecimento "${restaurantSlug}" não encontrado.`);
    }

    const ads = await this.prisma.advertisement.findMany({
      where: {
        restaurantId: restaurant.id,
        isActive: true,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 20,
    });

    return ads;
  }

  async recordClick(adId: string) {
    await this.prisma.advertisement.update({
      where: { id: adId },
      data: { clicks: { increment: 1 } },
    });
    return { success: true };
  }
}
