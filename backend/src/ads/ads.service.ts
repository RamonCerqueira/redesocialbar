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
        AND: [{ OR: [{startsAt:null},{startsAt:{lte:new Date()}}] }, { OR: [{endsAt:null},{endsAt:{gt:new Date()}}] }],
      },
      orderBy: [{sortOrder:'asc'}, { createdAt: 'desc' }, { id: 'desc' }],
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
  async recordImpression(adId: string) {
    const now=new Date();
    const result=await this.prisma.advertisement.updateMany({where:{id:adId,isActive:true,AND:[{OR:[{startsAt:null},{startsAt:{lte:now}}]},{OR:[{endsAt:null},{endsAt:{gt:now}}]}]},data:{impressions:{increment:1}}});
    if(!result.count) throw new NotFoundException('Novidade indisponível.');
    return {success:true};
  }
}
