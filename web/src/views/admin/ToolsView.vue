<template>
  <div class="tools-admin">
    <div class="page-head">
      <div>
        <h1 class="page-title">工具管理</h1>
        <p class="page-desc">共 {{ total }} 个工具，可新增、编辑、排序与导入</p>
      </div>
      <div class="head-actions">
        <button class="btn btn-outline" @click="showImport = true">📥 批量导入</button>
        <button class="btn btn-primary" @click="openCreate">➕ 添加工具</button>
      </div>
    </div>

    <!-- 筛选 -->
    <div class="filter-bar card">
      <input v-model="filters.keyword" type="text" class="input search-input" placeholder="搜索名称/链接/简介…" @keyup.enter="load" />
      <select v-model="filters.status" class="select" @change="resetAndLoad">
        <option value="">全部状态</option>
        <option value="PUBLISHED">已发布</option>
        <option value="PENDING">待审核</option>
        <option value="OFFLINE">已下架</option>
      </select>
      <select v-model="filters.categoryId" class="select" @change="resetAndLoad">
        <option value="">全部分类</option>
        <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
      <select v-model="filters.featured" class="select" @change="resetAndLoad">
        <option value="">推荐/普通</option>
        <option value="true">仅推荐</option>
        <option value="false">仅普通</option>
      </select>
      <select v-model="filters.sort" class="select" @change="resetAndLoad">
        <option value="sortOrder">按排序值</option>
        <option value="newest">最新创建</option>
        <option value="popular">访问最多</option>
        <option value="name">名称</option>
      </select>
      <button class="btn btn-outline btn-sm" @click="load">查询</button>
    </div>

    <!-- 批量操作 -->
    <div v-if="selected.length" class="bulk-bar">
      <span>已选择 {{ selected.length }} 项</span>
      <button class="btn btn-outline btn-sm" @click="bulkStatus('PUBLISHED')">批量发布</button>
      <button class="btn btn-outline btn-sm" @click="bulkStatus('OFFLINE')">批量下架</button>
      <button class="btn btn-danger btn-sm" @click="bulkDelete">批量删除</button>
      <button class="btn btn-ghost btn-sm" @click="selected = []">取消</button>
    </div>

    <!-- 表格 -->
    <div class="table-card card">
      <div v-if="loading" class="loading-state"><div class="spinner"></div></div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th class="th-check"><input type="checkbox" :checked="allChecked" @change="toggleAll" /></th>
            <th style="width: 46px">#</th>
            <th class="th-tool">工具</th>
            <th>分类</th>
            <th>价格</th>
            <th class="th-num">访问</th>
            <th class="th-num">排序</th>
            <th>状态</th>
            <th class="th-ops">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(tool, i) in tools" :key="tool.id" :class="{ 'row-offline': tool.status === 'OFFLINE' }">
            <td><input type="checkbox" :checked="selected.includes(tool.id)" @change="toggleOne(tool.id)" /></td>
            <td class="cell-idx">{{ (page - 1) * pageSize + i + 1 }}</td>
            <td>
              <div class="tool-cell">
                <span class="tool-mini-logo" :style="logoStyle(tool)">{{ tool.name.charAt(0).toUpperCase() }}</span>
                <div class="tool-cell-info">
                  <span class="tool-cell-name">
                    {{ tool.name }}
                    <span v-if="tool.featured" class="mini-star" title="推荐">★</span>
                  </span>
                  <span class="tool-cell-url">{{ displayUrl(tool) }}</span>
                </div>
              </div>
            </td>
            <td><span class="badge badge-cat">{{ tool.category?.name || '-' }}</span></td>
            <td><span class="badge" :class="`badge-${tool.pricing.toLowerCase()}`">{{ pricingLabel(tool.pricing) }}</span></td>
            <td class="cell-num">{{ tool.clicks }}</td>
            <td class="cell-num">
              <input
                type="number"
                class="sort-input"
                :value="tool.sortOrder"
                @change="updateSort(tool, $event)"
              />
            </td>
            <td>
              <span class="status-dot" :class="`status-${tool.status.toLowerCase()}`"></span>
              {{ statusLabel(tool.status) }}
            </td>
            <td class="cell-ops">
              <button class="btn btn-ghost btn-sm" @click="openEdit(tool)">编辑</button>
              <button class="btn btn-ghost btn-sm" @click="toggleFeatured(tool)">
                {{ tool.featured ? '取消推荐' : '推荐' }}
              </button>
              <button class="btn btn-ghost btn-sm danger" @click="remove(tool)">删除</button>
            </td>
          </tr>
          <tr v-if="!tools.length">
            <td colspan="9" class="empty-state">
              <div class="empty-icon">📦</div>
              <p>暂无数据，点击右上角「添加工具」开始</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="pagination">
      <button class="btn btn-outline btn-sm" :disabled="page === 1" @click="goPage(page - 1)">上一页</button>
      <span class="page-info">第 {{ page }} / {{ totalPages }} 页 · 共 {{ total }} 条</span>
      <button class="btn btn-outline btn-sm" :disabled="page === totalPages" @click="goPage(page + 1)">下一页</button>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="showForm" class="modal-mask" @click.self="showForm = false">
      <div class="modal card">
        <div class="modal-head">
          <h2 class="modal-title">{{ editing ? '编辑工具' : '添加工具' }}</h2>
          <button class="modal-close" @click="showForm = false">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-grid">
            <div class="form-item">
              <label class="form-label required">名称</label>
              <input v-model="form.name" type="text" class="input" placeholder="如 ChatGPT" />
            </div>
            <div class="form-item">
              <label class="form-label required">链接</label>
              <input v-model="form.url" type="text" class="input" placeholder="https://…" />
            </div>
            <div class="form-item">
              <label class="form-label required">分类</label>
              <select v-model="form.categoryId" class="select">
                <option value="">请选择分类</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.icon }} {{ c.name }}</option>
              </select>
            </div>
            <div class="form-item">
              <label class="form-label">图标地址</label>
              <input v-model="form.logo" type="text" class="input" placeholder="留空则自动生成首字母图标" />
            </div>
            <div class="form-item">
              <label class="form-label">价格模式</label>
              <select v-model="form.pricing" class="select">
                <option value="FREE">免费</option>
                <option value="FREEMIUM">免费增值</option>
                <option value="PAID">付费</option>
                <option value="TRIAL">试用</option>
              </select>
            </div>
            <div class="form-item">
              <label class="form-label">排序值</label>
              <input v-model.number="form.sortOrder" type="number" class="input" placeholder="越大越靠前" />
            </div>
          </div>

          <div class="form-item">
            <label class="form-label required">简介</label>
            <textarea v-model="form.description" class="textarea" rows="3" placeholder="用一两句话说明这个工具能做什么…"></textarea>
          </div>

          <div class="form-item">
            <label class="form-label">标签</label>
            <div class="tag-editor">
              <span v-for="(t, i) in form.tags" :key="i" class="tag-chip editable">
                {{ t }}
                <button type="button" class="tag-remove" @click="form.tags.splice(i, 1)">✕</button>
              </span>
              <input
                ref="tagInputEl"
                :value="tagInput"
                type="text"
                class="tag-input"
                placeholder="输入后回车添加"
                @input="tagInput = ($event.target as HTMLInputElement).value"
                @keyup.enter.prevent="addTag"
                @blur="addTag"
              />
            </div>
            <div class="tag-suggest">
              <span class="tag-suggest-label">常用：</span>
              <button v-for="t in suggestedTags" :key="t" type="button" class="tag-chip small" @click="pushTag(t)">
                + {{ t }}
              </button>
            </div>
          </div>

          <div class="form-checks">
            <label class="check-item">
              <input v-model="form.featured" type="checkbox" />
              <span>设为推荐（首页突出展示）</span>
            </label>
            <label class="check-item">
              <input v-model="form.zhSupport" type="checkbox" />
              <span>支持中文</span>
            </label>
            <label class="check-item">
              <input v-model="form.needsVpn" type="checkbox" />
              <span>需要额外网络环境</span>
            </label>
          </div>

          <div v-if="editing" class="form-item">
            <label class="form-label">状态</label>
            <select v-model="form.status" class="select">
              <option value="PUBLISHED">已发布</option>
              <option value="PENDING">待审核</option>
              <option value="OFFLINE">已下架</option>
            </select>
          </div>

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

    <!-- 导入弹窗 -->
    <div v-if="showImport" class="modal-mask" @click.self="showImport = false">
      <div class="modal card">
        <div class="modal-head">
          <h2 class="modal-title">批量导入</h2>
          <button class="modal-close" @click="showImport = false">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-tip">
            粘贴 JSON 数组，每个元素需包含 <code>name</code>、<code>url</code>、<code>categoryId</code>、<code>description</code>，
            可选 <code>tags</code>、<code>pricing</code>、<code>featured</code> 等字段。
          </p>
          <textarea v-model="importText" class="textarea" rows="12" placeholder='[{"name":"示例","url":"https://example.com","categoryId":"分类ID","description":"简介","tags":["标签"]}]'></textarea>
          <div v-if="importResult" class="import-result" :class="{ 'has-error': importResult.errors.length }">
            <p><strong>成功 {{ importResult.created }} 个</strong>，跳过 {{ importResult.skipped }} 个</p>
            <ul v-if="importResult.errors.length" class="import-errors">
              <li v-for="(e, i) in importResult.errors.slice(0, 8)" :key="i">{{ e }}</li>
            </ul>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-outline" @click="showImport = false">关闭</button>
          <button class="btn btn-primary" :disabled="importing" @click="doImport">
            {{ importing ? '导入中…' : '开始导入' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '@/api';
import { useSiteStore } from '@/stores/site';
import type { Category, Pricing, Tool, ToolStatus } from '@/types';

const route = useRoute();
const site = useSiteStore();

const tools = ref<Tool[]>([]);
const categories = ref<Category[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 20;
const loading = ref(true);

const filters = reactive({
  keyword: '',
  status: '',
  categoryId: '',
  featured: '',
  sort: 'sortOrder',
});

const selected = ref<string[]>([]);
const showForm = ref(false);
const saving = ref(false);
const formError = ref('');
const editing = ref<Tool | null>(null);
const tagInput = ref('');
const suggestedTags = ['国产', '免费', '开源', '多模态', '中文', '聚合', '文生图', '文生视频'];

const showImport = ref(false);
const importText = ref('');
const importing = ref(false);
const importResult = ref<{ created: number; skipped: number; errors: string[] } | null>(null);

const form = reactive({
  name: '',
  url: '',
  categoryId: '',
  description: '',
  logo: '',
  pricing: 'FREE' as Pricing,
  sortOrder: 0,
  featured: false,
  zhSupport: false,
  needsVpn: false,
  status: 'PUBLISHED' as ToolStatus,
  tags: [] as string[],
});

const totalPages = computed(() => Math.ceil(total.value / pageSize));
const allChecked = computed(() => tools.value.length > 0 && selected.value.length === tools.value.length);

const pricingLabels: Record<string, string> = {
  FREE: '免费',
  FREEMIUM: '免费增值',
  PAID: '付费',
  TRIAL: '试用',
};

const statusLabels: Record<string, string> = {
  PUBLISHED: '已发布',
  PENDING: '待审核',
  OFFLINE: '已下架',
};

function pricingLabel(v: string) {
  return pricingLabels[v] || v;
}

function statusLabel(v: string) {
  return statusLabels[v] || v;
}

function displayUrl(tool: Tool) {
  return tool.url.replace(/^https?:\/\//, '').slice(0, 40);
}

function logoStyle(tool: Tool) {
  if (tool.logo) return { background: 'transparent' };
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9'];
  return { background: colors[tool.name.charCodeAt(0) % colors.length] };
}

async function load() {
  loading.value = true;
  try {
    const res = await api.adminTools({
      keyword: filters.keyword || undefined,
      status: (filters.status || undefined) as ToolStatus | undefined,
      categoryId: filters.categoryId || undefined,
      featured: filters.featured === '' ? undefined : filters.featured === 'true',
      sort: filters.sort as any,
      page: page.value,
      pageSize,
    });
    tools.value = res.items;
    total.value = res.total;
    selected.value = [];
  } catch (e) {
    console.warn(e);
  } finally {
    loading.value = false;
  }
}

function resetAndLoad() {
  page.value = 1;
  load();
}

function goPage(p: number) {
  page.value = p;
  load();
}

function toggleAll() {
  selected.value = allChecked.value ? [] : tools.value.map((t) => t.id);
}

function toggleOne(id: string) {
  selected.value = selected.value.includes(id)
    ? selected.value.filter((x) => x !== id)
    : [...selected.value, id];
}

// ---------------- 表单 ----------------

function resetForm() {
  Object.assign(form, {
    name: '',
    url: '',
    categoryId: '',
    description: '',
    logo: '',
    pricing: 'FREE',
    sortOrder: 0,
    featured: false,
    zhSupport: false,
    needsVpn: false,
    status: 'PUBLISHED',
    tags: [],
  });
  formError.value = '';
  tagInput.value = '';
}

function openCreate() {
  editing.value = null;
  resetForm();
  showForm.value = true;
}

function openEdit(tool: Tool) {
  editing.value = tool;
  Object.assign(form, {
    name: tool.name,
    url: tool.url,
    categoryId: tool.categoryId,
    description: tool.description,
    logo: tool.logo,
    pricing: tool.pricing,
    sortOrder: tool.sortOrder,
    featured: tool.featured,
    zhSupport: tool.zhSupport,
    needsVpn: tool.needsVpn,
    status: tool.status,
    tags: (tool.tags || []).map((t) => t.name),
  });
  formError.value = '';
  showForm.value = true;
}

function addTag() {
  const v = tagInput.value.trim();
  if (v && !form.tags.includes(v)) form.tags.push(v);
  tagInput.value = '';
}

function pushTag(name: string) {
  if (!form.tags.includes(name)) form.tags.push(name);
}

async function save() {
  formError.value = '';
  if (!form.name.trim()) return (formError.value = '请填写名称');
  if (!form.url.trim()) return (formError.value = '请填写链接');
  if (!form.categoryId) return (formError.value = '请选择分类');
  if (!form.description.trim()) return (formError.value = '请填写简介');

  saving.value = true;
  try {
    const payload = { ...form, tags: [...form.tags] };
    if (editing.value) {
      await api.updateTool(editing.value.id, payload);
    } else {
      await api.createTool(payload);
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

async function updateSort(tool: Tool, e: Event) {
  const val = Number((e.target as HTMLInputElement).value);
  if (Number.isNaN(val) || val === tool.sortOrder) return;
  try {
    await api.sortTools([{ id: tool.id, sortOrder: val }]);
    await load();
  } catch (err) {
    console.warn(err);
  }
}

async function toggleFeatured(tool: Tool) {
  try {
    await api.updateTool(tool.id, { featured: !tool.featured });
    await load();
    await site.loadAll();
  } catch (e) {
    console.warn(e);
  }
}

async function remove(tool: Tool) {
  if (!confirm(`确定删除「${tool.name}」？删除后不可恢复。`)) return;
  try {
    await api.deleteTool(tool.id);
    await load();
    await site.loadAll();
  } catch (e) {
    alert((e as Error).message);
  }
}

async function bulkStatus(status: ToolStatus) {
  try {
    await Promise.all(selected.value.map((id) => api.updateTool(id, { status })));
    await load();
    await site.loadAll();
  } catch (e) {
    console.warn(e);
  }
}

async function bulkDelete() {
  if (!confirm(`确定删除选中的 ${selected.value.length} 个工具？`)) return;
  try {
    await Promise.all(selected.value.map((id) => api.deleteTool(id)));
    selected.value = [];
    await load();
    await site.loadAll();
  } catch (e) {
    console.warn(e);
  }
}

// ---------------- 导入 ----------------

async function doImport() {
  importResult.value = null;
  let parsed: any[] = [];
  try {
    parsed = JSON.parse(importText.value);
    if (!Array.isArray(parsed)) throw new Error('顶层必须是数组');
  } catch (e) {
    importResult.value = { created: 0, skipped: 0, errors: [`JSON 解析失败：${(e as Error).message}`] };
    return;
  }

  importing.value = true;
  try {
    importResult.value = await api.importTools(parsed);
    await load();
    await site.loadAll();
  } catch (e) {
    importResult.value = { created: 0, skipped: 0, errors: [(e as Error).message] };
  } finally {
    importing.value = false;
  }
}

onMounted(async () => {
  if (!site.categories.length) await site.loadAll();
  try {
    categories.value = await api.adminCategories();
  } catch (e) {
    console.warn(e);
  }
  await load();

  // 支持从看板「添加工具」直接打开表单
  if (route.query.action === 'create') openCreate();
});
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

.head-actions {
  display: flex;
  gap: 10px;
}

.filter-bar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  padding: 14px 16px;
  margin-bottom: 14px;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.filter-bar .select {
  width: auto;
  min-width: 130px;
}

.bulk-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  margin-bottom: 14px;
  border-radius: var(--radius-md);
  background: var(--color-primary-soft);
  font-size: 13px;
  color: var(--color-primary);
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

.row-offline {
  opacity: 0.55;
}

.th-check {
  width: 36px;
}

.th-num {
  text-align: center;
}

.th-ops {
  width: 200px;
}

.cell-idx {
  color: var(--color-text-muted);
}

.cell-num {
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.tool-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tool-mini-logo {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.tool-cell-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.tool-cell-name {
  font-weight: 500;
}

.mini-star {
  color: #f59e0b;
  margin-left: 4px;
}

.tool-cell-url {
  font-size: 12px;
  color: var(--color-text-muted);
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge-cat {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
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
.status-pending { background: var(--color-warning); }
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
  max-width: 640px;
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
  flex-shrink: 0;
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

.modal-tip {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.7;
}

.modal-tip code {
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--color-bg);
  font-family: ui-monospace, monospace;
  font-size: 12px;
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

.form-checks {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  background: var(--color-bg);
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

.tag-editor {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 6px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 12px;
}

.tag-chip.editable {
  padding-right: 5px;
}

.tag-remove {
  color: inherit;
  opacity: 0.6;
  font-size: 11px;
  line-height: 1;
}

.tag-remove:hover {
  opacity: 1;
}

.tag-chip.small {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  cursor: pointer;
}

.tag-chip.small:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.tag-input {
  flex: 1;
  min-width: 120px;
  height: 26px;
  border: none;
  outline: none;
  font-size: 13px;
  background: transparent;
}

.tag-suggest {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.tag-suggest-label {
  font-size: 12px;
  color: var(--color-text-muted);
}

.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 22px;
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}

.import-result {
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  background: #e7f8f0;
  color: #0a7d5a;
  font-size: 13px;
}

.import-result.has-error {
  background: #fff5e6;
  color: #a35b00;
}

.import-errors {
  margin-top: 6px;
  padding-left: 18px;
  list-style: disc;
  font-size: 12px;
  line-height: 1.7;
}

@media (max-width: 700px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .data-table {
    font-size: 12px;
  }

  .data-table th,
  .data-table td {
    padding: 9px 8px;
  }
}
</style>
