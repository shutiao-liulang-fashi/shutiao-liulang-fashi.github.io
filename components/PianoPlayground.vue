<template>
  <div class="piano-playground">
    <!-- 视图切换按钮 -->
    <div class="view-toggle">
      <button
        class="toggle-btn"
        :class="{ active: currentView === 'edit' }"
        @click="currentView = 'edit'"
      >
        <span class="toggle-icon">✏️</span>
        <span class="toggle-text">编辑</span>
      </button>
      <button
        class="toggle-btn"
        :class="{ active: currentView === 'display' }"
        @click="currentView = 'display'"
      >
        <span class="toggle-icon">🎹</span>
        <span class="toggle-text">演奏</span>
      </button>
    </div>

    <div class="piano-layout">
      <!-- 编辑区：输入和控制 -->
      <div v-show="currentView === 'edit'" class="control-section">
        <h2 class="section-title">钢琴演奏</h2>

        <!-- 选项配置区 -->
        <div class="options-section">
          <!-- 调性显示（固定为 C） -->
          <div class="option-item">
            <label>调性：</label>
            <span class="option-value">C</span>
          </div>

          <!-- 拍号选择 -->
          <div class="option-item">
            <label for="meter">拍号：</label>
            <select id="meter" v-model="options.meter" class="option-select">
              <option v-for="m in meterOptions" :key="m.value" :value="m.value">
                {{ m.label }}
              </option>
            </select>
          </div>

          <!-- 速度选择 -->
          <div class="option-item">
            <label for="tempo">速度：</label>
            <select id="tempo" v-model="options.tempo" class="option-select">
              <option v-for="t in tempoOptions" :key="t.value" :value="t.value">
                {{ t.label }}
              </option>
            </select>
          </div>

          <!-- 单位音符长度 -->
          <div class="option-item">
            <label for="unitNoteLength">单位音符：</label>
            <select id="unitNoteLength" v-model="options.unitNoteLength" class="option-select">
              <option v-for="u in unitNoteLengthOptions" :key="u.value" :value="u.value">
                {{ u.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- ABC 输入区 -->
        <div class="input-section">
          <label class="input-label">ABC 谱子：</label>
          <textarea
            v-model="abcInput"
            class="abc-textarea"
            placeholder="输入 ABC 谱子，例如：C D E F | G A B c'"
            @input="handleAbcInput"
          />
        </div>
      </div>

      <!-- 展示区：钢琴键盘 -->
      <div v-show="currentView === 'display'" class="piano-display-section">
        <!-- 当前按下的音符显示 -->
        <!-- 控制按钮 -->
        <div class="controls">
          <button
            class="btn btn-play"
            :class="{ 'playing': isPlaying }"
            @click="togglePlayback"
            :disabled="!hasValidAbc"
          >
            <span class="icon">{{ isPlaying ? '⏹' : '▶' }}</span>
            <span class="text">{{ isPlaying ? '停止' : '播放' }}</span>
          </button>
        </div>

        <!-- 当前演奏信息 -->
        <div class="current-note-info">
          <div class="note-info-content">
            <span class="note-value">{{ currentNote || '--' }}</span>
            <span class="note-label">当前音符</span>
          </div>
        </div>
        <!-- 钢琴键盘 -->
        <div class="piano-keyboard" ref="keyboardRef">
          <!-- 白键 -->
          <div class="white-keys">
            <div
              v-for="key in whiteKeys"
              :key="`white-${key.midiPitch}`"
              class="white-key"
              :class="{
                'is-pressed': pressedKeys.has(key.midiPitch),
                'is-highlighted': highlightedMidi === key.midiPitch
              }"
              :style="getKeyStyle(key)"
              :data-midi="key.midiPitch"
              @mousedown="handleMouseDown(key)"
              @mouseup="handleMouseUp(key)"
              @mouseleave="handleMouseUp(key)"
              @touchstart.prevent="handleTouchStart(key)"
              @touchend.prevent="handleTouchEnd(key)"
            >
              <span v-if="showNoteNames" class="key-label">
                {{ key.name }}{{ key.octave }}
              </span>
            </div>
          </div>

          <!-- 黑键 -->
          <div class="black-keys">
            <div
              v-for="key in blackKeys"
              :key="`black-${key.midiPitch}`"
              class="black-key"
              :class="{
                'is-pressed': pressedKeys.has(key.midiPitch),
                'is-highlighted': highlightedMidi === key.midiPitch
              }"
              :style="getBlackKeyStyle(key)"
              :data-midi="key.midiPitch"
              @mousedown="handleMouseDown(key)"
              @mouseup="handleMouseUp(key)"
              @mouseleave="handleMouseUp(key)"
              @touchstart.prevent="handleTouchStart(key)"
              @touchend.prevent="handleTouchEnd(key)"
            >
              <span v-if="showNoteNames" class="key-label">
                {{ key.name.replace('#', '♯') }}{{ key.octave }}
              </span>
            </div>
          </div>
        </div>

        <!-- 乐理信息面板 -->
        <div v-if="showTheoryInfo" class="theory-info">
          <h4>钢琴乐理</h4>
          <ul>
            <li>标准钢琴有 <strong>88 个键</strong>：52 个白键 + 36 个黑键</li>
            <li>音域范围：<strong>A0</strong>（最低音）到 <strong>C8</strong>（最高音）</li>
            <li>十二平均律：每个八度分为 12 个半音，频率比约为 1.059</li>
            <li>中央 C（C4）的频率为 <strong>261.63 Hz</strong></li>
            <li>A4 的标准音高为 <strong>440 Hz</strong></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { abcToAbc } from './core/abcToAbc'
import { AbcHandler } from './core/abcjsHandler'
import {
  generatePianoKeys,
  midiToNote,
  type PianoKey
} from './core/pianoData'

// 音符类型定义
interface Note {
  name: string
  octave: number
}

// 调性选项
const keyOptions = [
  { label: 'C', value: 'C' },
  { label: 'G', value: 'G' },
  { label: 'D', value: 'D' },
  { label: 'A', value: 'A' },
  { label: 'E', value: 'E' },
  { label: 'B', value: 'B' },
  { label: 'F', value: 'F' },
  { label: 'Bb', value: 'Bb' },
  { label: 'Eb', value: 'Eb' },
  { label: 'Ab', value: 'Ab' },
]

// 拍号选项
const meterOptions = [
  { label: '4/4', value: '4/4' },
  { label: '3/4', value: '3/4' },
  { label: '2/4', value: '2/4' },
  { label: '6/8', value: '6/8' },
  { label: '3/8', value: '3/8' },
  { label: '2/2', value: '2/2' },
]

// 速度选项
const tempoOptions = [
  { label: '60', value: '60' },
  { label: '80', value: '80' },
  { label: '100', value: '100' },
  { label: '120', value: '120' },
  { label: '140', value: '140' },
  { label: '160', value: '160' },
  { label: '180', value: '180' },
  { label: '200', value: '200' },
]

// 单位音符长度选项
const unitNoteLengthOptions = [
  { label: '1/1', value: '1/1' },
  { label: '1/2', value: '1/2' },
  { label: '1/4', value: '1/4' },
  { label: '1/8', value: '1/8' },
  { label: '1/16', value: '1/16' },
]

// 钢琴配置
// 标准 88 键钢琴音域：A0 (MIDI 21) 到 C8 (MIDI 108)
// 八度范围：0-8（A0 在八度 0，B0 也在八度 0，C1 开始是八度 1）
const startOctave = ref(0)
const endOctave = ref(8)
const volume = ref(0.5)
const showNoteNames = ref(true)
const showTheoryInfo = ref(false)

// 计算属性
const tempo = computed(() => parseInt(options.value.tempo, 10))

// 选项
const options = ref({
  key: 'C',
  meter: '4/4',
  tempo: '120',
  unitNoteLength: '1/4'
})

// ABC 输入
const abcInput = ref('C D E F | G A B c')

// 当前演奏的音符
const currentNote = ref<string | null>(null)

// 高亮的 MIDI 音高（用于联动钢琴）
const highlightedMidi = ref<number | null>(null)

// 播放状态
const isPlaying = ref(false)

// 当前视图：'edit' = 编辑区，'display' = 展示区
const currentView = ref<'edit' | 'display'>('edit')

// 用于控制闪烁效果的定时器
let blinkTimeout: number | null = null

// 主播放器实例
const mainHandler = ref<AbcHandler | null>(null)

// AbcHandler 实例（用于播放单个音符）
let pianoAbcHandler: AbcHandler | null = null

// Refs
const keyboardRef = ref<HTMLElement | null>(null)

// 按键状态
const pressedKeys = ref<Set<number>>(new Set())
const playingNotes = ref<number[]>([])

// 钢琴键数据
const allPianoKeys = ref<PianoKey[]>([])

// 计算属性：白键列表
const whiteKeys = computed<PianoKey[]>(() => {
  return allPianoKeys.value.filter((key: PianoKey) => !key.isBlack)
})

// 计算属性：黑键列表
const blackKeys = computed<PianoKey[]>(() => {
  return allPianoKeys.value.filter((key: PianoKey) => key.isBlack)
})

// 白键宽度（像素）
const WHITE_KEY_WIDTH = 28
const BLACK_KEY_WIDTH = 18

// 检查是否有有效的 ABC 输入
const hasValidAbc = computed(() => {
  return abcInput.value && abcInput.value.trim().length > 0
})

// 音符名称列表
const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// 将 MIDI 音高转换为音符名称
function midiPitchToNoteName(pitch: number): Note | null {
  if (typeof pitch !== 'number' || !isFinite(pitch) || pitch < 0) {
    return null
  }
  const noteIndex = pitch % 12
  const octave = Math.floor(pitch / 12) - 1
  return {
    name: noteNames[noteIndex],
    octave: octave,
  }
}

// MIDI 转音符名称
function midiToNoteName(midi: number): string {
  const note = midiToNote(midi)
  return `${note.name}${note.octave}`
}

// 初始化钢琴键
function initPianoKeys() {
  const keys = generatePianoKeys()

  // 过滤指定范围的键
  const filteredKeys = keys.filter(key =>
    key.octave >= startOctave.value && key.octave <= endOctave.value
  )

  // 计算在过滤列表中的白键索引
  const filteredWhiteKeys = filteredKeys.filter((key: PianoKey) => !key.isBlack)
  const whiteKeyIndexMap = new Map<number, number>()
  filteredWhiteKeys.forEach((key: PianoKey, index: number) => {
    whiteKeyIndexMap.set(key.midiPitch, index)
  })

  allPianoKeys.value = filteredKeys.map(key => {
    // 计算黑键对应的白键索引
    const whiteKeyIndex = key.isBlack ? whiteKeyIndexMap.get(key.midiPitch - 1) ?? -1 : -1
    return { ...key, whiteKeyIndex }
  })
}

// 获取白键样式
function getKeyStyle(_key: PianoKey) {
  return {
    width: `${WHITE_KEY_WIDTH}px`
  }
}

// 获取黑键样式
function getBlackKeyStyle(key: PianoKey) {
  const whiteKeyIndex = (key as PianoKey & { whiteKeyIndex?: number }).whiteKeyIndex ?? -1

  if (whiteKeyIndex === -1) {
    return { display: 'none' }
  }

  // 白键宽度 + 间距 = 28 + 1 = 29px
  const WHITE_KEY_UNIT = WHITE_KEY_WIDTH + 1

  // 黑键左边缘计算：
  // 黑键应该居中于两个白键之间
  // 使用黑键右边白键的位置，减去黑键宽度的一半
  // (whiteKeyIndex + 1) 是因为黑键右边的白键索引
  const left = (whiteKeyIndex + 1) * WHITE_KEY_UNIT - BLACK_KEY_WIDTH / 2

  return {
    left: `${left}px`,
    width: `${BLACK_KEY_WIDTH}px`
  }
}

// 处理鼠标按下
function handleMouseDown(key: PianoKey) {
  playNote(key)
}

// 处理鼠标释放
function handleMouseUp(key: PianoKey) {
  releaseNote(key)
}

// 处理触摸开始
function handleTouchStart(key: PianoKey) {
  playNote(key)
}

// 处理触摸结束
function handleTouchEnd(key: PianoKey) {
  releaseNote(key)
}

// 播放音符
function playNote(key: PianoKey) {
  if (pressedKeys.value.has(key.midiPitch)) return

  pressedKeys.value.add(key.midiPitch)
  playingNotes.value = Array.from(pressedKeys.value)

  // 播放音频
  playAudio(key)
}

// 释放音符
function releaseNote(key: PianoKey) {
  if (!pressedKeys.value.has(key.midiPitch)) return

  pressedKeys.value.delete(key.midiPitch)
  playingNotes.value = Array.from(pressedKeys.value)
}

// 初始化 AbcHandler
function initPianoAbcHandler() {
  if (pianoAbcHandler) return

  pianoAbcHandler = new AbcHandler({
    enablePlayback: true,
    volume: volume.value
  })
}

// 播放音频
function playAudio(key: PianoKey) {
  if (!pianoAbcHandler) {
    initPianoAbcHandler()
  }

  if (!pianoAbcHandler) return

  const abcString = `X:1\nT:Note\nM:4/4\nL:1/4\nK:C\n${key.abcNotation} |\n`
  pianoAbcHandler.updateAbcString(abcString).then(() => {
    pianoAbcHandler?.play()
  })
}

// 停止所有音频
function stopAllAudio() {
  pressedKeys.value.clear()
  playingNotes.value = []
}

// 滚动到指定 MIDI 音符位置
function scrollToMidi(midi: number) {
  nextTick(() => {
    const container = keyboardRef.value
    if (!container) return

    const keyElement = container.querySelector(`[data-midi="${midi}"]`)
    if (keyElement) {
      const containerRect = container.getBoundingClientRect()
      const keyRect = keyElement.getBoundingClientRect()

      const keyCenter = keyRect.left + keyRect.width / 2
      const containerCenter = containerRect.left + containerRect.width / 2
      const scrollLeft = container.scrollLeft + (keyCenter - containerCenter)

      container.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth'
      })
    }
  })
}

// 处理 ABC 输入变化
function handleAbcInput() {
  // 可以在这里添加输入验证
}

// 播放
async function play() {
  if (!hasValidAbc.value || !mainHandler.value) {
    return
  }

  try {
    // 先停止之前的播放
    stop()

    // 处理 ABC 字符串
    const processedAbc = abcToAbc(abcInput.value, {
      key: options.value.key,
      meter: options.value.meter,
      tempo: options.value.tempo,
      unitNoteLength: options.value.unitNoteLength
    })

    // 更新处理器的 ABC 字符串
    await mainHandler.value!.updateAbcString(processedAbc)

    // 播放
    await mainHandler.value!.play()

    isPlaying.value = true
  } catch (error) {
    console.error('播放失败:', error)
    isPlaying.value = false
  }
}

// 停止
function stop() {
  // 清除定时器
  if (blinkTimeout !== null) {
    clearTimeout(blinkTimeout)
    blinkTimeout = null
  }

  if (mainHandler.value) {
    mainHandler.value.stop()
  }

  isPlaying.value = false
  currentNote.value = null
  highlightedMidi.value = null
}

// 切换播放/停止
async function togglePlayback() {
  if (isPlaying.value) {
    stop()
  } else {
    await play()
  }
}

// 监听 highlightedMidi 变化（用于 abcjs 联动）
watch(highlightedMidi, (newMidi) => {
  if (newMidi !== null) {
    const key = allPianoKeys.value.find((k: PianoKey) => k.midiPitch === newMidi)
    if (key) {
      // 查找对应的 PianoKey 对象来演奏
      playNote(key)
      // 滚动到该音符位置
      scrollToMidi(newMidi)
      // 根据 tempo 计算自动释放时间（约一个十六分音符的时长）
      const releaseTime = (60 / tempo.value) * 250
      setTimeout(() => {
        if (pressedKeys.value.has(newMidi)) {
          releaseNote(key)
        }
      }, releaseTime)
    }
  }
})

// 组件挂载时初始化
onMounted(() => {
  // 初始化钢琴键
  initPianoKeys()

  // 创建自定义游标控制器
  const cursorControl: any = {
    onEvent: (event: any) => {
      // 处理音符事件
      if (event && event.midiPitches && event.midiPitches.length > 0) {
        const midiPitchObj = event.midiPitches[0]
        const midiPitch = midiPitchObj.pitch
        const noteName = midiPitchToNoteName(midiPitch)

        if (noteName) {
          // 清除之前的定时器
          if (blinkTimeout !== null) {
            clearTimeout(blinkTimeout)
            blinkTimeout = null
          }

          // 先清除当前显示
          currentNote.value = null
          highlightedMidi.value = null

          // 延迟一小段时间后显示新音符，产生闪烁效果
          blinkTimeout = window.setTimeout(() => {
            currentNote.value = `${noteName.name}${noteName.octave}`
            highlightedMidi.value = midiPitch
          }, 60)
        }
      }
    },

    onFinished: () => {
      // 清除定时器
      if (blinkTimeout !== null) {
        clearTimeout(blinkTimeout)
        blinkTimeout = null
      }

      isPlaying.value = false
      currentNote.value = null
      highlightedMidi.value = null
    }
  }

  // 创建主处理器实例
  mainHandler.value = new AbcHandler({
    abcString: abcInput.value,
    enablePlayback: true,
    enableRender: false,
    tempo: parseInt(options.value.tempo, 10),
    onPlay: () => {
      isPlaying.value = true
    },
    onStop: () => {
      isPlaying.value = false
      currentNote.value = null
      highlightedMidi.value = null
    },
    cursorControl: cursorControl,
  })
})

// 组件卸载时清理
onBeforeUnmount(() => {
  // 清除定时器
  if (blinkTimeout !== null) {
    clearTimeout(blinkTimeout)
    blinkTimeout = null
  }

  // 停止所有音频
  stopAllAudio()

  // 销毁主处理器实例
  if (mainHandler.value) {
    mainHandler.value.dispose()
    mainHandler.value = null
  }

  // 销毁钢琴音频处理器
  if (pianoAbcHandler) {
    pianoAbcHandler.dispose()
    pianoAbcHandler = null
  }
})
</script>

<style scoped>
/* 统一使用 CSS 变量 */
.piano-playground {
  padding: 1rem;
  background: var(--va-c-bg-soft);
  border-radius: 0.5rem;
  min-height: 400px;
}

/* 视图切换按钮 */
.view-toggle {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: var(--va-c-bg);
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.toggle-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.625rem 1rem;
  border: 2px solid var(--va-c-divider);
  border-radius: 0.375rem;
  background: var(--va-c-bg);
  color: var(--va-c-text-light);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  border-color: var(--va-c-primary);
  color: var(--va-c-primary);
}

.toggle-btn.active {
  border-color: var(--va-c-primary);
  background: rgba(var(--va-c-primary-rgb), 0.1);
  color: var(--va-c-primary);
}

.toggle-icon {
  font-size: 1rem;
}

.toggle-text {
  line-height: 1;
}

.piano-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.control-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--va-c-bg);
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.section-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--va-c-text);
}

.options-section {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.625rem;
  background: var(--va-c-bg-soft);
  border-radius: 0.375rem;
  border: 1px solid var(--va-c-divider);
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex: 1 1 calc(25% - 0.5rem);
  min-width: 140px;
}

.option-item label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--va-c-text-light);
  white-space: nowrap;
}

.option-value {
  flex: 1;
  padding: 0.3125rem 0.5rem;
  background: var(--va-c-bg-soft);
  border-radius: 0.25rem;
  color: var(--va-c-text);
  font-size: 0.75rem;
  font-family: 'Courier New', monospace;
}

.option-select {
  flex: 1;
  padding: 0.3125rem 0.5rem;
  border: 1px solid var(--va-c-divider);
  border-radius: 0.25rem;
  background: var(--va-c-bg);
  color: var(--va-c-text);
  font-size: 0.75rem;
  font-family: 'Courier New', monospace;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-select:hover {
  border-color: var(--va-c-primary);
}

.option-select:focus {
  outline: none;
  border-color: var(--va-c-primary);
  box-shadow: 0 0 0 2px rgba(var(--va-c-primary-rgb), 0.1);
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-label {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--va-c-text);
}

.abc-textarea {
  width: 100%;
  min-height: 150px;
  padding: 0.75rem;
  border: 1px solid var(--va-c-divider);
  border-radius: 0.375rem;
  font-family: 'Courier New', monospace;
  font-size: 0.8125rem;
  line-height: 1.5;
  resize: vertical;
  background: var(--va-c-bg-soft);
  color: var(--va-c-text);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.abc-textarea:focus {
  outline: none;
  border-color: var(--va-c-primary);
  box-shadow: 0 0 0 3px rgba(var(--va-c-primary-rgb), 0.1);
}

.controls {
  display: flex;
  gap: 0.625rem;
}

.btn {
  flex: 1;
  padding: 0.625rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3125rem;
  min-height: 44px;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn:active:not(:disabled) {
  transform: translateY(0);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-play {
  background: var(--va-c-primary);
  color: white;
}

.btn-play:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(var(--va-c-primary-rgb), 0.35);
}

.btn-play.playing {
  background: var(--va-c-error);
}

.btn-play.playing:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(var(--va-c-error-rgb), 0.35);
}

.btn-play .icon {
  font-size: 1rem;
  line-height: 1;
}

.btn-play .text {
  line-height: 1;
}

.current-note-info {
  background: var(--va-c-bg);
  border-radius: 0.375rem;
  padding: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--va-c-divider);
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.note-info-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.note-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--va-c-primary);
  font-family: 'Courier New', monospace;
}

.note-label {
  font-size: 0.6875rem;
  color: var(--va-c-text-light);
}

.piano-display-section {
  background: var(--va-c-bg);
  border-radius: 0.5rem;
  padding: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: auto;
  flex: 1;
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

/* 当前演奏的音符 */
.playing-notes {
  display: flex;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  background: var(--va-c-bg);
  border-radius: 0.375rem;
  min-height: 40px;
  align-items: center;
  flex-shrink: 0;
  font-size: 0.75rem;
  margin-bottom: 0.5rem;
}

.playing-note {
  background: linear-gradient(135deg, var(--va-c-primary) 0%, #764ba2 100%);
  color: white;
  padding: 0.125rem 0.625rem;
  border-radius: 1rem;
  font-weight: 600;
  font-size: 0.75rem;
  animation: pulse 0.2s ease;
}

.playing-placeholder {
  color: var(--va-c-text-light);
  font-size: 0.6875rem;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* 钢琴键盘容器 */
.piano-keyboard {
  position: relative;
  display: flex;
  height: 120px;
  background: linear-gradient(180deg, #333 0%, #1a1a1a 100%);
  border-radius: 0.375rem;
  padding: 0.375rem;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
  overflow-x: auto;
  overflow-y: hidden;
}

/* 自定义滚动条样式 */
.piano-keyboard::-webkit-scrollbar {
  height: 8px;
}

.piano-keyboard::-webkit-scrollbar-track {
  background: #444;
  border-radius: 4px;
}

.piano-keyboard::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.piano-keyboard::-webkit-scrollbar-thumb:hover {
  background: #aaa;
}

/* 白键容器 */
.white-keys {
  display: flex;
  position: relative;
  height: 100%;
  gap: 1px;
}

/* 白键 */
.white-key {
  width: 28px;
  height: 100%;
  background: linear-gradient(180deg, #ffffff 0%, #f0f0f0 80%, #e0e0e0 100%);
  border: 1px solid #ccc;
  border-radius: 0 0 4px 4px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding-bottom: 4px;
  cursor: pointer;
  transition: all 0.08s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  position: relative;
}

.white-key:hover {
  background: linear-gradient(180deg, #ffffff 0%, #f8f8f8 80%, #e8e8e8 100%);
}

.white-key.is-pressed,
.white-key.is-highlighted {
  background: linear-gradient(180deg, #e3f2fd 0%, #bbdefb 80%, #90caf9 100%);
  transform: translateY(2px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.white-key.is-highlighted {
  background: linear-gradient(180deg, #fff9c4 0%, #fff59d 80%, #fff176 100%);
}

/* 黑键容器 */
.black-keys {
  position: absolute;
  top: 6px;
  left: 6px;
  height: 72px;
  pointer-events: none;
  right: 0;
}

/* 黑键 */
.black-key {
  position: absolute;
  height: 100%;
  background: linear-gradient(180deg, #333 0%, #1a1a1a 80%, #000 100%);
  border-radius: 0 0 3px 3px;
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.08s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding-bottom: 4px;
  z-index: 1;
}

.black-key:hover {
  background: linear-gradient(180deg, #444 0%, #2a2a2a 80%, #111 100%);
}

.black-key.is-pressed,
.black-key.is-highlighted {
  background: linear-gradient(180deg, #424242 0%, #212121 80%, #000 100%);
  transform: translateY(2px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.black-key.is-highlighted {
  background: linear-gradient(180deg, #5d4037 0%, #3e2723 80%, #1a1a1a 100%);
}

/* 键标签 */
.key-label {
  font-size: 8px;
  color: #666;
  font-weight: 500;
}

.black-key .key-label {
  color: #aaa;
}

/* 乐理信息 */
.theory-info {
  background: var(--va-c-bg);
  padding: 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.6875rem;
  line-height: 1.5;
  margin-top: 0.5rem;
}

.theory-info h4 {
  margin: 0 0 0.5rem 0;
  color: var(--va-c-text);
  font-size: 0.8125rem;
}

.theory-info ul {
  margin: 0;
  padding-left: 1rem;
}

.theory-info li {
  margin-bottom: 0.25rem;
  color: var(--va-c-text-light);
}

.theory-info strong {
  color: var(--va-c-primary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .piano-playground {
    padding: 0.625rem;
    min-height: auto;
  }

  .options-section {
    flex-direction: column;
    gap: 0.375rem;
    padding: 0.5rem;
  }

  .option-item {
    flex: 1 1 100%;
    min-width: 0;
  }

  .option-item label {
    font-size: 0.6875rem;
    min-width: 60px;
  }

  .abc-textarea {
    min-height: 120px;
    font-size: 0.75rem;
    padding: 0.5rem;
  }

  .controls {
    gap: 0.5rem;
  }

  .btn {
    padding: 0.625rem 0.75rem;
    font-size: 0.8125rem;
    min-height: 44px;
  }

  .current-note-info {
    padding: 0.625rem;
    min-height: 44px;
  }

  .note-value {
    font-size: 1.125rem;
  }

  .piano-keyboard {
    height: 100px;
  }

  .white-key {
    width: 24px;
  }

  .black-keys {
    height: 60px;
  }

  .key-label {
    font-size: 7px;
  }
}

@media (max-width: 480px) {
  .piano-playground {
    padding: 0.5rem;
  }

  .section-title {
    font-size: 1rem;
  }

  .options-section {
    padding: 0.375rem;
  }

  .option-item {
    gap: 0.25rem;
  }

  .option-item label {
    font-size: 0.625rem;
    min-width: 50px;
  }

  .option-select {
    font-size: 0.6875rem;
    padding: 0.25rem 0.375rem;
  }

  .input-label {
    font-size: 0.75rem;
  }

  .abc-textarea {
    min-height: 100px;
    font-size: 0.6875rem;
    padding: 0.5rem;
  }

  .btn {
    font-size: 0.75rem;
    padding: 0.5rem 0.625rem;
  }

  .note-value {
    font-size: 1rem;
  }
}
</style>
