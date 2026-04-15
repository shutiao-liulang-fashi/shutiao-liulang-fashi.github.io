<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

interface Props {
  targetUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
  targetUrl: '/'
})

const router = useRouter()
const loadingStatus = ref('加载中...')

onMounted(() => {
  // 保存当前页面的 title
  const originalTitle = document.title
  // 安全超时：如果加载太慢，强制跳转
  setTimeout(() => {
    loadingStatus.value = '发呆中...'
    setTimeout(() => {
      router.push(props.targetUrl)
      window.document.title = originalTitle
    }, 300)
  }, 2000) // 2 秒自动跳转
})
</script>

<template>
  <div class="goto-page">
    <div class="loader">
      <div class="quote">
        <span class="word">The</span>
        <span class="word">world</span>
        <span class="word">is</span>
        <span class="word">not</span>
        <span class="word">beautiful.</span>
        <br>
        <span class="word">Therefore,</span>
        <span class="word">it</span>
        <span class="word">is.</span>
        <br>
        <span class="author">-《奇诺之旅》</span>
      </div>
      <p class="loading-text">{{ loadingStatus }}</p>
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
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loader {
  text-align: center;
  color: #333;
  padding: 40px;
  user-select: none; /* 禁止所有文字选中 */
}

.quote {
  font-size: 28px;
  font-weight: 400;
  color: #555;
  margin-bottom: 40px;
  line-height: 1.8;
  letter-spacing: 0.5px;
  user-select: none; /* 禁止文字选中 */
}

.word {
  display: inline-block;
  animation: bounce 0.6s ease-in-out infinite;
  margin-right: 8px; /* 单词之间的微小间隔 */
}

.word:last-child {
  margin-right: 0; /* 最后一个单词不需要右边距 */
}

.word:nth-child(1) { animation-delay: 0s; }
.word:nth-child(2) { animation-delay: 0.1s; }
.word:nth-child(3) { animation-delay: 0.2s; }
.word:nth-child(4) { animation-delay: 0.3s; }
.word:nth-child(5) { animation-delay: 0.4s; }
.word:nth-child(6) { animation-delay: 0.5s; }
.word:nth-child(7) { animation-delay: 0.6s; }
.word:nth-child(8) { animation-delay: 0.7s; }

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.author {
  font-size: 24px;
  color: #888;
  font-style: italic;
  display: block;
  animation: none;
}

.loading-text {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
  color: #666;
  user-select: none; /* 禁止文字选中 */
}
</style>

