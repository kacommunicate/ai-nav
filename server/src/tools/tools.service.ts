import { Injectable, NotFoundException } from '@nestjs/common';
import { Pricing, Prisma, ToolStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { toSlug } from '../common/slug';

export interface ToolQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  categoryId?: string;
  tag?: string;
  pricing?: Pricing;
  needsVpn?: boolean;
  featured?: boolean;
  status?: ToolStatus;
  sort?: 'newest' | 'popular' | 'name' | 'sortOrder';
}

export interface CreateToolInput {
  name: string;
  url: string;
  description: string;
  categoryId: string;
  logo?: string;
  pricing?: Pricing;
  needsVpn?: boolean;
  zhSupport?: boolean;
  featured?: boolean;
  sortOrder?: number;
  status?: ToolStatus;
  tags?: string[];
}

@Injectable()
export class ToolsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // ---------------- 公开接口 ----------------

  /** 前台列表：仅返回已发布 */
  async findPublished(query: ToolQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 24));

    const where: Prisma.ToolWhereInput = { status: ToolStatus.PUBLISHED };
    if (query.keyword) {
      where.OR = [
        { name: { contains: query.keyword } },
        { description: { contains: query.keyword } },
        { url: { contains: query.keyword } },
        { tags: { some: { tag: { name: { contains: query.keyword } } } } },
      ];
    }
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.tag) where.tags = { some: { tag: { name: query.tag } } };
    if (query.pricing) where.pricing = query.pricing;
    if (query.needsVpn !== undefined) where.needsVpn = query.needsVpn;
    if (query.featured !== undefined) where.featured = query.featured;

    const orderBy = this.buildOrderBy(query.sort);

    const [total, items] = await this.prisma.$transaction([
      this.prisma.tool.count({ where }),
      this.prisma.tool.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          category: { select: { id: true, name: true, slug: true, icon: true, color: true } },
          tags: { include: { tag: { select: { id: true, name: true } } } },
        },
      }),
    ]);

    return {
      total,
      page,
      pageSize,
      items: items.map((t) => this.serialize(t)),
    };
  }

  /** 前台详情 */
  async findOnePublished(idOrSlug: string) {
    const tool = await this.prisma.tool.findFirst({
      where: {
        status: ToolStatus.PUBLISHED,
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        category: { select: { id: true, name: true, slug: true, icon: true, color: true } },
        tags: { include: { tag: { select: { id: true, name: true } } } },
      },
    });
    if (!tool) throw new NotFoundException('工具不存在或未发布');
    return this.serialize(tool);
  }

  /** 热门排行 */
  async findTop(limit = 10) {
    const items = await this.prisma.tool.findMany({
      where: { status: ToolStatus.PUBLISHED },
      orderBy: { clicks: 'desc' },
      take: Math.min(50, limit),
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });
    return items.map((t) => this.serialize(t));
  }

  /** 记录点击并返回跳转地址 */
  async registerClick(id: string, meta: { ip?: string; userAgent?: string; referer?: string }) {
    const tool = await this.prisma.tool.findFirst({
      where: { id, status: ToolStatus.PUBLISHED },
      select: { id: true, url: true },
    });
    if (!tool) throw new NotFoundException('工具不存在或未发布');

    await this.prisma.$transaction([
      this.prisma.tool.update({ where: { id }, data: { clicks: { increment: 1 } } }),
      this.prisma.clickLog.create({
        data: {
          toolId: id,
          ip: meta.ip || '',
          userAgent: meta.userAgent || '',
          referer: meta.referer || '',
        },
      }),
    ]);

    return { url: tool.url };
  }

  // ---------------- 后台接口 ----------------

  async findAll(query: ToolQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(200, Math.max(1, Number(query.pageSize) || 20));

    const where: Prisma.ToolWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.featured !== undefined) where.featured = query.featured;
    if (query.keyword) {
      where.OR = [
        { name: { contains: query.keyword } },
        { description: { contains: query.keyword } },
        { url: { contains: query.keyword } },
      ];
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.tool.count({ where }),
      this.prisma.tool.findMany({
        where,
        orderBy: this.buildOrderBy(query.sort),
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          tags: { include: { tag: { select: { id: true, name: true } } } },
        },
      }),
    ]);

    return { total, page, pageSize, items: items.map((t) => this.serialize(t)) };
  }

  async create(input: CreateToolInput, userId: string) {
    const slug = await this.uniqueSlug(input.name);
    const data: Prisma.ToolCreateInput = {
      name: input.name,
      slug,
      url: this.normalizeUrl(input.url),
      description: input.description,
      logo: input.logo || '',
      pricing: input.pricing || Pricing.FREE,
      needsVpn: input.needsVpn ?? false,
      zhSupport: input.zhSupport ?? false,
      featured: input.featured ?? false,
      sortOrder: input.sortOrder ?? 0,
      status: input.status || ToolStatus.PUBLISHED,
      category: { connect: { id: input.categoryId } },
    };

    const tool = await this.prisma.tool.create({
      data: {
        ...data,
        tags: input.tags?.length
          ? {
              create: await Promise.all(
                input.tags.map(async (name) => ({
                  tag: {
                    connectOrCreate: {
                      where: { name: name.trim() },
                      create: { name: name.trim() },
                    },
                  },
                })),
              ),
            }
          : undefined,
      },
      include: this.defaultInclude(),
    });

    await this.audit.record(userId, 'create', 'tool', tool.id, JSON.stringify({ name: tool.name }));
    return this.serialize(tool);
  }

  async update(id: string, input: Partial<CreateToolInput>, userId: string) {
    const existing = await this.prisma.tool.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('工具不存在');

    const data: Prisma.ToolUpdateInput = {
      name: input.name,
      url: input.url ? this.normalizeUrl(input.url) : undefined,
      description: input.description,
      logo: input.logo,
      pricing: input.pricing,
      needsVpn: input.needsVpn,
      zhSupport: input.zhSupport,
      featured: input.featured,
      sortOrder: input.sortOrder,
      status: input.status,
      category: input.categoryId ? { connect: { id: input.categoryId } } : undefined,
    };

    const tool = await this.prisma.tool.update({
      where: { id },
      data: {
        ...Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)),
        // 标签整体替换
        ...(input.tags !== undefined
          ? { tags: { deleteMany: {}, create: await this.tagCreates(input.tags) } }
          : {}),
      },
      include: this.defaultInclude(),
    });

    await this.audit.record(userId, 'update', 'tool', id, JSON.stringify({ name: tool.name }));
    return this.serialize(tool);
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.tool.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('工具不存在');
    await this.prisma.tool.delete({ where: { id } });
    await this.audit.record(userId, 'delete', 'tool', id, JSON.stringify({ name: existing.name }));
    return { success: true };
  }

  /** 批量更新排序 */
  async updateSort(items: { id: string; sortOrder: number }[], userId: string) {
    await this.prisma.$transaction(
      items.map((it) => this.prisma.tool.update({ where: { id: it.id }, data: { sortOrder: it.sortOrder } })),
    );
    await this.audit.record(userId, 'sort', 'tool', '', JSON.stringify(items));
    return { success: true };
  }

  /** 批量导入 */
  async importMany(tools: CreateToolInput[], userId: string) {
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const t of tools) {
      try {
        if (!t.name || !t.url || !t.categoryId) {
          skipped += 1;
          errors.push(`${t.name || '(未命名)'}: 缺少必填字段`);
          continue;
        }
        await this.create(t, userId);
        created += 1;
      } catch (e) {
        skipped += 1;
        errors.push(`${t.name}: ${(e as Error).message}`);
      }
    }
    return { created, skipped, errors };
  }

  // ---------------- helpers ----------------

  private buildOrderBy(sort?: string): Prisma.ToolOrderByWithRelationInput {
    switch (sort) {
      case 'popular':
        return { clicks: 'desc' };
      case 'name':
        return { name: 'asc' };
      case 'newest':
        return { createdAt: 'desc' };
      case 'sortOrder':
      default:
        return [{ featured: 'desc' }, { sortOrder: 'desc' }, { clicks: 'desc' }];
    }
  }

  private async tagCreates(names: string[]) {
    return Promise.all(
      names
        .filter((n) => n && n.trim())
        .map(async (name) => ({
          tag: {
            connectOrCreate: {
              where: { name: name.trim() },
              create: { name: name.trim() },
            },
          },
        })),
    );
  }

  private async uniqueSlug(name: string) {
    let slug = toSlug(name);
    let i = 1;
    // SQLite 唯一索引大小写不敏感，需循环探测
    while (await this.prisma.tool.findUnique({ where: { slug } })) {
      slug = `${slug}-${i++}`;
    }
    return slug;
  }

  private normalizeUrl(url: string) {
    if (!/^https?:\/\//i.test(url)) return `https://${url}`;
    return url;
  }

  private defaultInclude(): Prisma.ToolInclude {
    return {
      category: { select: { id: true, name: true, slug: true, icon: true, color: true } },
      tags: { include: { tag: { select: { id: true, name: true } } } },
    };
  }

  private serialize(tool: any) {
    return {
      ...tool,
      tags: (tool.tags || []).map((tt: any) => tt.tag),
    };
  }
}
