<template>
  <div class="front-layout">
    <FrontHeader />
    <div v-if="notice" class="notice-bar">
      <div class="container notice-inner">
        <span class="notice-icon">📢</span>
        <span>{{ notice }}</span>
      </div>
    </div>
    <main class="front-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <FrontFooter />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import FrontHeader from './FrontHeader.vue';
import FrontFooter from './FrontFooter.vue';
import { useSiteStore } from '@/stores/site';

const site = useSiteStore();
const notice = computed(() => site.settings?.notice || '');

onMounted(() => {
  if (!site.settings) site.loadAll();
});
</script>

<style scoped>
.front-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.front-main {
  flex: 1;
}

.notice-bar {
  background: linear-gradient(135deg, #eef0ff, #f5edff);
  border-bottom: 1px solid var(--color-border);
}

.notice-inner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 9px;
  padding-bottom: 9px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.notice-icon {
  flex-shrink: 0;
}
</style>
