<template>
  <div class="tool-card" :class="{ 'is-featured': tool.featured }">
    <div v-if="tool.featured" class="featured-ribbon">★ 推荐</div>

    <div class="card-top">
      <div class="tool-logo" :style="logoStyle">
        <img v-if="tool.logo" :src="tool.logo" :alt="tool.name" loading="lazy" @error="onLogoError" />
        <span v-else>{{ initial }}</span>
      </div>

      <div class="tool-heading">
        <div class="tool-name-row">
          <a :href="tool.url" target="_blank" rel="noopener noreferrer" class="tool-name" @click="go(tool.id)">
            {{ tool.name }}
          </a>
          <span v-if="tool.category" class="tool-cat">{{ tool.category.icon }} {{ tool.category.name }}</span>
        </div>

        <div class="tool-badges">
          <span class="badge" :class="`badge-${tool.pricing.toLowerCase()}`">{{ pricingLabel }}</span>
          <span v-if="tool.zhSupport" class="badge badge-zh">中文</span>
          <span v-if="tool.needsVpn" class="badge badge-vpn">需网络工具</span>
        </div>
      </div>
    </div>

    <p class="tool-desc">{{ tool.description }}</p>

    <div v-if="tool.tags?.length" class="tool-tags">
      <span v-for="tag in tool.tags.slice(0, 4)" :key="tag.id" class="tag-chip">{{ tag.name }}</span>
      <span v-if="tool.tags.length > 4" class="tag-more">+{{ tool.tags.length - 4 }}</span>
    </div>

    <div class="card-bottom">
      <span class="tool-clicks" :title="`${tool.clicks} 次访问`">
        <span class="click-dot"></span>{{ formatClicks(tool.clicks) }} 次访问
      </span>
      <a :href="tool.url" target="_blank" rel="noopener noreferrer" class="visit-btn" @click="go(tool.id)">
        访问 →
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Tool } from '@/types';
import { api } from '@/api';

const props = defineProps<{ tool: Tool }>();

const pricingLabels: Record<string, string> = {
  FREE: '免费',
  FREEMIUM: '免费增值',
  PAID: '付费',
  TRIAL: '试用',
};

const pricingLabel = computed(() => pricingLabels[props.tool.pricing] || props.tool.pricing);
const initial = computed(() => (props.tool.name || '?').trim().charAt(0).toUpperCase());

const logoError = ref(false);

/** 无 logo 时根据名称哈希生成稳定渐变色 */
const logoStyle = computed(() => {
  if (props.tool.logo && !logoError.value) return {};
  const hash = hashString(props.tool.name);
  const h1 = hash % 360;
  const h2 = (h1 + 40) % 360;
  return {
    background: `linear-gradient(135deg, hsl(${h1} 72% 62%), hsl(${h2} 72% 52%))`,
  };
});

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function onLogoError() {
  logoError.value = true;
}

function formatClicks(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}w`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

async function go(id: string) {
  // 乐观计数：后台异步记录，失败不影响跳转
  try {
    await api.clickTool(id);
  } catch {
    /* 忽略 */
  }
}
</script>

<style scoped>
.tool-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;
  overflow: hidden;
}

.tool-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
  border-color: #d4d8ea;
}

.tool-card.is-featured {
  border-color: #ffd9a8;
  background: linear-gradient(180deg, #fffdf8, #fff);
}

.featured-ribbon {
  position: absolute;
  top: 0;
  right: 0;
  padding: 3px 10px;
  border-bottom-left-radius: var(--radius-sm);
  background: linear-gradient(135deg, #f59e0b, #ec4899);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
}

.card-top {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.tool-logo {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 12px;
  flex-shrink: 0;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  overflow: hidden;
}

.tool-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tool-heading {
  flex: 1;
  min-width: 0;
}

.tool-name-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.tool-name {
  font-size: 15px;
  font-weight: 600;
}

.tool-name:hover {
  color: var(--color-primary);
}

.tool-cat {
  font-size: 12px;
  color: var(--color-text-muted);
}

.tool-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.tool-desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.65;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 63px;
}

.tool-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag-more {
  font-size: 12px;
  color: var(--color-text-muted);
  align-self: center;
}

.card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px dashed var(--color-border);
}

.tool-clicks {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.click-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-success);
}

.visit-btn {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-primary);
}

.visit-btn:hover {
  color: var(--color-primary-hover);
}
</style>
