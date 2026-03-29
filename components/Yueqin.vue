<template>
  <div class="yueqin-container">
    <div class="yueqin-layout">
      <!-- 左侧：输入和控制区 -->
      <div class="control-section">
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

        <!-- 控制按钮 -->
        <div class="controls">
          <button @click="play" :disabled="!hasValidAbc || isPlaying" class="btn btn-play">
            ▶ 播放
          </button>
          <button @click="stop" :disabled="!isPlaying" class="btn btn-stop">
            ⏹ 停止
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
      </div>

      <!-- 右侧：月琴展示区 -->
      <div class="yueqin-display-section">
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
import { AbcAudioPlayer } from "./core/abcjsHandler"

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
const abcInput = ref(`X:1
T:ABC谱
M:4/4
L:1/4
Q:120
K:C
A/2 c/2 |
d d/2 c/2 d/2 e/4 d/4 c/2 d/2 |
e/2 g/2 g/2 a/2 e e/2 g/2 |
d d/2 c/2 d/2 c/2 c/2 d/2 |
e2 z |
A/2 c/2 |
d d d/2 e/4 d/4 c/2 d/2 |
e/2 g/2 g/2 a/2 e g/2 e/2 |
d g/2 e/2 d/2 A/2 A/2 c/2 |
c2 z |`)

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

// 使用 AbcAudioPlayer（全局单例）
const audioPlayer = ref<AbcAudioPlayer | null>(null)

// 单个音符播放器（独立实例）
const singleNotePlayer = ref<AbcAudioPlayer | null>(null)

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

  if (!hasValidAbc.value || !audioPlayer.value) {

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



            // 先清除当前显示

            currentNote.value = null

            currentPosition.value = null



            // 清除之前的定时器

            if (blinkTimeout !== null) {

              clearTimeout(blinkTimeout)

            }



            // 延迟一小段时间后显示新音符，产生闪烁效果

            blinkTimeout = window.setTimeout(() => {

              currentNote.value = noteName

              currentPosition.value = position

            }, 80) // 80ms 的闪烁间隔

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



    // 使用 AbcAudioPlayer 播放

    await audioPlayer.value.play(processedAbc, {

      cursorControl,

      tempo: parseInt(options.value.tempo, 10)

    })



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



  if (audioPlayer.value) {

    audioPlayer.value.stop()

  }



  isPlaying.value = false

  currentNote.value = null

  currentPosition.value = null

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

    // 使用独立的单个音符播放器

    if (!singleNotePlayer.value) {

      singleNotePlayer.value = new AbcAudioPlayer()

    }

    // 停止单个音符播放器之前的播放

    singleNotePlayer.value.stop()

    // 播放单个音符

    await singleNotePlayer.value.play(abcString, {

      cursorControl,

      tempo: parseInt(options.value.tempo, 10)

    })

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
  // 创建播放器实例
  audioPlayer.value = new AbcAudioPlayer()

  // 设置播放回调
  audioPlayer.value.onPlay(() => {
    isPlaying.value = true
  })

  audioPlayer.value.onStop(() => {
    isPlaying.value = false
    currentNote.value = null
    currentPosition.value = null
  })
})

// 组件卸载时清理
onUnmounted(() => {
  // 清除定时器
  if (blinkTimeout !== null) {
    clearTimeout(blinkTimeout)
    blinkTimeout = null
  }

  // 销毁主播放器实例，释放资源
  if (audioPlayer.value) {
    audioPlayer.value.dispose()
    audioPlayer.value = null
  }

  // 销毁单个音符播放器实例，释放资源
  if (singleNotePlayer.value) {
    singleNotePlayer.value.dispose()
    singleNotePlayer.value = null
  }
})
</script>

<style scoped>
.yueqin-container {
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
  min-height: 600px;
}

.yueqin-layout {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 20px;
  height: 100%;
}

.control-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}



.options-section {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1 1 calc(20% - 8px);
  min-width: 140px;
}

.option-item-full {
  flex-basis: 100%;
  min-width: 100%;
}

.option-item label {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  white-space: nowrap;
}

.option-value {
  flex: 1;
  padding: 5px 8px;
  background: #f3f4f6;
  border-radius: 4px;
  color: #374151;
  font-size: 12px;
  font-family: 'Courier New', monospace;
}

.option-select,
.option-input {
  flex: 1;
  padding: 5px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  color: #374151;
  font-size: 12px;
  font-family: 'Courier New', monospace;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-input {
  cursor: text;
}

.option-select:hover,
.option-input:hover {
  border-color: #2196f3;
}

.option-select:focus,
.option-input:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  font-weight: bold;
  font-size: 14px;
  color: #333;
}

.abc-textarea {
  width: 100%;
  min-height: 200px;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  resize: vertical;
  background: #fafafa;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.abc-textarea:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

.controls {
  display: flex;
  gap: 10px;
}

.btn {
  flex: 1;
  padding: 10px 15px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
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
  background: #4caf50;
  color: white;
}

.btn-play:hover:not(:disabled) {
  background: #45a049;
}

.btn-stop {
  background: #f44336;
  color: white;
}

.btn-stop:hover:not(:disabled) {
  background: #d32f2f;
}

.current-note-info {
  background: white;
  border-radius: 6px;
  padding: 8px 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.note-info-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  justify-content: center;
  width: 100%;
}

.note-value {
  font-size: 16px;
  font-weight: bold;
  color: #2196f3;
  min-width: 30px;
  text-align: center;
}

.note-placeholder {
  font-size: 14px;
  color: #9ca3af;
}

.note-position {
  font-size: 12px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 3px;
  white-space: nowrap;
}

.yueqin-display-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: auto;
}

.yueqin-display {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 400px;
}


.tuning-settings {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}



.tuning-inputs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.tuning-input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tuning-input-group label {
  font-size: 11px;
  font-weight: bold;
  color: #666;
  text-align: center;
}

.tuning-input {
  padding: 4px 6px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  text-align: center;
  transition: border-color 0.2s;
  width: 100%;
  box-sizing: border-box;
}

.tuning-input:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

.tuning-input:hover {
  border-color: #2196f3;
}

.string-labels-top {
  display: flex;
  justify-content: space-around;
  padding: 5px;
  margin-bottom: 5px;
}

.string-label {
  font-weight: bold;
  text-align: center;
  min-width: 30px;
  font-size: 10px;
  background: #e3f2fd;
  padding: 3px 8px;
  border-radius: 4px;
}

.fretboard {
  flex: 1;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  overflow: auto;
}

.fret-row {
  display: flex;
  align-items: stretch;
  gap: 6px;
}

.fret-label-side {
  font-weight: bold;
  text-align: center;
  padding: 0 8px;
  min-width: 25px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 10px;
  flex-shrink: 0;
}

.fret {
  flex: 1;
  min-width: 20px;
  height: 24px;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  font-size: 10px;
}

.fret::before {
  content: attr(data-note);
  position: absolute;
  font-size: 10px;
  color: #999;
  opacity: 0.5;
  pointer-events: none;
}

.fret.fret-0 {
  font-weight: bold;
  background: #fff3e0;
  border-color: #ff9800;
}

.fret.is-current {
  background: #fffde7;
  border-color: #ff9800;
}

.fret.is-current .indicator-dot {
  position: absolute;
  bottom: 2px;
  left: 2px;
  width: 8px;
  height: 8px;
  background: #ff9800;
  border-radius: 50%;
  box-shadow: 0 0 4px rgba(255, 152, 0, 0.6);
}

.note-display {
  font-size: 10px;
  font-weight: bold;
  z-index: 1;
  position: absolute;
  opacity: 1;
  visibility: visible;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .yueqin-layout {
    grid-template-columns: 1fr;
  }

  .yueqin-display-section {
    min-height: 500px;
  }
}
</style>
