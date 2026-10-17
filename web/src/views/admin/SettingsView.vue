<template>
  <div class="settings-admin">
    <h1 class="page-title">站点设置</h1>
    <p class="page-desc">修改前台站点信息、SEO 与页脚内容</p>

    <div class="settings-grid">
      <!-- 基本信息 -->
      <div class="card settings-card">
        <h2 class="card-title">基本信息</h2>
        <div class="form-item">
          <label class="form-label">站点名称</label>
          <input v-model="form.siteName" type="text" class="input" placeholder="AI 导航" />
        </div>
        <div class="form-item">
          <label class="form-label">站点描述</label>
          <textarea v-model="form.description" class="textarea" rows="2" placeholder="显示在首页与页脚"></textarea>
        </div>
        <div class="form-item">
          <label class="form-label">首页公告</label>
          <textarea v-model="form.notice" class="textarea" rows="2" placeholder="显示在导航栏下方的公告条，留空则不显示"></textarea>
        </div>
        <div class="form-item">
          <label class="form-label">Logo 地址</label>
          <input v-model="form.logo" type="text" class="input" placeholder="留空使用默认文字 Logo" />
        </div>
      </div>

      <!-- SEO 与页脚 -->
      <div class="card settings-card">
        <h2 class="card-title">SEO 与页脚</h2>
        <div class="form-item">
          <label class="form-label">关键词（keywords）</label>
          <input v-model="form.keywords" type="text" class="input" placeholder="AI工具,AI导航,人工智能" />
          <p class="form-hint">多个关键词用英文逗号分隔</p>
        </div>
        <div class="form-item">
          <label class="form-label">ICP 备案号</label>
          <input v-model="form.icp" type="text" class="input" placeholder="如 京ICP备12345678号，留空则不显示" />
        </div>
        <div class="form-item">
          <label class="form-label">页脚自定义文字</label>
          <input v-model="form.footerText" type="text" class="input" placeholder="如 本站仅收录工具，不提供任何担保" />
        </div>
      </div>
    </div>

    <!-- 预览 -->
    <div class="card preview-card">
      <h2 class="card-title">效果预览</h2>
      <div class="preview-box">
        <div class="preview-logo">
          <span class="preview-mark">{{ (form.siteName || 'A').charAt(0).toUpperCase() }}</span>
          <span class="preview-name">{{ form.siteName || '站点名称' }}</span>
        </div>
        <p class="preview-desc">{{ form.description || '站点描述' }}</p>
        <p v-if="form.notice" class="preview-notice">📢 {{ form.notice }}</p>
        <div class="preview-footer">
          <span>{{ form.footerText || '页脚文字' }}</span>
          <span v-if="form.icp" class="preview-icp">{{ form.icp }}</span>
        </div>
      </div>
    </div>

    <div class="settings-actions">
      <button class="btn btn-primary" :disabled="saving" @click="save">{{ saving ? '保存中…' : '保存设置' }}</button>
      <button class="btn btn-outline" @click="load">重置</button>
      <span v-if="saved" class="save-ok">✓ 已保存</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { api } from '@/api';
import { useSiteStore } from '@/stores/site';
import type { SiteSetting } from '@/types';

const site = useSiteStore();
const saving = ref(false);
const saved = ref(false);

const form = reactive({
  siteName: '',
  description: '',
  keywords: '',
  logo: '',
  icp: '',
  footerText: '',
  notice: '',
});

async function load() {
  try {
    const s = await api.getSettings();
    Object.assign(form, {
      siteName: s.siteName,
      description: s.description,
      keywords: s.keywords,
      logo: s.logo,
      icp: s.icp,
      footerText: s.footerText,
      notice: s.notice,
    });
  } catch (e) {
    console.warn(e);
  }
}

async function save() {
  saving.value = true;
  saved.value = false;
  try {
    await api.updateSettings({ ...form });
    await site.loadAll();
    saved.value = true;
    setTimeout(() => (saved.value = false), 2500);
  } catch (e) {
    alert((e as Error).message);
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.settings-card {
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
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

.form-hint {
  font-size: 12px;
  color: var(--color-text-muted);
}

.preview-card {
  padding: 22px;
  margin-bottom: 18px;
}

.preview-box {
  margin-top: 14px;
  padding: 22px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
}

.preview-logo {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 8px;
}

.preview-mark {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 13px;
  font-weight: 800;
}

.preview-name {
  font-size: 16px;
  font-weight: 700;
}

.preview-desc {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.preview-notice {
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  background: #eef0ff;
  font-size: 12px;
  color: var(--color-primary);
}

.preview-footer {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
  font-size: 12px;
  color: var(--color-text-muted);
}

.settings-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.save-ok {
  font-size: 13px;
  color: var(--color-success);
  font-weight: 500;
}

@media (max-width: 900px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>
