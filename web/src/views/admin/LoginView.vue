<template>
  <div class="login-page">
    <div class="login-box card">
      <div class="login-logo">
        <span class="logo-mark">AI</span>
        <h1 class="login-title">AI 导航后台</h1>
        <p class="login-sub">请登录以管理站点内容</p>
      </div>

      <form class="login-form" @submit.prevent="submit">
        <div class="form-item">
          <label class="form-label">用户名</label>
          <input v-model="form.username" type="text" class="input" placeholder="请输入用户名" autocomplete="username" />
        </div>

        <div class="form-item">
          <label class="form-label">密码</label>
          <div class="pwd-wrap">
            <input
              v-model="form.password"
              :type="showPwd ? 'text' : 'password'"
              class="input"
              placeholder="请输入密码"
              autocomplete="current-password"
              @keyup.enter="submit"
            />
            <button type="button" class="pwd-toggle" @click="showPwd = !showPwd">
              {{ showPwd ? '🙈' : '👁' }}
            </button>
          </div>
        </div>

        <p v-if="error" class="form-error">{{ error }}</p>

        <button type="submit" class="btn btn-primary login-btn" :disabled="loading">
          <span v-if="loading" class="btn-spinner"></span>
          <span v-else>登 录</span>
        </button>
      </form>

      <div class="login-tip">
        <p>默认账号：<code>admin</code> / 密码：<code>admin123456</code></p>
        <p class="login-tip-sub">首次登录后请立即在「修改密码」中更新</p>
      </div>

      <router-link to="/" class="login-back">← 返回前台首页</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const form = ref({ username: '', password: '' });
const showPwd = ref(false);
const loading = ref(false);
const error = ref('');

async function submit() {
  error.value = '';
  if (!form.value.username.trim()) {
    error.value = '请输入用户名';
    return;
  }
  if (!form.value.password) {
    error.value = '请输入密码';
    return;
  }

  loading.value = true;
  try {
    await auth.login(form.value.username.trim(), form.value.password);
    const redirect = (route.query.redirect as string) || '/admin/dashboard';
    router.push(redirect);
  } catch (e) {
    error.value = (e as Error).message || '登录失败';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  auth.bootstrap();
  if (auth.user) router.push({ name: 'admin-dashboard' });
});
</script>

<style scoped>
.login-page {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: 20px;
  background:
    radial-gradient(ellipse 70% 50% at 50% 0%, rgb(99 102 241 / 12%), transparent),
    radial-gradient(ellipse 50% 40% at 80% 100%, rgb(236 72 153 / 8%), transparent);
}

.login-box {
  width: 100%;
  max-width: 380px;
  padding: 36px 32px 28px;
  box-shadow: var(--shadow-lg);
}

.login-logo {
  text-align: center;
  margin-bottom: 28px;
}

.logo-mark {
  display: inline-grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 13px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 17px;
  font-weight: 800;
  margin-bottom: 12px;
}

.login-title {
  font-size: 20px;
  font-weight: 700;
}

.login-sub {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-top: 4px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.pwd-wrap {
  position: relative;
}

.pwd-toggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  opacity: 0.6;
}

.pwd-toggle:hover {
  opacity: 1;
}

.form-error {
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  background: #fdeaea;
  color: #b02020;
  font-size: 13px;
}

.login-btn {
  height: 42px;
  font-size: 15px;
  margin-top: 4px;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgb(255 255 255 / 40%);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.login-tip {
  margin-top: 22px;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.8;
}

.login-tip code {
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-family: ui-monospace, monospace;
}

.login-tip-sub {
  color: #b3325c;
}

.login-back {
  display: block;
  text-align: center;
  margin-top: 18px;
  font-size: 13px;
  color: var(--color-text-muted);
}

.login-back:hover {
  color: var(--color-primary);
}
</style>
