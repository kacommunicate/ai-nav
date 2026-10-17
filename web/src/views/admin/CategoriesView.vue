<template>
  <div class="categories-admin">
    <div class="page-head">
      <div>
        <h1 class="page-title">分类管理</h1>
        <p class="page-desc">管理工具分类，排序值越大越靠前</p>
      </div>
      <button class="btn btn-primary" @click="openCreate">➕ 添加分类</button>
    </div>

    <div class="table-card card">
      <div v-if="loading" class="loading-state"><div class="spinner"></div></div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th style="width: 60px">排序</th>
            <th>分类</th>
            <th>Slug</th>
            <th>简介</th>
            <th class="th-num">工具数</th>
            <th>状态</th>
            <th class="th-ops">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cat in categories" :key="cat.id">
            <td>
              <input
                type="number"
                class="sort-input"
                :value="cat.sortOrder"
                @change="updateSort(cat, $event)"
              />
            </td>
            <td>
              <div class="cat-cell">
                <span class="cat-ico" :style="{ background: hexToRgba(cat.color, 0.14) }">{{ cat.icon || '📁' }}</span>
                <span class="cat-name">{{ cat.name }}</span>
              </div>
            </td>
            <td><code class="slug-code">{{ cat.slug }}</code></td>
            <td class="cell-desc">{{ cat.description || '-' }}</td>
            <td class="cell-num">{{ cat.toolCount ?? 0 }}</td>
            <td>
              <span class="status-dot" :class="cat.isActive ? 'status-published' : 'status-offline'"></span>
              {{ cat.isActive ? '启用' : '停用' }}
            </td>
            <td class="cell-ops">
              <button class="btn btn-ghost btn-sm" @click="openEdit(cat)">编辑</button>
              <button class="btn btn-ghost btn-sm" @click="toggleActive(cat)">
                {{ cat.isActive ? '停用' : '启用' }}
              </button>
              <button class="btn btn-ghost btn-sm danger" @click="remove(cat)">删除</button>
            </td>
          </tr>
          <tr v-if="!categories.length">
            <td colspan="7" class="empty-state">
              <div class="empty-icon">🗂</div>
              <p>暂无分类</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="showForm" class="modal-mask" @click.self="showForm = false">
      <div class="modal card">
        <div class="modal-head">
          <h2 class="modal-title">{{ editing ? '编辑分类' : '添加分类' }}</h2>
          <button class="modal-close" @click="showForm = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-item">
              <label class="form-label required">名称</label>
              <input v-model="form.name" type="text" class="input" placeholder="如 AI 绘画" />
            </div>
            <div class="form-item">
              <label class="form-label required">Slug</label>
              <input v-model="form.slug" type="text" class="input" placeholder="如 image（英文，用于 URL）" />
            </div>
            <div class="form-item">
              <label class="form-label">图标</label>
              <input v-model="form.icon" type="text" class="input" placeholder="Emoji，如 🎨" maxlength="4" />
            </div>
            <div class="form-item">
              <label class="form-label">主题色</label>
              <div class="color-wrap">
                <input v-model="form.color" type="color" class="color-input" />
                <input v-model="form.color" type="text" class="input color-text" />
              </div>
            </div>
          </div>
          <div class="form-item">
            <label class="form-label">排序值</label>
            <input v-model.number="form.sortOrder" type="number" class="input" placeholder="越大越靠前" />
          </div>
          <div class="form-item">
            <label class="form-label">简介</label>
            <textarea v-model="form.description" class="textarea" rows="2" placeholder="一句话描述这个分类"></textarea>
          </div>
          <label class="check-item">
            <input v-model="form.isActive" type="checkbox" />
            <span>启用该分类（前台可见）</span>
          </label>
          <p v-if="formError" class="form-error">{{ formError }}</p>
        </div>
        <div class="modal-foot">
          <button class="btn btn-outline" @click="showForm = false">取消</button>
          <button class="btn btn-primary" :disabled="saving" @click="save">
            {{ saving ? '保存中…' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { api } from '@/api';
import { useSiteStore } from '@/stores/site';
import type { Category } from '@/types';

const site = useSiteStore();
const categories = ref<Category[]>([]);
const loading = ref(true);
const showForm = ref(false);
const saving = ref(false);
const formError = ref('');
const editing = ref<Category | null>(null);

const form = reactive({
  name: '',
  slug: '',
  description: '',
  icon: '',
  color: '#6366f1',
  sortOrder: 0,
  isActive: true,
});

function hexToRgba(hex: string, alpha: number): string {
  const h = (hex || '#6366f1').replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16) || 99;
  const g = parseInt(full.slice(2, 4), 16) || 102;
  const b = parseInt(full.slice(4, 6), 16) || 241;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

async function load() {
  loading.value = true;
  try {
    categories.value = await api.adminCategories();
  } catch (e) {
    console.warn(e);
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editing.value = null;
  Object.assign(form, {
    name: '',
    slug: '',
    description: '',
    icon: '',
    color: '#6366f1',
    sortOrder: 0,
    isActive: true,
  });
  formError.value = '';
  showForm.value = true;
}

function openEdit(cat: Category) {
  editing.value = cat;
  Object.assign(form, {
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    icon: cat.icon,
    color: cat.color,
    sortOrder: cat.sortOrder,
    isActive: cat.isActive,
  });
  formError.value = '';
  showForm.value = true;
}

async function save() {
  formError.value = '';
  if (!form.name.trim()) return (formError.value = '请填写名称');
  if (!form.slug.trim()) return (formError.value = '请填写 Slug');

  saving.value = true;
  try {
    if (editing.value) {
      await api.updateCategory(editing.value.id, { ...form });
    } else {
      await api.createCategory({ ...form });
    }
    showForm.value = false;
    await load();
    await site.loadAll();
  } catch (e) {
    formError.value = (e as Error).message;
  } finally {
    saving.value = false;
  }
}

async function updateSort(cat: Category, e: Event) {
  const val = Number((e.target as HTMLInputElement).value);
  if (Number.isNaN(val) || val === cat.sortOrder) return;
  try {
    await api.sortCategories([{ id: cat.id, sortOrder: val }]);
    await load();
    await site.loadAll();
  } catch (err) {
    console.warn(err);
  }
}

async function toggleActive(cat: Category) {
  try {
    await api.updateCategory(cat.id, { isActive: !cat.isActive });
    await load();
    await site.loadAll();
  } catch (e) {
    alert((e as Error).message);
  }
}

async function remove(cat: Category) {
  if (!confirm(`确定删除分类「${cat.name}」？`)) return;
  try {
    await api.deleteCategory(cat.id);
    await load();
    await site.loadAll();
  } catch (e) {
    alert((e as Error).message);
  }
}

onMounted(load);
</script>

<style scoped>
.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

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

.th-num {
  text-align: center;
}

.th-ops {
  width: 190px;
}

.cell-num {
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.cell-desc {
  max-width: 240px;
  color: var(--color-text-secondary);
}

.cat-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cat-ico {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  font-size: 16px;
  flex-shrink: 0;
}

.cat-name {
  font-weight: 500;
}

.slug-code {
  padding: 2px 7px;
  border-radius: 5px;
  background: var(--color-bg);
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.status-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: middle;
}

.status-published { background: var(--color-success); }
.status-offline { background: #c0c4d4; }

.sort-input {
  width: 62px;
  height: 28px;
  padding: 0 6px;
  text-align: center;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
}

.cell-ops {
  white-space: nowrap;
}

.btn-ghost.danger {
  color: var(--color-danger);
}

.btn-ghost.danger:hover {
  background: #fdeaea;
}

/* ---------- 弹窗 ---------- */

.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgb(20 24 45 / 45%);
  backdrop-filter: blur(2px);
  animation: fade-in 0.15s;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

.modal {
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
}

.modal-close {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  font-size: 14px;
}

.modal-close:hover {
  background: var(--color-bg);
}

.modal-body {
  padding: 22px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
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

.color-wrap {
  display: flex;
  gap: 8px;
  align-items: center;
}

.color-input {
  width: 38px;
  height: 38px;
  padding: 2px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  cursor: pointer;
  flex-shrink: 0;
}

.color-text {
  flex: 1;
  font-family: ui-monospace, monospace;
  font-size: 13px;
}

.check-item {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.check-item input {
  accent-color: var(--color-primary);
}

.form-error {
  padding: 9px 13px;
  border-radius: var(--radius-sm);
  background: #fdeaea;
  color: #b02020;
  font-size: 13px;
}

.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 22px;
  border-top: 1px solid var(--color-border);
}

@media (max-width: 700px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
