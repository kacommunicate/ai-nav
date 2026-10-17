<template>
  <div class="home">
    <!-- Hero -->
    <section class="hero">
      <div class="container">
        <h1 class="hero-title">
          发现最好用的 <span class="gradient-text">AI 工具</span>
        </h1>
        <p class="hero-sub">
          收录 {{ stats.publishedTotal || categories.length > 0 ? '' : '' }}{{ totalTools }} 款
          AI 应用，覆盖对话、绘画、视频、编程、办公全场景
        </p>

        <div class="hero-search">
          <input
            v-model="heroKeyword"
            type="text"
            placeholder="试试搜索「绘画」「视频」「编程」「免费」…"
            @keyup.enter="doSearch"
          />
          <button class="btn btn-primary hero-search-btn" @click="doSearch">搜索</button>
        </div>

        <div class="hero-hot">
          <span class="hero-hot-label">热门：</span>
          <button v-for="kw in hotWords" :key="kw" class="hero-hot-item" @click="quickSearch(kw)">
            {{ kw }}
          </button>
        </div>
      </div>
    </section>

    <!-- 精选推荐 -->
    <section v-if="featured.length" class="section">
      <div class="container">
        <div class="section-head">
          <div>
            <h2 class="section-title">⭐ 精选推荐</h2>
            <p class="section-sub">编辑挑选的高质量 AI 工具</p>
          </div>
          <router-link to="/search?featured=1" class="section-more">查看全部 →</router-link>
        </div>
        <div class="tool-grid">
          <ToolCard v-for="tool in featured.slice(0, 8)" :key="tool.id" :tool="tool" />
        </div>
      </div>
    </section>

    <!-- 分类入口 -->
    <section class="section">
      <div class="container">
        <div class="section-head">
          <h2 class="section-title">🧭 按分类浏览</h2>
        </div>
        <div class="category-grid">
          <router-link
            v-for="cat in categories"
            :key="cat.id"
            :to="`/category/${cat.slug}`"
            class="category-card"
          >
            <span class="cat-icon" :style="{ background: hexToRgba(cat.color, 0.12) }">{{ cat.icon }}</span>
            <div class="cat-info">
              <div class="cat-name">{{ cat.name }}</div>
              <div class="cat-count">{{ cat.toolCount ?? 0 }} 个工具</div>
            </div>
            <span class="cat-arrow" :style="{ color: cat.color }">→</span>
          </router-link>
        </div>
      </div>
    </section>

    <!-- 最新收录 -->
    <section class="section">
      <div class="container">
        <div class="section-head">
          <div>
            <h2 class="section-title">🆕 最新收录</h2>
            <p class="section-sub">最近添加到导航站的工具</p>
          </div>
        </div>
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
        </div>
        <div v-else-if="latest.length" class="tool-grid">
          <ToolCard v-for="tool in latest" :key="tool.id" :tool="tool" />
        </div>
        <div v-else class="empty-state">
          <div class="empty-icon">📭</div>
          <p>暂无数据，请先到后台添加工具</p>
        </div>
      </div>
    </section>

    <!-- 热门排行 -->
    <section v-if="popular.length" class="section">
      <div class="container">
        <div class="section-head">
          <div>
            <h2 class="section-title">🔥 访问排行</h2>
            <p class="section-sub">按访问量排序</p>
          </div>
        </div>
        <div class="card rank-card">
          <div v-for="(tool, i) in popular.slice(0, 8)" :key="tool.id" class="rank-row">
            <span class="rank-no" :class="`rank-${i + 1}`">{{ i + 1 }}</span>
            <span class="rank-logo" :style="rankLogoStyle(tool)">{{ initial(tool) }}</span>
            <div class="rank-info">
              <a :href="tool.url" target="_blank" rel="noopener noreferrer" class="rank-name" @click="click(tool)">
                {{ tool.name }}
              </a>
              <span class="rank-desc">{{ tool.description }}</span>
            </div>
            <span class="rank-clicks">{{ tool.clicks }} 次</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import ToolCard from '@/components/ToolCard.vue';
import { api } from '@/api';
import { useSiteStore } from '@/stores/site';
import type { Tool } from '@/types';

const router = useRouter();
const site = useSiteStore();

const categories = computed(() => site.categories);
const featured = ref<Tool[]>([]);
const latest = ref<Tool[]>([]);
const popular = ref<Tool[]>([]);
const loading = ref(true);
const totalTools = ref(0);

const hotWords = ['ChatGPT', '绘画', '视频生成', '免费', '编程', 'PPT'];
const heroKeyword = ref('');

onMounted(async () => {
  await site.loadAll();
  try {
    const [feat, lat, top] = await Promise.all([
      api.getTools({ featured: true, pageSize: 8, sort: 'popular' }),
      api.getTools({ pageSize: 8, sort: 'newest' }),
      api.getTopTools(8),
    ]);
    featured.value = feat.items;
    latest.value = lat.items;
    totalTools.value = feat.total || lat.total;
    popular.value = top;
  } catch (e) {
    console.warn('首页数据加载失败', e);
  } finally {
    loading.value = false;
  }
});

function doSearch() {
  const kw = heroKeyword.value.trim();
  if (kw) router.push({ name: 'search', query: { keyword: kw } });
}

function quickSearch(kw: string) {
  router.push({ name: 'search', query: { keyword: kw } });
}

function click(tool: Tool) {
  api.clickTool(tool.id).catch(() => {});
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16) || 99;
  const g = parseInt(full.slice(2, 4), 16) || 102;
  const b = parseInt(full.slice(4, 6), 16) || 241;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function rankLogoStyle(tool: Tool) {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9'];
  const idx = tool.name.charCodeAt(0) % colors.length;
  return { background: colors[idx] };
}

function initial(tool: Tool) {
  return tool.name.charAt(0).toUpperCase();
}
</script>

<style scoped>
.hero {
  position: relative;
  padding: 64px 0 52px;
  text-align: center;
  background:
    radial-gradient(ellipse 80% 60% at 50% -10%, rgb(99 102 241 / 12%), transparent),
    radial-gradient(ellipse 60% 50% at 80% 10%, rgb(236 72 153 / 8%), transparent);
  overflow: hidden;
}

.hero-title {
  font-size: 40px;
  font-weight: 800;
  letter-spacing: -1px;
  margin-bottom: 14px;
}

.gradient-text {
  background: linear-gradient(135deg, #6366f1, #a855f7, #ec4899);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-sub {
  font-size: 15px;
  color: var(--color-text-secondary);
  margin-bottom: 28px;
}

.hero-search {
  display: flex;
  gap: 10px;
  max-width: 560px;
  margin: 0 auto 18px;
}

.hero-search input {
  flex: 1;
  height: 46px;
  padding: 0 18px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.hero-search input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.hero-search-btn {
  height: 46px;
  border-radius: 999px;
  padding: 0 26px;
}

.hero-hot {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 13px;
}

.hero-hot-label {
  color: var(--color-text-muted);
}

.hero-hot-item {
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: 13px;
  transition: all 0.15s;
}

.hero-hot-item:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.section {
  padding: 32px 0;
}

.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 18px;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
}

.section-sub {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.section-more {
  font-size: 13px;
  color: var(--color-primary);
  flex-shrink: 0;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 16px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 12px;
}

.category-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all 0.18s;
}

.category-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: #d4d8ea;
}

.cat-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  font-size: 20px;
  flex-shrink: 0;
}

.cat-info {
  flex: 1;
  min-width: 0;
}

.cat-name {
  font-size: 14px;
  font-weight: 600;
}

.cat-count {
  font-size: 12px;
  color: var(--color-text-muted);
}

.cat-arrow {
  font-size: 16px;
  opacity: 0.7;
}

.loading-state {
  display: grid;
  place-items: center;
  padding: 60px;
}

.rank-card {
  padding: 6px 0;
  overflow: hidden;
}

.rank-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 18px;
  border-bottom: 1px solid var(--color-border);
}

.rank-row:last-child {
  border-bottom: none;
}

.rank-no {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-muted);
  background: var(--color-bg);
  flex-shrink: 0;
}

.rank-no.rank-1 { background: linear-gradient(135deg, #ffd76e, #f59e0b); color: #fff; }
.rank-no.rank-2 { background: linear-gradient(135deg, #d8dee9, #9aa5b8); color: #fff; }
.rank-no.rank-3 { background: linear-gradient(135deg, #f0b48a, #c97b4a); color: #fff; }

.rank-logo {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.rank-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.rank-name {
  font-size: 14px;
  font-weight: 600;
}

.rank-name:hover {
  color: var(--color-primary);
}

.rank-desc {
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rank-clicks {
  font-size: 12px;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

@media (max-width: 700px) {
  .hero {
    padding: 44px 0 36px;
  }

  .hero-title {
    font-size: 28px;
  }

  .hero-search {
    flex-direction: column;
  }

  .hero-search-btn {
    width: 100%;
  }

  .section-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
}
</style>
