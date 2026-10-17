<template>
  <div class="not-found">
    <div class="container">
      <div class="nf-inner">
        <div class="nf-code">404</div>
        <p class="nf-text">页面不存在或已被移除</p>
        <router-link to="/" class="btn btn-primary">返回首页</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  display: grid;
  place-items: center;
  min-height: 70vh;
}

.nf-inner {
  text-align: center;
}

.nf-code {
  font-size: 72px;
  font-weight: 800;
  background: linear-gradient(135deg, #6366f1, #ec4899);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
}

.nf-text {
  font-size: 15px;
  color: var(--color-text-secondary);
  margin: 16px 0 24px;
}
</style>
