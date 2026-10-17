<template>
  <div class="about-page">
    <div class="container narrow">
      <h1 class="page-title">关于本站</h1>

      <div class="card about-card">
        <h2 class="about-title">🎯 我们做什么</h2>
        <p>
          AI 导航是一个专注于收录优质 AI 工具的导航网站。我们从海量 AI 应用中筛选出真正好用的产品，
          按用途分类整理，帮助你快速找到适合自己需求的工具。
        </p>
        <p>
          无论你是想用 AI 辅助写作、绘画、编程，还是想了解最新的 AI 视频与音频技术，
          这里都能帮你节省大量的搜索时间。
        </p>
      </div>

      <div class="card about-card">
        <h2 class="about-title">📊 收录标准</h2>
        <ul class="about-list">
          <li><strong>实用性</strong>：真正能解决具体问题，而非概念演示</li>
          <li><strong>可访问性</strong>：标注是否需要额外网络环境，国内可直接访问的会特别说明</li>
          <li><strong>价格透明</strong>：明确标注免费、免费增值、付费或试用</li>
          <li><strong>信息准确</strong>：简介与链接经过人工核对</li>
        </ul>
      </div>

      <div class="card about-card">
        <h2 class="about-title">🗂 分类说明</h2>
        <div class="about-cats">
          <div v-for="cat in categories" :key="cat.id" class="about-cat">
            <span class="about-cat-icon">{{ cat.icon }}</span>
            <div>
              <div class="about-cat-name">{{ cat.name }}</div>
              <div class="about-cat-desc">{{ cat.description }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card about-card">
        <h2 class="about-title">📮 反馈与建议</h2>
        <p>
          如果你发现了更好用的 AI 工具，或者发现本站信息有误，欢迎通过页脚的联系方式告知我们，
          我们会尽快核实并更新。
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useSiteStore } from '@/stores/site';

const site = useSiteStore();
const categories = computed(() => site.categories);

onMounted(() => {
  if (!site.categories.length) site.loadAll();
});
</script>

<style scoped>
.about-page {
  padding: 32px 0 40px;
}

.narrow {
  max-width: 820px;
}

.about-card {
  padding: 24px 28px;
  margin-bottom: 16px;
}

.about-title {
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 12px;
}

.about-card p {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.8;
  margin-bottom: 10px;
}

.about-card p:last-child {
  margin-bottom: 0;
}

.about-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.about-list li {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.7;
  padding-left: 18px;
  position: relative;
}

.about-list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--color-success);
  font-weight: 700;
}

.about-cats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.about-cat {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: var(--color-bg);
}

.about-cat-icon {
  font-size: 20px;
  line-height: 1.2;
}

.about-cat-name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 2px;
}

.about-cat-desc {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.6;
}
</style>
