<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as ABCJS from "abcjs"

interface Props {
  /** ABC 记谱法字符串 */
  abcStr: string
  /** 渲染选项 */
  options?: ABCJS.RenderOptions
  /** 是否显示标题 */
  showTitle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
options: () => ({
    responsive: "resize",
    scale: 1.0,
    paddingtop: 10,
    paddingbottom: 10,
    paddingleft: 10,
    paddingright: 10,
  }),
  showTitle: false,
})

const abcContainer = ref<HTMLDivElement | null>(null)
// abcjs 加载状态
const loading = ref(true)
// 错误状态
const error = ref<string | null>(null)

/**
 * 处理 ABC 字符串，根据 showTitle 选项控制标题显示
 */
function processAbcString(abcStr: string): string {
  if (props.showTitle) {
    return abcStr
  }

  // 移除标题行 (T:)
  const lines = abcStr.split('\n')
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim()
    return !trimmed.startsWith('T:')
  })

  return filteredLines.join('\n')
}

/**
 * 渲染 ABC 记谱法
 */
async function renderAbc() {
  console.log('Rendering ABC notation:', props.abcStr)
  if (!abcContainer.value || !props.abcStr) {
    return
  }
  try {
    // 清空容器
    abcContainer.value.innerHTML = ''

    // 处理 ABC 字符串
    const processedAbcStr = processAbcString(props.abcStr)

    // 等待一帧，确保容器已经渲染
    await new Promise(resolve => requestAnimationFrame(resolve))

    // 获取容器宽度
    const containerWidth = abcContainer.value.clientWidth || 800

    // 合并选项
    const renderOptions: ABCJS.RenderOptions = {
      responsive: "resize",
      scale: 1.0,
      paddingtop: 10,
      paddingbottom: 10,
      paddingleft: 20,
      paddingright: 20,
      stretchlast: false, // 不拉伸最后一行
      staffwidth: Math.max(containerWidth - 40, 400),
      wrap: {
        minSpacing: 1.0,     // 最小间距
        maxSpacing: 1.6,     // 超过此值会换行
        preferredMeasuresPerLine: 4, // 每行首选 4 个小节
      },
      ...props.options,
    }

    console.log('Container width:', containerWidth)

    // 使用 abcjs 渲染
    ABCJS.renderAbc(abcContainer.value, processedAbcStr, renderOptions)

    loading.value = false
    error.value = null
  } catch (err) {
    console.error('Error rendering ABC notation:', err)
    error.value = '渲染失败：' + (err as Error).message
  }
}

// 组件挂载时渲染
onMounted(() => {
  renderAbc()

  // 监听窗口大小变化，重新渲染以适应新宽度
  const handleResize = () => {
    renderAbc()
  }
  window.addEventListener('resize', handleResize)

  // 组件卸载时移除监听器
  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
  })
})

// 监听 showTitle 变化
watch(() => props.showTitle, () => {
  renderAbc()
})

// 监听 abcStr 变化
watch(() => props.abcStr, () => {
  renderAbc()
})
</script>

<template>
  <div class="abc-svg-wrapper" :class="{ 'hide-title': !showTitle }">
    <!-- ABC 渲染容器 -->
    <div
      ref="abcContainer"
      class="abc-svg-container"
    />
  </div>
</template>

<style scoped>
.abc-svg-wrapper {
  width: 100%;
}

.loading-state,
.error-state {
  padding: 2rem;
  text-align: center;
  border-radius: 0.5rem;
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-state {
  background: var(--va-c-bg-soft);
  color: var(--va-c-text-light);
}

.error-state {
  background: var(--va-c-error-bg);
  color: var(--va-c-error);
}

.abc-svg-container {
  width: 100%;
  min-height: 100px;
  overflow-x: auto; /* 允许横向滚动 */
}

.abc-svg-container :deep(svg) {
  display: block;
  height: auto;
  min-width: 100%;
}

/* 确保五线谱填满容器宽度 */
.abc-svg-container :deep(.abcjs-svg) {
  width: 100% !important;
}

/* 强制五线谱系统填满宽度 */
.abc-svg-container :deep(.abcjs-system) {
  width: 100% !important;
}

/* 隐藏标题 */
.abc-svg-wrapper.hide-title :deep(.abcjs-title) {
  display: none;
}
</style>
