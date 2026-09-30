import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { assertSocialAccess } from '../auth/social-access';

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
              where: { isDeleted: false, type: { not: 'FLIRT' } },
              include: { media: true },
              orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
              take: 12,
            },
            _count: {
              select: {
                followers: true,
                following: true,
                posts: { where: { isDeleted: false, type: { not: 'FLIRT' } } },
                checkIns: true,
              },
            },
          },
        },
      },
    });

    if (!profile || profile.user.status !== 'ACTIVE') {
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

    if (isBlocked) throw new NotFoundException('Perfil indisponível.');
    const isOwner = currentUserId === profile.userId;
    const canSeeContent = isOwner || !profile.isPrivate;
    const activeCheckIn = (isOwner || (!profile.invisibleMode && canSeeContent))
      ? profile.user.checkIns[0] || null : null;

    return {
      id: profile.userId,
      name: profile.name,
      username: profile.username,
      bio: profile.bio,
      city: profile.city,
      avatarUrl: profile.avatarUrl,
      interests: profile.interests,
      isPrivate: profile.isPrivate,
      ...(isOwner ? { showInFlirtRadar: profile.showInFlirtRadar, invisibleMode: profile.invisibleMode, allowFlirtFrom: profile.allowFlirtFrom } : {}),
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
        posts: canSeeContent ? profile.user._count.posts : 0,
        totalCheckIns: profile.user._count.checkIns,
      },
      recentPosts: (canSeeContent ? profile.user.posts : []).map((p) => ({
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
        isPrivate: dto.isPrivate,
      },
    });

    return updated;
  }

  async profilePosts(username: string, userId?: string, cursor?: string) {
    const profile = await this.getProfileByUsername(username, userId);
    if (profile.isPrivate && profile.id !== userId) return { items: [], nextCursor: null };
    const where = { authorId: profile.id, isDeleted: false, type: { not: 'FLIRT' as const } };
    if (cursor && !await this.prisma.post.findFirst({ where: { ...where, id: cursor }, select: { id: true } })) throw new BadRequestException('Publicação de referência indisponível. Atualize o perfil.');
    const rows = await this.prisma.post.findMany({ where, include: { media: true }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 13, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) });
    const items = rows.slice(0,12).map(post=>({id:post.id,content:post.content,createdAt:post.createdAt,likesCount:post.likesCount,media:post.media.map(media=>media.url)}));
    return { items, nextCursor: rows.length>12 ? items.at(-1)?.id : null };
  }

  async toggleFollow(targetUserId: string, currentUserId: string) {
    if (targetUserId === currentUserId) {
      throw new BadRequestException('Você não pode seguir a si mesmo.');
    }
    await assertSocialAccess(this.prisma, currentUserId, targetUserId);

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
    if (!await this.prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } })) throw new NotFoundException('Usuário não encontrado.');

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
