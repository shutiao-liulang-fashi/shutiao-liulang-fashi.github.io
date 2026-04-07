/**
 * 钢琴音符数据模块
 *
 * 钢琴键盘布局说明：
 * - 标准钢琴有 88 个键（52 个白键 + 36 个黑键）
 * - 从 A0（第0音）到 C8（最高音）
 * - 7 个完整八度 + 1 个小三度
 *
 * 音符命名规则（科学音高记谱法）：
 * - C, C#, D, D#, E, F, F#, G, G#, A, A#, B
 * - 八度数字从 0 开始（C0 是最低音）
 */

// 从 pianoTypes.ts 导入类型并重新导出
import type { Note, PianoKey, KeyboardMapping } from './pianoTypes'
export type { Note, PianoKey, KeyboardMapping }

// 导入科学记谱法转 ABC 记谱法的转换函数
import { scientificToAbc } from './scientificToAbc'

/**
 * 音符名称列表（半音阶）
 * 按音高顺序排列
 */
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

/**
 * 白键音符名称列表
 * 钢琴上的自然音阶
 */
export const WHITE_KEY_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const

/**
 * 黑键音符名称列表
 */
export const BLACK_KEY_NAMES = ['C#', 'D#', 'F#', 'G#', 'A#'] as const

/**
 * 音符的 MIDI 音高映射
 * MIDI 音高范围：21（A0）到 108（C8）
 */
export const MIDI_BASE = {
  C0: 12,  // C0 = 12
  A0: 21,  // A0 = 21 (钢琴最低音)
  C8: 108  // C8 = 108 (钢琴最高音)
} as const

/**
 * 生成指定八度的音符
 */
export function getNoteInOctave(noteName: string, octave: number): Note {
  const baseIndex = NOTE_NAMES.indexOf(noteName)
  const midiPitch = (octave + 1) * 12 + baseIndex

  // 使用 scientificToAbc 转换器生成 ABC 记谱法
  const scientific = `${noteName}${octave}`
  // scientificToAbc 返回完整 ABC 字符串，取最后一行并去除小节线得到纯音符
  const abcNotation = scientificToAbc(scientific)

  return {
    name: noteName,
    octave,
    midiPitch,
    isBlack: noteName.includes('#'),
    scientific,
    abcNotation,
    frequency: 440 * Math.pow(2, (midiPitch - 69) / 12) // A4 = 440Hz
  }
}

/**
 * MIDI 音高转音符信息
 */
export function midiToNote(midiPitch: number): Note {
  const octave = Math.floor(midiPitch / 12) - 1
  const noteIndex = midiPitch % 12
  const noteName = NOTE_NAMES[noteIndex]

  // 使用 scientificToAbc 转换器生成 ABC 记谱法
  const scientific = `${noteName}${octave}`
  const abcResult = scientificToAbc(scientific)
  // scientificToAbc 返回完整 ABC 字符串，取最后一行并去除小节线得到纯音符
  const abcNotation = abcResult.split('\n').pop()?.replace(/\|.*$/, '').trim() || scientific

  return {
    name: noteName,
    octave,
    midiPitch,
    isBlack: noteName.includes('#'),
    scientific,
    abcNotation,
    frequency: 440 * Math.pow(2, (midiPitch - 69) / 12)
  }
}

/**
 * 生成钢琴的所有 88 个键
 * 从 A0 到 C8
 */
export function generatePianoKeys(): PianoKey[] {
  const keys: PianoKey[] = []

  // 钢琴范围：A0 (MIDI 21) 到 C8 (MIDI 108)
  const startMidi = 21 // A0
  const endMidi = 108  // C8

  for (let midi = startMidi; midi <= endMidi; midi++) {
    const note = midiToNote(midi)

    // 计算在当前八度中的位置（白键位置）
    const noteInOctave = midi % 12

    // 白键位置映射（用于计算钢琴上的水平位置）
    // C=0, D=1, E=2, F=3, G=4, A=5, B=6
    const whiteKeyPositions: Record<string, number> = {
      'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6
    }

    // 计算该键在钢琴上的显示位置
    const octaveOffset = note.octave * 7
    const positionInOctave = note.isBlack ? -1 : whiteKeyPositions[note.name]
    const displayPosition = note.isBlack ? -1 : octaveOffset + positionInOctave

    keys.push({
      ...note,
      midiPitch: midi,
      displayPosition,
      isAccidental: note.isBlack,
      keyboardKey: '' // 稍后由键盘映射填充
    })
  }

  return keys
}

/**
 * 键盘映射配置
 * 将电脑键盘映射到钢琴键
 *
 * 设计原则：
 * - 使用 ASDFGHJKL 和 ZXCVBNM 行分别对应两个八度
 * - 第一行 (Z-M) 对应低音区
 * - 第二行 (A-;) 对应中音区
 *
 * 标准钢琴键盘布局（左手在下方，右手在上方）：
 * - 左手：2-9 数字键上方的一排和 Z-M 行
 * - 右手：A-; 行和 1-0 数字键
 */
export const KEYBOARD_MAPPINGS: Record<string, { midi: number; description: string }> = {
  // 低音八度（Z 行）- 对应 C3 到 B3
  'z': { midi: 48, description: 'C3' },   // C3
  'x': { midi: 50, description: 'D3' },   // D3
  'c': { midi: 52, description: 'E3' },   // E3
  'v': { midi: 53, description: 'F3' },   // F3
  'b': { midi: 55, description: 'G3' },   // G3
  'n': { midi: 57, description: 'A3' },  // A3
  'm': { midi: 59, description: 'B3' },   // B3

  // 中音八度（A 行）- 对应 C4 到 B4（中央 C 八度）
  'a': { midi: 60, description: 'C4' },  // C4 (中央 C)
  's': { midi: 62, description: 'D4' },   // D4
  'd': { midi: 64, description: 'E4' },   // E4
  'f': { midi: 65, description: 'F4' },   // F4
  'g': { midi: 67, description: 'G4' },   // G4
  'h': { midi: 69, description: 'A4' },   // A4
  'j': { midi: 71, description: 'B4' },   // B4

  // 高音八度（Q 行）- 对应 C5 到 B5
  'q': { midi: 72, description: 'C5' },   // C5
  'w': { midi: 74, description: 'D5' },   // D5
  'e': { midi: 76, description: 'E5' },   // E5
  'r': { midi: 77, description: 'F5' },   // F5
  't': { midi: 79, description: 'G5' },   // G5
  'y': { midi: 81, description: 'A5' },   // A5
  'u': { midi: 83, description: 'B5' },   // B5

  // 最高音八度（数字行）- 对应 C6 到 B6
  '1': { midi: 84, description: 'C6' },  // C6
  '2': { midi: 86, description: 'D6' },  // D6
  '3': { midi: 88, description: 'E6' },  // E6
  '4': { midi: 89, description: 'F6' },   // F6
  '5': { midi: 91, description: 'G6' },  // G6
  '6': { midi: 93, description: 'A6' },   // A6
  '7': { midi: 95, description: 'B6' },   // B6
}

/**
 * 黑键的计算机键盘映射
 * 黑键使用 Shift + 对应的白键字母
 */
export const BLACK_KEY_MAPPINGS: Record<string, { midi: number; description: string }> = {
  // Shift + 低音八度白键 = 黑键
  'Z': { midi: 49, description: 'C#3' },  // C#3
  'X': { midi: 51, description: 'D#3' },  // D#3
  // C 行没有黑键（E-F 是相邻的）
  'V': { midi: 54, description: 'F#3' },  // F#3
  'B': { midi: 56, description: 'G#3' },  // G#3
  'N': { midi: 58, description: 'A#3' },  // A#3

  // Shift + 中音八度白键 = 黑键
  'A': { midi: 61, description: 'C#4' },  // C#4
  'S': { midi: 63, description: 'D#4' },  // D#4
  // D 行没有黑键
  'F': { midi: 66, description: 'F#4' },  // F#4
  'G': { midi: 68, description: 'G#4' },  // G#4
  'H': { midi: 70, description: 'A#4' },  // A#4

  // Shift + 高音八度白键 = 黑键
  'Q': { midi: 73, description: 'C#5' },  // C#5
  'W': { midi: 75, description: 'D#5' },  // D#5
  // E 行没有黑键
  'R': { midi: 78, description: 'F#5' },  // F#5
  'T': { midi: 80, description: 'G#5' },  // G#5
  'Y': { midi: 82, description: 'A#5' },  // A#5
}

/**
 * 获取指定范围的钢琴键
 */
export function getPianoKeysRange(
  startOctave: number = 2,
  endOctave: number = 6
): PianoKey[] {
  const allKeys = generatePianoKeys()
  return allKeys.filter(key =>
    key.octave >= startOctave && key.octave <= endOctave
  )
}

/**
 * 获取可视范围内的钢琴键（优化显示）
 * 只返回实际会显示在钢琴上的键
 */
export function getVisiblePianoKeys(
  startNote: string = 'C',
  startOctave: number = 2,
  endNote: string = 'C',
  endOctave: number = 7
): PianoKey[] {
  const allKeys = generatePianoKeys()

  const startMidi = midiToNote(MIDI_BASE.C0).midiPitch + // 基准
    (startOctave * 12) +
    NOTE_NAMES.indexOf(startNote)

  const endMidi = midiToNote(MIDI_BASE.C0).midiPitch +
    (endOctave * 12) +
    NOTE_NAMES.indexOf(endNote)

  return allKeys.filter(key =>
    key.midiPitch >= startMidi && key.midiPitch <= endMidi
  )
}

/**
 * 将 ABC 音符转换为 MIDI 音高
 * ABC 音符格式：小写字母 = 低一个八度，大写字母 = 原始八度
 */
export function abcNoteToMidi(abcNote: string, baseOctave: number = 4): number {
  const noteMap: Record<string, number> = {
    'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11,
    'c': -12, 'd': -10, 'e': -8, 'f': -7, 'g': -5, 'a': -3, 'b': -1
  }

  // 处理升降号
  let offset = 0
  let note = abcNote

  if (abcNote.includes('^')) {
    offset = 1
    note = abcNote.replace('^', '')
  } else if (abcNote.includes('_')) {
    offset = -1
    note = abcNote.replace('_', '')
  } else if (abcNote.includes('=')) {
    offset = 0
    note = abcNote.replace('=', '')
  }

  const noteOffset = noteMap[note[0]] ?? 0
  const baseMidi = (baseOctave + 1) * 12 + noteOffset

  return baseMidi + offset
}

/**
 * 钢琴调律信息
 * 描述十二平均律
 */
export const PIANO_TUNING_INFO = {
  system: '十二平均律 (Equal Temperament)',
  a4Frequency: 440, // Hz
  a4Midi: 69,
  description: '标准钢琴使用十二平均律，将一个八度分成12个等半音，每个半音的频率比为 2^(1/12) ≈ 1.05946',
  octaves: 7 + 1/3, // 7 个完整八度 + 小三度
  totalKeys: 88,
  whiteKeys: 52,
  blackKeys: 36
} as const

/**
 * 键盘提示文字
 */
export const KEYBOARD_HINTS = {
  subtitle: '使用电脑键盘演奏钢琴',
  whiteKeys: '白键: Z-M (低音) | A-J (中音) | Q-U (高音)',
  blackKeys: '黑键: Shift + 对应白键',
  special: '提示：按多个键可演奏和弦'
} as const
