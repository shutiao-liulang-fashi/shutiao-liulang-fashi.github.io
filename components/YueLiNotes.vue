<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { abcToAbc, type AbcConversionOptions, hasAbcHeader } from './core/abcToAbc'
import { jianpuToAbc, type ConversionOptions as JianpuConversionOptions } from './core/jianpuToAbc'
import { scientificToAbc, type ConversionOptions as ScientificConversionOptions } from './core/scientificToAbc'
import { AbcAudioPlayer } from './core/abcjsHandler'
import AbcSvg from './AbcSvg.vue'

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

// 音频播放器实例（使用全局单例）
const audioPlayer = ref<AbcAudioPlayer | null>(null)

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


// 组件挂载时初始化音频播放器
onMounted(() => {
  // 创建播放器实例
  audioPlayer.value = new AbcAudioPlayer()
})

// 组件卸载前清理
onBeforeUnmount(() => {
  // 销毁播放器实例，释放资源
  if (audioPlayer.value) {
    audioPlayer.value.dispose()
    audioPlayer.value = null
  }
})

/**
 * 播放音符
 */
async function play() {
  if (!abcString.value || !audioPlayer.value) {
    return
  }

  console.log('Playing ABC string:', abcString.value)
  try {
    // 清除之前的错误
    error.value = null

    // 播放音频
    await audioPlayer.value.play(abcString.value)
  } catch (err) {
    console.error('Error playing audio:', err)
    error.value = (err as Error).message
  }
}

/**
 * 停止播放
 */
function stop() {
  if (audioPlayer.value) {
    audioPlayer.value.stop()
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
      <AbcSvg
        :abc-str="abcString"
        :show-title="showTitle"
      />
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
</style>
