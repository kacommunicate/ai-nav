import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SettingsInput {
  siteName?: string;
  description?: string;
  keywords?: string;
  logo?: string;
  icp?: string;
  footerText?: string;
  notice?: string;
}

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  /** 公开读取站点设置（前端导航栏/页脚/SEO 用） */
  async get() {
    const setting = await this.prisma.siteSetting.findUnique({ where: { id: 'default' } });
    if (setting) return setting;
    // 首次访问时初始化默认值
    return this.prisma.siteSetting.create({ data: { id: 'default' } });
  }

  async update(input: SettingsInput) {
    const data = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined),
    );
    return this.prisma.siteSetting.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...data },
      update: data,
    });
  }
}
