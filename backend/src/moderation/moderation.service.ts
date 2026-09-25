import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportStatus } from '@prisma/client';
import { AccessService, Actor } from '../auth/access.service';

@Injectable()
export class ModerationService {
  constructor(private prisma: PrismaService, private access: AccessService) {}
  async createReport(reporterId: string, dto: CreateReportDto) {
    let restaurantId: string | undefined;
    if (dto.targetType === 'POST') {
      const post = await this.prisma.post.findUnique({ where: { id: dto.targetId } });
      if (!post || post.isDeleted) throw new NotFoundException('Publicação não encontrada.');
      restaurantId = post.restaurantId;
    } else if (dto.targetType === 'COMMENT') {
      const comment = await this.prisma.comment.findUnique({ where: { id: dto.targetId }, include: { post: true } });
      if (!comment || comment.isDeleted) throw new NotFoundException('Comentário não encontrado.');
      restaurantId = comment.post.restaurantId;
    } else {
      if (!dto.restaurantSlug) throw new BadRequestException('Informe o restaurante da denúncia.');
      const r = await this.prisma.restaurant.findUnique({ where: { slug: dto.restaurantSlug } });
      if (!r) throw new NotFoundException('Restaurante não encontrado.');
      if (!await this.prisma.user.findUnique({ where: { id: dto.targetId }, select: { id: true } })) throw new NotFoundException('Usuário não encontrado.');
      restaurantId = r.id;
    }
    const report = await this.prisma.report.create({ data: {
      reporterId, restaurantId, targetType: dto.targetType, targetId: dto.targetId, reason: dto.reason, notes: dto.notes,
      postId: dto.targetType === 'POST' ? dto.targetId : null,
      commentId: dto.targetType === 'COMMENT' ? dto.targetId : null,
      targetedUserId: dto.targetType === 'USER' ? dto.targetId : null,
    } });
    return { reportId: report.id, message: 'Denúncia recebida.' };
  }
  async getReports(actor: Actor, slug: string, status?: ReportStatus) {
    const r = await this.access.restaurant(actor, slug);
    return this.prisma.report.findMany({
      where: { restaurantId: r.id, ...(status ? { status } : {}) },
      select: { id: true, targetType: true, targetId: true, reason: true, notes: true, status: true, createdAt: true,
        post: { select: { content: true } }, comment: { select: { content: true } },
        targetedUser: { select: { profile: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' }, take: 100,
    });
  }
  async resolveReport(id: string, action: 'DISMISS' | 'REMOVE_CONTENT' | 'BAN_USER', actor: Actor) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Denúncia não encontrada.');
    if (report.restaurantId) await this.access.restaurantId(actor, report.restaurantId);
    else if (actor.role !== 'SUPERADMIN') throw new ForbiddenException('Denúncia sem escopo de restaurante.');
    if (action === 'BAN_USER' && actor.role !== 'SUPERADMIN') throw new ForbiddenException('Somente um superadministrador pode suspender uma conta global.');
    if (!['DISMISS', 'REMOVE_CONTENT', 'BAN_USER'].includes(action)) throw new BadRequestException('Ação inválida.');
    if (action === 'REMOVE_CONTENT' && report.targetType === 'USER') throw new BadRequestException('Esta denúncia não possui conteúdo para remover.');
    await this.prisma.$transaction(async tx => {
      const pending = await tx.report.updateMany({ where: { id, status: { in: ['PENDING', 'INVESTIGATING'] } }, data: { status: action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED' } });
      if (!pending.count) throw new BadRequestException('Denúncia já resolvida.');
      if (action === 'REMOVE_CONTENT') {
        if (report.postId) await tx.post.update({ where: { id: report.postId }, data: { isDeleted: true } });
        if (report.commentId) await tx.comment.update({ where: { id: report.commentId }, data: { isDeleted: true } });
      }
      if (action === 'BAN_USER') {
        const target = report.targetedUserId
          || (report.postId ? (await tx.post.findUnique({ where: { id: report.postId } }))?.authorId : undefined)
          || (report.commentId ? (await tx.comment.findUnique({ where: { id: report.commentId } }))?.authorId : undefined);
        if (!target || target === actor.id) throw new BadRequestException('Usuário alvo inválido.');
        const user = await tx.user.findUnique({ where: { id: target } });
        if (user?.role === 'SUPERADMIN') throw new ForbiddenException('Não é possível banir um superadministrador por este fluxo.');
        await tx.user.update({ where: { id: target }, data: { status: 'BANNED' } });
        await tx.checkIn.updateMany({ where: { userId: target, status: 'ACTIVE' }, data: { status: 'CHECKED_OUT', endedAt: new Date() } });
      }
      await tx.auditLog.create({ data: { userId: actor.id, action, entity: 'Report', entityId: id } });
    });
    return { message: 'Denúncia atualizada.' };
  }
}
