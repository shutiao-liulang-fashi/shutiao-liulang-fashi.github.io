<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { abcToAbc, type AbcConversionOptions, hasAbcHeader } from './core/abcToAbc'
import { jianpuToAbc, type ConversionOptions as JianpuConversionOptions } from './core/jianpuToAbc'
import { scientificToAbc, type ConversionOptions as ScientificConversionOptions } from './core/scientificToAbc'
import { AbcHandler } from './core/abcjsHandler'

type NotationType = 'abc' | 'jianpu' | 'scientific'

interface ConversionOptions extends AbcConversionOptions {
  baseNote?: string // 仅简谱需要
}

interface Props {
  /** 记谱法类型 */
  notationType: NotationType
  /** 音符字符串 */
  notes: string
  /** 转换选项 */
  conversionOptions?: ConversionOptions
  /** 是否显示五线谱 */
  showSheetMusic?: boolean
  /** 是否显示五线谱标题 */
  showTitle?: boolean
  /** 是否显示音符信息 */
  showNotes?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  conversionOptions: () => ({
    key: 'C',
    meter: '4/4',
    tempo: '120',
    unitNoteLength: '1/4',
    title: 'Notation'
  }),
  showSheetMusic: false,
  showTitle: false,
  showNotes: true,
})

// 错误状态
const error = ref<string | null>(null)

// ABC 处理器实例
const abcHandler = ref<AbcHandler | null>(null)

// 渲染容器引用
const sheetMusicContainer = ref<HTMLDivElement | null>(null)

/**
 * 根据 notationType 获取默认标题
 */
const getDefaultTitle = computed(() => {
  switch (props.notationType) {
    case 'abc':
      return 'ABC Notation'
    case 'jianpu':
      return 'Jianpu Notation'
    case 'scientific':
      return 'Scientific Notation'
    default:
      return 'Notation'
  }
})

/**
 * 合并转换选项，确保有默认值
 */
const mergedOptions = computed(() => {
  return {
    key: 'C',
    meter: '4/4',
    tempo: '120',
    unitNoteLength: '1/4',
    title: getDefaultTitle.value,
    ...props.conversionOptions
  }
})

/**
 * 检查用户传入的 ABC 是否包含头部信息（仅 abc 类型）
 */
const hasUserHeader = computed(() => {
  return props.notationType === 'abc' && hasAbcHeader(props.notes)
})

/**
 * 将记谱法转换为 ABC 记谱法
 */
const abcString = computed(() => {
  if (!props.notes || !props.notes.trim()) {
    return ''
  }

  try {
    switch (props.notationType) {
      case 'abc':
        return abcToAbc(props.notes, mergedOptions.value)
      case 'jianpu':
        return jianpuToAbc(props.notes, mergedOptions.value as JianpuConversionOptions)
      case 'scientific':
        return scientificToAbc(props.notes, mergedOptions.value as ScientificConversionOptions)
      default:
        return ''
    }
  } catch (err) {
    console.error('Error converting notation:', err)
    error.value = (err as Error).message
    return ''
  }
})


// 组件挂载时初始化 ABC 处理器
onMounted(async () => {
  // 创建处理器实例
  abcHandler.value = new AbcHandler({
    abcString: abcString.value,
    enablePlayback: true,
    enableRender: props.showSheetMusic,
    container: props.showSheetMusic ? sheetMusicContainer.value : undefined,
    showTitle: props.showTitle,
    tempo: parseInt(mergedOptions.value.tempo, 10),
    onPlay: () => {
      // 可以在这里处理播放开始事件
    },
    onStop: () => {
      // 可以在这里处理播放停止事件
    }
  })

  // 如果启用了渲染，执行初始渲染
  if (props.showSheetMusic && abcHandler.value) {
    await abcHandler.value.render()
  }
})

// 监听 abcString 变化，更新处理器
watch(abcString, async (newAbcString) => {
  if (abcHandler.value && newAbcString) {
    await abcHandler.value.updateAbcString(newAbcString)
  }
})

// 监听 showSheetMusic 变化
watch(() => props.showSheetMusic, async (newValue) => {
  if (abcHandler.value) {
    // 重新创建处理器以更新配置
    abcHandler.value.dispose()
    abcHandler.value = new AbcHandler({
      abcString: abcString.value,
      enablePlayback: true,
      enableRender: newValue,
      container: newValue ? sheetMusicContainer.value : undefined,
      showTitle: props.showTitle,
      tempo: parseInt(mergedOptions.value.tempo, 10),
      onPlay: () => {
        // 可以在这里处理播放开始事件
      },
      onStop: () => {
        // 可以在这里处理播放停止事件
      }
    })

    // 如果启用了渲染，执行渲染
    if (newValue) {
      await abcHandler.value.render()
    }
  }
})

// 监听 showTitle 变化
watch(() => props.showTitle, async (newValue) => {
  if (abcHandler.value && props.showSheetMusic) {
    await abcHandler.value.render()
  }
})

// 组件卸载前清理
onBeforeUnmount(() => {
  // 销毁处理器实例，释放资源
  if (abcHandler.value) {
    abcHandler.value.dispose()
    abcHandler.value = null
  }
})

/**
 * 播放音符
 */
async function play() {
  if (!abcString.value || !abcHandler.value) {
    return
  }

  console.log('Playing ABC string:', abcString.value)
  try {
    // 清除之前的错误
    error.value = null

    // 播放音频
    await abcHandler.value.play()
  } catch (err) {
    console.error('Error playing audio:', err)
    error.value = (err as Error).message
  }
}

/**
 * 停止播放
 */
function stop() {
  if (abcHandler.value) {
    abcHandler.value.stop()
  }
}
</script>

<template>
  <div class="play-note">
    <!-- 显示音符信息 -->
    <div
      v-if="showNotes"
      class="note-info"
      :class="{ 'clickable': props.notes && props.notes.trim() }"
      @click="props.notes && props.notes.trim() ? play() : null"
    >
      <div class="note-display">
        <pre v-if="notationType === 'abc'">{{ props.notes || '无乐谱' }}</pre>
        <template v-else>{{ props.notes || '无音符' }}</template>
      </div>
      <div v-if="hasUserHeader" class="header-indicator">
        📝 包含头部信息
      </div>
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>

    <!-- 显示五线谱（可选） -->
    <div
      v-if="showSheetMusic && abcString"
      class="sheet-music-container"
      :class="{ 'clickable': abcString }"
      @click="abcString ? play() : null"
    >
      <div ref="sheetMusicContainer" class="abc-render-container" />
    </div>
  </div>
</template>

<style scoped>
.play-note {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.note-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  position: relative;
}

.note-info.clickable {
  cursor: pointer;
}

.note-display {
  font-size: 1.2rem;
  font-weight: 600;
  padding: 0.75rem;
  background: var(--va-c-bg-soft);
  border-radius: 0.5rem;
  color: var(--va-c-text);
  font-family: 'Courier New', monospace;
  white-space: pre-wrap; /* 保留换行符和空格 */
  word-break: break-all; /* 允许在任意字符间断行 */
  overflow-x: auto;
  max-height: 300px;
  overflow-y: auto;
}

.note-display pre {
  margin: 0;
  padding: 0;
  font-family: inherit;
}

.header-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  color: var(--va-c-success);
  font-weight: 500;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 0.25rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.error-message {
  padding: 0.5rem 0.75rem;
  background: var(--va-c-error-bg);
  color: var(--va-c-error);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  text-align: center;
}

.sheet-music-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  position: relative;
}

.sheet-music-container.clickable {
  cursor: pointer;
}

.abc-render-container {
  width: 100%;
  min-height: 100px;
  overflow-x: auto;
}

.abc-render-container :deep(svg) {
  display: block;
  height: auto;
  min-width: 100%;
}

.abc-render-container :deep(.abcjs-svg) {
  width: 100% !important;
}

.abc-render-container :deep(.abcjs-system) {
  width: 100% !important;
}
</style>
