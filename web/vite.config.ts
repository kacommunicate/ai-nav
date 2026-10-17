import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

// ============================================================
// 构建时注入
// ------------------------------------------------------------
// VITE_BASE     部署基路径。GitHub Pages 项目页传 "/<repo>/"；
//              根域名或自定义域名传 "/"（默认）。
// VITE_API_URL  后端 API 地址。留空时用同源 "/api"（前后端
//              同进程托管场景）；前后端分离时必须填完整地址，
//              例如 "https://ai-nav-api.onrender.com/api"。
// ============================================================
const base = process.env.VITE_BASE || '/';
const apiUrl = (process.env.VITE_API_URL || '').replace(/\/+$/, '');

export default defineConfig({
  base,
  plugins: [vue()],
  define: {
    __API_BASE__: JSON.stringify(apiUrl),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
