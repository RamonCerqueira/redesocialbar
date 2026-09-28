import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { INITIAL_PASSWORD, isInstitutionalEmail, normalizeEmail, SUPERADMIN_EMAIL } from '../auth/institutional-policy';
import type { CreateTeamUserDto } from './team.controller';

const teamSelect = {
  id: true, email: true, role: true, status: true, mustChangePassword: true, createdAt: true,
  profile: { select: { name: true, username: true } },
  restaurantMembers: { select: { restaurant: { select: { name: true, slug: true } } } },
} satisfies Prisma.UserSelect;

@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService) {}

  async authorize(userId: string) {
    const actor = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!actor || actor.role !== 'SUPERADMIN' || normalizeEmail(actor.email) !== SUPERADMIN_EMAIL || actor.status !== 'ACTIVE' || actor.mustChangePassword) {
      throw new ForbiddenException('Somente Ramon, superadministrador, pode gerenciar contas institucionais.');
    }
  }

  async list(userId: string, cursor?: string) {
    await this.authorize(userId);
    const items = await this.prisma.user.findMany({
      where: { email: { endsWith: '@pirambeira.com', mode: 'insensitive' } },
      select: teamSelect, orderBy: { id: 'asc' }, take: 51,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    return { items: items.slice(0, 50), nextCursor: items.length > 50 ? items[49].id : null };
  }

  async create(actorId: string, dto: CreateTeamUserDto) {
    await this.authorize(actorId);
    const email = normalizeEmail(dto.email);
    if (!isInstitutionalEmail(email)) throw new BadRequestException('Use um e-mail @pirambeira.com.');
    const restaurant = await this.prisma.restaurant.findUnique({ where: { slug: dto.restaurantSlug } });
    if (!restaurant || !restaurant.isActive) throw new NotFoundException('Restaurante ativo não encontrado.');
    const existing = await this.prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, select: { id: true } });
    if (existing) throw new ConflictException('Este e-mail já está cadastrado.');
    const passwordHash = await bcrypt.hash(INITIAL_PASSWORD, 12);
    try {
      return await this.prisma.$transaction(async tx => {
        const user = await tx.user.create({
          data: {
            email, passwordHash, mustChangePassword: true, role: dto.role,
            profile: { create: { name: dto.name.trim(), username: 'equipe_' + randomBytes(8).toString('hex'), invisibleMode: true, showInFlirtRadar: false } },
            restaurantMembers: { create: { restaurantId: restaurant.id, role: dto.role === 'RESTAURANT_ADMIN' ? 'MANAGER' : 'STAFF' } },
          }, select: teamSelect,
        });
        await tx.auditLog.create({ data: { userId: actorId, action: 'CREATE_INSTITUTIONAL_USER', entity: 'User', entityId: user.id } });
        return user;
      }, { timeout: 15000 });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('Este e-mail já está cadastrado.');
      throw error;
    }
  }

  async resetPassword(actorId: string, targetId: string) {
    await this.authorize(actorId);
    if (actorId === targetId) throw new BadRequestException('Altere sua própria senha na área de Ajustes.');
    const target = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!target || !isInstitutionalEmail(target.email) || target.role === 'SUPERADMIN') throw new NotFoundException('Conta da equipe não encontrada.');
    const passwordHash = await bcrypt.hash(INITIAL_PASSWORD, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: targetId }, data: { passwordHash, mustChangePassword: true, tokenVersion: { increment: 1 } } }),
      this.prisma.auditLog.create({ data: { userId: actorId, action: 'RESET_INSTITUTIONAL_PASSWORD', entity: 'User', entityId: targetId } }),
    ]);
    return { success: true };
  }
}
