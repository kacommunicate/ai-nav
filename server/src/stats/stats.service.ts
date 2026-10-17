import { Injectable } from '@nestjs/common';
import { ToolStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async overview() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    const [
      toolTotal,
      publishedTotal,
      pendingTotal,
      offlineTotal,
      categoryTotal,
      tagTotal,
      clickTotal,
      clickToday,
      clickWeek,
    ] = await this.prisma.$transaction([
      this.prisma.tool.count(),
      this.prisma.tool.count({ where: { status: ToolStatus.PUBLISHED } }),
      this.prisma.tool.count({ where: { status: ToolStatus.PENDING } }),
      this.prisma.tool.count({ where: { status: ToolStatus.OFFLINE } }),
      this.prisma.category.count(),
      this.prisma.tag.count(),
      this.prisma.clickLog.count(),
      this.prisma.clickLog.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.clickLog.count({ where: { createdAt: { gte: weekStart } } }),
    ]);

    return {
      toolTotal,
      publishedTotal,
      pendingTotal,
      offlineTotal,
      categoryTotal,
      tagTotal,
      clickTotal,
      clickToday,
      clickWeek,
    };
  }

  /** 最近 N 天每日点击趋势 */
  async trend(days = 14) {
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const logs = await this.prisma.clickLog.findMany({
      where: { createdAt: { gte: start } },
      select: { createdAt: true, toolId: true },
      orderBy: { createdAt: 'asc' },
    });

    const map = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      map.set(this.dateKey(d), 0);
    }
    for (const log of logs) {
      const key = this.dateKey(log.createdAt);
      map.set(key, (map.get(key) || 0) + 1);
    }
    return [...map.entries()].map(([date, clicks]) => ({ date, clicks }));
  }

  /** 各分类点击占比 */
  async byCategory() {
    const categories = await this.prisma.category.findMany({
      include: {
        tools: {
          where: { status: ToolStatus.PUBLISHED },
          select: { clicks: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      clicks: c.tools.reduce((sum, t) => sum + t.clicks, 0),
      toolCount: c.tools.length,
    }));
  }

  /** 单个工具的点击趋势 */
  async toolTrend(id: string, days = 14) {
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const logs = await this.prisma.clickLog.findMany({
      where: { toolId: id, createdAt: { gte: start } },
      select: { createdAt: true },
    });

    const map = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      map.set(this.dateKey(d), 0);
    }
    for (const log of logs) {
      const key = this.dateKey(log.createdAt);
      map.set(key, (map.get(key) || 0) + 1);
    }
    return [...map.entries()].map(([date, clicks]) => ({ date, clicks }));
  }

  private dateKey(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
