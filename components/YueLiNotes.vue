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
  showNotes: false,
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


// 播放状态
const isPlaying = ref(false)

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
      isPlaying.value = true
    },
    onStop: () => {
      isPlaying.value = false
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
    // 停止播放并重置状态
    isPlaying.value = false

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
        isPlaying.value = true
      },
      onStop: () => {
        isPlaying.value = false
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

/**
 * 切换播放/停止
 */
async function togglePlayback() {
  if (isPlaying.value) {
    stop()
  } else {
    await play()
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
    >
      <!-- 播放/停止切换按钮（音符信息区域） -->
      <button
        v-if="abcString"
        class="play-stop-button"
        :class="{ 'playing': isPlaying }"
        @click.stop="togglePlayback"
        :disabled="!abcString"
      >
        <span v-if="isPlaying" class="icon-stop">⏹</span>
        <span v-else class="icon-play">▶</span>
      </button>

      <div class="note-display">
        <pre v-if="notationType === 'abc'">{{ props.notes || '无乐谱' }}</pre>
        <template v-else>{{ props.notes || '无音符' }}</template>
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
    >
      <!-- 播放/停止切换按钮（五线谱区域，仅在无音符信息时显示） -->
      <button
        v-if="!showNotes"
        class="play-stop-button"
        :class="{ 'playing': isPlaying }"
        @click.stop="togglePlayback"
        :disabled="!abcString"
      >
        <span v-if="isPlaying" class="icon-stop">⏹</span>
        <span v-else class="icon-play">▶</span>
      </button>

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

/* 播放/停止切换按钮样式 */
.play-stop-button {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid var(--va-c-border);
  background: var(--va-c-bg);
  color: var(--va-c-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  transition: all 0.2s ease;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.play-stop-button:hover:not(:disabled) {
  transform: scale(1.05);
  border-color: var(--va-c-primary);
  background: var(--va-c-primary-soft);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.play-stop-button:active:not(:disabled) {
  transform: scale(0.95);
}

.play-stop-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.play-stop-button.playing {
  border-color: var(--va-c-error);
  background: var(--va-c-error-soft);
  color: var(--va-c-error);
}

.play-stop-button.playing:hover:not(:disabled) {
  background: var(--va-c-error-bg);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}

.play-stop-button .icon-play,
.play-stop-button .icon-stop {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
</style>
