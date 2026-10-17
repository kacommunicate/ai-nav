<template>
  <div class="tags-admin">
    <div class="page-head">
      <div>
        <h1 class="page-title">标签管理</h1>
        <p class="page-desc">共 {{ tags.length }} 个标签，仅显示被使用的标签</p>
      </div>
      <input v-model="keyword" type="text" class="input search" placeholder="搜索标签…" />
    </div>

    <div v-if="loading" class="loading-state"><div class="spinner"></div></div>

    <div v-else-if="filtered.length" class="tag-cloud card">
      <div v-for="tag in filtered" :key="tag.id" class="tag-row">
        <div class="tag-main">
          <span class="tag-hash">#</span>
          <span class="tag-name">{{ tag.name }}</span>
          <span class="tag-count">{{ tag.toolCount }} 个工具</span>
        </div>
        <div class="tag-actions">
          <input
            :value="tag.name"
            class="rename-input"
            @keyup.enter="rename(tag, $event)"
            @blur="onBlurRename(tag, $event)"
          />
          <button class="btn btn-ghost btn-sm danger" @click="remove(tag)">删除</button>
        </div>
      </div>
    </div>

    <div v-else class="card empty-state">
      <div class="empty-icon">🏷</div>
      <p>{{ keyword ? '没有匹配的标签' : '暂无标签，添加工具时会自动创建' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { api } from '@/api';
import type { Tag } from '@/types';

const tags = ref<Tag[]>([]);
const keyword = ref('');
const loading = ref(true);

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return tags.value;
  return tags.value.filter((t) => t.name.toLowerCase().includes(kw));
});

async function load() {
  loading.value = true;
  try {
    tags.value = await api.getTags();
  } catch (e) {
    console.warn(e);
  } finally {
    loading.value = false;
  }
}

async function rename(tag: Tag, e: Event) {
  const input = e.target as HTMLInputElement;
  const val = input.value.trim();
  if (!val || val === tag.name) return;
  try {
    await api.renameTag(tag.id, val);
    await load();
  } catch (err) {
    alert((err as Error).message);
    input.value = tag.name;
  }
}

/** 失焦时若值未变则不做处理；变化时提交（与 enter 去重） */
function onBlurRename(tag: Tag, e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.value.trim() && input.value.trim() !== tag.name) {
    rename(tag, e);
  }
}

async function remove(tag: Tag) {
  if (!confirm(`确定删除标签「${tag.name}」？将从所有工具上移除该标签。`)) return;
  try {
    await api.deleteTag(tag.id);
    await load();
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

.search {
  width: 240px;
}

.loading-state {
  display: grid;
  place-items: center;
  padding: 80px;
}

.tag-cloud {
  padding: 6px 0;
}

.tag-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 18px;
  border-bottom: 1px solid var(--color-border);
}

.tag-row:last-child {
  border-bottom: none;
}

.tag-row:hover {
  background: #fbfbfe;
}

.tag-main {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.tag-hash {
  color: var(--color-primary);
  font-weight: 700;
}

.tag-name {
  font-size: 14px;
  font-weight: 500;
}

.tag-count {
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.tag-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.rename-input {
  width: 160px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  font-size: 13px;
}

.rename-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.btn-ghost.danger {
  color: var(--color-danger);
}

.btn-ghost.danger:hover {
  background: #fdeaea;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: var(--color-text-muted);
}

.empty-icon {
  font-size: 36px;
  margin-bottom: 10px;
}

@media (max-width: 700px) {
  .tag-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .rename-input {
    width: 100%;
  }
}
</style>
