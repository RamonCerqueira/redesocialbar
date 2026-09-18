import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportStatus, ReportTargetType, UserStatus } from '@prisma/client';

@Injectable()
export class ModerationService {
  constructor(private prisma: PrismaService) {}

  async createReport(reporterId: string, dto: CreateReportDto) {
    const report = await this.prisma.report.create({
      data: {
        reporterId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason,
        notes: dto.notes,
        status: ReportStatus.PENDING,
        postId: dto.targetType === ReportTargetType.POST ? dto.targetId : null,
        commentId: dto.targetType === ReportTargetType.COMMENT ? dto.targetId : null,
        targetedUserId: dto.targetType === ReportTargetType.USER ? dto.targetId : null,
      },
    });

    return {
      message: 'Denúncia recebida com sucesso. Nossa equipe avaliará o conteúdo prontamente.',
      reportId: report.id,
    };
  }

  async getReports(status?: ReportStatus) {
    const reports = await this.prisma.report.findMany({
      where: status ? { status } : undefined,
      include: {
        reporter: { include: { profile: true } },
        post: { include: { author: { include: { profile: true } } } },
        comment: { include: { author: { include: { profile: true } } } },
        targetedUser: { include: { profile: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return reports.map((r) => ({
      id: r.id,
      targetType: r.targetType,
      targetId: r.targetId,
      reason: r.reason,
      notes: r.notes,
      status: r.status,
      createdAt: r.createdAt,
      reporterName: r.reporter.profile?.name || 'Usuário',
      targetInfo:
        r.targetType === ReportTargetType.POST
          ? { content: r.post?.content, author: r.post?.author.profile?.name }
          : r.targetType === ReportTargetType.COMMENT
          ? { content: r.comment?.content, author: r.comment?.author.profile?.name }
          : { name: r.targetedUser?.profile?.name, email: r.targetedUser?.email },
    }));
  }

  async resolveReport(reportId: string, action: 'DISMISS' | 'REMOVE_CONTENT' | 'BAN_USER') {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Denúncia não encontrada.');
    }

    if (action === 'DISMISS') {
      await this.prisma.report.update({
        where: { id: reportId },
        data: { status: ReportStatus.DISMISSED },
      });
      return { message: 'Denúncia arquivada.' };
    }

    if (action === 'REMOVE_CONTENT') {
      if (report.targetType === ReportTargetType.POST && report.postId) {
        await this.prisma.post.update({
          where: { id: report.postId },
          data: { isDeleted: true },
        });
      } else if (report.targetType === ReportTargetType.COMMENT && report.commentId) {
        await this.prisma.comment.update({
          where: { id: report.commentId },
          data: { isDeleted: true },
        });
      }

      await this.prisma.report.update({
        where: { id: reportId },
        data: { status: ReportStatus.RESOLVED },
      });

      return { message: 'Conteúdo removido e denúncia concluída.' };
    }

    if (action === 'BAN_USER') {
      let userIdToBan: string | null = null;

      if (report.targetType === ReportTargetType.USER) {
        userIdToBan = report.targetId;
      } else if (report.targetType === ReportTargetType.POST && report.postId) {
        const post = await this.prisma.post.findUnique({ where: { id: report.postId } });
        userIdToBan = post?.authorId || null;
      }

      if (userIdToBan) {
        await this.prisma.user.update({
          where: { id: userIdToBan },
          data: { status: UserStatus.BANNED },
        });
      }

      await this.prisma.report.update({
        where: { id: reportId },
        data: { status: ReportStatus.RESOLVED },
      });

      return { message: 'Usuário banido e denúncia concluída com rigor.' };
    }

    return { message: 'Ação executada.' };
  }
}
