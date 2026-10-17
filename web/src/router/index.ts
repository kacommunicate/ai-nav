import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  // ---------------- 前台 ----------------
  {
    path: '/',
    component: () => import('@/layouts/FrontLayout.vue'),
    children: [
      { path: '', name: 'home', component: () => import('@/views/HomeView.vue'), meta: { title: '首页' } },
      { path: 'category/:slug', name: 'category', component: () => import('@/views/CategoryView.vue'), meta: { title: '分类' } },
      { path: 'tool/:idOrSlug', name: 'tool-detail', component: () => import('@/views/ToolDetailView.vue'), meta: { title: '工具详情' } },
      { path: 'search', name: 'search', component: () => import('@/views/SearchView.vue'), meta: { title: '搜索' } },
      { path: 'about', name: 'about', component: () => import('@/views/AboutView.vue'), meta: { title: '关于' } },
    ],
  },

  // ---------------- 后台 ----------------
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('@/views/admin/LoginView.vue'),
    meta: { title: '后台登录', guestOnly: true },
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: { name: 'admin-dashboard' } },
      { path: 'dashboard', name: 'admin-dashboard', component: () => import('@/views/admin/DashboardView.vue'), meta: { title: '数据看板' } },
      { path: 'tools', name: 'admin-tools', component: () => import('@/views/admin/ToolsView.vue'), meta: { title: '工具管理' } },
      { path: 'categories', name: 'admin-categories', component: () => import('@/views/admin/CategoriesView.vue'), meta: { title: '分类管理' } },
      { path: 'tags', name: 'admin-tags', component: () => import('@/views/admin/TagsView.vue'), meta: { title: '标签管理' } },
      { path: 'settings', name: 'admin-settings', component: () => import('@/views/admin/SettingsView.vue'), meta: { title: '站点设置' } },
      { path: 'logs', name: 'admin-logs', component: () => import('@/views/admin/LogsView.vue'), meta: { title: '操作日志' } },
      { path: 'password', name: 'admin-password', component: () => import('@/views/admin/PasswordView.vue'), meta: { title: '修改密码' } },
    ],
  },

  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: '页面不存在' },
  },
];

// 部署在子路径时（GitHub Pages 项目页 /<repo>/），base 必须与
// vite.config.ts 的 base 一致。Vite 会把 import.meta.env.BASE_URL
// 替换成构建时的 base，所以这里直接用它，无需硬编码仓库名。
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

// 路由守卫：鉴权 + 标题
router.beforeEach((to, _from, next) => {
  document.title = to.meta.title ? `${to.meta.title as string} — AI 导航` : 'AI 导航';

  const token = localStorage.getItem('ai_nav_token');

  if (to.meta.requiresAuth && !token) {
    return next({ name: 'admin-login', query: { redirect: to.fullPath } });
  }
  if (to.meta.guestOnly && token) {
    return next({ name: 'admin-dashboard' });
  }
  next();
});

export default router;
