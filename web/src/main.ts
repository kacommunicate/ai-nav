import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { tokenStore } from './api';
import './styles/index.css';

const app = createApp(App);

app.use(createPinia());
app.use(router);

// 全局挂载 token 工具，便于调试
(app.config.globalProperties as any).$tokenStore = tokenStore;

app.mount('#app');
