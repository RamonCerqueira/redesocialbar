import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface Actor { id: string; role: string }

@Injectable()
export class AccessService {
  constructor(private prisma: PrismaService) {}

  async restaurant(actor: Actor, slug: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { slug } });
    if (!restaurant) throw new NotFoundException('Restaurante não encontrado.');
    await this.restaurantId(actor, restaurant.id);
    return restaurant;
  }

  async restaurantId(actor: Actor, restaurantId: string) {
    if (actor.role === 'SUPERADMIN') return;
    if (actor.role !== 'RESTAURANT_ADMIN') throw new ForbiddenException('Acesso administrativo necessário.');
    const member = await this.prisma.restaurantMember.findUnique({
      where: { restaurantId_userId: { restaurantId, userId: actor.id } },
    });
    if (!member || !['OWNER', 'MANAGER'].includes(member.role)) {
      throw new ForbiddenException('Você não administra este restaurante.');
    }
  }
}
