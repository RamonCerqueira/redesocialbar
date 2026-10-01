import { Injectable, UnauthorizedException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
import { INITIAL_PASSWORD, isInstitutionalEmail, normalizeEmail } from './institutional-policy';
import { Prisma } from '@prisma/client';
import { assertAcceptance, acceptanceData } from '../legal/legal-policy';

type SessionUser = Prisma.UserGetPayload<{ include: { profile: true } }>;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private session(user: SessionUser) {
    return {
      token: this.jwtService.sign({ sub: user.id, version: user.tokenVersion }, { expiresIn: user.mustChangePassword ? '15m' : '1d' }),
      user: { id: user.id, email: user.email, role: user.role, status: user.status, profile: user.profile, mustChangePassword: user.mustChangePassword },
    };
  }

  async checkUsername(username: string) {
    const valid = /^[a-zA-Z0-9_]{3,30}$/.test(username);
    const exists = valid ? await this.prisma.profile.findUnique({ where: { username: username.toLowerCase() }, select: { id: true } }) : true;
    return { available: !exists, message: exists ? 'Nome indisponível ou inválido.' : 'Nome disponível.' };
  }

  async register(dto: RegisterDto) {
    if (Buffer.byteLength(dto.password, 'utf8') > 72) throw new BadRequestException('A senha deve ter no máximo 72 bytes.');
    if (isInstitutionalEmail(dto.email)) {
      throw new ForbiddenException('Contas @pirambeira.com são cadastradas exclusivamente pelo superadministrador.');
    }
    assertAcceptance(dto);
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (existingEmail) {
      throw new ConflictException('Este e-mail já está cadastrado.');
    }

    const cleanUsername = dto.username.toLowerCase().replace(/[^a-z0-9_]/g, '');
    const existingUsername = await this.prisma.profile.findUnique({
      where: { username: cleanUsername },
    });
    if (existingUsername) {
      throw new ConflictException('Este nome de usuário já está em uso.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        auditLogs: { create: acceptanceData('registration') },
        profile: {
          create: {
            name: dto.name.trim(),
            username: cleanUsername,
            city: dto.city || 'Salvador, BA',
            bio: dto.bio || 'Adoro curtir bons momentos no bar!',
            avatarUrl: dto.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    return this.session(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: normalizeEmail(dto.email) },
      include: {
        profile: true,
        restaurantMembers: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Sua conta foi suspensa pela moderação.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    return this.session(user);
  }

  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || !await bcrypt.compare(currentPassword, user.passwordHash)) throw new UnauthorizedException('Senha atual incorreta.');
    return this.savePassword(user, newPassword);
  }

  async completeFirstAccess(id: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || !user.mustChangePassword) throw new BadRequestException('O primeiro acesso já foi concluído.');
    return this.savePassword(user, newPassword);
  }

  private async savePassword(user: { id: string; passwordHash: string; tokenVersion: number; mustChangePassword: boolean }, newPassword: string) {
    if (newPassword.length < 8 || Buffer.byteLength(newPassword, 'utf8') > 72) throw new BadRequestException('Use uma senha de 8 a 72 caracteres (máximo de 72 bytes).');
    if (newPassword === INITIAL_PASSWORD || await bcrypt.compare(newPassword, user.passwordHash)) throw new BadRequestException('Escolha uma senha diferente da senha atual e da senha padrão.');
    const passwordHash = await bcrypt.hash(newPassword, 12);
    const updated = await this.prisma.user.updateMany({
      where: { id: user.id, tokenVersion: user.tokenVersion, passwordHash: user.passwordHash, status: 'ACTIVE' },
      data: { passwordHash, mustChangePassword: false, tokenVersion: { increment: 1 } },
    });
    if (updated.count !== 1) throw new UnauthorizedException('A sessão mudou. Entre novamente para continuar.');
    const account = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id }, include: { profile: true } });
    return { success: true, ...this.session(account) };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        restaurantMembers: {
          include: {
            restaurant: true,
          },
        },
        checkIns: {
          where: {
            status: 'ACTIVE',
            expiresAt: { gt: new Date() },
          },
          include: {
            restaurant: true,
          },
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    const activeCheckIn = user.checkIns[0] || null;

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
      profile: user.profile,
      activeCheckIn,
      restaurantMembers: user.restaurantMembers,
      counts: user._count,
    };
  }
}
