<script setup lang="ts">
import { onMounted, ref } from 'vue'

interface Props {
  targetUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
  targetUrl: '/'
})

const progress = ref(0)

onMounted(() => {
  // 保存当前页面的 title
  const originalTitle = document.title

  // 进度条动画
  let value = 0
  const interval = setInterval(() => {
    value += 10
    progress.value = value
    if (value >= 100) {
      clearInterval(interval)
      setTimeout(() => {
        // 跳转前清除 title 监听
        window.location.href = props.targetUrl
        window.document.title = originalTitle
      }, 500)
    }
  }, 10)
})
</script>

<template>
  <div class="goto-page">
    <div class="loader">
      <div class="spinner"></div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
      <p class="loading-text">加载中 {{ progress }}%</p>
    </div>
  </div>
</template>

<style scoped>
.goto-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loader {
  text-align: center;
  color: white;
}

.spinner {
  width: 60px;
  height: 60px;
  margin: 0 auto 30px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.progress-bar {
  width: 300px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
  margin: 0 auto 20px;
}

.progress-fill {
  height: 100%;
  background: white;
  transition: width 0.02s linear;
  border-radius: 2px;
}

.loading-text {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
  opacity: 0.9;
}
</style>

