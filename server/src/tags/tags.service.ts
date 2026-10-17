import { Injectable } from '@nestjs/common';
import { Prisma, ToolStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  /** 所有标签（按使用次数倒序） */
  async findAll() {
    const tags = await this.prisma.tag.findMany({
      include: { _count: { select: { tools: { where: { tool: { status: ToolStatus.PUBLISHED } } } } } },
      orderBy: { name: 'asc' },
    });
    return tags
      .map(({ _count, ...t }) => ({ ...t, toolCount: _count.tools }))
      .filter((t) => t.toolCount > 0);
  }

  async search(keyword: string) {
    if (!keyword) return this.findAll();
    const tags = await this.prisma.tag.findMany({
      where: { name: { contains: keyword } },
      include: { _count: { select: { tools: { where: { tool: { status: ToolStatus.PUBLISHED } } } } } },
      take: 20,
      orderBy: { name: 'asc' },
    });
    return tags.map(({ _count, ...t }) => ({ ...t, toolCount: _count.tools }));
  }

  /** 重命名标签 */
  async rename(id: string, name: string) {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) throw new Error('标签不存在');
    const trimmed = name.trim();
    if (!trimmed) throw new Error('标签名不能为空');

    if (trimmed !== tag.name) {
      const target = await this.prisma.tag.findUnique({ where: { name: trimmed } });
      if (target) {
        // 合并到已有标签
        await this.prisma.$transaction([
          this.prisma.toolTag.updateMany({
            where: { tagId: id },
            data: { tagId: target.id },
          }),
          this.prisma.tag.delete({ where: { id } }),
        ]);
        return this.prisma.tag.findUnique({ where: { id: target.id } });
      }
    }
    return this.prisma.tag.update({ where: { id }, data: { name: trimmed } });
  }

  async remove(id: string) {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) throw new Error('标签不存在');
    await this.prisma.tag.delete({ where: { id } });
    return { success: true };
  }
}
