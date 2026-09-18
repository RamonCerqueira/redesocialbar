import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckInDto } from './dto/create-checkin.dto';
import { CheckInStatus } from '@prisma/client';

@Injectable()
export class CheckInsService {
  constructor(private prisma: PrismaService) {}

  async checkIn(userId: string, dto: CreateCheckInDto) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug: dto.restaurantSlug },
    });

    if (!restaurant) {
      throw new NotFoundException(`Estabelecimento "${dto.restaurantSlug}" não encontrado.`);
    }

    // Encerrar check-ins ativos anteriores do usuário
    await this.prisma.checkIn.updateMany({
      where: {
        userId,
        status: CheckInStatus.ACTIVE,
      },
      data: {
        status: CheckInStatus.CHECKED_OUT,
        endedAt: new Date(),
      },
    });

    const now = new Date();
    // Duração padrão: 4 horas
    const expiresAt = new Date(now.getTime() + 4 * 3600000);

    // Calcular distância aproximada se fornecida
    let approxDistanceMeters: number | null = null;
    if (dto.approxLatitude && dto.approxLongitude && restaurant.approxLatitude && restaurant.approxLongitude) {
      approxDistanceMeters = this.calculateDistance(
        dto.approxLatitude,
        dto.approxLongitude,
        restaurant.approxLatitude,
        restaurant.approxLongitude,
      );
    }

    const checkIn = await this.prisma.checkIn.create({
      data: {
        userId,
        restaurantId: restaurant.id,
        status: CheckInStatus.ACTIVE,
        startedAt: now,
        expiresAt,
        approxDistanceMeters,
      },
      include: {
        restaurant: true,
      },
    });

    // Incrementar contagem de check-ins no perfil
    await this.prisma.profile.update({
      where: { userId },
      data: {
        checkInCount: { increment: 1 },
      },
    });

    return checkIn;
  }

  async checkOut(userId: string) {
    const activeCheckIn = await this.prisma.checkIn.findFirst({
      where: {
        userId,
        status: CheckInStatus.ACTIVE,
      },
    });

    if (!activeCheckIn) {
      throw new BadRequestException('Você não possui nenhum check-in ativo no momento.');
    }

    const updated = await this.prisma.checkIn.update({
      where: { id: activeCheckIn.id },
      data: {
        status: CheckInStatus.CHECKED_OUT,
        endedAt: new Date(),
      },
    });

    return { message: 'Check-out realizado com sucesso.', checkIn: updated };
  }

  async getActiveCheckIn(userId: string) {
    const active = await this.prisma.checkIn.findFirst({
      where: {
        userId,
        status: CheckInStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
      include: {
        restaurant: true,
      },
      orderBy: { startedAt: 'desc' },
    });

    return active;
  }

  async getWhoIsHere(restaurantSlug: string, currentUserId?: string, filter?: 'all' | 'new' | 'friends' | 'flirt') {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug: restaurantSlug },
    });

    if (!restaurant) {
      throw new NotFoundException(`Estabelecimento "${restaurantSlug}" não encontrado.`);
    }

    const now = new Date();

    // Auto-expirar check-ins vencidos em background
    await this.prisma.checkIn.updateMany({
      where: {
        restaurantId: restaurant.id,
        status: CheckInStatus.ACTIVE,
        expiresAt: { lte: now },
      },
      data: {
        status: CheckInStatus.EXPIRED,
      },
    });

    // Buscar lista de IDs de amigos que o usuário atual segue
    let followedUserIds: string[] = [];
    if (currentUserId && filter === 'friends') {
      const follows = await this.prisma.follow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true },
      });
      followedUserIds = follows.map((f) => f.followingId);
    }

    // Buscar quem bloqueou ou foi bloqueado
    let blockedUserIds: string[] = [];
    if (currentUserId) {
      const blocks = await this.prisma.block.findMany({
        where: {
          OR: [{ blockerId: currentUserId }, { blockedId: currentUserId }],
        },
      });
      blockedUserIds = blocks.map((b) => (b.blockerId === currentUserId ? b.blockedId : b.blockerId));
    }

    const checkIns = await this.prisma.checkIn.findMany({
      where: {
        restaurantId: restaurant.id,
        status: CheckInStatus.ACTIVE,
        expiresAt: { gt: now },
        user: {
          id: { notIn: blockedUserIds },
          profile: {
            invisibleMode: false,
            ...(filter === 'new' ? { checkInCount: { lte: 6 } } : {}),
            ...(filter === 'flirt' ? { showInFlirtRadar: true } : {}),
          },
          ...(filter === 'friends' ? { id: { in: followedUserIds } } : {}),
        },
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    // Contagem total de pessoas presentes no momento
    const totalCount = await this.prisma.checkIn.count({
      where: {
        restaurantId: restaurant.id,
        status: CheckInStatus.ACTIVE,
        expiresAt: { gt: now },
      },
    });

    // Mapear resultado para formato limpo sem expor dados privados
    const patrons = checkIns.map((ci) => {
      const p = ci.user.profile;
      return {
        checkInId: ci.id,
        userId: ci.user.id,
        name: p?.name || 'Frequentador',
        username: p?.username || 'usuario',
        avatarUrl: p?.avatarUrl,
        bio: p?.bio,
        city: p?.city,
        interests: p?.interests || [],
        checkInCount: p?.checkInCount || 1,
        showInFlirtRadar: p?.showInFlirtRadar ?? true,
        startedAt: ci.startedAt,
        timePresentMinutes: Math.max(0, Math.floor((now.getTime() - new Date(ci.startedAt).getTime()) / 60000)),
      };
    });

    return {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
      },
      totalActivePatrons: totalCount,
      patrons,
    };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Metros
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }
}
