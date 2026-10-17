<template>
  <div class="search-page">
    <div class="container">
      <h1 class="page-title">🔍 搜索 AI 工具</h1>
      <p class="page-desc">
        <template v-if="keyword">「{{ keyword }}」找到 {{ total }} 个结果</template>
        <template v-else>共收录 {{ total }} 个 AI 工具</template>
      </p>

      <!-- 搜索框 -->
      <div class="search-bar">
        <input v-model="localKeyword" type="text" placeholder="输入关键词…" @keyup.enter="submit" />
        <button class="btn btn-primary" @click="submit">搜索</button>
      </div>

      <!-- 标签筛选 -->
      <div v-if="tags.length" class="tag-filter">
        <span class="tag-filter-label">标签：</span>
        <button class="tag-chip" :class="{ active: !activeTag }" @click="selectTag('')">全部</button>
        <button
          v-for="tag in tags"
          :key="tag.id"
          class="tag-chip"
          :class="{ active: activeTag === tag.name }"
          @click="selectTag(tag.name)"
        >
          {{ tag.name }}
        </button>
      </div>

      <!-- 价格筛选 -->
      <div class="filter-bar">
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
      </div>

      <!-- 结果 -->
      <div v-if="loading" class="loading-state"><div class="spinner"></div></div>
      <div v-else-if="tools.length" class="tool-grid">
        <ToolCard v-for="tool in tools" :key="tool.id" :tool="tool" />
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">😶</div>
        <p>没有找到匹配的工具，换个关键词试试</p>
      </div>

      <div v-if="totalPages > 1" class="pagination">
        <button class="btn btn-outline btn-sm" :disabled="page === 1" @click="goPage(page - 1)">上一页</button>
        <span class="page-info">第 {{ page }} / {{ totalPages }} 页</span>
        <button class="btn btn-outline btn-sm" :disabled="page === totalPages" @click="goPage(page + 1)">下一页</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ToolCard from '@/components/ToolCard.vue';
import { api } from '@/api';
import { useSiteStore } from '@/stores/site';
import type { Pricing, Tool } from '@/types';

const route = useRoute();
const router = useRouter();
const site = useSiteStore();

const localKeyword = ref('');
const keyword = computed(() => (route.query.keyword as string) || '');
const activeTag = computed(() => (route.query.tag as string) || '');
const pricing = ref<Pricing | ''>('');
const sort = ref<'newest' | 'popular' | 'name' | 'sortOrder'>('sortOrder');

const tools = ref<Tool[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 24;
const loading = ref(true);
const tags = computed(() => site.tags);

const sortOptions = [
  { value: 'sortOrder' as const, label: '推荐排序' },
  { value: 'popular' as const, label: '最热门' },
  { value: 'newest' as const, label: '最新' },
];

const pricingOptions: { value: Pricing | ''; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'FREE', label: '免费' },
  { value: 'FREEMIUM', label: '免费增值' },
  { value: 'PAID', label: '付费' },
];

const totalPages = computed(() => Math.ceil(total.value / pageSize));

async function load() {
  loading.value = true;
  try {
    const res = await api.getTools({
      keyword: keyword.value || undefined,
      tag: activeTag.value || undefined,
      pricing: (pricing.value || undefined) as Pricing | undefined,
      featured: route.query.featured === '1' ? true : undefined,
      page: page.value,
      pageSize,
      sort: sort.value,
    });
    tools.value = res.items;
    total.value = res.total;
  } catch (e) {
    console.warn(e);
  } finally {
    loading.value = false;
  }
}

function submit() {
  const kw = localKeyword.value.trim();
  router.push({ name: 'search', query: kw ? { keyword: kw } : {} });
}

function selectTag(name: string) {
  const query: Record<string, string> = {};
  if (keyword.value) query.keyword = keyword.value;
  if (name) query.tag = name;
  router.push({ name: 'search', query });
}

function changePricing(v: Pricing | '') {
  pricing.value = v;
  page.value = 1;
  load();
}

function changeSort(v: string) {
  sort.value = v as typeof sort.value;
  page.value = 1;
  load();
}

function goPage(p: number) {
  page.value = p;
  load();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

onMounted(async () => {
  localKeyword.value = keyword.value;
  if (!site.categories.length) await site.loadAll();
  load();
});
</script>

<style scoped>
.search-page {
  padding: 28px 0 20px;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
}

.search-bar input {
  flex: 1;
  max-width: 520px;
  height: 38px;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}

.search-bar input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.tag-filter {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.tag-filter-label {
  font-size: 13px;
  color: var(--color-text-muted);
}

.tag-chip {
  cursor: pointer;
  padding: 3px 10px;
  border-radius: 6px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  font-size: 12px;
  color: var(--color-text-secondary);
  transition: all 0.15s;
}

.tag-chip:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.tag-chip.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
  padding: 12px 16px;
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
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  font-size: 13px;
  color: var(--color-text-secondary);
}

.filter-chip.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
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
