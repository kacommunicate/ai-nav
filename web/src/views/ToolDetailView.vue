<template>
  <div class="detail-page">
    <div class="container">
      <div v-if="loading" class="loading-state"><div class="spinner"></div></div>

      <template v-else-if="tool">
        <!-- 面包屑 -->
        <div class="breadcrumb">
          <router-link to="/">首页</router-link>
          <span class="crumb-sep">/</span>
          <router-link v-if="tool.category" :to="`/category/${tool.category.slug}`">
            {{ tool.category.name }}
          </router-link>
          <span class="crumb-sep">/</span>
          <span class="crumb-current">{{ tool.name }}</span>
        </div>

        <!-- 主体 -->
        <div class="detail-grid">
          <div class="detail-main">
            <div class="detail-head">
              <div class="detail-logo" :style="logoStyle">
                <img v-if="tool.logo" :src="tool.logo" :alt="tool.name" @error="logoError = true" />
                <span v-else>{{ initial }}</span>
              </div>
              <div class="detail-title-block">
                <div class="detail-name-row">
                  <h1 class="detail-name">{{ tool.name }}</h1>
                  <span v-if="tool.featured" class="badge badge-featured">★ 推荐</span>
                </div>
                <div class="detail-meta">
                  <span class="badge" :class="`badge-${tool.pricing.toLowerCase()}`">{{ pricingLabel }}</span>
                  <span v-if="tool.zhSupport" class="badge badge-zh">中文支持</span>
                  <span v-if="tool.needsVpn" class="badge badge-vpn">需网络工具</span>
                  <span class="detail-clicks">{{ tool.clicks }} 次访问</span>
                </div>
              </div>
            </div>

            <div class="detail-actions">
              <a :href="tool.url" target="_blank" rel="noopener noreferrer" class="btn btn-primary visit-main" @click="click">
                访问官网 →
              </a>
              <button class="btn btn-outline" @click="copyUrl">{{ copied ? '✓ 已复制链接' : '复制链接' }}</button>
              <span class="detail-url">{{ displayUrl }}</span>
            </div>

            <div class="detail-section">
              <h2 class="detail-section-title">工具简介</h2>
              <p class="detail-desc">{{ tool.description }}</p>
            </div>

            <div v-if="tool.tags?.length" class="detail-section">
              <h2 class="detail-section-title">相关标签</h2>
              <div class="detail-tags">
                <router-link
                  v-for="tag in tool.tags"
                  :key="tag.id"
                  :to="{ name: 'search', query: { tag: tag.name } }"
                  class="tag-chip"
                >
                  #{{ tag.name }}
                </router-link>
              </div>
            </div>
          </div>

          <!-- 侧栏 -->
          <aside class="detail-side">
            <div class="side-card">
              <div class="side-title">同类工具</div>
              <div v-if="related.length" class="related-list">
                <router-link
                  v-for="item in related"
                  :key="item.id"
                  :to="`/tool/${item.id}`"
                  class="related-item"
                >
                  <span class="related-logo" :style="relatedLogoStyle(item)">{{ item.name.charAt(0).toUpperCase() }}</span>
                  <div class="related-info">
                    <span class="related-name">{{ item.name }}</span>
                    <span class="related-desc">{{ item.description }}</span>
                  </div>
                </router-link>
              </div>
              <p v-else class="side-empty">暂无同类工具</p>
            </div>

            <div class="side-card">
              <div class="side-title">热门排行</div>
              <div v-if="popular.length" class="mini-rank">
                <router-link v-for="(item, i) in popular.slice(0, 5)" :key="item.id" :to="`/tool/${item.id}`" class="mini-rank-row">
                  <span class="mini-rank-no" :class="`rank-${i + 1}`">{{ i + 1 }}</span>
                  <span class="mini-rank-name">{{ item.name }}</span>
                  <span class="mini-rank-clicks">{{ item.clicks }}</span>
                </router-link>
              </div>
            </div>
          </aside>
        </div>
      </template>

      <div v-else class="empty-state">
        <div class="empty-icon">🫥</div>
        <p>工具不存在或已下架</p>
        <router-link to="/" class="btn btn-primary" style="margin-top: 16px">返回首页</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '@/api';
import type { Tool } from '@/types';

const route = useRoute();

const tool = ref<Tool | null>(null);
const related = ref<Tool[]>([]);
const popular = ref<Tool[]>([]);
const loading = ref(true);
const logoError = ref(false);
const copied = ref(false);

const pricingLabels: Record<string, string> = {
  FREE: '免费',
  FREEMIUM: '免费增值',
  PAID: '付费',
  TRIAL: '试用',
};

const initial = computed(() => (tool.value?.name || '?').charAt(0).toUpperCase());
const pricingLabel = computed(() => (tool.value ? pricingLabels[tool.value.pricing] || tool.value.pricing : ''));
const displayUrl = computed(() => {
  const u = tool.value?.url || '';
  return u.replace(/^https?:\/\//, '').replace(/\/$/, '');
});

const logoStyle = computed(() => {
  if (tool.value?.logo && !logoError.value) return {};
  const name = tool.value?.name || 'A';
  const hash = [...name].reduce((h, c) => (h << 5) - h + c.charCodeAt(0), 0);
  const h = Math.abs(hash) % 360;
  return { background: `linear-gradient(135deg, hsl(${h} 72% 62%), hsl(${(h + 40) % 360} 72% 52%))` };
});

function relatedLogoStyle(item: Tool) {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9'];
  return { background: colors[item.name.charCodeAt(0) % colors.length] };
}

async function click() {
  if (!tool.value) return;
  api.clickTool(tool.value.id).catch(() => {});
}

async function copyUrl() {
  if (!tool.value) return;
  try {
    await navigator.clipboard.writeText(tool.value.url);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  } catch {
    /* 剪贴板不可用时忽略 */
  }
}

onMounted(async () => {
  loading.value = true;
  try {
    const idOrSlug = route.params.idOrSlug as string;
    tool.value = await api.getTool(idOrSlug);

    const [rel, pop] = await Promise.all([
      api.getTools({ categoryId: tool.value.categoryId, pageSize: 5, sort: 'popular' }),
      api.getTopTools(5),
    ]);
    related.value = rel.items.filter((t) => t.id !== tool.value!.id).slice(0, 4);
    popular.value = pop;
  } catch (e) {
    console.warn(e);
    tool.value = null;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.detail-page {
  padding: 24px 0 40px;
}

.loading-state {
  display: grid;
  place-items: center;
  padding: 80px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.breadcrumb a:hover {
  color: var(--color-primary);
}

.crumb-sep {
  opacity: 0.5;
}

.crumb-current {
  color: var(--color-text);
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
  align-items: start;
}

.detail-main {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 28px;
  box-shadow: var(--shadow-sm);
}

.detail-head {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.detail-logo {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 16px;
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  overflow: hidden;
}

.detail-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-title-block {
  flex: 1;
  min-width: 0;
}

.detail-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.detail-name {
  font-size: 24px;
  font-weight: 700;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.detail-clicks {
  font-size: 12px;
  color: var(--color-text-muted);
}

.detail-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 18px 0;
  margin: 20px 0;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

.visit-main {
  height: 40px;
  padding: 0 22px;
  font-size: 15px;
}

.detail-url {
  font-size: 12px;
  color: var(--color-text-muted);
  word-break: break-all;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
}

.detail-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.8;
}

.detail-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag-chip {
  padding: 4px 11px;
  border-radius: 6px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  font-size: 12px;
  color: var(--color-text-secondary);
}

.tag-chip:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.detail-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.side-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px 18px;
}

.side-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
}

.side-empty {
  font-size: 13px;
  color: var(--color-text-muted);
}

.related-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.related-item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 8px;
  border-radius: var(--radius-sm);
}

.related-item:hover {
  background: var(--color-bg);
}

.related-logo {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.related-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.related-name {
  font-size: 13px;
  font-weight: 500;
}

.related-desc {
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.mini-rank {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mini-rank-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 6px;
  border-radius: var(--radius-sm);
  font-size: 13px;
}

.mini-rank-row:hover {
  background: var(--color-bg);
}

.mini-rank-no {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-muted);
  background: var(--color-bg);
  flex-shrink: 0;
}

.mini-rank-no.rank-1 { background: linear-gradient(135deg, #ffd76e, #f59e0b); color: #fff; }
.mini-rank-no.rank-2 { background: linear-gradient(135deg, #d8dee9, #9aa5b8); color: #fff; }
.mini-rank-no.rank-3 { background: linear-gradient(135deg, #f0b48a, #c97b4a); color: #fff; }

.mini-rank-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mini-rank-clicks {
  font-size: 12px;
  color: var(--color-text-muted);
}

@media (max-width: 900px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-main {
    padding: 20px;
  }
}
</style>
