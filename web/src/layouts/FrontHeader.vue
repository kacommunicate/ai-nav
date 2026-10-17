<template>
  <header class="front-header">
    <div class="container header-inner">
      <router-link to="/" class="logo">
        <span class="logo-mark">AI</span>
        <span class="logo-text">{{ siteName }}</span>
      </router-link>

      <nav class="main-nav">
        <router-link to="/" class="nav-link" exact-active-class="active">首页</router-link>
        <router-link
          v-for="cat in categories.slice(0, 6)"
          :key="cat.id"
          :to="`/category/${cat.slug}`"
          class="nav-link"
          active-class="active"
        >
          {{ cat.icon }} {{ cat.name }}
        </router-link>
        <router-link to="/about" class="nav-link" active-class="active">关于</router-link>
      </nav>

      <div class="header-actions">
        <div class="search-box">
          <input
            :value="keyword"
            type="text"
            placeholder="搜索 AI 工具…"
            @input="onInput"
            @keyup.enter="submit"
          />
          <span class="search-icon">🔍</span>
        </div>
        <router-link to="/admin" class="admin-entry">后台</router-link>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSiteStore } from '@/stores/site';

const router = useRouter();
const site = useSiteStore();
const siteName = computed(() => site.settings?.siteName || 'AI 导航');
const categories = computed(() => site.categories);

const keyword = ref('');

function onInput(e: Event) {
  keyword.value = (e.target as HTMLInputElement).value;
}

function submit() {
  const kw = keyword.value.trim();
  if (!kw) return;
  router.push({ name: 'search', query: { keyword: kw } });
}
</script>

<style scoped>
.front-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgb(255 255 255 / 88%);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
}

.header-inner {
  display: flex;
  align-items: center;
  gap: 24px;
  height: var(--header-height);
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 17px;
  flex-shrink: 0;
}

.logo-mark {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.logo-text {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.main-nav {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 1;
  overflow-x: auto;
  scrollbar-width: none;
}

.main-nav::-webkit-scrollbar {
  display: none;
}

.nav-link {
  padding: 6px 11px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.nav-link:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.nav-link.active {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 500;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.search-box {
  position: relative;
}

.search-box input {
  width: 180px;
  height: 34px;
  padding: 0 32px 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-bg);
  transition: all 0.15s;
}

.search-box input:focus {
  outline: none;
  width: 220px;
  border-color: var(--color-primary);
  background: var(--color-surface);
}

.search-icon {
  position: absolute;
  right: 11px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  opacity: 0.6;
  pointer-events: none;
}

.admin-entry {
  padding: 5px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  font-size: 13px;
  color: var(--color-text-secondary);
}

.admin-entry:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

@media (max-width: 900px) {
  .header-inner {
    gap: 12px;
  }

  .search-box input {
    width: 120px;
  }

  .search-box input:focus {
    width: 150px;
  }
}
</style>
