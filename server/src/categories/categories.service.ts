import { AuditService } from '../audit/audit.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CategoryInput {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
}

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /** 公开：仅返回启用分类，附带工具数量 */
  async findActive() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { tools: { where: { status: 'PUBLISHED' } } } },
      },
    });
    return categories.map(({ _count, ...c }) => ({ ...c, toolCount: _count.tools }));
  }

  async findAll() {
    const categories = await this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { tools: true } },
      },
    });
    return categories.map(({ _count, ...c }) => ({ ...c, toolCount: _count.tools }));
  }

  async create(input: CategoryInput, userId: string) {
    const category = await this.prisma.category.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description || '',
        icon: input.icon || '',
        color: input.color || '#6366f1',
        sortOrder: input.sortOrder ?? 0,
        isActive: input.isActive ?? true,
      },
    });
    await this.audit.record(userId, 'create', 'category', category.id, JSON.stringify({ name }));
    return category;
  }

  async update(id: string, input: Partial<CategoryInput>, userId: string) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('分类不存在');

    const data: Prisma.CategoryUpdateInput = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined),
    );
    const category = await this.prisma.category.update({ where: { id }, data });
    await this.audit.record(userId, 'update', 'category', id, JSON.stringify({ name: category.name }));
    return category;
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { tools: true } } },
    });
    if (!existing) throw new NotFoundException('分类不存在');
    if (existing._count.tools > 0) {
      throw new NotFoundException(`该分类下还有 ${existing._count.tools} 个工具，无法删除`);
    }
    await this.prisma.category.delete({ where: { id } });
    await this.audit.record(userId, 'delete', 'category', id, JSON.stringify({ name: existing.name }));
    return { success: true };
  }

  async updateSort(items: { id: string; sortOrder: number }[], userId: string) {
    await this.prisma.$transaction(
      items.map((it) =>
        this.prisma.category.update({ where: { id: it.id }, data: { sortOrder: it.sortOrder } }),
      ),
    );
    await this.audit.record(userId, 'sort', 'category', '', JSON.stringify(items));
    return { success: true };
  }
}
