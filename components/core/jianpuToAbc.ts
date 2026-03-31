/**
 * 简谱到 ABC 记谱法转换工具
 * 基于 ABC 标准 v2.1
 */

import {
  parseAbcHeader,
  extractAbcBody,
  generateHeader,
  mergeHeaders,
  headerToString,
  type AbcHeader
} from './abcToAbc';

export interface ConversionOptions {
  /** 调性，默认 C */
  key?: string;
  /** 拍号，默认 4/4 */
  meter?: string;
  /** 速度，默认 120 */
  tempo?: string;
  /** 记录单位，默认 1/4 */
  unitNoteLength?: string;
  /** 标题 */
  title?: string;
  /** 基音（简谱1对应的音名），默认 C4 */
  baseNote?: string;
}

/**
 * 解析后的简谱音符
 */
export interface ParsedJianpuNote {
  /** 简谱数字 (1-7) */
  digit: string;
  /** 升降号 (sharp/flat/natural) */
  accidental: '#' | 'b' | 'n' | '';
  /** 八度偏移（相对于基音） */
  octaveOffset: number;
  /** 时值修饰符 */
  durationModifiers: string[];
  /** 连音线标记 */
  hasTie: boolean;
  /** 是否为休止符 */
  isRest: boolean;
  /** 特殊符号（小节线、反复记号等） */
  specialSymbol?: string;
  /** 三连音或其他连音标记 */
  tuplet?: { count: number };
}

/**
 * 简谱到 ABC 记谱法转换函数
 * @param jianpuNotes 简谱音符字符串（可能包含 ABC header）
 * @param options 转换选项
 * @returns ABC 记谱法字符串
 */
export function jianpuToAbc(
  jianpuNotes: string,
  options: ConversionOptions = {}
): string {
  const {
    key = 'C',
    meter = '4/4',
    tempo = '120',
    unitNoteLength = '1/4',
    title = 'Jianpu Notation',
    baseNote = 'C4'
  } = options;

  // 清理输入
  const cleanedInput = jianpuNotes.trim();
  if (!cleanedInput) {
    return '';
  }

  // 解析输入中的 ABC header（如果有）
  const userHeader = parseAbcHeader(cleanedInput);
  const userBody = extractAbcBody(cleanedInput);

  // 如果没有 ABC header，则使用整个输入作为音符主体
  const notesBody = userBody || cleanedInput;

  // 从 userHeader 中提取 BN 字段作为 baseNote（优先级高于 options 中的 baseNote）
  const actualBaseNote = userHeader.BN || baseNote;

  // 解析并转换音符
  const notes = parseJianpuNotes(notesBody);
  // 转换音符并保留换行符
  const convertedNotes = notes.map(note => convertJianpuNoteToAbc(note, actualBaseNote));
  // 构建最终的 ABC 字符串，保留换行符
  let abcNotes = '';
  let needSpace = false; // 标记是否需要在下一个音符前添加空格

  for (let i = 0; i < convertedNotes.length; i++) {
    const current = convertedNotes[i];

    if (current === '\n') {
      // 换行符：保留换行符
      abcNotes += '\n';
      needSpace = false;
    } else if (current) {
      // 检查是否为括号（括号不需要前导空格）
      const isBracket = current === '(' || current === ')';

      // 括号不需要前导空格
      if (!isBracket && needSpace) {
        abcNotes += ' ';
      }
      abcNotes += current;
      // 括号后不需要空格，其他符号和音符后需要空格
      needSpace = !isBracket;
    }
    // 空字符串跳过
  }

  // 生成默认 ABC 头部
  const defaultHeader = generateHeader({
    title,
    meter,
    tempo,
    unitNoteLength,
    key
  });

  // 合并头部（用户传入的优先）
  const mergedHeader = mergeHeaders(userHeader, defaultHeader);

  // 将头部对象转换为 ABC 字符串
  const headerString = headerToString(mergedHeader);

  return `${headerString}\n${abcNotes}`;
}

/**
 * 解析简谱音符字符串
 */
function parseJianpuNotes(jianpuNotes: string): ParsedJianpuNote[] {
  const tokens = tokenizeJianpu(jianpuNotes);
  return tokens.map(parseJianpuToken);
}

/**
 * 将简谱字符串分解为标记
 */
function tokenizeJianpu(input: string): string[] {
  // 移除多余空格，但保留换行符
  const cleaned = input.trim();
  if (!cleaned) return [];

  const tokens: string[] = [];
  let current = '';

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];

    // 空格和制表符分隔标记
    if (char === ' ' || char === '\t') {
      if (current) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    // 换行符保留为单独的标记
    if (char === '\n') {
      if (current) {
        tokens.push(current);
        current = '';
      }
      tokens.push('\n'); // 保留换行符作为标记
      continue;
    }

    // 特殊符号：小节线、反复记号等
    if (char === '|' || char === ':') {
      if (current) {
        tokens.push(current);
        current = '';
      }

      // 检查是否是组合符号
      if (i + 1 < cleaned.length) {
        const nextChar = cleaned[i + 1];
        const twoChars = char + nextChar;

        if (['||', '|:', ':|', '::'].includes(twoChars)) {
          tokens.push(twoChars);
          i++;
          continue;
        }

        if (i + 2 < cleaned.length) {
          const thirdChar = cleaned[i + 2];
          const threeChars = twoChars + thirdChar;

          if (['|::', '::|'].includes(threeChars)) {
            tokens.push(threeChars);
            i += 2;
            continue;
          }
        }
      }

      tokens.push(char);
      continue;
    }

    // 其他特殊符号（括号）
    if (['(', ')', '[', ']'].includes(char)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      tokens.push(char);
      continue;
    }

    current += char;
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}

/**
 * 解析单个简谱标记
 */
function parseJianpuToken(token: string): ParsedJianpuNote {
  // 检查是否为换行符
  if (token === '\n') {
    return {
      digit: '',
      accidental: '',
      octaveOffset: 0,
      durationModifiers: [],
      hasTie: false,
      isRest: false,
      specialSymbol: '\n'
    };
  }

  // 检查是否为特殊符号
  const specialSymbols = ['|', ':', '(', ')', '[', ']', '||', '|:', ':|', '::', '|::', '::|'];
  if (specialSymbols.includes(token)) {
    return {
      digit: '',
      accidental: '',
      octaveOffset: 0,
      durationModifiers: [],
      hasTie: false,
      isRest: false,
      specialSymbol: token
    };
  }

  // 检查是否为三连音标记 (3)
  if (token === '(3' || token === '(2' || token === '(4' || token === '(5' || token === '(6') {
    const count = parseInt(token.substring(1), 10);
    return {
      digit: '',
      accidental: '',
      octaveOffset: 0,
      durationModifiers: [],
      hasTie: false,
      isRest: false,
      specialSymbol: token,
      tuplet: { count }
    };
  }

  // 检查是否为休止符（简谱用 - 或 0 表示）
  if (token === '-' || token === '0') {
    return {
      digit: '',
      accidental: '',
      octaveOffset: 0,
      durationModifiers: [],
      hasTie: false,
      isRest: true,
      specialSymbol: undefined
    };
  }

  // 解析音符
  // 格式: [1-7][#b]?[',]*[\/\d-=.]*
  // 例如：1, 1' 1# 1b 1- 1- 1_ 1= 1. 1'- 1'. 6/2 1'/2 3'/4 等
  const match = token.match(/^([1-7])([#b])?([',]*)([\/\d-=.]*)$/);
  if (!match) {
    // 无法解析，返回空音符
    return {
      digit: '',
      accidental: '',
      octaveOffset: 0,
      durationModifiers: [],
      hasTie: false,
      isRest: false,
      specialSymbol: undefined
    };
  }

  const [, digit, accidental, octaveChars, modifiers] = match;

  // 计算八度偏移
  let octaveOffset = 0;
  if (octaveChars) {
    // 计算 ' 和 , 的数量
    const highOctaves = (octaveChars.match(/'/g) || []).length;
    const lowOctaves = (octaveChars.match(/,/g) || []).length;
    octaveOffset = highOctaves - lowOctaves;
  }

  // 解析时值修饰符
  const durationModifiers: string[] = [];
  let hasTie = false;

  if (modifiers) {
    let i = 0;
    while (i < modifiers.length) {
      const char = modifiers[i];

      if (char === '/') {
        // 分数时值 /2, /4, /8
        let fraction = '';
        i++;
        while (i < modifiers.length && /\d/.test(modifiers[i])) {
          fraction += modifiers[i];
          i++;
        }
        if (fraction) {
          durationModifiers.push(`/${fraction}`);
        }
      } else if (char === '-') {
        // 连音线标记（最后一个-）
        if (i === modifiers.length - 1) {
          hasTie = true;
        } else {
          // 延长线，添加时值
          durationModifiers.push('2');
        }
        i++;
      } else if (char === '_') {
        // 减半时值（八分音符）
        durationModifiers.push('/2');
        i++;
      } else if (char === '=') {
        // 四分之一时值（十六分音符）
        durationModifiers.push('/4');
        i++;
      } else if (char === '.') {
        // 附点
        durationModifiers.push('.');
        i++;
      } else if (/\d/.test(char)) {
        // 整数时值 2, 4, 8
        let number = '';
        while (i < modifiers.length && /\d/.test(modifiers[i])) {
          number += modifiers[i];
          i++;
        }
        if (number) {
          durationModifiers.push(number);
        }
      } else {
        i++;
      }
    }
  }

  return {
    digit,
    accidental: (accidental as '#' | 'b' | 'n') || '',
    octaveOffset,
    durationModifiers,
    hasTie,
    isRest: false,
    specialSymbol: undefined
  };
}

/**
 * 简谱数字到音名的映射
 */
const digitToNoteName: Record<string, string> = {
  '1': 'C',
  '2': 'D',
  '3': 'E',
  '4': 'F',
  '5': 'G',
  '6': 'A',
  '7': 'B'
};

/**
 * 半音偏移到ABC降号音名的映射
 */
const semitoneOffsetToFlatNoteName: Record<number, string> = {
  0: 'C',
  1: '_D',  // C# = Db
  2: 'D',
  3: '_E',  // D# = Eb
  4: 'E',
  5: 'F',
  6: '_G',  // F# = Gb
  7: 'G',
  8: '_A',  // G# = Ab
  9: 'A',
  10: '_B', // A# = Bb
  11: 'B'
};

/**
 * 音名到音级的映射（1-7）
 */
const digitToScaleDegree: Record<string, number> = {
  'C': 1,
  'D': 2,
  'E': 3,
  'F': 4,
  'G': 5,
  'A': 6,
  'B': 7
};

/**
 * 音级到半音间隔的映射（自然音阶）
 */
const scaleDegreeToSemitone: Record<number, number> = {
  1: 2,  // 1-2: C-D = 2半音
  2: 2,  // 2-3: D-E = 2半音
  3: 1,  // 3-4: E-F = 1半音
  4: 2,  // 4-5: F-G = 2半音
  5: 2,  // 5-6: G-A = 2半音
  6: 2,  // 6-7: A-B = 2半音
  7: 1   // 7-1: B-C = 1半音
};

/**
 * 大调音阶偏移（相对于基音）
 */
const majorScaleOffset = [0, 2, 4, 5, 7, 9, 11];

/**
 * 简谱数字到半音偏移（相对于C）
 */
const digitToSemitoneOffset: Record<string, number> = {
  '1': 0,  // C
  '2': 2,  // D
  '3': 4,  // E
  '4': 5,  // F
  '5': 7,  // G
  '6': 9,  // A
  '7': 11  // B
};

/**
 * 音名数组（按半音排列）
 */
const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * 获取音名的半音位置
 */
function getNoteSemitone(noteName: string): number {
  return noteNames.indexOf(noteName);
}

/**
 * 获取升降号的偏移
 */
function getAccidentalOffset(accidental: string): number {
  switch (accidental) {
    case '#':
      return 1;
    case 'b':
      return -1;
    case 'n':
      return 0;
    default:
      return 0;
  }
}

/**
 * 解析基音（例如 C4 → 音名=C, 八度=4）
 */
function parseBaseNote(baseNote: string): { noteName: string; octave: number } {
  const match = baseNote.match(/^([A-G])([#b])?(\d)$/);
  if (!match) {
    return { noteName: 'C', octave: 4 }; // 默认 C4
  }

  const [, noteName, accidental, octaveStr] = match;
  return {
    noteName,
    octave: parseInt(octaveStr, 10)
  };
}

/**
 * 音名到半音偏移的映射
 */
const noteNameToSemitoneOffset: Record<string, number> = {
  'C': 0,
  'D': 2,
  'E': 4,
  'F': 5,
  'G': 7,
  'A': 9,
  'B': 11
};

/**
 * 半音偏移到ABC音名的映射（包含升降号）
 */
const semitoneOffsetToNoteName: Record<number, string> = {
  0: 'C',
  1: '^C',  // C#
  2: 'D',
  3: '^D',  // D#
  4: 'E',
  5: 'F',
  6: '^F',  // F#
  7: 'G',
  8: '^G',  // G#
  9: 'A',
  10: '^A', // A#
  11: 'B'
};

/**
 * 将解析后的简谱音符转换为 ABC 记谱法
 */
function convertJianpuNoteToAbc(note: ParsedJianpuNote, baseNote: string): string {
  // 换行符直接返回
  if (note.specialSymbol === '\n') {
    return '\n';
  }

  // 特殊符号直接返回
  if (note.specialSymbol) {
    return note.specialSymbol;
  }

  // 空音符返回空字符串
  if (!note.digit && !note.isRest) {
    return '';
  }

  // 休止符
  if (note.isRest) {
    let rest = 'z';
    if (note.durationModifiers.length > 0) {
      rest += note.durationModifiers.join('');
    }
    return rest;
  }

  // 解析基音
  const { noteName: baseNoteName, octave: baseOctave } = parseBaseNote(baseNote);

  // 计算基音的半音位置
  const baseSemitone = getNoteSemitone(baseNoteName);

  // 获取大调音阶偏移
  const scaleOffset = majorScaleOffset[note.digit - 1];

  // 获取升降号的偏移
  const accidentalOffset = getAccidentalOffset(note.accidental);

  // 计算目标音符的半音位置
  let targetSemitone = (baseSemitone + scaleOffset + accidentalOffset) % 12;
  if (targetSemitone < 0) targetSemitone += 12;

  // 获取ABC音名（根据升降号选择不同的映射表）
  let abcNoteName: string;
  if (note.accidental === 'b') {
    // 使用降号映射表
    abcNoteName = semitoneOffsetToFlatNoteName[targetSemitone];
  } else {
    // 使用升号映射表（默认）
    abcNoteName = semitoneOffsetToNoteName[targetSemitone];
  }

  // 计算八度
  let octave = baseOctave + note.octaveOffset;

  // 检查是否跨越八度边界（例如：B# 应该是 C5，而不是 B4#）
  const originalSemitone = (baseSemitone + scaleOffset) % 12;
  if (note.accidental === '#' && originalSemitone >= 11) {
    // B# → C5
    abcNoteName = 'C';
    octave += 1;
  }

  // 转换八度
  let abcNote = convertOctave(abcNoteName, octave);

  // 添加时值修饰符
  if (note.durationModifiers.length > 0) {
    abcNote += note.durationModifiers.join('');
  }

  // 添加连音线
  if (note.hasTie) {
    abcNote += '-';
  }

  return abcNote;
}

/**
 * 转换八度（与scientificToAbc相同）
 */
function convertOctave(noteName: string, octave: number): string {
  // 分离升降号前缀和基础音名
  const accidentalMatch = noteName.match(/^([_^]?)([A-Ga-g])$/);
  if (!accidentalMatch) {
    // 如果格式不正确，直接返回原音名
    return noteName;
  }

  const [, accidental, baseNote] = accidentalMatch;

  if (octave < 4) {
    const commas = 4 - octave;
    return `${accidental}${baseNote.toUpperCase()}${','.repeat(commas)}`;
  } else if (octave === 4) {
    return `${accidental}${baseNote.toUpperCase()}`;
  } else if (octave === 5) {
    return `${accidental}${baseNote.toLowerCase()}`;
  } else {
    const apostrophes = octave - 5;
    return `${accidental}${baseNote.toLowerCase()}${'\''.repeat(apostrophes)}`;
  }
}

/**
 * 快速转换函数（使用默认选项）
 */
export function quickConvertJianpu(jianpuNotes: string): string {
  return jianpuToAbc(jianpuNotes);
}

/**
 * 批量转换多个简谱字符串
 */
export function batchConvertJianpu(
  jianpuNotesArray: string[],
  options?: ConversionOptions
): string[] {
  return jianpuNotesArray.map(notes => jianpuToAbc(notes, options));
}

/**
 * 验证简谱格式
 */
export function validateJianpuNotation(jianpuNotes: string): boolean {
  const tokens = tokenizeJianpu(jianpuNotes);
  return tokens.every(token => {
    // 特殊符号
    const specialSymbols = ['|', ':', '(', ')', '[', ']', '||', '|:', ':|', '::', '|::', '::|'];
    if (specialSymbols.includes(token)) {
      return true;
    }

    // 三连音标记
    if (/^\(\d$/.test(token)) {
      return true;
    }

    // 休止符
    if (token === '-' || token === '0') {
      return true;
    }

    // 音符
    const match = token.match(/^([1-7])([#b])?([',]*)([-_=.]*)$/);
    return match !== null;
  });
}
