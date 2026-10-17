import axios, { type AxiosInstance } from 'axios';
import type {
  AuditLog,
  AuthUser,
  Category,
  Paged,
  SiteSetting,
  StatsOverview,
  Tag,
  Tool,
  ToolQuery,
  TrendPoint,
  CategoryStat,
  Pricing,
  ToolStatus,
} from '@/types';

const TOKEN_KEY = 'ai_nav_token';

// 构建期由 vite.config.ts 注入：空串表示与前端同源（同进程托管），
// 前后端分离时为完整地址，如 "https://ai-nav-api.onrender.com/api"。
const API_BASE: string =
  typeof __API_BASE__ !== 'undefined' && __API_BASE__ ? __API_BASE__ : '/api';

export const tokenStore = {
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
  },
};

class ApiClient {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: API_BASE,
      timeout: 15000,
    });

    this.http.interceptors.request.use((config) => {
      const token = tokenStore.get();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    this.http.interceptors.response.use(
      (res) => res.data,
      (error) => {
        const status = error?.response?.status;
        const message =
          error?.response?.data?.message ||
          error?.message ||
          '请求失败，请稍后重试';
        if (status === 401) {
          tokenStore.clear();
          if (location.pathname.startsWith('/admin')) {
            location.href = '/admin/login';
          }
        }
        return Promise.reject(new Error(Array.isArray(message) ? message[0] : message));
      },
    );
  }

  // ---------------- 公开接口 ----------------

  getSettings(): Promise<SiteSetting> {
    return this.http.get('/settings');
  }

  getCategories(): Promise<Category[]> {
    return this.http.get('/categories');
  }

  getTags(keyword?: string): Promise<Tag[]> {
    return this.http.get('/tags', { params: { keyword } });
  }

  getTools(query: ToolQuery = {}): Promise<Paged<Tool>> {
    return this.http.get('/tools', { params: this.clean(query) });
  }

  getTopTools(limit = 10): Promise<Tool[]> {
    return this.http.get('/tools/top', { params: { limit } });
  }

  getTool(idOrSlug: string): Promise<Tool> {
    return this.http.get(`/tools/${idOrSlug}`);
  }

  clickTool(id: string): Promise<{ url: string }> {
    return this.http.post(`/tools/${id}/click`);
  }

  // ---------------- 认证 ----------------

  login(username: string, password: string): Promise<{ accessToken: string; user: AuthUser }> {
    return this.http.post('/auth/login', { username, password });
  }

  me(): Promise<AuthUser> {
    return this.http.get('/auth/me');
  }

  changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean }> {
    return this.http.post('/auth/change-password', { oldPassword, newPassword });
  }

  // ---------------- 后台：工具 ----------------

  adminTools(query: ToolQuery = {}): Promise<Paged<Tool>> {
    return this.http.get('/tools/admin/list', { params: this.clean(query) });
  }

  createTool(data: Partial<Tool> & { tags?: string[] }): Promise<Tool> {
    return this.http.post('/tools/admin', data);
  }

  updateTool(id: string, data: Partial<Tool> & { tags?: string[] }): Promise<Tool> {
    return this.http.put(`/tools/admin/${id}`, data);
  }

  deleteTool(id: string): Promise<{ success: boolean }> {
    return this.http.delete(`/tools/admin/${id}`);
  }

  sortTools(items: { id: string; sortOrder: number }[]): Promise<{ success: boolean }> {
    return this.http.put('/tools/admin/batch/sort', { items });
  }

  importTools(tools: (Partial<Tool> & { tags?: string[] })[]): Promise<{
    created: number;
    skipped: number;
    errors: string[];
  }> {
    return this.http.post('/tools/admin/import', { tools });
  }

  // ---------------- 后台：分类 ----------------

  adminCategories(): Promise<Category[]> {
    return this.http.get('/categories/admin/list');
  }

  createCategory(data: Partial<Category>): Promise<Category> {
    return this.http.post('/categories/admin', data);
  }

  updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    return this.http.put(`/categories/admin/${id}`, data);
  }

  deleteCategory(id: string): Promise<{ success: boolean }> {
    return this.http.delete(`/categories/admin/${id}`);
  }

  sortCategories(items: { id: string; sortOrder: number }[]): Promise<{ success: boolean }> {
    return this.http.put('/categories/admin/batch/sort', { items });
  }

  // ---------------- 后台：标签 ----------------

  renameTag(id: string, name: string): Promise<Tag> {
    return this.http.put(`/tags/${id}`, { name });
  }

  deleteTag(id: string): Promise<{ success: boolean }> {
    return this.http.delete(`/tags/${id}`);
  }

  // ---------------- 后台：统计 ----------------

  statsOverview(): Promise<StatsOverview> {
    return this.http.get('/admin/stats/overview');
  }

  statsTrend(days = 14): Promise<TrendPoint[]> {
    return this.http.get('/admin/stats/trend', { params: { days } });
  }

  statsByCategory(): Promise<CategoryStat[]> {
    return this.http.get('/admin/stats/by-category');
  }

  statsToolTrend(id: string, days = 14): Promise<TrendPoint[]> {
    return this.http.get(`/admin/stats/tool/${id}/trend`, { params: { days } });
  }

  // ---------------- 后台：设置 / 审计 ----------------

  updateSettings(data: Partial<SiteSetting>): Promise<SiteSetting> {
    return this.http.put('/settings', data);
  }

  auditLogs(page = 1, pageSize = 30): Promise<Paged<AuditLog>> {
    return this.http.get('/admin/audit-logs', { params: { page, pageSize } });
  }

  // ---------------- 工具方法 ----------------

  private clean(obj: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ''),
    );
  }
}

export const api = new ApiClient();
export type { Pricing, ToolStatus };
