import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfileByUsername(username: string, currentUserId?: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { username },
      include: {
        user: {
          include: {
            checkIns: {
              where: {
                status: 'ACTIVE',
                expiresAt: { gt: new Date() },
              },
              include: { restaurant: true },
              orderBy: { startedAt: 'desc' },
              take: 1,
            },
            posts: {
              where: { isDeleted: false },
              include: { media: true },
              orderBy: { createdAt: 'desc' },
              take: 12,
            },
            _count: {
              select: {
                followers: true,
                following: true,
                posts: true,
                checkIns: true,
              },
            },
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException(`Usuário @${username} não encontrado.`);
    }

    let isFollowing = false;
    let isBlocked = false;

    if (currentUserId && currentUserId !== profile.userId) {
      const follow = await this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: profile.userId,
          },
        },
      });
      isFollowing = !!follow;

      const block = await this.prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: currentUserId, blockedId: profile.userId },
            { blockerId: profile.userId, blockedId: currentUserId },
          ],
        },
      });
      isBlocked = !!block;
    }

    const activeCheckIn = profile.user.checkIns[0] || null;

    return {
      id: profile.userId,
      name: profile.name,
      username: profile.username,
      bio: profile.bio,
      city: profile.city,
      avatarUrl: profile.avatarUrl,
      interests: profile.interests,
      checkInCount: profile.checkInCount,
      isFollowing,
      isBlocked,
      activeCheckIn: activeCheckIn
        ? {
            restaurantName: activeCheckIn.restaurant.name,
            restaurantSlug: activeCheckIn.restaurant.slug,
            startedAt: activeCheckIn.startedAt,
          }
        : null,
      counts: {
        followers: profile.user._count.followers,
        following: profile.user._count.following,
        posts: profile.user._count.posts,
        totalCheckIns: profile.user._count.checkIns,
      },
      recentPosts: profile.user.posts.map((p) => ({
        id: p.id,
        content: p.content,
        createdAt: p.createdAt,
        likesCount: p.likesCount,
        media: p.media.map((m) => m.url),
      })),
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const updated = await this.prisma.profile.update({
      where: { userId },
      data: {
        name: dto.name,
        bio: dto.bio,
        city: dto.city,
        avatarUrl: dto.avatarUrl,
        interests: dto.interests,
        showInFlirtRadar: dto.showInFlirtRadar,
        allowFlirtFrom: dto.allowFlirtFrom,
        invisibleMode: dto.invisibleMode,
      },
    });

    return updated;
  }

  async toggleFollow(targetUserId: string, currentUserId: string) {
    if (targetUserId === currentUserId) {
      throw new BadRequestException('Você não pode seguir a si mesmo.');
    }

    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

    if (existing) {
      await this.prisma.follow.delete({
        where: { id: existing.id },
      });
      return { following: false, message: 'Deixou de seguir.' };
    }

    await this.prisma.follow.create({
      data: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    });

    // Notificar usuário seguido
    const follower = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      include: { profile: true },
    });
    await this.prisma.notification.create({
      data: {
        userId: targetUserId,
        type: 'FOLLOW',
        title: 'Novo seguidor no Piramba!',
        body: `${follower?.profile?.name || 'Alguém'} começou a seguir você.`,
        link: `/perfil/${follower?.profile?.username}`,
      },
    });

    return { following: true, message: 'Seguindo com sucesso!' };
  }

  async toggleBlock(targetUserId: string, currentUserId: string) {
    if (targetUserId === currentUserId) {
      throw new BadRequestException('Você não pode bloquear a si mesmo.');
    }

    const existing = await this.prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: currentUserId,
          blockedId: targetUserId,
        },
      },
    });

    if (existing) {
      await this.prisma.block.delete({
        where: { id: existing.id },
      });
      return { blocked: false, message: 'Usuário desbloqueado.' };
    }

    await this.prisma.block.create({
      data: {
        blockerId: currentUserId,
        blockedId: targetUserId,
      },
    });

    // Remover follow mútuo se houver
    await this.prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: currentUserId, followingId: targetUserId },
          { followerId: targetUserId, followingId: currentUserId },
        ],
      },
    });

    return { blocked: true, message: 'Usuário bloqueado com sucesso.' };
  }
}
