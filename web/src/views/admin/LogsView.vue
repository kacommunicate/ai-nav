<template>
  <div class="logs-admin">
    <h1 class="page-title">操作日志</h1>
    <p class="page-desc">记录后台的关键操作，便于追溯</p>

    <div class="table-card card">
      <div v-if="loading" class="loading-state"><div class="spinner"></div></div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th style="width: 150px">时间</th>
            <th>操作人</th>
            <th style="width: 90px">动作</th>
            <th style="width: 90px">对象</th>
            <th>详情</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id">
            <td class="cell-time">{{ formatTime(log.createdAt) }}</td>
            <td>
              <div class="user-cell">
                <span class="user-avatar">{{ (log.user?.displayName || log.user?.username || '系').charAt(0) }}</span>
                <span>{{ log.user?.displayName || log.user?.username || '系统' }}</span>
              </div>
            </td>
            <td><span class="badge" :class="actionClass(log.action)">{{ actionLabel(log.action) }}</span></td>
            <td><code class="entity-code">{{ log.entity }}</code></td>
            <td class="cell-detail">{{ log.detail || '-' }}</td>
          </tr>
          <tr v-if="!logs.length">
            <td colspan="5" class="empty-state">
              <div class="empty-icon">📜</div>
              <p>暂无操作记录</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="totalPages > 1" class="pagination">
      <button class="btn btn-outline btn-sm" :disabled="page === 1" @click="goPage(page - 1)">上一页</button>
      <span class="page-info">第 {{ page }} / {{ totalPages }} 页 · 共 {{ total }} 条</span>
      <button class="btn btn-outline btn-sm" :disabled="page === totalPages" @click="goPage(page + 1)">下一页</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { api } from '@/api';
import type { AuditLog } from '@/types';

const logs = ref<AuditLog[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 30;
const loading = ref(true);

const totalPages = computed(() => Math.ceil(total.value / pageSize));

const actionLabels: Record<string, string> = {
  create: '创建',
  update: '更新',
  delete: '删除',
  sort: '排序',
  login: '登录',
};

function actionLabel(a: string) {
  return actionLabels[a] || a;
}

function actionClass(a: string): string {
  const map: Record<string, string> = {
    create: 'badge-free',
    update: 'badge-zh',
    delete: 'badge-paid',
    sort: 'badge-freemium',
    login: 'badge-trial',
  };
  return map[a] || 'badge-cat';
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function load() {
  loading.value = true;
  try {
    const res = await api.auditLogs(page.value, pageSize);
    logs.value = res.items;
    total.value = res.total;
  } catch (e) {
    console.warn(e);
  } finally {
    loading.value = false;
  }
}

function goPage(p: number) {
  page.value = p;
  load();
}

onMounted(load);
</script>

<style scoped>
.table-card {
  overflow: hidden;
}

.loading-state {
  display: grid;
  place-items: center;
  padding: 80px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th {
  padding: 12px 14px;
  text-align: left;
  font-weight: 600;
  font-size: 12px;
  color: var(--color-text-muted);
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}

.data-table td {
  padding: 11px 14px;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.data-table tbody tr:hover {
  background: #fbfbfe;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.cell-time {
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.cell-detail {
  max-width: 320px;
  color: var(--color-text-secondary);
  word-break: break-all;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.badge-cat {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.entity-code {
  padding: 2px 7px;
  border-radius: 5px;
  background: var(--color-bg);
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 18px;
}

.page-info {
  font-size: 13px;
  color: var(--color-text-muted);
}
</style>
