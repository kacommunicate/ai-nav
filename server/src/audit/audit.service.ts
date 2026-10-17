import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async record(
    userId: string | null,
    action: string,
    entity: string,
    entityId: string,
    detail: string,
    ip = '',
  ) {
    try {
      await this.prisma.auditLog.create({
        data: { userId, action, entity, entityId, detail, ip },
      });
    } catch {
      // 审计日志失败不影响主流程
    }
  }

  async list(page = 1, pageSize = 30) {
    const [total, items] = await this.prisma.$transaction([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { id: true, username: true, displayName: true } } },
      }),
    ]);
    return { total, page, pageSize, items };
  }
}
