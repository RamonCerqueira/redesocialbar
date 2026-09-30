import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export async function blockedIds(prisma: PrismaService, userId?: string): Promise<string[]> {
  if (!userId) return [];
  const blocks = await prisma.block.findMany({ where: { OR: [{ blockerId: userId }, { blockedId: userId }] } });
  return blocks.map(block => block.blockerId === userId ? block.blockedId : block.blockerId);
}

export async function assertSocialAccess(prisma: PrismaService, actorId: string, targetId: string) {
  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { status: true, profile: { select: { isPrivate: true } } } });
  if (!target || target.status !== 'ACTIVE') throw new NotFoundException('Conteúdo indisponível.');
  if (actorId === targetId) return;
  const block = await prisma.block.findFirst({ where: { OR: [{ blockerId: actorId, blockedId: targetId }, { blockerId: targetId, blockedId: actorId }] } });
  if (block || target.profile?.isPrivate) throw new NotFoundException('Conteúdo indisponível.');
}
