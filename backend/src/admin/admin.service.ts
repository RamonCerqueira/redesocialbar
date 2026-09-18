import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardMetrics(restaurantSlug: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug: restaurantSlug },
    });

    if (!restaurant) {
      throw new NotFoundException(`Estabelecimento "${restaurantSlug}" não encontrado.`);
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Pessoas presentes agora
    const activePatronsCount = await this.prisma.checkIn.count({
      where: {
        restaurantId: restaurant.id,
        status: 'ACTIVE',
        expiresAt: { gt: now },
      },
    });

    // 2. Check-ins hoje
    const todayCheckInsCount = await this.prisma.checkIn.count({
      where: {
        restaurantId: restaurant.id,
        startedAt: { gte: startOfToday },
      },
    });

    // 3. Publicações no restaurante
    const postsCount = await this.prisma.post.count({
      where: {
        restaurantId: restaurant.id,
        isDeleted: false,
      },
    });

    // 4. Interações (reações + comentários)
    const reactionsCount = await this.prisma.reaction.count({
      where: {
        post: { restaurantId: restaurant.id },
      },
    });
    const commentsCount = await this.prisma.comment.count({
      where: {
        post: { restaurantId: restaurant.id },
      },
    });

    // 5. Cupons resgatados
    const redeemedCouponsCount = await this.prisma.coupon.count({
      where: {
        promotion: { restaurantId: restaurant.id },
      },
    });

    // 6. Eventos cadastrados
    const eventsCount = await this.prisma.event.count({
      where: {
        restaurantId: restaurant.id,
      },
    });

    // 7. Encontros comunitários
    const meetupsCount = await this.prisma.meetup.count({
      where: {
        restaurantId: restaurant.id,
      },
    });

    // 8. Gráfico de fluxo por horário (distribuição simulada/agrupada)
    const hourlyTraffic = [
      { hour: '17h', patrons: 14 },
      { hour: '18h', patrons: 28 },
      { hour: '19h', patrons: 56 },
      { hour: '20h', patrons: 82 },
      { hour: '21h', patrons: 87 },
      { hour: '22h', patrons: 74 },
      { hour: '23h', patrons: 45 },
    ];

    return {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
      },
      metrics: {
        activePatronsCount,
        todayCheckInsCount,
        postsCount,
        interactionsCount: reactionsCount + commentsCount,
        redeemedCouponsCount,
        eventsCount,
        meetupsCount,
      },
      charts: {
        hourlyTraffic,
      },
    };
  }
}
