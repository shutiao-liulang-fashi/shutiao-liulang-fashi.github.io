/**
 * 钢琴组件类型定义
 */

/**
 * 音符信息
 */
export interface Note {
  /** 音符名称（C, C#, D, ...） */
  name: string
  /** 八度数字（0-8） */
  octave: number
  /** MIDI 音高（21-108） */
  midiPitch: number
  /** 是否为黑键 */
  isBlack: boolean
  /** 科学记谱法名称 */
  scientific: string
  /** ABC 记谱法表示 */
  abcNotation: string
  /** 频率（Hz） */
  frequency: number
}

/**
 * 钢琴按键
 */
export interface PianoKey extends Note {
  /** 在钢琴上的显示位置 */
  displayPosition: number
  /** 是否为变化音（升号/降号） */
  isAccidental: boolean
  /** 黑键对应的白键在过滤列表中的索引 */
  whiteKeyIndex?: number
}

/**
 * 钢琴组件属性
 */
export interface PianoProps {
  /** 起始八度（默认2） */
  startOctave?: number
  /** 结束八度（默认6） */
  endOctave?: number
  /** 是否启用音频播放 */
  enableAudio?: boolean
  /** 是否显示音符名称 */
  showNoteNames?: boolean
  /** 当前高亮的 MIDI 音高（用于 abcjs 联动） */
  highlightedMidi?: number | null
  /** 音量（0-1） */
  volume?: number
  /** 速度（BPM） */
  tempo?: number
  /** 是否显示乐理信息 */
  showTheoryInfo?: boolean
}

/**
 * 钢琴组件事件
 */
export interface PianoEmits {
  /** 按下音符时触发 */
  (e: 'noteDown', midi: number, note: Note): void
  /** 释放音符时触发 */
  (e: 'noteUp', midi: number): void
  /** 按键时触发（用于 abcjs 联动） */
  (e: 'keyPress', midi: number): void
}

/**
 * 演奏中的音符信息
 */
export interface PlayingNote {
  midiPitch: number
  startTime: number
}
