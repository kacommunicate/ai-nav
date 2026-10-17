<template>
  <div class="dashboard">
    <h1 class="page-title">数据看板</h1>
    <p class="page-desc">站点运行数据总览</p>

    <div v-if="loading" class="loading-state"><div class="spinner"></div></div>

    <template v-else>
      <!-- 统计卡片 -->
      <div class="stat-grid">
        <div v-for="card in statCards" :key="card.label" class="stat-card card">
          <div class="stat-icon" :style="{ background: card.bg }">{{ card.icon }}</div>
          <div class="stat-body">
            <div class="stat-value">{{ card.value }}</div>
            <div class="stat-label">{{ card.label }}</div>
          </div>
        </div>
      </div>

      <div class="dash-grid">
        <!-- 趋势图 -->
        <div class="card chart-card">
          <div class="card-head">
            <h2 class="card-title">访问趋势（近 {{ trendDays }} 天）</h2>
            <div class="day-select">
              <button
                v-for="d in [7, 14, 30]"
                :key="d"
                class="day-btn"
                :class="{ active: trendDays === d }"
                @click="trendDays = d; loadTrend()"
              >
                {{ d }}天
              </button>
            </div>
          </div>
          <div v-if="trend.length" class="bar-chart">
            <div v-for="p in trend" :key="p.date" class="bar-col" :title="`${p.date}: ${p.clicks} 次`">
              <div class="bar-track">
                <div class="bar-fill" :style="{ height: barHeight(p.clicks) + '%' }"></div>
              </div>
              <span class="bar-label">{{ shortDate(p.date) }}</span>
            </div>
          </div>
          <div v-else class="empty-state small"><p>暂无访问数据</p></div>
        </div>

        <!-- 分类占比 -->
        <div class="card chart-card">
          <div class="card-head">
            <h2 class="card-title">分类访问分布</h2>
          </div>
          <div v-if="catStats.length" class="cat-bars">
            <div v-for="c in catStats" :key="c.id" class="cat-bar-row">
              <span class="cat-bar-name">{{ c.name }}</span>
              <div class="cat-bar-track">
                <div
                  class="cat-bar-fill"
                  :style="{ width: catWidth(c) + '%', background: c.color }"
                ></div>
              </div>
              <span class="cat-bar-value">{{ c.clicks }}</span>
            </div>
          </div>
          <div v-else class="empty-state small"><p>暂无数据</p></div>
        </div>
      </div>

      <!-- 快捷入口 -->
      <div class="card quick-card">
        <h2 class="card-title">快捷操作</h2>
        <div class="quick-actions">
          <router-link to="/admin/tools?action=create" class="quick-action">
            <span class="quick-icon">➕</span>
            <span>添加工具</span>
          </router-link>
          <router-link to="/admin/categories" class="quick-action">
            <span class="quick-icon">🗂</span>
            <span>管理分类</span>
          </router-link>
          <router-link to="/admin/tags" class="quick-action">
            <span class="quick-icon">🏷</span>
            <span>管理标签</span>
          </router-link>
          <router-link to="/admin/settings" class="quick-action">
            <span class="quick-icon">⚙️</span>
            <span>站点设置</span>
          </router-link>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { api } from '@/api';
import type { CategoryStat, StatsOverview, TrendPoint } from '@/types';

const loading = ref(true);
const overview = ref<StatsOverview | null>(null);
const trend = ref<TrendPoint[]>([]);
const catStats = ref<CategoryStat[]>([]);
const trendDays = ref(14);

const statCards = computed(() => {
  const o = overview.value;
  if (!o) return [];
  return [
    { label: '已发布工具', value: o.publishedTotal, icon: '🧰', bg: '#eef0ff' },
    { label: '分类数量', value: o.categoryTotal, icon: '🗂', bg: '#e7f8f0' },
    { label: '标签数量', value: o.tagTotal, icon: '🏷', bg: '#fff5e6' },
    { label: '总访问量', value: o.clickTotal, icon: '👀', bg: '#fdeaea' },
    { label: '今日访问', value: o.clickToday, icon: '📅', bg: '#eaf0ff' },
    { label: '近 7 天访问', value: o.clickWeek, icon: '📈', bg: '#f0ebff' },
    { label: '待审核', value: o.pendingTotal, icon: '⏳', bg: '#fff5e6' },
    { label: '已下架', value: o.offlineTotal, icon: '🚫', bg: '#f0f1f5' },
  ];
});

function barHeight(clicks: number): number {
  const max = Math.max(...trend.value.map((t) => t.clicks), 1);
  return Math.round((clicks / max) * 100);
}

function catWidth(c: CategoryStat): number {
  const max = Math.max(...catStats.value.map((x) => x.clicks), 1);
  return Math.round((c.clicks / max) * 100);
}

function shortDate(date: string): string {
  return date.slice(5).replace('-', '/');
}

async function loadTrend() {
  try {
    trend.value = await api.statsTrend(trendDays.value);
  } catch (e) {
    console.warn(e);
  }
}

onMounted(async () => {
  try {
    const [o, t, c] = await Promise.all([
      api.statsOverview(),
      api.statsTrend(trendDays.value),
      api.statsByCategory(),
    ]);
    overview.value = o;
    trend.value = t;
    catStats.value = c;
  } catch (e) {
    console.warn(e);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.loading-state {
  display: grid;
  place-items: center;
  padding: 100px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
}

.stat-icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 12px;
  font-size: 21px;
  flex-shrink: 0;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.dash-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.chart-card {
  padding: 20px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
}

.day-select {
  display: flex;
  gap: 4px;
}

.day-btn {
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}

.day-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 200px;
  padding-top: 10px;
}

.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  height: 100%;
  min-width: 0;
}

.bar-track {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  min-height: 0;
}

.bar-fill {
  width: 100%;
  min-height: 3px;
  border-radius: 5px 5px 2px 2px;
  background: linear-gradient(180deg, #6366f1, #a5b4fc);
  transition: height 0.3s;
}

.bar-col:hover .bar-fill {
  background: linear-gradient(180deg, #4f46e5, #6366f1);
}

.bar-label {
  font-size: 10px;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.cat-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cat-bar-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.cat-bar-name {
  width: 76px;
  flex-shrink: 0;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cat-bar-track {
  flex: 1;
  height: 8px;
  border-radius: 999px;
  background: var(--color-bg);
  overflow: hidden;
}

.cat-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s;
}

.cat-bar-value {
  width: 42px;
  text-align: right;
  font-size: 12px;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.empty-state.small {
  padding: 40px 12px;
  font-size: 13px;
}

.quick-card {
  padding: 20px;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.quick-action {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.15s;
}

.quick-action:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: translateY(-2px);
}

.quick-icon {
  font-size: 19px;
}

@media (max-width: 1000px) {
  .dash-grid {
    grid-template-columns: 1fr;
  }
}
</style>
