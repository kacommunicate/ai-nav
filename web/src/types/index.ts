export type Pricing = 'FREE' | 'FREEMIUM' | 'PAID' | 'TRIAL';
export type ToolStatus = 'PUBLISHED' | 'PENDING' | 'OFFLINE';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
  toolCount?: number;
}

export interface Tag {
  id: string;
  name: string;
  toolCount?: number;
}

export interface Tool {
  id: string;
  name: string;
  slug: string;
  url: string;
  logo: string;
  description: string;
  pricing: Pricing;
  needsVpn: boolean;
  zhSupport: boolean;
  featured: boolean;
  sortOrder: number;
  status: ToolStatus;
  clicks: number;
  createdAt: string;
  updatedAt: string;
  categoryId: string;
  category?: Category;
  tags?: Tag[];
}

export interface Paged<T> {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
}

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

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  role: 'ADMIN' | 'EDITOR';
}

export interface SiteSetting {
  id: string;
  siteName: string;
  description: string;
  keywords: string;
  logo: string;
  icp: string;
  footerText: string;
  notice: string;
}

export interface StatsOverview {
  toolTotal: number;
  publishedTotal: number;
  pendingTotal: number;
  offlineTotal: number;
  categoryTotal: number;
  tagTotal: number;
  clickTotal: number;
  clickToday: number;
  clickWeek: number;
}

export interface TrendPoint {
  date: string;
  clicks: number;
}

export interface CategoryStat {
  id: string;
  name: string;
  color: string;
  clicks: number;
  toolCount: number;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  detail: string;
  ip: string;
  createdAt: string;
  user?: { id: string; username: string; displayName: string } | null;
}
