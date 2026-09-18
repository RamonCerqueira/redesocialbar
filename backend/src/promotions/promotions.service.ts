import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CouponStatus } from '@prisma/client';

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(restaurantSlug: string, currentUserId?: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug: restaurantSlug },
    });

    if (!restaurant) {
      throw new NotFoundException(`Estabelecimento "${restaurantSlug}" não encontrado.`);
    }

    const promotions = await this.prisma.promotion.findMany({
      where: {
        restaurantId: restaurant.id,
        validUntil: { gt: new Date() },
      },
      include: {
        coupons: currentUserId
          ? {
              where: { userId: currentUserId },
            }
          : false,
      },
      orderBy: { createdAt: 'desc' },
    });

    return promotions.map((p) => {
      const userCoupon = currentUserId && p.coupons && p.coupons.length > 0 ? p.coupons[0] : null;

      return {
        id: p.id,
        title: p.title,
        discountText: p.discountText,
        description: p.description,
        validUntil: p.validUntil,
        terms: p.terms,
        badge: p.badge,
        totalCoupons: p.totalCoupons,
        redeemedCount: p.redeemedCount,
        isAvailable: p.redeemedCount < p.totalCoupons,
        userCoupon: userCoupon
          ? {
              id: userCoupon.id,
              code: userCoupon.code,
              status: userCoupon.status,
              claimedAt: userCoupon.claimedAt,
            }
          : null,
      };
    });
  }

  async claimCoupon(promotionId: string, userId: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id: promotionId },
      include: { restaurant: true },
    });

    if (!promotion) {
      throw new NotFoundException('Promoção não encontrada.');
    }

    if (new Date() > promotion.validUntil) {
      throw new BadRequestException('Esta promoção já expirou.');
    }

    if (promotion.redeemedCount >= promotion.totalCoupons) {
      throw new BadRequestException('Os cupons desta promoção esgotaram.');
    }

    const existingCoupon = await this.prisma.coupon.findFirst({
      where: {
        promotionId,
        userId,
      },
    });

    if (existingCoupon) {
      return {
        message: 'Você já resgatou este cupom anteriormente.',
        coupon: existingCoupon,
      };
    }

    // Gerar código único e legível
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `PIRAMBA-${randomSuffix}-${Math.floor(100 + Math.random() * 900)}`;

    const [coupon] = await this.prisma.$transaction([
      this.prisma.coupon.create({
        data: {
          code,
          promotionId,
          userId,
          status: CouponStatus.CLAIMED,
        },
      }),
      this.prisma.promotion.update({
        where: { id: promotionId },
        data: { redeemedCount: { increment: 1 } },
      }),
      this.prisma.notification.create({
        data: {
          userId,
          type: 'COUPON',
          title: '🎉 Cupom resgatado com sucesso!',
          body: `Seu cupom "${promotion.title}" foi gerado. Apresente o código ${code} no bar.`,
          link: '/promocoes',
        },
      }),
    ]);

    return {
      message: 'Cupom resgatado com sucesso!',
      coupon,
    };
  }

  async validateCoupon(code: string, restaurantSlug: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code },
      include: {
        promotion: {
          include: { restaurant: true },
        },
        user: {
          include: { profile: true },
        },
      },
    });

    if (!coupon) {
      throw new NotFoundException('Cupom não encontrado.');
    }

    if (coupon.promotion.restaurant.slug !== restaurantSlug) {
      throw new BadRequestException('Este cupom não pertence a este estabelecimento.');
    }

    if (coupon.status === CouponStatus.USED) {
      throw new BadRequestException(`Este cupom já foi utilizado em ${coupon.usedAt?.toLocaleString('pt-BR')}.`);
    }

    if (new Date() > coupon.promotion.validUntil) {
      throw new BadRequestException('Este cupom expirou.');
    }

    const validated = await this.prisma.coupon.update({
      where: { id: coupon.id },
      data: {
        status: CouponStatus.USED,
        usedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Cupom validado com sucesso!',
      customer: {
        name: coupon.user.profile?.name,
        username: coupon.user.profile?.username,
      },
      promotion: {
        title: coupon.promotion.title,
        discountText: coupon.promotion.discountText,
      },
      coupon: validated,
    };
  }
}
