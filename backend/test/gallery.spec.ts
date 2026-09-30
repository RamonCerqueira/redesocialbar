import { describe, expect, it, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { validate } from 'class-validator';
import { RestaurantGalleryDto } from '../src/admin/admin.dto';
import { AdminService } from '../src/admin/admin.service';
import { AccessService } from '../src/auth/access.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Galeria administrada', () => {
  it('recusa cardápio e horários malformados antes de persistir', async () => {
    const update = vi.fn();
    const service = new AdminService({ restaurant: { update } } as unknown as PrismaService, { restaurant: vi.fn().mockResolvedValue({ id: 'r' }) } as unknown as AccessService);
    for (const data of [{ menuCategories: [{ name: 'Bebidas', items: [null] }] }, { openingHours: { segunda: { start: 17 } } }, { menuCategories: [{ name: 'Bebidas', items: [{ name: 'Chopp', price: '12', imageUrl: 'javascript:alert(1)' }] }] }]) {
      await expect(service.saveSettings({ id: 'a', role: 'SUPERADMIN' }, 'bar', data as any)).rejects.toThrow();
    }
    expect(update).not.toHaveBeenCalled();
  });
  it('valida URLs e limita a galeria a 20 fotos', async () => {
    for (const photos of [['javascript:alert(1)'], Array(21).fill('https://example.com/photo.jpg')]) {
      expect((await validate(Object.assign(new RestaurantGalleryDto(), { photos }))).length).toBeGreaterThan(0);
    }
    expect(await validate(Object.assign(new RestaurantGalleryDto(), { photos: [] }))).toEqual([]);
  });
  it('nega alteração por usuário comum e administrador de outro restaurante', async () => {
    const update = vi.fn();
    const access = { restaurant: vi.fn().mockRejectedValue(new ForbiddenException()) } as unknown as AccessService;
    const service = new AdminService({ restaurant: { update } } as unknown as PrismaService, access);
    for (const role of ['USER', 'RESTAURANT_ADMIN']) await expect(service.saveGallery({ id: 'actor', role }, 'other', [])).rejects.toThrow(ForbiddenException);
    expect(update).not.toHaveBeenCalled();
  });
  it('salva somente as fotos do restaurante autorizado, na ordem definida', async () => {
    const update = vi.fn().mockResolvedValue({ galleryPhotos: ['https://example.com/b.jpg', 'https://example.com/a.jpg'] });
    const access = { restaurant: vi.fn().mockResolvedValue({ id: 'allowed' }) } as unknown as AccessService;
    const service = new AdminService({ restaurant: { update } } as unknown as PrismaService, access);
    await service.saveGallery({ id: 'admin', role: 'SUPERADMIN' }, 'bar', ['https://example.com/b.jpg', 'https://example.com/a.jpg', 'https://example.com/b.jpg']);
    expect(update).toHaveBeenCalledWith({ where: { id: 'allowed' }, data: { galleryPhotos: ['https://example.com/b.jpg', 'https://example.com/a.jpg'] }, select: { galleryPhotos: true } });
  });
});
