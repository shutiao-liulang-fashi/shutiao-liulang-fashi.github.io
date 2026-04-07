<template>
  <div class="yueqin-container">
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
        <span class="toggle-icon">🪕</span>
        <span class="toggle-text">演奏</span>
      </button>
    </div>

    <div class="yueqin-layout">
      <!-- 编辑区：输入和控制 -->
      <div v-show="currentView === 'edit'" class="control-section">
        <h2 class="section-title">月琴演奏</h2>

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
              <option
                v-for="option in meterOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>

          <!-- 速度选择 -->
          <div class="option-item">
            <label for="tempo">速度：</label>
            <select id="tempo" v-model="options.tempo" class="option-select">
              <option
                v-for="option in tempoOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>

          <!-- 单位音符长度选择 -->
          <div class="option-item">
            <label for="unitNoteLength">单位音符：</label>
            <select id="unitNoteLength" v-model="options.unitNoteLength" class="option-select">
              <option
                v-for="option in unitNoteLengthOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
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
            placeholder="输入 ABC 谱子，例如：c d e f | g a b c' |"
            @input="handleAbcInput"
          />
        </div>
      </div>

      <!-- 展示区：月琴演奏 -->
      <div v-show="currentView === 'display'" class="yueqin-display-section">
        
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

        <!-- 当前音符信息 -->
        <div class="current-note-info">
          <div class="note-info-content">
            <span class="note-value">{{ currentNote ? `${currentNote.name}${currentNote.octave}` : '--' }}</span>
            <span class="note-position">
              第 {{ currentPosition ? 4 - currentPosition.stringIndex : '-' }} 弦
              第 {{ currentPosition ? currentPosition.fret : '-' }} 品
            </span>
          </div>
        </div>
        <div class="yueqin-display">
          <!-- 空弦定调设置 -->
          <div class="tuning-settings">
            <div class="tuning-title">空弦定调</div>
            <div class="tuning-inputs">
              <div class="tuning-input-group">
                <label>四弦</label>
                <input
                  type="text"
                  v-model="tuning.string4"
                  @change="updateTuning"
                  class="tuning-input"
                />
              </div>
              <div class="tuning-input-group">
                <label>三弦</label>
                <input
                  type="text"
                  v-model="tuning.string3"
                  @change="updateTuning"
                  class="tuning-input"
                />
              </div>
              <div class="tuning-input-group">
                <label>二弦</label>
                <input
                  type="text"
                  v-model="tuning.string2"
                  @change="updateTuning"
                  class="tuning-input"
                />
              </div>
              <div class="tuning-input-group">
                <label>一弦</label>
                <input
                  type="text"
                  v-model="tuning.string1"
                  @change="updateTuning"
                  class="tuning-input"
                />
              </div>
            </div>
          </div>

          <!-- 弦标签（顶部）-->
          <div class="string-labels-top">
            <div v-for="(label, index) in reversedStringLabels" :key="index" class="string-label">
              {{ label }}
            </div>
          </div>

          <!-- 弦和品位 -->
          <div class="fretboard">
            <div
              v-for="fret in fretCount + 1"
              :key="`fret-row-${fret}`"
              class="fret-row"
            >
              <!-- 品位标签（左侧）-->
              <div class="fret-label-side">
                {{ fret - 1 }}
              </div>

              <!-- 弦（横向排列）-->
              <div
                v-for="(string, stringIndex) in stringCount"
                :key="`fret-${fret}-string-${stringIndex}`"
                class="fret"
                :class="{
                  'fret-0': fret === 1,
                  'is-current': isCurrentPosition(stringIndex, fret - 1),
                }"
                :data-note="getNoteName(stringIndex, fret - 1)"
                @click="playSingleNote(stringIndex, fret - 1)"
              >
                <!-- 左下角指示点 -->
                <span v-if="isCurrentPosition(stringIndex, fret - 1)" class="indicator-dot"></span>
                <!-- 当前播放位置显示音符 -->
                <span v-if="isCurrentPosition(stringIndex, fret - 1)" class="note-display">
                  {{ getNoteName(stringIndex, fret - 1) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue"
import { abcToAbc } from "./core/abcToAbc"
import { scientificToAbc, type ConversionOptions as ScientificConversionOptions } from "./core/scientificToAbc"
import { AbcHandler } from "./core/abcjsHandler"

// 音符类型定义
interface Note {
  name: string
  octave: number
}

// 月琴位置类型定义
interface YueQinPosition {
  stringIndex: number
  fret: number
}

// 月琴配置
const stringCount = 4
const fretCount = 16

// 定调（从四弦到一弦）
const tuning = ref({
  string4: "G3",
  string3: "D4",
  string2: "G4",
  string1: "D5",
})

// ABC 输入
const abcInput = ref(' c d e f g a b ')

// 选项
const options = ref({
  key: 'C', // 固定为 C
  meter: '4/4',
  tempo: '120',
  unitNoteLength: '1/4'
})



// 拍号选项
const meterOptions = [
  { label: '2/4', value: '2/4' },
  { label: '3/4', value: '3/4' },
  { label: '4/4', value: '4/4' },
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

// 当前播放的音符
const currentNote = ref<Note | null>(null)

// 当前播放的位置
const currentPosition = ref<YueQinPosition | null>(null)

// 用于控制闪烁效果的定时器
let blinkTimeout: number | null = null

// 播放状态
const isPlaying = ref(false)

// 当前视图：'edit' = 编辑区，'display' = 展示区
const currentView = ref<'edit' | 'display'>('edit')

// 主播放器实例
const mainHandler = ref<AbcHandler | null>(null)

// 单个音符播放器实例（独立实例）
const singleNoteHandler = ref<AbcHandler | null>(null)

// 弦标签
const stringLabels = computed(() => {
  return ["一弦", "二弦", "三弦", "四弦"].slice(0, stringCount)
})

// 反转的弦标签（从右往左）
const reversedStringLabels = computed(() => {
  return [...stringLabels.value].reverse()
})

// 检查是否有有效的 ABC 输入
const hasValidAbc = computed(() => {
  return abcInput.value && abcInput.value.trim().length > 0
})

// 音符名称列表
const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

// 解析音符字符串
function parseNoteString(noteStr: string): Note {
  const match = noteStr.match(/^([A-G]#?)(\d+)$/)
  if (!match) {
    return { name: "C", octave: 4 }
  }
  return {
    name: match[1],
    octave: parseInt(match[2], 10),
  }
}

// 获取音符在半音阶中的索引
function getNoteIndex(name: string): number {
  return noteNames.indexOf(name)
}

// 获取指定弦和品的音符
function getNote(stringIndex: number, fret: number): Note {
  const openStrings = [
    parseNoteString(tuning.value.string4),
    parseNoteString(tuning.value.string3),
    parseNoteString(tuning.value.string2),
    parseNoteString(tuning.value.string1),
  ]

  if (stringIndex < 0 || stringIndex >= stringCount) {
    throw new Error(`Invalid string index: ${stringIndex}`)
  }
  if (fret < 0 || fret > fretCount) {
    throw new Error(`Invalid fret: ${fret}`)
  }

  const openString = openStrings[stringIndex]
  const openStringIndex = getNoteIndex(openString.name)
  const targetIndex = (openStringIndex + fret) % 12
  const octaveIncrease = Math.floor((openStringIndex + fret) / 12)

  return {
    name: noteNames[targetIndex],
    octave: openString.octave + octaveIncrease,
  }
}

// 根据音符查找月琴上的位置
function findPositions(note: Note): YueQinPosition[] {
  const positions: YueQinPosition[] = []
  const targetIndex = getNoteIndex(note.name)

  for (let stringIndex = 0; stringIndex < stringCount; stringIndex++) {
    const openStrings = [
      parseNoteString(tuning.value.string4),
      parseNoteString(tuning.value.string3),
      parseNoteString(tuning.value.string2),
      parseNoteString(tuning.value.string1),
    ]

    const openString = openStrings[stringIndex]
    const openStringIndex = getNoteIndex(openString.name)

    let fret = targetIndex - openStringIndex
    let octave = openString.octave

    while (fret < 0) {
      fret += 12
      octave += 1
    }

    while (fret > fretCount) {
      fret -= 12
      octave -= 1
    }

    if (fret >= 0 && fret <= fretCount && octave === note.octave) {
      positions.push({ stringIndex, fret })
    }
  }

  // 返回最佳位置（品位最小的）
  if (positions.length === 0) {
    return []
  }

  positions.sort((a, b) => a.fret - b.fret)
  return [positions[0]]
}

// 获取音符名称
function getNoteName(stringIndex: number, fret: number): string {
  const note = getNote(stringIndex, fret)
  return `${note.name}${note.octave}`
}

// 判断是否是当前播放的位置
function isCurrentPosition(stringIndex: number, fret: number): boolean {
  if (!currentPosition.value) {
    return false
  }
  return currentPosition.value.stringIndex === stringIndex && currentPosition.value.fret === fret
}


// 处理 ABC 输入变化

function handleAbcInput() {

  // 可以在这里添加输入验证

}



// 更新定调

function updateTuning() {

  // 定调更新后，清除当前显示

  currentNote.value = null

  currentPosition.value = null

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
    console.error("播放失败:", error)
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
  currentPosition.value = null
}

// 切换播放/停止
async function togglePlayback() {
  if (isPlaying.value) {
    stop()
  } else {
    await play()
  }
}

// 播放单个音符

async function playSingleNote(stringIndex: number, fret: number) {

  try {

    // 获取音符（科学记谱法）

    const note = getNote(stringIndex, fret)

    const scientificNote = `${note.name}${note.octave}`

    // 使用 scientificToAbc 转换科学记谱法到 ABC 记谱法

    const conversionOptions: ScientificConversionOptions = {

      key: options.value.key,

      meter: options.value.meter,

      tempo: options.value.tempo,

      unitNoteLength: options.value.unitNoteLength,

      title: 'Single Note'

    }

    const abcString = scientificToAbc(scientificNote, conversionOptions)

    // 创建自定义游标控制器

    const cursorControl: any = {

      onEvent: (event: any) => {

        // 处理音符事件

        if (event && event.midiPitches && event.midiPitches.length > 0) {

          const midiPitchObj = event.midiPitches[0]

          const midiPitch = midiPitchObj.pitch

          const noteName = midiPitchToNoteName(midiPitch)



          if (noteName) {

            // 显示当前音符

            currentNote.value = noteName

            currentPosition.value = { stringIndex, fret }

          }

        }

      },

      onFinished: () => {

        // 播放完成后清除显示

        currentNote.value = null

        currentPosition.value = null

      }

    }

    // 使用独立的单个音符处理器
    if (!singleNoteHandler.value) {
      singleNoteHandler.value = new AbcHandler({
        abcString: abcString,
        enablePlayback: true,
        enableRender: false,
        tempo: parseInt(options.value.tempo, 10),
        cursorControl: cursorControl,
      })
    } else {
      // 更新 ABC 字符串
      await singleNoteHandler.value.updateAbcString(abcString)
    }

    // 停止单个音符处理器之前的播放
    singleNoteHandler.value.stop()

    // 播放单个音符
    await singleNoteHandler.value.play()
  } catch (error) {
    console.error('播放单个音符失败:', error)
  }
}

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



// 组件挂载时初始化
onMounted(() => {

      // 创建自定义游标控制器

    const cursorControl: any = {

      onBeat: (beatNumber: number, totalBeats: number, totalTime: number) => {

        // 不需要处理

      },

      onEvent: (event: any) => {

              // 处理音符事件

              if (event && event.midiPitches && event.midiPitches.length > 0) {

                const midiPitchObj = event.midiPitches[0]

                const midiPitch = midiPitchObj.pitch

                const noteName = midiPitchToNoteName(midiPitch)



                if (noteName) {

                  // 查找月琴上的位置

                  const positions = findPositions(noteName)

                  const position = positions.length > 0 ? positions[0] : null



                  // 清除之前的定时器

                  if (blinkTimeout !== null) {

                    clearTimeout(blinkTimeout)

                  }



                  // 先清除当前显示

                  currentNote.value = null

                  currentPosition.value = null



                  // 延迟一小段时间后显示新音符，产生闪烁效果

                  // 即使是同一个音符，也会有短暂的空白期，产生跳动效果

                  blinkTimeout = window.setTimeout(() => {

                    currentNote.value = noteName

                    currentPosition.value = position

                  }, 60) // 60ms 的闪烁间隔，确保每次都有跳动效果

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

        currentPosition.value = null

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
      currentPosition.value = null
    },
    cursorControl: cursorControl,
  })
})

// 组件卸载时清理
onUnmounted(() => {
  // 清除定时器
  if (blinkTimeout !== null) {
    clearTimeout(blinkTimeout)
    blinkTimeout = null
  }

  // 销毁主处理器实例，释放资源
  if (mainHandler.value) {
    mainHandler.value.dispose()
    mainHandler.value = null
  }

  // 销毁单个音符处理器实例，释放资源
  if (singleNoteHandler.value) {
    singleNoteHandler.value.dispose()
    singleNoteHandler.value = null
  }
})
</script>

<style scoped>
/* 统一使用 CSS 变量 */
.yueqin-container {
  padding: 1rem;
  background: var(--va-c-bg-soft);
  border-radius: 0.5rem;
  min-height: 600px;
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

.yueqin-layout {
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
  flex: 1 1 calc(20% - 0.5rem);
  min-width: 140px;
}

.option-item-full {
  flex-basis: 100%;
  min-width: 100%;
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

.option-select,
.option-input {
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

.option-input {
  cursor: text;
}

.option-select:hover,
.option-input:hover {
  border-color: var(--va-c-primary);
}

.option-select:focus,
.option-input:focus {
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
  padding: 0.5rem 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--va-c-divider);
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.note-info-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: nowrap;
  justify-content: center;
  width: 100%;
}

.note-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--va-c-primary);
  min-width: 30px;
  text-align: center;
}

.note-placeholder {
  font-size: 0.875rem;
  color: var(--va-c-text-light);
}

.note-position {
  font-size: 0.75rem;
  color: var(--va-c-text-light);
  background: var(--va-c-bg-soft);
  padding: 0.125rem 0.5rem;
  border-radius: 0.1875rem;
  white-space: nowrap;
}

.yueqin-display-section {
  background: var(--va-c-bg);
  border-radius: 0.5rem;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: auto;
}

.yueqin-display {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  min-height: 400px;
}

.tuning-settings {
  background: var(--va-c-bg-soft);
  border-radius: 0.5rem;
  padding: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.tuning-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--va-c-text-light);
  margin-bottom: 0.5rem;
  text-align: center;
}

.tuning-inputs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.tuning-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.tuning-input-group label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--va-c-text-light);
  text-align: center;
}

.tuning-input {
  padding: 0.25rem 0.375rem;
  border: 1px solid var(--va-c-divider);
  border-radius: 0.25rem;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  text-align: center;
  transition: border-color 0.2s;
  width: 100%;
  box-sizing: border-box;
  background: var(--va-c-bg);
  color: var(--va-c-text);
}

.tuning-input:focus {
  outline: none;
  border-color: var(--va-c-primary);
  box-shadow: 0 0 0 2px rgba(var(--va-c-primary-rgb), 0.1);
}

.tuning-input:hover {
  border-color: var(--va-c-primary);
}

.string-labels-top {
  display: flex;
  justify-content: space-around;
  padding: 0.3125rem;
  margin-bottom: 0.3125rem;
}

.string-label {
  font-weight: 600;
  text-align: center;
  min-width: 30px;
  font-size: 0.625rem;
  background: rgba(var(--va-c-primary-rgb), 0.1);
  color: var(--va-c-primary);
  padding: 0.1875rem 0.5rem;
  border-radius: 0.25rem;
}

.fretboard {
  flex: 1;
  padding: 0.375rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  min-height: 0;
  overflow: auto;
}

.fret-row {
  display: flex;
  align-items: stretch;
  gap: 0.375rem;
}

.fret-label-side {
  font-weight: 600;
  text-align: center;
  padding: 0 0.5rem;
  min-width: 25px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--va-c-bg-soft);
  border-radius: 0.25rem;
  font-size: 0.625rem;
  color: var(--va-c-text-light);
  flex-shrink: 0;
}

.fret {
  flex: 1;
  min-width: 20px;
  height: 24px;
  background: var(--va-c-bg);
  border: 1px solid var(--va-c-divider);
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  font-size: 0.625rem;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.fret::before {
  content: attr(data-note);
  position: absolute;
  font-size: 0.625rem;
  color: var(--va-c-text-light);
  opacity: 0.5;
  pointer-events: none;
}

.fret.fret-0 {
  font-weight: 600;
  background: rgba(var(--va-c-warning-rgb, 255, 152, 0), 0.1);
  border-color: var(--va-c-warning, #ff9800);
}

.fret.is-current {
  background: rgba(var(--va-c-warning-rgb, 255, 152, 0), 0.05);
  border-color: var(--va-c-warning, #ff9800);
}

.fret.is-current .indicator-dot {
  position: absolute;
  bottom: 2px;
  left: 2px;
  width: 8px;
  height: 8px;
  background: var(--va-c-warning, #ff9800);
  border-radius: 50%;
  box-shadow: 0 0 4px rgba(255, 152, 0, 0.6);
}

.note-display {
  font-size: 0.625rem;
  font-weight: 600;
  z-index: 1;
  position: absolute;
  opacity: 1;
  visibility: visible;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .yueqin-container {
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
  }

  .controls {
    gap: 0.5rem;
  }

  .btn {
    padding: 0.625rem 0.75rem;
    font-size: 0.8125rem;
    min-height: 44px;
  }

  .tuning-inputs {
    grid-template-columns: repeat(4, 1fr);
    gap: 0.375rem;
  }

  .tuning-input-group label {
    font-size: 0.625rem;
  }

  .tuning-input {
    font-size: 0.6875rem;
    padding: 0.25rem;
  }

  .string-label {
    font-size: 0.5625rem;
    padding: 0.125rem 0.375rem;
  }

  .fret-label-side {
    min-width: 20px;
    font-size: 0.5625rem;
    padding: 0 0.25rem;
  }

  .fret {
    min-width: 16px;
    height: 20px;
  }

  .fret::before {
    font-size: 0.5rem;
  }

  .note-display {
    font-size: 0.5rem;
  }

  .fret.is-current .indicator-dot {
    width: 6px;
    height: 6px;
    bottom: 1px;
    left: 1px;
  }

  .note-value {
    font-size: 0.875rem;
  }

  .note-position {
    font-size: 0.6875rem;
  }
}

@media (max-width: 480px) {
  .yueqin-container {
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

  .tuning-settings {
    padding: 0.5rem;
  }

  .tuning-title {
    font-size: 0.75rem;
    margin-bottom: 0.375rem;
  }

  .fretboard {
    padding: 0.25rem;
    gap: 0.25rem;
  }

  .fret-row {
    gap: 0.25rem;
  }

  .fret {
    min-width: 14px;
    height: 18px;
    border-radius: 0.1875rem;
  }

  .fret::before {
    font-size: 0.4375rem;
  }

  .note-display {
    font-size: 0.4375rem;
  }

  .fret-label-side {
    min-width: 16px;
    font-size: 0.5rem;
    padding: 0 0.125rem;
  }

  .string-label {
    font-size: 0.5rem;
    padding: 0.125rem 0.25rem;
  }

  .string-labels-top {
    padding: 0.1875rem;
    margin-bottom: 0.1875rem;
  }

  .current-note-info {
    padding: 0.375rem 0.625rem;
    min-height: 32px;
  }

  .note-value {
    font-size: 0.8125rem;
  }

  .note-position {
    font-size: 0.625rem;
    padding: 0.0625rem 0.375rem;
  }
}
</style>
