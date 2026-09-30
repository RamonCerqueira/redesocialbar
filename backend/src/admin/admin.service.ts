import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService, Actor } from '../auth/access.service';
import { AdminPostDto, AdvertisementDto, EventDto, PromotionDto, RestaurantSettingsDto } from './admin.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService, private access: AccessService) {}
  restaurants(actor: Actor) {
    return this.prisma.restaurant.findMany({
      where: actor.role === 'SUPERADMIN' ? {} : { members: { some: { userId: actor.id, role: { in: ['OWNER', 'MANAGER'] } } } },
      select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' },
    });
  }
  settings(actor: Actor, slug: string) { return this.access.restaurant(actor, slug); }
  async saveGallery(actor: Actor, slug: string, photos: string[]) {
    const restaurant = await this.access.restaurant(actor, slug);
    return this.prisma.restaurant.update({ where: { id: restaurant.id }, data: { galleryPhotos: [...new Set(photos)] }, select: { galleryPhotos: true } });
  }
  async saveSettings(actor: Actor, slug: string, dto: RestaurantSettingsDto) {
    const r = await this.access.restaurant(actor, slug);
    if (dto.openingHours && Object.entries(dto.openingHours).some(([day, hours]) => day.length > 40 || typeof hours !== 'string' || hours.length > 120)) {
      throw new BadRequestException('Informe os horários como textos de até 120 caracteres.');
    }
    const text = (value: unknown, limit: number, required = false) => typeof value === 'string' ? value.length <= limit && (!required || !!value.trim()) : !required && value == null;
    if (dto.menuCategories && (dto.menuCategories.length > 40 || dto.menuCategories.some(category =>
      !category || !text(category.name, 100, true) || !text(category.description, 1000) || !Array.isArray(category.items) || category.items.length > 200 || category.items.some(item =>
        !item || !text(item.name, 140, true) || !text(item.price, 80, true) || !text(item.description, 3000) ||
        !text(item.portion, 120) || !text(item.prepTime, 120) || !text(item.weeklyPickNote, 300) ||
        (item.imageUrl && (!text(item.imageUrl, 2000) || !/^https?:\/\//i.test(item.imageUrl))) ||
        (item.tags != null && (!Array.isArray(item.tags) || item.tags.length > 12 || item.tags.some(tag => !text(tag, 50, true))))
      )
    ))) throw new BadRequestException('Revise as categorias, produtos, fotos e tags do cardápio.');
    return this.prisma.restaurant.update({ where: { id: r.id }, data: dto });
  }
  async dashboard(actor: Actor, slug: string) {
    const r = await this.access.restaurant(actor, slug);
    const now = new Date();
    const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
    const start = new Date(day + 'T00:00:00-03:00');
    const [activePatronsCount, todayCheckInsCount, postsCount, redeemedCouponsCount, usedCouponsCount, eventsCount, visits] = await Promise.all([
      this.prisma.checkIn.count({ where: { restaurantId: r.id, status: 'ACTIVE', expiresAt: { gt: now } } }),
      this.prisma.checkIn.count({ where: { restaurantId: r.id, startedAt: { gte: start } } }),
      this.prisma.post.count({ where: { restaurantId: r.id, isDeleted: false } }),
      this.prisma.coupon.count({ where: { promotion: { restaurantId: r.id } } }),
      this.prisma.coupon.count({ where: { promotion: { restaurantId: r.id }, status: 'USED' } }),
      this.prisma.event.count({ where: { restaurantId: r.id, isActive: true, date: { gte: start } } }),
      this.prisma.checkIn.findMany({ where: { restaurantId: r.id, startedAt: { gte: start } }, select: { startedAt: true } }),
    ]);
    const hourlyTraffic = Array.from({ length: 24 }, (_, h) => ({ hour: String(h).padStart(2, '0') + 'h', patrons: 0 }));
    for (const v of visits) {
      const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hourCycle: 'h23' }).format(v.startedAt));
      hourlyTraffic[hour].patrons++;
    }
    return { restaurant: { id: r.id, name: r.name, slug: r.slug }, metrics: { activePatronsCount, todayCheckInsCount, postsCount, redeemedCouponsCount, usedCouponsCount, eventsCount }, charts: { hourlyTraffic } };
  }
  async posts(actor: Actor, slug: string) {
    const r = await this.access.restaurant(actor, slug);
    return this.prisma.post.findMany({ where: { restaurantId: r.id, isDeleted: false, isOfficial: true }, include: { media: true }, orderBy: { createdAt: 'desc' }, take: 100 });
  }
  async savePost(actor: Actor, slug: string, dto: AdminPostDto, id?: string) {
    const r = await this.access.restaurant(actor, slug);
    if (id && !await this.prisma.post.findFirst({ where: { id, restaurantId: r.id, isOfficial: true, isDeleted: false } })) throw new NotFoundException('Publicação não encontrada.');
    const { mediaUrls = [], ...fields } = dto;
    if (!!dto.buttonText !== !!dto.buttonUrl) throw new BadRequestException('Informe texto e endereço do botão juntos.');
    const media = mediaUrls.map((url, sortOrder) => ({ url, sortOrder, type: 'IMAGE' }));
    return id
      ? this.prisma.post.update({ where: { id }, data: { ...fields, media: { deleteMany: {}, create: media } }, include: { media: true } })
      : this.prisma.post.create({ data: { ...fields, restaurantId: r.id, authorId: actor.id, isOfficial: true, media: { create: media } }, include: { media: true } });
  }
  async promotions(actor: Actor, slug: string) {
    const r = await this.access.restaurant(actor, slug);
    return this.prisma.promotion.findMany({ where: { restaurantId: r.id }, orderBy: { createdAt: 'desc' } });
  }
  async savePromotion(actor: Actor, slug: string, dto: PromotionDto, id?: string) {
    const r = await this.access.restaurant(actor, slug);
    const data = { ...dto, validUntil: new Date(dto.validUntil), buttonText: dto.buttonText || 'Resgatar cupom' };
    if (!id) {
      if (data.validUntil <= new Date()) throw new BadRequestException('Informe uma validade futura.');
      return this.prisma.promotion.create({ data: { ...data, restaurantId: r.id } });
    }
    const updated = await this.prisma.promotion.updateMany({ where: { id, restaurantId: r.id, redeemedCount: { lte: dto.totalCoupons } }, data });
    if (!updated.count) throw new BadRequestException('Promoção não encontrada ou quantidade inferior aos cupons já emitidos.');
    return this.prisma.promotion.findUnique({ where: { id } });
  }
  async coupons(actor: Actor, slug: string, cursor?: string) {
    const r = await this.access.restaurant(actor, slug);
    const items = await this.prisma.coupon.findMany({
      where: { promotion: { restaurantId: r.id } }, orderBy: [{ claimedAt: 'desc' }, { id: 'desc' }], take: 51,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { promotion: { select: { title: true, validUntil: true } }, user: { select: { profile: { select: { name: true } } } } },
    });
    return { items: items.slice(0, 50), nextCursor: items.length > 50 ? items[49].id : null };
  }
  async ads(actor: Actor, slug: string) {
    const r = await this.access.restaurant(actor, slug);
    return this.prisma.advertisement.findMany({ where: { restaurantId: r.id }, orderBy: { createdAt: 'desc' } });
  }
  async saveAd(actor: Actor, slug: string, dto: AdvertisementDto, id?: string) {
    const r = await this.access.restaurant(actor, slug);
    if (!id) return this.prisma.advertisement.create({ data: { ...dto, restaurantId: r.id } });
    const result = await this.prisma.advertisement.updateMany({ where: { id, restaurantId: r.id }, data: dto });
    if (!result.count) throw new NotFoundException('Banner não encontrado.');
    return this.prisma.advertisement.findUnique({ where: { id } });
  }
  async events(actor: Actor, slug: string) {
    const r = await this.access.restaurant(actor, slug);
    return this.prisma.event.findMany({ where: { restaurantId: r.id }, include: { _count: { select: { participants: true } } }, orderBy: { date: 'desc' } });
  }
  async saveEvent(actor: Actor, slug: string, dto: EventDto, id?: string) {
    const r = await this.access.restaurant(actor, slug);
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(dto.startTime)) throw new BadRequestException('Horário inválido.');
    const data = { ...dto, date: new Date(dto.date) };
    if (!id) return this.prisma.event.create({ data: { ...data, restaurantId: r.id } });
    const result = await this.prisma.event.updateMany({ where: { id, restaurantId: r.id }, data });
    if (!result.count) throw new NotFoundException('Evento não encontrado.');
    return this.prisma.event.findUnique({ where: { id } });
  }
  async archive(actor: Actor, slug: string, entity: 'post' | 'promotion' | 'advertisement' | 'event', id: string) {
    const r = await this.access.restaurant(actor, slug);
    const where = { id, restaurantId: r.id };
    const result = entity === 'post' ? await this.prisma.post.updateMany({ where: { ...where, isOfficial: true }, data: { isDeleted: true } })
      : entity === 'promotion' ? await this.prisma.promotion.updateMany({ where, data: { isActive: false } })
      : entity === 'advertisement' ? await this.prisma.advertisement.updateMany({ where, data: { isActive: false } })
      : await this.prisma.event.updateMany({ where, data: { isActive: false } });
    if (!result.count) throw new NotFoundException('Registro não encontrado.');
    return { success: true };
  }
}
