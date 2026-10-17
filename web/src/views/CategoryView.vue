<template>
  <div class="category-page">
    <div class="container">
      <!-- 分类头 -->
      <div class="cat-hero" :style="{ background: heroBg }">
        <span class="cat-hero-icon">{{ category?.icon || '📁' }}</span>
        <div>
          <h1 class="cat-hero-title">{{ category?.name || '加载中…' }}</h1>
          <p class="cat-hero-desc">{{ category?.description }}</p>
          <span class="cat-hero-count">{{ total }} 个工具</span>
        </div>
      </div>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <div class="filter-group">
          <span class="filter-label">排序</span>
          <button
            v-for="opt in sortOptions"
            :key="opt.value"
            class="filter-chip"
            :class="{ active: sort === opt.value }"
            @click="changeSort(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
        <div class="filter-group">
          <span class="filter-label">价格</span>
          <button
            v-for="opt in pricingOptions"
            :key="opt.value"
            class="filter-chip"
            :class="{ active: pricing === opt.value }"
            @click="changePricing(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
        <div class="filter-group">
          <label class="filter-check">
            <input v-model="needsVpn" type="checkbox" @change="reload" />
            <span>只看需网络工具</span>
          </label>
          <label class="filter-check">
            <input v-model="zhOnly" type="checkbox" @change="reload" />
            <span>只看中文支持</span>
          </label>
        </div>
      </div>

      <!-- 工具列表 -->
      <div v-if="loading" class="loading-state"><div class="spinner"></div></div>
      <div v-else-if="tools.length" class="tool-grid">
        <ToolCard v-for="tool in tools" :key="tool.id" :tool="tool" />
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>该分类下暂无符合条件的工具</p>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
        <button class="btn btn-outline btn-sm" :disabled="page === 1" @click="goPage(page - 1)">上一页</button>
        <span class="page-info">第 {{ page }} / {{ totalPages }} 页</span>
        <button class="btn btn-outline btn-sm" :disabled="page === totalPages" @click="goPage(page + 1)">下一页</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import ToolCard from '@/components/ToolCard.vue';
import { api } from '@/api';
import { useSiteStore } from '@/stores/site';
import type { Pricing, Tool } from '@/types';

const route = useRoute();
const site = useSiteStore();

const category = computed(() => site.categories.find((c) => c.slug === route.params.slug));
const categoryId = computed(() => category.value?.id || '');

const tools = ref<Tool[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 24;
const loading = ref(true);

const sort = ref<'newest' | 'popular' | 'name' | 'sortOrder'>('sortOrder');
const pricing = ref<Pricing | ''>('');
const needsVpn = ref(false);
const zhOnly = ref(false);

const sortOptions = [
  { value: 'sortOrder' as const, label: '推荐排序' },
  { value: 'popular' as const, label: '最热门' },
  { value: 'newest' as const, label: '最新' },
  { value: 'name' as const, label: '名称' },
];

const pricingOptions: { value: Pricing | ''; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'FREE', label: '免费' },
  { value: 'FREEMIUM', label: '免费增值' },
  { value: 'PAID', label: '付费' },
];

const totalPages = computed(() => Math.ceil(total.value / pageSize));
const heroBg = computed(() => {
  const c = category.value?.color || '#6366f1';
  return `linear-gradient(135deg, ${c}18, ${c}08)`;
});

async function load() {
  if (!categoryId.value) return;
  loading.value = true;
  try {
    const res = await api.getTools({
      categoryId: categoryId.value,
      page: page.value,
      pageSize,
      sort: sort.value,
      pricing: (pricing.value || undefined) as Pricing | undefined,
      needsVpn: needsVpn.value || undefined,
      featured: undefined,
    });
    tools.value = zhOnly.value ? res.items.filter((t) => t.zhSupport) : res.items;
    total.value = res.total;
  } catch (e) {
    console.warn(e);
  } finally {
    loading.value = false;
  }
}

function reload() {
  page.value = 1;
  load();
}

function changeSort(v: string) {
  sort.value = v as typeof sort.value;
  reload();
}

function changePricing(v: Pricing | '') {
  pricing.value = v;
  reload();
}

function goPage(p: number) {
  page.value = p;
  load();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

onMounted(async () => {
  if (!site.categories.length) await site.loadAll();
  load();
});

watch(() => route.params.slug, () => {
  page.value = 1;
  load();
});
</script>

<style scoped>
.category-page {
  padding: 28px 0 20px;
}

.cat-hero {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 26px 28px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  margin-bottom: 22px;
}

.cat-hero-icon {
  font-size: 44px;
  line-height: 1;
}

.cat-hero-title {
  font-size: 24px;
  font-weight: 700;
}

.cat-hero-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 4px 0 6px;
}

.cat-hero-count {
  font-size: 12px;
  color: var(--color-text-muted);
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
  padding: 14px 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 13px;
  color: var(--color-text-muted);
}

.filter-chip {
  padding: 5px 13px;
  border-radius: 999px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  font-size: 13px;
  color: var(--color-text-secondary);
  transition: all 0.15s;
}

.filter-chip:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.filter-chip.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.filter-check {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.filter-check input {
  accent-color: var(--color-primary);
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 16px;
}

.loading-state {
  display: grid;
  place-items: center;
  padding: 60px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 28px;
}

.page-info {
  font-size: 13px;
  color: var(--color-text-muted);
}
</style>
