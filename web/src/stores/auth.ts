import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api, tokenStore } from '@/api';
import type { AuthUser } from '@/types';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null);
  const initialized = ref(false);

  async function bootstrap() {
    if (initialized.value) return;
    initialized.value = true;
    if (!tokenStore.get()) return;
    try {
      user.value = await api.me();
    } catch {
      tokenStore.clear();
    }
  }

  async function login(username: string, password: string) {
    const res = await api.login(username, password);
    tokenStore.set(res.accessToken);
    user.value = res.user;
    return res.user;
  }

  function logout() {
    tokenStore.clear();
    user.value = null;
  }

  return { user, initialized, bootstrap, login, logout };
});
