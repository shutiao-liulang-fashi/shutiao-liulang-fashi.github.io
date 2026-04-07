<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { jianpuToScientific, type JianpuToScientificOptions } from './core/jianpuToScientific'
import { jianpuToAbc, type ConversionOptions as JianpuConversionOptions } from './core/jianpuToAbc'
import { scientificToAbc, type ConversionOptions as ScientificConversionOptions } from './core/scientificToAbc'
import { abcToAbc, type AbcConversionOptions } from './core/abcToAbc'
import { AbcHandler } from './core/abcjsHandler'
import { xiyan } from './core/jianpu_xiyan'

// 基音选项
const baseNoteOptions = [
  { label: 'C3', value: 'C3' },
  { label: 'C#3', value: 'C#3' },
  { label: 'D3', value: 'D3' },
  { label: 'D#3', value: 'D#3' },
  { label: 'E3', value: 'E3' },
  { label: 'F3', value: 'F3' },
  { label: 'F#3', value: 'F#3' },
  { label: 'G3', value: 'G3' },
  { label: 'G#3', value: 'G#3' },
  { label: 'A3', value: 'A3' },
  { label: 'A#3', value: 'A#3' },
  { label: 'B3', value: 'B3' },
  { label: 'C4', value: 'C4' },
  { label: 'C#4', value: 'C#4' },
  { label: 'D4', value: 'D4' },
  { label: 'D#4', value: 'D#4' },
  { label: 'E4', value: 'E4' },
  { label: 'F4', value: 'F4' },
  { label: 'F#4', value: 'F#4' },
  { label: 'G4', value: 'G4' },
  { label: 'G#4', value: 'G#4' },
  { label: 'A4', value: 'A4' },
  { label: 'A#4', value: 'A#4' },
  { label: 'B4', value: 'B4' },
  { label: 'C5', value: 'C5' },
  { label: 'C#5', value: 'C#5' },
  { label: 'D5', value: 'D5' },
  { label: 'D#5', value: 'D#5' },
  { label: 'E5', value: 'E5' },
  { label: 'F5', value: 'F5' },
  { label: 'F#5', value: 'F#5' },
  { label: 'G5', value: 'G5' },
  { label: 'G#5', value: 'G#5' },
  { label: 'A5', value: 'A5' },
  { label: 'A#5', value: 'A#5' },
  { label: 'B5', value: 'B5' },
]

// 选中的参数
const selectedBaseNote = ref('C4')
const selectedMeter = ref('4/4')
const selectedTempo = ref('120')
const selectedUnitNoteLength = ref('1/4')
const selectedTitle = ref('')

// 拍号选项
const meterOptions = [
  { label: '2/4', value: '2/4' },
  { label: '3/4', value: '3/4' },
  { label: '4/4', value: '4/4' },
  { label: '6/8', value: '6/8' },
  { label: '3/8', value: '3/8' },
]

// 速度选项
const tempoOptions = [
  { label: '60', value: '60' },
  { label: '80', value: '80' },
  { label: '100', value: '100' },
  { label: '120', value: '120' },
  { label: '140', value: '140' },
  { label: '160', value: '160' },
]

// 单位音符长度选项
const unitNoteLengthOptions = [
  { label: '1/1', value: '1/1' },
  { label: '1/2', value: '1/2' },
  { label: '1/4', value: '1/4' },
  { label: '1/8', value: '1/8' },
  { label: '1/16', value: '1/16' },
]

// 输入框的值
const jianpuInput = ref('')
const scientificInput = ref('')
const abcInput = ref('')

jianpuInput.value = ''
scientificInput.value = jianpuToScientific(jianpuInput.value, {
  baseNote: selectedBaseNote.value
})
abcInput.value = jianpuToAbc(jianpuInput.value, {
  key: 'C',
  meter: selectedMeter.value,
  tempo: selectedTempo.value,
  unitNoteLength: selectedUnitNoteLength.value,
  title: selectedTitle.value || '简谱',
  baseNote: selectedBaseNote.value
})

// 当前选中的标签
const selectedTab = ref<'jianpu' | 'scientific' | 'abc'>('jianpu')

// 每栏的视图模式：'edit' = 编辑模式，'display' = 渲染模式
const jianpuView = ref<'edit' | 'display'>('edit')
const scientificView = ref<'edit' | 'display'>('edit')
const abcView = ref<'edit' | 'display'>('edit')

// 播放状态
const jianpuPlaying = ref(false)
const scientificPlaying = ref(false)
const abcPlaying = ref(false)

// ABC 处理器实例（每个记谱法一个）
const jianpuHandler = ref<AbcHandler | null>(null)
const scientificHandler = ref<AbcHandler | null>(null)
const abcHandler = ref<AbcHandler | null>(null)

// 渲染容器引用
const jianpuRenderContainer = ref<HTMLDivElement | null>(null)
const scientificRenderContainer = ref<HTMLDivElement | null>(null)
const abcRenderContainer = ref<HTMLDivElement | null>(null)

// 计算属性：从简谱计算ABC谱（用于渲染和播放）
const computedAbcFromJianpu = computed(() => {
  if (!jianpuInput.value || !jianpuInput.value.trim()) {
    return ''
  }
  try {
    return jianpuToAbc(jianpuInput.value, {
      key: 'C',
      meter: selectedMeter.value,
      tempo: selectedTempo.value,
      unitNoteLength: selectedUnitNoteLength.value,
      title: selectedTitle.value || '简谱',
      baseNote: selectedBaseNote.value
    })
  } catch (err) {
    console.error('简谱转ABC谱错误:', err)
    return ''
  }
})

// 计算属性：从简谱计算科学谱（用于显示）
const computedScientificFromJianpu = computed(() => {
  if (!jianpuInput.value || !jianpuInput.value.trim()) {
    return ''
  }
  try {
    return jianpuToScientific(jianpuInput.value, {
      baseNote: selectedBaseNote.value
    })
  } catch (err) {
    console.error('简谱转科学谱错误:', err)
    return ''
  }
})

// 计算属性：从科学谱计算ABC谱（用于渲染和播放）
const computedAbcFromScientific = computed(() => {
  if (!scientificInput.value || !scientificInput.value.trim()) {
    return ''
  }
  try {
    return scientificToAbc(scientificInput.value, {
      key: 'C',
      meter: selectedMeter.value,
      tempo: selectedTempo.value,
      unitNoteLength: selectedUnitNoteLength.value,
      title: selectedTitle.value || '科学谱'
    })
  } catch (err) {
    console.error('科学谱转ABC谱错误:', err)
    return ''
  }
})

// 计算属性：处理ABC谱输入（用于渲染和播放）
const processedAbcInput = computed(() => {
  if (!abcInput.value || !abcInput.value.trim()) {
    return ''
  }
  try {
    return abcToAbc(abcInput.value, {
      key: 'C',
      meter: selectedMeter.value,
      tempo: selectedTempo.value,
      unitNoteLength: selectedUnitNoteLength.value,
      title: selectedTitle.value || 'ABC谱'
    })
  } catch (err) {
    console.error('处理ABC谱错误:', err)
    return ''
  }
})

// 监听参数变化，触发对应输入框的重新转换和渲染
watch([selectedBaseNote, selectedMeter, selectedTempo, selectedUnitNoteLength, selectedTitle], async () => {
  // 更新简谱处理器的 tempo
  if (jianpuHandler.value) {
    jianpuHandler.value.setTempo(parseInt(selectedTempo.value))
  }
  // 更新科学谱处理器的 tempo
  if (scientificHandler.value) {
    scientificHandler.value.setTempo(parseInt(selectedTempo.value))
  }
  // 更新 ABC 谱处理器的 tempo
  if (abcHandler.value) {
    abcHandler.value.setTempo(parseInt(selectedTempo.value))
  }

  // 触发所有渲染更新
  updateJianpuRendering()
  updateScientificRendering()
  updateAbcRendering()
})

// 监听简谱输入，更新渲染
watch(() => jianpuInput.value, () => {
  updateJianpuRendering()
}, { immediate: true, flush: 'post' })

// 监听科学谱输入，更新渲染
watch(() => scientificInput.value, () => {
  updateScientificRendering()
}, { immediate: true, flush: 'post' })

// 监听 ABC 谱输入，更新渲染
watch(() => abcInput.value, () => {
  updateAbcRendering()
}, { immediate: true, flush: 'post' })

// 更新简谱渲染
async function updateJianpuRendering() {
  if (jianpuHandler.value && jianpuRenderContainer.value) {
    try {
      if (computedAbcFromJianpu.value) {
        await jianpuHandler.value.updateAbcString(computedAbcFromJianpu.value)
      } else {
        jianpuHandler.value.clear()
      }
    } catch (err) {
      console.error('简谱渲染错误:', err)
    }
  }
}

// 更新科学谱渲染
async function updateScientificRendering() {
  if (scientificHandler.value && scientificRenderContainer.value) {
    try {
      if (computedAbcFromScientific.value) {
        await scientificHandler.value.updateAbcString(computedAbcFromScientific.value)
      } else {
        scientificHandler.value.clear()
      }
    } catch (err) {
      console.error('科学谱渲染错误:', err)
    }
  }
}

// 更新 ABC 谱渲染
async function updateAbcRendering() {
  if (abcHandler.value && abcRenderContainer.value) {
    try {
      if (processedAbcInput.value) {
        await abcHandler.value.updateAbcString(processedAbcInput.value)
      } else {
        abcHandler.value.clear()
      }
    } catch (err) {
      console.error('ABC谱渲染错误:', err)
    }
  }
}

// 简谱播放功能
async function playJianpu() {
  if (!computedAbcFromJianpu.value || !jianpuHandler.value) return

  try {
    jianpuPlaying.value = true
    await jianpuHandler.value.play()
  } catch (err) {
    console.error('简谱播放错误:', err)
    jianpuPlaying.value = false
  }
}

function stopJianpu() {
  if (jianpuHandler.value) {
    jianpuHandler.value.stop()
    jianpuPlaying.value = false
  }
}

/**
 * 切换简谱播放/停止
 */
async function togglePlaybackJianpu() {
  if (jianpuPlaying.value) {
    stopJianpu()
  } else {
    await playJianpu()
  }
}

// 科学谱播放功能
async function playScientific() {
  if (!computedAbcFromScientific.value || !scientificHandler.value) return

  try {
    scientificPlaying.value = true
    await scientificHandler.value.play()
  } catch (err) {
    console.error('科学谱播放错误:', err)
    scientificPlaying.value = false
  }
}

function stopScientific() {
  if (scientificHandler.value) {
    scientificHandler.value.stop()
    scientificPlaying.value = false
  }
}

/**
 * 切换科学谱播放/停止
 */
async function togglePlaybackScientific() {
  if (scientificPlaying.value) {
    stopScientific()
  } else {
    await playScientific()
  }
}

// ABC 谱播放功能
async function playAbc() {
  if (!processedAbcInput.value || !abcHandler.value) return

  try {
    abcPlaying.value = true
    await abcHandler.value.play()
  } catch (err) {
    console.error('ABC谱播放错误:', err)
    abcPlaying.value = false
  }
}

function stopAbc() {
  if (abcHandler.value) {
    abcHandler.value.stop()
    abcPlaying.value = false
  }
}

/**
 * 切换 ABC 谱播放/停止
 */
async function togglePlaybackAbc() {
  if (abcPlaying.value) {
    stopAbc()
  } else {
    await playAbc()
  }
}

// 组件挂载时初始化
onMounted(async () => {
  await nextTick()

  // 初始化简谱处理器（播放+渲染）
  if (jianpuRenderContainer.value) {
    jianpuHandler.value = new AbcHandler({
      abcString: computedAbcFromJianpu.value,
      enablePlayback: true,
      enableRender: true,
      container: jianpuRenderContainer.value,
      tempo: parseInt(selectedTempo.value),
      onPlay: () => { jianpuPlaying.value = true },
      onStop: () => { jianpuPlaying.value = false },
      responsive: true
    })
    await jianpuHandler.value.render()
  }

  // 初始化科学谱处理器（播放+渲染）
  if (scientificRenderContainer.value) {
    scientificHandler.value = new AbcHandler({
      abcString: computedAbcFromScientific.value,
      enablePlayback: true,
      enableRender: true,
      container: scientificRenderContainer.value,
      tempo: parseInt(selectedTempo.value),
      onPlay: () => { scientificPlaying.value = true },
      onStop: () => { scientificPlaying.value = false },
      responsive: true
    })
    await scientificHandler.value.render()
  }

  // 初始化 ABC 谱处理器（播放+渲染）
  if (abcRenderContainer.value) {
    abcHandler.value = new AbcHandler({
      abcString: processedAbcInput.value,
      enablePlayback: true,
      enableRender: true,
      container: abcRenderContainer.value,
      tempo: parseInt(selectedTempo.value),
      onPlay: () => { abcPlaying.value = true },
      onStop: () => { abcPlaying.value = false },
      responsive: true
    })
    await abcHandler.value.render()
  }
})

// 组件卸载时清理资源
onBeforeUnmount(() => {
  if (jianpuHandler.value) {
    jianpuHandler.value.dispose()
    jianpuHandler.value = null
  }
  if (scientificHandler.value) {
    scientificHandler.value.dispose()
    scientificHandler.value = null
  }
  if (abcHandler.value) {
    abcHandler.value.dispose()
    abcHandler.value = null
  }
})
</script>

<template>
  <div class="any-note">
    <!-- 参数选择器 -->
    <div class="options-section">
      <!-- 基音选择器 -->
      <div class="option-item">
        <label for="baseNote">基音：</label>
        <select
          id="baseNote"
          v-model="selectedBaseNote"
          class="option-select"
        >
          <option
            v-for="option in baseNoteOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>

      <!-- 拍号选择器 -->
      <div class="option-item">
        <label for="meter">拍号：</label>
        <select
          id="meter"
          v-model="selectedMeter"
          class="option-select"
        >
          <option
            v-for="option in meterOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>

      <!-- 速度选择器 -->
      <div class="option-item">
        <label for="tempo">速度：</label>
        <select
          id="tempo"
          v-model="selectedTempo"
          class="option-select"
        >
          <option
            v-for="option in tempoOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>

      <!-- 单位音符长度选择器 -->
      <div class="option-item">
        <label for="unitNoteLength">单位音符：</label>
        <select
          id="unitNoteLength"
          v-model="selectedUnitNoteLength"
          class="option-select"
        >
          <option
            v-for="option in unitNoteLengthOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>

      <!-- 标题输入框 -->
      <div class="option-item">
        <label for="title">标题：</label>
        <input
          id="title"
          v-model="selectedTitle"
          type="text"
          class="option-input"
          placeholder="（可选）"
        />
      </div>
    </div>

    <!-- 标签切换栏 -->
    <div class="tab-bar">
      <button
        class="tab-button"
        :class="{ active: selectedTab === 'jianpu' }"
        @click="selectedTab = 'jianpu'"
      >
        简谱
      </button>
      <button
        class="tab-button"
        :class="{ active: selectedTab === 'scientific' }"
        @click="selectedTab = 'scientific'"
      >
        科学谱
      </button>
      <button
        class="tab-button"
        :class="{ active: selectedTab === 'abc' }"
        @click="selectedTab = 'abc'"
      >
        ABC谱
      </button>
    </div>

    <div class="note-section">
      <!-- 简谱部分 -->
      <div class="note-column" v-show="selectedTab === 'jianpu'">
        <!-- 视图切换按钮 -->
        <div class="view-toggle">
          <button
            class="toggle-btn"
            :class="{ active: jianpuView === 'edit' }"
            @click="jianpuView = 'edit'"
          >
            <span class="toggle-icon">✏️</span>
            <span class="toggle-text">编辑</span>
          </button>
          <button
            class="toggle-btn"
            :class="{ active: jianpuView === 'display' }"
            @click="jianpuView = 'display'"
          >
            <span class="toggle-icon">🎼</span>
            <span class="toggle-text">渲染</span>
          </button>
        </div>

        <!-- 编辑视图 -->
        <div v-show="jianpuView === 'edit'" class="edit-content">
          <div class="input-row">
            <textarea
              v-model="jianpuInput"
              class="note-input"
              placeholder="输入简谱..."
              rows="4"
            />
          </div>
        </div>

        <!-- 渲染视图 -->
        <div v-show="jianpuView === 'display'" class="display-content">
            <div class="button-group">
              <button
                class="btn btn-play"
                :class="{ 'playing': jianpuPlaying }"
                @click="togglePlaybackJianpu"
                :disabled="!jianpuInput.trim()"
              >
                <span class="icon">{{ jianpuPlaying ? '⏹' : '▶' }}</span>
                <span class="text">{{ jianpuPlaying ? '停止' : '播放' }}</span>
              </button>
            </div>
            
          <div class="abc-string-row">
            <div class="abc-string-container">
              <h4>科学谱：</h4>
              <pre class="abc-string">{{ computedScientificFromJianpu || '（无内容）' }}</pre>
            </div>
          </div>
          <div class="abc-string-row">
            <div class="abc-string-container">
              <h4>ABC 谱（用于渲染和播放）：</h4>
              <pre class="abc-string">{{ computedAbcFromJianpu || '（无内容）' }}</pre>
            </div>
          </div>
          <div class="render-row">
            <div ref="jianpuRenderContainer" class="render-container"></div>
          </div>
        </div>
      </div>

      <!-- 科学谱部分 -->
      <div class="note-column" v-show="selectedTab === 'scientific'">
        <!-- 视图切换按钮 -->
        <div class="view-toggle">
          <button
            class="toggle-btn"
            :class="{ active: scientificView === 'edit' }"
            @click="scientificView = 'edit'"
          >
            <span class="toggle-icon">✏️</span>
            <span class="toggle-text">编辑</span>
          </button>
          <button
            class="toggle-btn"
            :class="{ active: scientificView === 'display' }"
            @click="scientificView = 'display'"
          >
            <span class="toggle-icon">🎼</span>
            <span class="toggle-text">渲染</span>
          </button>
        </div>

        <!-- 编辑视图 -->
        <div v-show="scientificView === 'edit'" class="edit-content">
          <div class="input-row">
            <textarea
              v-model="scientificInput"
              class="note-input"
              placeholder="输入科学谱..."
              rows="4"
            />
          </div>
        </div>

        <!-- 渲染视图 -->
        <div v-show="scientificView === 'display'" class="display-content">
          <div class="button-group">
            <button
              class="btn btn-play"
              :class="{ 'playing': scientificPlaying }"
              @click="togglePlaybackScientific"
              :disabled="!scientificInput.trim()"
            >
              <span class="icon">{{ scientificPlaying ? '⏹' : '▶' }}</span>
              <span class="text">{{ scientificPlaying ? '停止' : '播放' }}</span>
            </button>
          </div>
          
          <div class="abc-string-row">
            <div class="abc-string-container">
              <h4>ABC 谱（用于渲染和播放）：</h4>
              <pre class="abc-string">{{ computedAbcFromScientific || '（无内容）' }}</pre>
            </div>
          </div>
          <div class="render-row">
            <div ref="scientificRenderContainer" class="render-container"></div>
          </div>
        </div>
      </div>

      <!-- ABC 谱部分 -->
      <div class="note-column" v-show="selectedTab === 'abc'">
        <!-- 视图切换按钮 -->
        <div class="view-toggle">
          <button
            class="toggle-btn"
            :class="{ active: abcView === 'edit' }"
            @click="abcView = 'edit'"
          >
            <span class="toggle-icon">✏️</span>
            <span class="toggle-text">编辑</span>
          </button>
          <button
            class="toggle-btn"
            :class="{ active: abcView === 'display' }"
            @click="abcView = 'display'"
          >
            <span class="toggle-icon">🎼</span>
            <span class="toggle-text">渲染</span>
          </button>
        </div>

        <!-- 编辑视图 -->
        <div v-show="abcView === 'edit'" class="edit-content">
          <div class="input-row">
            <textarea
              v-model="abcInput"
              class="note-input"
              placeholder="输入 ABC 谱..."
              rows="4"
            />
          </div>
        </div>

        <!-- 渲染视图 -->
        <div v-show="abcView === 'display'" class="display-content">
          <div class="button-group">
            <button
              class="btn btn-play"
              :class="{ 'playing': abcPlaying }"
              @click="togglePlaybackAbc"
              :disabled="!abcInput.trim()"
            >
              <span class="icon">{{ abcPlaying ? '⏹' : '▶' }}</span>
              <span class="text">{{ abcPlaying ? '停止' : '播放' }}</span>
            </button>
          </div>
          
          <div class="abc-string-row">
            <div class="abc-string-container">
              <h4>处理后的 ABC 谱（用于渲染和播放）：</h4>
              <pre class="abc-string">{{ processedAbcInput || '（无内容）' }}</pre>
            </div>
          </div>
          <div class="render-row">
            <div ref="abcRenderContainer" class="render-container"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 统一使用 CSS 变量 */
.any-note {
  width: 100%;
  padding: 1rem;
  background: var(--va-c-bg-soft);
  border-radius: 0.5rem;
}

.options-section {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.625rem;
  background: var(--va-c-bg);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex: 1 1 calc(20% - 0.5rem);
  min-width: 140px;
}

.option-item label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--va-c-text-light);
  white-space: nowrap;
}

.option-select,
.option-input {
  flex: 1;
  padding: 0.3125rem 0.5rem;
  border: 1px solid var(--va-c-divider);
  border-radius: 0.25rem;
  background: var(--va-c-bg-soft);
  color: var(--va-c-text);
  font-size: 0.75rem;
  font-family: 'Courier New', monospace;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
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

.tab-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 2px solid var(--va-c-divider);
  padding-bottom: 0.5rem;
}

.tab-button {
  flex: 1;
  padding: 0.625rem 1rem;
  border: none;
  background: transparent;
  color: var(--va-c-text-light);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 0.375rem 0.375rem 0 0;
  position: relative;
}

.tab-button:hover {
  background: var(--va-c-bg);
  color: var(--va-c-text);
}

.tab-button.active {
  background: var(--va-c-bg);
  color: var(--va-c-primary);
  font-weight: 600;
}

.tab-button.active::after {
  content: '';
  position: absolute;
  bottom: -0.5625rem;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--va-c-primary);
  border-radius: 2px 2px 0 0;
}

.note-section {
  display: block;
}

.note-column {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border: 1px solid var(--va-c-divider);
  border-radius: 0.5rem;
  padding: 1rem;
  background: var(--va-c-bg);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* 视图切换按钮 - 统一风格 */
.view-toggle {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--va-c-bg-soft);
  border-radius: 0.375rem;
}

.toggle-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  border: 2px solid var(--va-c-divider);
  border-radius: 0.375rem;
  background: var(--va-c-bg);
  color: var(--va-c-text-light);
  font-size: 0.8125rem;
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

.edit-content,
.display-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.input-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.note-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--va-c-divider);
  border-radius: 0.375rem;
  background: var(--va-c-bg-soft);
  color: var(--va-c-text);
  font-family: 'Courier New', monospace;
  font-size: 0.8125rem;
  resize: both;
  min-height: 200px;
  white-space: pre;
  overflow-x: auto;
  overflow-y: auto;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.note-input:focus {
  outline: none;
  border-color: var(--va-c-primary);
  box-shadow: 0 0 0 3px rgba(var(--va-c-primary-rgb), 0.1);
}

.button-group {
  display: flex;
  gap: 0.5rem;
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

.abc-string-row {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.abc-string-container {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.abc-string-container h4 {
  margin: 0;
  font-size: 0.75rem;
  color: var(--va-c-text-light);
}

.abc-string {
  padding: 0.75rem;
  background: var(--va-c-bg-soft);
  border-radius: 0.375rem;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  color: var(--va-c-text-light);
  white-space: pre;
  overflow-x: auto;
  max-height: 200px;
  overflow-y: auto;
}

.render-row {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.render-container {
  position: relative !important;
  width: 100%;
  min-width: 0;
  min-height: 120px;
  background: var(--va-c-bg-soft);
  border-radius: 0.375rem;
  padding: 0.75rem;
  overflow-x: auto;
}

.render-container :deep(svg) {
  display: block;
  max-width: 100%;
  height: auto;
}

@media (max-width: 768px) {
  .button-group {
    flex-wrap: wrap;
  }

  .btn {
    flex: 1 1 calc(33.333% - 0.375rem);
    min-width: 80px;
  }

  .options-section {
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem;
  }

  .option-item {
    flex: 1 1 100%;
    min-width: 0;
  }

  .tab-bar {
    margin-bottom: 0.75rem;
    padding-bottom: 0;
    border-bottom: none;
    gap: 0;
    background: var(--va-c-bg-soft);
    border-radius: 0.375rem;
    padding: 0.25rem;
  }

  .tab-button {
    padding: 0.5rem 0.625rem;
    font-size: 0.8125rem;
    border-radius: 0.25rem;
  }

  .tab-button.active::after {
    display: none;
  }

  .tab-button.active {
    background: var(--va-c-bg);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .note-section {
    padding: 0;
  }

  .note-column {
    padding: 0.75rem;
  }

  .note-input {
    min-height: 160px;
    font-size: 0.75rem;
  }

  .abc-string {
    font-size: 0.6875rem;
    max-height: 160px;
  }

  .render-container {
    padding: 0.5rem;
    min-height: 100px;
  }
}

@media (max-width: 480px) {
  .any-note {
    padding: 0.5rem;
  }

  .btn {
    min-height: 40px;
    font-size: 0.8125rem;
  }

  .btn .text {
    display: none;
  }

  .btn .icon {
    font-size: 1.125rem;
  }

  .note-input {
    min-height: 120px;
    font-size: 0.6875rem;
  }

  .abc-string-container h4 {
    font-size: 0.6875rem;
  }

  .abc-string {
    max-height: 120px;
    padding: 0.5rem;
  }
}
</style>
