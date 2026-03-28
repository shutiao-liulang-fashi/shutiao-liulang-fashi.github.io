<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { scientificToAbc, type ConversionOptions } from './core/scientificToAbc'
import { AbcAudioPlayer } from './core/abcjsHandler'
import AbcSvg from './AbcSvg.vue'

interface Props {
  /** 科学记谱法音符（单个或多个，空格分隔） */
  notes: string
  /** 转换选项 */
  conversionOptions?: ConversionOptions
  /** 是否显示五线谱 */
  showSheetMusic?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  conversionOptions: () => ({
    key: 'C',
    meter: '4/4',
    tempo: '1/4=120',
    unitNoteLength: '1/4',
    title: 'Scientific Notation'
  }),
  showSheetMusic: false,
})

// 当前是否正在播放
const isPlaying = ref(false)
// 错误状态
const error = ref<string | null>(null)

// 音频播放器实例
let audioPlayer: AbcAudioPlayer | null = null

/**
 * 将科学记谱法转换为 ABC 记谱法
 */
const abcString = computed(() => {
  if (!props.notes || !props.notes.trim()) {
    return ''
  }
  return scientificToAbc(props.notes, props.conversionOptions)
})

/**
 * 播放音符
 */
async function play() {
  if (!abcString.value) {
    return
  }
  console.log('Playing ABC string:', abcString.value)
  try {
    // 清除之前的错误
    error.value = null

    // 设置播放状态（在播放开始前就设置，给用户更好的反馈）
    isPlaying.value = true

    // 播放音频
    await audioPlayer!.play(abcString.value)
  } catch (err) {
    console.error('Error playing audio:', err)
    error.value = (err as Error).message
    isPlaying.value = false
  }
}

/**
 * 停止播放
 */
function stop() {
  if (audioPlayer) {
    audioPlayer.stop()
  }
}

// 组件挂载时初始化音频播放器
onMounted(() => {
  audioPlayer = new AbcAudioPlayer()

  // 设置播放状态回调
  audioPlayer.onPlay(() => {
    isPlaying.value = true
  })

  audioPlayer.onStop(() => {
    isPlaying.value = false
  })
})

// 组件卸载时清理资源
onBeforeUnmount(() => {
  if (audioPlayer) {
    audioPlayer.dispose()
    audioPlayer = null
  }
})

// 暴露方法给父组件
defineExpose({
  play,
  stop,
})
</script>

<template>
  <div class="play-note">
    <!-- 显示音符信息 -->
    <div
      class="note-info"
      :class="{ 'clickable': props.notes && props.notes.trim(), 'playing': isPlaying }"
      @click="props.notes && props.notes.trim() ? play() : null"
    >
      <div class="note-display">
        {{ props.notes || '无音符' }}
      </div>
      <div v-if="isPlaying" class="playing-indicator">
        ▶ 播放中...
      </div>
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>

    <!-- 显示五线谱（可选） -->
    <AbcSvg
      v-if="showSheetMusic && abcString"
      :abc-str="abcString"
    />
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
  transition: all 0.2s ease;
  position: relative;
}

.note-info.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.note-info.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.note-info.clickable:active {
  transform: translateY(0);
}

.note-info.playing {
  border: 2px solid var(--va-c-primary);
}

.note-display {
  font-size: 1.2rem;
  font-weight: 600;
  padding: 0.75rem;
  background: var(--va-c-bg-soft);
  border-radius: 0.5rem;
  color: var(--va-c-text);
  white-space: pre-wrap; /* 保留换行符和空格 */
  word-break: break-word; /* 允许在单词边界换行 */
}

.playing-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  color: var(--va-c-primary);
  font-weight: 500;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 0.25rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  animation: pulse 1.5s ease-in-out infinite;
  z-index: 10;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.error-message {
  padding: 0.5rem 0.75rem;
  background: var(--va-c-error-bg);
  color: var(--va-c-error);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  text-align: center;
}
</style>
