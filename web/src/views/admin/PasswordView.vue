<template>
  <div class="password-admin">
    <h1 class="page-title">修改密码</h1>
    <p class="page-desc">建议首次登录后立即修改默认密码</p>

    <div class="card pwd-card">
      <div class="form-item">
        <label class="form-label">当前账号</label>
        <div class="current-user">
          <span class="user-avatar">{{ (user?.displayName || user?.username || 'A').charAt(0).toUpperCase() }}</span>
          <div>
            <div class="cu-name">{{ user?.displayName || user?.username }}</div>
            <div class="cu-role">{{ user?.role === 'ADMIN' ? '超级管理员' : '编辑' }}</div>
          </div>
        </div>
      </div>

      <div class="form-item">
        <label class="form-label required">原密码</label>
        <input v-model="form.oldPassword" type="password" class="input" placeholder="请输入当前密码" autocomplete="current-password" />
      </div>

      <div class="form-item">
        <label class="form-label required">新密码</label>
        <input v-model="form.newPassword" type="password" class="input" placeholder="至少 6 位" autocomplete="new-password" />
      </div>

      <div class="form-item">
        <label class="form-label required">确认新密码</label>
        <input v-model="form.confirm" type="password" class="input" placeholder="再次输入新密码" autocomplete="new-password" @keyup.enter="submit" />
      </div>

      <!-- 强度提示 -->
      <div v-if="form.newPassword" class="pwd-strength">
        <div class="strength-bars">
          <div v-for="i in 3" :key="i" class="strength-bar" :class="{ filled: i <= strength }"></div>
        </div>
        <span class="strength-text" :class="`s${strength}`">{{ strengthText }}</span>
      </div>

      <p v-if="error" class="form-error">{{ error }}</p>
      <p v-if="done" class="form-ok">✓ 密码修改成功，请牢记新密码</p>

      <div class="form-actions">
        <button class="btn btn-primary" :disabled="saving" @click="submit">
          {{ saving ? '提交中…' : '确认修改' }}
        </button>
        <button class="btn btn-outline" @click="reset">重置</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { api } from '@/api';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const user = computed(() => auth.user);

const form = ref({ oldPassword: '', newPassword: '', confirm: '' });
const saving = ref(false);
const error = ref('');
const done = ref(false);

const strength = computed(() => {
  const p = form.value.newPassword;
  if (!p) return 0;
  let s = 1;
  if (p.length >= 8) s += 1;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p) && /\d/.test(p)) s += 1;
  if (/[^A-Za-z0-9]/.test(p)) s = 3;
  return s;
});

const strengthText = computed(() => ['', '弱', '中', '强'][strength.value] || '弱');

function reset() {
  form.value = { oldPassword: '', newPassword: '', confirm: '' };
  error.value = '';
  done.value = false;
}

async function submit() {
  error.value = '';
  done.value = false;

  if (!form.value.oldPassword) return (error.value = '请输入原密码');
  if (!form.value.newPassword || form.value.newPassword.length < 6) return (error.value = '新密码至少 6 位');
  if (form.value.newPassword !== form.value.confirm) return (error.value = '两次输入的新密码不一致');
  if (form.value.newPassword === form.value.oldPassword) return (error.value = '新密码不能与原密码相同');

  saving.value = true;
  try {
    await api.changePassword(form.value.oldPassword, form.value.newPassword);
    done.value = true;
    form.value = { oldPassword: '', newPassword: '', confirm: '' };
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    saving.value = false;
  }
}

onMounted(() => auth.bootstrap());
</script>

<style scoped>
.pwd-card {
  max-width: 460px;
  padding: 26px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.current-user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  background: var(--color-bg);
}

.user-avatar {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
}

.cu-name {
  font-size: 14px;
  font-weight: 600;
}

.cu-role {
  font-size: 12px;
  color: var(--color-text-muted);
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

.form-label.required::after {
  content: ' *';
  color: var(--color-danger);
}

.pwd-strength {
  display: flex;
  align-items: center;
  gap: 10px;
}

.strength-bars {
  display: flex;
  gap: 5px;
}

.strength-bar {
  width: 40px;
  height: 5px;
  border-radius: 999px;
  background: var(--color-border);
  transition: background 0.2s;
}

.strength-bar.filled:nth-child(1) { background: #ef4444; }
.strength-bar.filled:nth-child(2) { background: #f59e0b; }
.strength-bar.filled:nth-child(3) { background: #10b981; }

.strength-text {
  font-size: 12px;
  color: var(--color-text-muted);
}

.strength-text.s3 { color: var(--color-success); }
.strength-text.s2 { color: var(--color-warning); }
.strength-text.s1 { color: var(--color-danger); }

.form-error {
  padding: 9px 13px;
  border-radius: var(--radius-sm);
  background: #fdeaea;
  color: #b02020;
  font-size: 13px;
}

.form-ok {
  padding: 9px 13px;
  border-radius: var(--radius-sm);
  background: #e7f8f0;
  color: #0a7d5a;
  font-size: 13px;
}

.form-actions {
  display: flex;
  gap: 10px;
}
</style>
