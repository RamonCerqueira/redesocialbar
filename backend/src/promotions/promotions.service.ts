import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService, Actor } from '../auth/access.service';

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService, private access: AccessService) {}
  async mine(userId: string) {
    const coupons = await this.prisma.coupon.findMany({ where: { userId }, include: { promotion: true }, orderBy: { claimedAt: 'desc' } });
    return coupons.map(c => ({ ...c, status: c.status === 'CLAIMED' && c.promotion.validUntil <= new Date() ? 'EXPIRED' : c.status }));
  }
  async findAll(slug: string, userId?: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { slug } });
    if (!restaurant) throw new NotFoundException('Restaurante não encontrado.');
    const promotions = await this.prisma.promotion.findMany({
      where: { restaurantId: restaurant.id, isActive: true, validUntil: { gt: new Date() } },
      include: { coupons: { where: { userId: userId || '' } } }, orderBy: { createdAt: 'desc' },
    });
    return promotions.map(({ coupons, ...p }) => ({ ...p, isAvailable: p.redeemedCount < p.totalCoupons, userCoupon: coupons[0] || null }));
  }
  async claimCoupon(promotionId: string, userId: string) {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        return await this.prisma.$transaction(async tx => {
          const existing = await tx.coupon.findUnique({ where: { promotionId_userId: { promotionId, userId } } });
          if (existing) return { message: 'Você já resgatou este cupom.', coupon: existing };
          const promotion = await tx.promotion.findUnique({ where: { id: promotionId } });
          if (!promotion) throw new NotFoundException('Promoção não encontrada.');
          if (!promotion.isActive || promotion.validUntil <= new Date()) throw new BadRequestException('Promoção indisponível ou expirada.');
          const reserved = await tx.promotion.updateMany({
            where: { id: promotionId, isActive: true, validUntil: { gt: new Date() }, redeemedCount: { lt: promotion.totalCoupons } },
            data: { redeemedCount: { increment: 1 } },
          });
          if (reserved.count !== 1) throw new BadRequestException('Os cupons esgotaram.');
          const coupon = await tx.coupon.create({ data: { promotionId, userId, code: 'PIRAMBA-' + randomBytes(6).toString('hex').toUpperCase() } });
          await tx.notification.create({ data: { userId, type: 'COUPON', title: 'Cupom resgatado!', body: promotion.title, link: '/promocoes' } });
          return { message: 'Cupom resgatado com sucesso!', coupon };
        }, { maxWait: 10000, timeout: 15000, isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2034', 'P2002'].includes(error.code) && attempt < 3) continue;
        throw error;
      }
    }
    throw new BadRequestException('Tente resgatar novamente.');
  }
  async validateCoupon(code: string, slug: string, actor: Actor) {
    const restaurant = await this.access.restaurant(actor, slug);
    const coupon = await this.prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() }, include: { promotion: true, user: { select: { profile: true } } } });
    if (!coupon || coupon.promotion.restaurantId !== restaurant.id) throw new NotFoundException('Cupom não encontrado neste restaurante.');
    if (coupon.promotion.validUntil <= new Date()) throw new BadRequestException('Cupom expirado.');
    const updated = await this.prisma.coupon.updateMany({
      where: { id: coupon.id, status: 'CLAIMED', promotion: { validUntil: { gt: new Date() } } },
      data: { status: 'USED', usedAt: new Date() },
    });
    if (updated.count !== 1) throw new BadRequestException('Este cupom já foi utilizado ou expirou.');
    return { success: true, message: 'Cupom validado!', customer: { name: coupon.user.profile?.name }, promotion: { title: coupon.promotion.title }, coupon: { id: coupon.id, code: coupon.code, status: 'USED' } };
  }
}
