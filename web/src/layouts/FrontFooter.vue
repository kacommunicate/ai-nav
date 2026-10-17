<template>
  <footer class="front-footer">
    <div class="container footer-inner">
      <div class="footer-brand">
        <span class="logo-mark">AI</span>
        <div>
          <div class="footer-name">{{ siteName }}</div>
          <div class="footer-desc">{{ description }}</div>
        </div>
      </div>

      <div class="footer-cols">
        <div class="footer-col">
          <div class="footer-title">分类</div>
          <router-link v-for="cat in categories.slice(0, 5)" :key="cat.id" :to="`/category/${cat.slug}`">
            {{ cat.name }}
          </router-link>
        </div>
        <div class="footer-col">
          <div class="footer-title">热门标签</div>
          <span v-for="tag in tags.slice(0, 6)" :key="tag.id" class="footer-tag">#{{ tag.name }}</span>
        </div>
        <div class="footer-col">
          <div class="footer-title">链接</div>
          <router-link to="/about">关于本站</router-link>
          <router-link to="/admin">管理后台</router-link>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <span v-if="footerText">{{ footerText }}</span>
      <span v-if="icp" class="footer-icp">{{ icp }}</span>
      <span class="footer-made">Powered by NestJS + Vue3</span>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSiteStore } from '@/stores/site';

const site = useSiteStore();
const siteName = computed(() => site.settings?.siteName || 'AI 导航');
const description = computed(() => site.settings?.description || '');
const footerText = computed(() => site.settings?.footerText || '');
const icp = computed(() => site.settings?.icp || '');
const categories = computed(() => site.categories);
const tags = computed(() => site.tags);
</script>

<style scoped>
.front-footer {
  margin-top: 60px;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}

.footer-inner {
  display: flex;
  gap: 48px;
  padding-top: 40px;
  padding-bottom: 28px;
  flex-wrap: wrap;
}

.footer-brand {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  flex: 1;
  min-width: 240px;
}

.logo-mark {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  flex-shrink: 0;
}

.footer-name {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 4px;
}

.footer-desc {
  font-size: 13px;
  color: var(--color-text-muted);
  max-width: 320px;
}

.footer-cols {
  display: flex;
  gap: 56px;
  flex-wrap: wrap;
}

.footer-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.footer-title {
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 2px;
}

.footer-col a:hover {
  color: var(--color-primary);
}

.footer-tag {
  color: var(--color-text-muted);
}

.footer-bottom {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  padding: 16px 20px;
  border-top: 1px solid var(--color-border);
  font-size: 12px;
  color: var(--color-text-muted);
}

.footer-icp {
  color: var(--color-text-muted);
}

@media (max-width: 700px) {
  .footer-inner {
    flex-direction: column;
    gap: 28px;
  }

  .footer-cols {
    gap: 32px;
  }
}
</style>
