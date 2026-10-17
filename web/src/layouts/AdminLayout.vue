<template>
  <div class="admin-layout">
    <aside class="admin-sidebar" :class="{ collapsed: collapsed }">
      <div class="sidebar-logo">
        <span class="logo-mark">AI</span>
        <span v-show="!collapsed" class="logo-text">导航后台</span>
      </div>

      <nav class="sidebar-nav">
        <router-link
          v-for="item in menuItems"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          active-class="active"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span v-show="!collapsed" class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <router-link to="/" class="nav-item">
          <span class="nav-icon">🌐</span>
          <span v-show="!collapsed" class="nav-label">返回前台</span>
        </router-link>
      </div>
    </aside>

    <div class="admin-main">
      <header class="admin-header">
        <button class="collapse-btn" @click="collapsed = !collapsed">
          {{ collapsed ? '☰' : '✕' }}
        </button>

        <div class="header-title">{{ currentTitle }}</div>

        <div class="header-right">
          <div class="user-info">
            <span class="user-avatar">{{ (user?.displayName || user?.username || 'A').charAt(0).toUpperCase() }}</span>
            <div class="user-text">
              <div class="user-name">{{ user?.displayName || user?.username || '未登录' }}</div>
              <div class="user-role">{{ user?.role === 'ADMIN' ? '超级管理员' : '编辑' }}</div>
            </div>
          </div>
          <button class="btn btn-outline btn-sm" @click="logout">退出登录</button>
        </div>
      </header>

      <main class="admin-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useSiteStore } from '@/stores/site';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const site = useSiteStore();

const collapsed = ref(false);
const user = computed(() => auth.user);

const menuItems = [
  { to: '/admin/dashboard', label: '数据看板', icon: '📊' },
  { to: '/admin/tools', label: '工具管理', icon: '🧰' },
  { to: '/admin/categories', label: '分类管理', icon: '🗂' },
  { to: '/admin/tags', label: '标签管理', icon: '🏷' },
  { to: '/admin/settings', label: '站点设置', icon: '⚙️' },
  { to: '/admin/logs', label: '操作日志', icon: '📜' },
  { to: '/admin/password', label: '修改密码', icon: '🔑' },
];

const currentTitle = computed(() => {
  const item = menuItems.find((m) => route.path.startsWith(m.to));
  return item?.label || '后台管理';
});

function logout() {
  auth.logout();
  router.push({ name: 'admin-login' });
}

onMounted(() => {
  auth.bootstrap();
});
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg);
}

.admin-sidebar {
  display: flex;
  flex-direction: column;
  width: 220px;
  background: #171a2b;
  color: #c8ccdd;
  transition: width 0.2s;
  position: sticky;
  top: 0;
  height: 100vh;
  flex-shrink: 0;
}

.admin-sidebar.collapsed {
  width: 64px;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  height: var(--header-height);
  padding: 0 18px;
  border-bottom: 1px solid rgb(255 255 255 / 8%);
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
  flex-shrink: 0;
}

.logo-text {
  font-weight: 700;
  font-size: 15px;
  color: #fff;
  white-space: nowrap;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px 10px;
  overflow-y: auto;
}

.sidebar-footer {
  padding: 10px;
  border-top: 1px solid rgb(255 255 255 / 8%);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: #a8aec8;
  white-space: nowrap;
  transition: all 0.15s;
}

.nav-item:hover {
  background: rgb(255 255 255 / 7%);
  color: #fff;
}

.nav-item.active {
  background: linear-gradient(135deg, #6366f1, #7c3aed);
  color: #fff;
  font-weight: 500;
}

.nav-icon {
  font-size: 16px;
  flex-shrink: 0;
  width: 20px;
  text-align: center;
}

.admin-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.admin-header {
  display: flex;
  align-items: center;
  gap: 16px;
  height: var(--header-height);
  padding: 0 24px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 50;
}

.collapse-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: 15px;
}

.collapse-btn:hover {
  background: var(--color-bg);
}

.header-title {
  font-size: 15px;
  font-weight: 600;
  flex: 1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 9px;
}

.user-avatar {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}

.user-text {
  line-height: 1.3;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
}

.user-role {
  font-size: 11px;
  color: var(--color-text-muted);
}

.admin-content {
  flex: 1;
  padding: 24px;
}

@media (max-width: 768px) {
  .admin-content {
    padding: 16px;
  }

  .user-text {
    display: none;
  }
}
</style>
