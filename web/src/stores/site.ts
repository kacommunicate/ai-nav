import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/api';
import type { Category, SiteSetting, Tag } from '@/types';

export const useSiteStore = defineStore('site', () => {
  const settings = ref<SiteSetting | null>(null);
  const categories = ref<Category[]>([]);
  const tags = ref<Tag[]>([]);
  const loading = ref(false);

  async function loadAll() {
    loading.value = true;
    try {
      const [s, c, t] = await Promise.all([
        api.getSettings(),
        api.getCategories(),
        api.getTags(),
      ]);
      settings.value = s;
      categories.value = c;
      tags.value = t;
    } catch (e) {
      // 后台未启动时保持默认值，不阻塞页面渲染
      console.warn('站点数据加载失败', e);
      settings.value = {
        id: 'default',
        siteName: 'AI 导航',
        description: '发现最好用的 AI 工具',
        keywords: 'AI工具,AI导航',
        logo: '',
        icp: '',
        footerText: '',
        notice: '',
      };
    } finally {
      loading.value = false;
    }
  }

  return { settings, categories, tags, loading, loadAll };
});
