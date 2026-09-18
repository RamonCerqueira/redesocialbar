import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
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

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
      include: {
        profile: true,
        restaurantMembers: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    if (user.status === 'BANNED') {
      throw new UnauthorizedException('Sua conta foi suspensa pela moderação.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        restaurantMembers: user.restaurantMembers,
      },
    };
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
      profile: user.profile,
      activeCheckIn,
      restaurantMembers: user.restaurantMembers,
      counts: user._count,
    };
  }
}
