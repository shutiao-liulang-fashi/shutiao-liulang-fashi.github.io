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
  /** 是否显示播放按钮（仅当 notes 存在时） */
  showPlayButton?: boolean
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
  showPlayButton: true
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

// 当前显示的视图（音符信息或五线谱）
const currentView = ref<'notes' | 'sheet-music'>('sheet-music')

// 是否需要显示切换按钮（音符信息和五线谱都存在时）
const showToggleButton = computed(() => {
  return props.showNotes && props.showSheetMusic
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
      isPlaying.value = true
    },
    onStop: () => {
      isPlaying.value = false
    },
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

/**
 * 切换视图（音符信息 <-> 五线谱）
 */
function toggleView() {
  currentView.value = currentView.value === 'notes' ? 'sheet-music' : 'notes'
}
</script>

<template>
  <div class="play-note">
    <!-- 播放控制区域 -->
    <div v-if="abcString && showPlayButton" class="play-control-section">
      <button
        class="play-stop-button"
        :class="{ 'playing': isPlaying }"
        @click="togglePlayback"
        :disabled="!abcString"
      >
        <span class="icon">{{ isPlaying ? '⏹' : '▶' }}</span>
        <span class="text">{{ isPlaying ? '停止' : '播放' }}</span>
      </button>

      <!-- 切换按钮（仅在两者都存在时显示） -->
      <button
        v-if="showToggleButton"
        class="toggle-view-button"
        @click="toggleView"
      >
        <span class="icon">{{ currentView === 'notes' ? '📜' : '🎵' }}</span>
        <span class="text">{{ currentView === 'notes' ? '查看五线谱' : '查看音符' }}</span>
      </button>
    </div>

    <!-- 显示音符信息 -->
    <div
      v-show="showNotes && (currentView === 'notes' || !showSheetMusic)"
      class="note-info"
      :class="{ 'clickable': props.notes && props.notes.trim() }"
    >
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
      v-show="showSheetMusic && abcString && (currentView === 'sheet-music' || !showNotes)"
      class="sheet-music-container"
      :class="{ 'clickable': abcString }"
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
  position: relative;
  border: 1px solid var(--va-c-border);
}

.play-control-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: var(--va-c-bg-soft, #f5f5f5);
  flex-wrap: wrap;
}

.play-stop-button {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  border: 1px solid var(--va-c-border);
  border-radius: 0.375rem;
  color: var(--va-c-text);
  cursor: pointer;
  font-size: 0.8125rem;
  font-weight: 500;
  transition: all 0.2s ease;
  flex: 1 1 auto;
  min-width: 0;
  justify-content: center;
  max-width: 160px;
}

.play-stop-button:hover:not(:disabled) {
  border-color: var(--va-c-primary);
  background: var(--va-c-primary-soft);
  color: var(--va-c-primary);
}

.play-stop-button:active:not(:disabled) {
  transform: translateY(1px);
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
  color: var(--va-c-error);
}

.play-stop-button .icon {
  font-size: 0.875rem;
  line-height: 1;
  flex-shrink: 0;
}

.play-stop-button .text {
  line-height: 1;
  white-space: nowrap;
}

/* 切换视图按钮样式 */
.toggle-view-button {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  border: 1px solid var(--va-c-border);
  border-radius: 0.375rem;
  background: var(--va-c-bg);
  color: var(--va-c-text);
  cursor: pointer;
  font-size: 0.8125rem;
  font-weight: 500;
  transition: all 0.2s ease;
  flex: 1 1 auto;
  min-width: 0;
  justify-content: center;
  max-width: 180px;
}

.toggle-view-button:hover {
  border-color: var(--va-c-primary);
  background: var(--va-c-primary-soft);
  color: var(--va-c-primary);
}

.toggle-view-button:active {
  transform: translateY(1px);
}

.toggle-view-button .icon {
  font-size: 0.875rem;
  line-height: 1;
  flex-shrink: 0;
}

.toggle-view-button .text {
  line-height: 1;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .play-control-section {
    padding: 0.5rem;
    gap: 0.375rem;
  }

  .play-stop-button,
  .toggle-view-button {
    padding: 0.5rem 0.625rem;
    font-size: 0.75rem;
    gap: 0.25rem;
  }

  .play-stop-button .text {
    display: none;
  }

  .toggle-view-button .text {
    display: none;
  }

  .play-stop-button,
  .toggle-view-button {
    min-height: 40px;
    max-width: 48px;
  }
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
  border-radius: 0.5rem;
  color: var(--va-c-text);
  font-family: 'Courier New', monospace;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-x: auto;
  overflow-y: auto;
}

.note-display pre {
  margin: 0;
  padding: 0;
  font-family: inherit;
}

.error-message {
  padding: 0.5rem 0.75rem;
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
