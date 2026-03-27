<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { scientificToAbc, type ConversionOptions } from './core/scientificToAbc'
import * as ABCJS from "abcjs"
import AbcSvg from './AbcSvg.vue'

interface Props {
  /** 科学记谱法音符（单个或多个，空格分隔） */
  notes: string
  /** 转换选项 */
  conversionOptions?: ConversionOptions
  /** 是否显示五线谱 */
  showSheetMusic?: boolean
  /** 是否显示五线谱标题 */
  showTitle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  conversionOptions: () => ({
    key: 'C',
    meter: '4/4',
    tempo: '1/4=120',
    unitNoteLength: '1/4',
    title: 'Play Note'
  }),
  showSheetMusic: false,
  showTitle: false,
})

// 隐藏的渲染容器
const hiddenContainer = ref<HTMLElement | null>(null)
// 当前是否正在播放
const isPlaying = ref(false)
// 错误状态
const error = ref<string | null>(null)

// 音频上下文
let audioContext: AudioContext | null = null

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
 * 初始化音频播放
 */
async function initAudio() {
  try {
    if (!abcString.value || !hiddenContainer.value) {
      return
    }
    // 创建音频上下文（如果还没有）
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    // 注册音频上下文到 ABCJS
    ABCJS.synth.registerAudioContext(audioContext)

    // 清空容器
    hiddenContainer.value.innerHTML = ''
    // 等待一小段时间确保渲染完成
    await new Promise(resolve => setTimeout(resolve, 100))
  } catch (err) {
    console.error('Error initializing ABC audio:', err)
    error.value = '初始化失败：' + (err as Error).message
  }
}

/**
 * 播放音符
 */
function play() {
  try {
     if (!abcString.value || !hiddenContainer.value) {
      return
    }
    const synthControl = new ABCJS.synth.SynthController()
    // 使用 cursorControl 来处理播放事件
    const cursorControl = {
      onBeat: (beatNumber: number, totalBeats: number, totalTime: number) => {
        // 不需要处理
      },
      onEvent: (event: any) => {
        // ABCJS 的事件结构
        if (event && event.midiPitches && event.midiPitches.length > 0) {
        }
      },
      onFinished: () => {
        isPlaying.value = false
      }
    }
    // 使用 abcjs 渲染到隐藏容器
    const visualObjs = ABCJS.renderAbc(hiddenContainer.value, abcString.value, {
      responsive: 'resize',
    })
    const visualObj = visualObjs[0] // 获取第一个（通常只有一个）
    // 加载并播放
    synthControl.load(hiddenContainer.value, cursorControl, {})
    // 设置 tune 并播放
    synthControl.setTune(visualObj, false, {}).then((response: any) => {
      synthControl.play()
    }).catch((error: any) => {
      console.error("Failed to load audio:", error)
      isPlaying.value = false
    })
    // 清除之前的错误
    error.value = null
    isPlaying.value = true
  } catch (err) {
    console.error('Error playing audio:', err)
    error.value = '播放失败：' + (err as Error).message
    isPlaying.value = false
  }
}

// 组件挂载时初始化
onMounted(() => {
  initAudio()
})


// 暴露方法给父组件
defineExpose({
  play,
})
</script>

<template>
  <div class="play-note">
    <!-- 隐藏的渲染容器，用于生成音频 -->
    <div
      ref="hiddenContainer"
      class="hidden-container"
      aria-hidden="true"
    />

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
      :show-title="showTitle"
    />
  </div>
</template>

<style scoped>
.play-note {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.hidden-container {
  position: fixed !important;
  left: -9999px !important;
  top: -9999px !important;
  width: 0px !important;
  height: 0px !important;
  overflow: hidden !important;
  z-index: -1 !important;
  visibility: hidden !important;
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
