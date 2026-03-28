<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { AbcRenderer } from './core/abcjsHandler'
import type * as ABCJS from "abcjs"

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

// 渲染器实例
let renderer: AbcRenderer | null = null

/**
 * 渲染 ABC 记谱法
 */
async function renderAbc() {
  if (!abcContainer.value || !props.abcStr) {
    return
  }

  try {
    await renderer!.render(props.abcStr, props.options, props.showTitle)
    loading.value = false
    error.value = null
  } catch (err) {
    console.error('Error rendering ABC notation:', err)
    error.value = (err as Error).message
  }
}

// 组件挂载时初始化渲染器并渲染
onMounted(() => {
  if (abcContainer.value) {
    renderer = new AbcRenderer(abcContainer.value)
    // 启用响应式重渲染
    renderer.enableResponsive()
    renderAbc()
  }
})

// 组件卸载时清理资源
onBeforeUnmount(() => {
  if (renderer) {
    renderer.dispose()
    renderer = null
  }
})


// 监听 abcStr 变化
watch(() => props.abcStr, () => {
  renderAbc()
})

// 监听 options 变化
watch(() => props.options, () => {
  renderAbc()
}, { deep: true })
</script>

<template>
  <div class="abc-svg-wrapper" >
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

</style>
