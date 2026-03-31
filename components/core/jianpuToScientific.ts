/**
 * 简谱到科学谱转换工具
 * 基于 ABC 标准 v2.1
 */

import {
  parseAbcHeader,
  extractAbcBody,
  headerToString,
  type AbcHeader
} from './abcToAbc';

export interface JianpuToScientificOptions {
  /** 基音，默认 C4 */
  baseNote?: string;
}

/**
 * 解析后的音符
 */
interface ParsedNote {
  /** 简谱数字 1-7 */
  digit: number;
  /** 升降号 */
  accidental: '#' | 'b' | 'n' | '';
  /** 八度修饰符 */
  octaveModifier: number;
  /** 时值修饰符 */
  durationModifiers: string[];
  /** 是否为休止符 */
  isRest: boolean;
  /** 特殊符号（小节线、反复记号等） */
  specialSymbol?: string;
}

/**
 * 简谱到科学谱转换函数
 * @param jianpu 简谱字符串（可能包含 ABC header）
 * @param options 转换选项
 * @returns 科学谱字符串（如果输入有 ABC header，header 会原样保留）
 */
export function jianpuToScientific(
  jianpu: string,
  options: JianpuToScientificOptions = {}
): string {
  const {
    baseNote = 'C4'
  } = options;

  // 清理输入
  const cleanedInput = jianpu.trim();
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

  // 解析简谱
  const notes = parseJianpu(notesBody);

  // 转换为科学谱
  const scientificNotes = notes.map(note => convertNoteToScientific(note, actualBaseNote));

  // 构建最终的音符字符串，保留换行符
  let result = '';
  let needSpace = false; // 标记是否需要在下一个音符前添加空格

  for (let i = 0; i < scientificNotes.length; i++) {
    const current = scientificNotes[i];

    if (notes[i].specialSymbol === '\n') {
      // 换行符：保留换行符
      result += '\n';
      needSpace = false;
    } else if (current) {
      // 检查是否为括号（括号不需要前导空格）
      const isBracket = current === '(' || current === ')';

      // 括号不需要前导空格
      if (!isBracket && needSpace) {
        result += ' ';
      }
      result += current;
      // 括号后不需要空格，其他符号和音符后需要空格
      needSpace = !isBracket;
    }
  }


  // 如果有 ABC header，将 header 和 body 合并输出
  if (Object.keys(userHeader).length > 0) {
    const headerString = headerToString(userHeader);
    return `${headerString}\n${result}`;
  }

  // 没有 header，只返回转换后的音符
  return result;
}

/**
 * 解析简谱字符串
 */
function parseJianpu(jianpu: string): ParsedNote[] {
  const tokens = tokenizeJianpu(jianpu);
  return tokens.map(parseJianpuToken);
}

/**
 * 将简谱字符串分解为标记
 */
function tokenizeJianpu(input: string): string[] {
  // 移除首尾空白，但保留中间的空白字符用于解析
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

    // 小节线和反复记号
    if (char === '|' || char === ':') {
      if (current) {
        tokens.push(current);
        current = '';
      }

      // 检查组合符号
      if (i + 1 < cleaned.length) {
        const twoChars = char + cleaned[i + 1];
        if (['||', '|:', ':|', '::'].includes(twoChars)) {
          tokens.push(twoChars);
          i++;
          continue;
        }

        // 检查三字符组合
        if (i + 2 < cleaned.length) {
          const threeChars = twoChars + cleaned[i + 2];
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

    // 括号（包括三连音等）
    if (char === '(' || char === ')') {
      if (current) {
        tokens.push(current);
        current = '';
      }

      if (char === '(') {
        // 找到对应的 )
        let parenEnd = i + 1;
        while (parenEnd < cleaned.length && cleaned[parenEnd] !== ')') {
          parenEnd++;
        }

        if (parenEnd < cleaned.length) {
          // 提取括号内的内容
          const parenContent = cleaned.substring(i + 1, parenEnd).trim();

          // 添加左括号
          tokens.push('(');

          // 如果括号内不为空，分解括号内的内容
          if (parenContent) {
            // 对括号内的内容进行递归处理
            const innerTokens = tokenizeJianpu(parenContent);
            tokens.push(...innerTokens);
          }

          // 添加右括号
          tokens.push(')');

          i = parenEnd;
          continue;
        }
      } else {
        // 右括号
        tokens.push(')');
        continue;
      }
    }

    // 休止符
    if (char === '0' || char === '-') {
      if (current && current.match(/^\d/)) {
        // 当前是音符，0 是独立的休止符
        tokens.push(current);
        current = char;
      } else {
        current += char;
      }
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
function parseJianpuToken(token: string): ParsedNote {
  // 检查是否为换行符
  if (token === '\n') {
    return {
      digit: 0,
      accidental: '',
      octaveModifier: 0,
      durationModifiers: [],
      isRest: false,
      specialSymbol: '\n'
    };
  }

  // 检查特殊符号
  const specialSymbols = ['|', ':', '(', ')', '[', ']', '||', '|:', ':|', '::', '|::', '::|'];
  if (specialSymbols.includes(token)) {
    return {
      digit: 0,
      accidental: '',
      octaveModifier: 0,
      durationModifiers: [],
      isRest: false,
      specialSymbol: token
    };
  }

  // 检查三连音
  if (token.startsWith('(')) {
    return {
      digit: 0,
      accidental: '',
      octaveModifier: 0,
      durationModifiers: [],
      isRest: false,
      specialSymbol: token
    };
  }

  // 检查休止符
  if (token === '0' || token === '-' || token.startsWith('0') || token.startsWith('-')) {
    let durationModifiers: string[] = [];
    let restPart = token;

    // 提取时值修饰符
    if (token.length > 1) {
      const match = token.match(/^([-0])(.+)$/);
      if (match) {
        restPart = match[1];
        durationModifiers = parseDurationModifiers(match[2]);
      }
    }

    return {
      digit: 0,
      accidental: '',
      octaveModifier: 0,
      durationModifiers,
      isRest: true,
      specialSymbol: undefined
    };
  }

  // 解析音符
  // 格式: [1-7][#b]?[',]*[-_=.]*
  const match = token.match(/^([1-7])([#bn]?)([',]*)([-_=.]*)$/);
  if (!match) {
    // 尝试另一种格式：时值在前面，如 6/2
    const match2 = token.match(/^([1-7])([#bn]?)([',]*)(\/\d+)([-_=.]*)$/);
    if (match2) {
      const [, digit, accidental, octave, fraction, otherModifiers] = match2;
      return {
        digit: parseInt(digit, 10),
        accidental: (accidental as '#' | 'b' | 'n') || '',
        octaveModifier: calculateOctaveModifier(octave),
        durationModifiers: [fraction, ...parseDurationModifiers(otherModifiers)],
        isRest: false,
        specialSymbol: undefined
      };
    }

    // 尝试第三种格式：数字+分数形式的时值修饰符，如 23/4（2 后面跟着 3/4 的时值）
    const match3 = token.match(/^([1-7])([#bn]?)([',]*)(\d+\/\d+)([-_=.]*)$/);
    if (match3) {
      const [, digit, accidental, octave, durationFraction, otherModifiers] = match3;
      return {
        digit: parseInt(digit, 10),
        accidental: (accidental as '#' | 'b' | 'n') || '',
        octaveModifier: calculateOctaveModifier(octave),
        durationModifiers: [durationFraction, ...parseDurationModifiers(otherModifiers)],
        isRest: false,
        specialSymbol: undefined
      };
    }

    // 尝试第四种格式：纯数字形式的时值修饰符，如 5'2 (表示高八度的 5，二分音符)
    const match4 = token.match(/^([1-7])([#bn]?)([',]*)(\d+)([-_=.]*)$/);
    if (match4) {
      const [, digit, accidental, octave, durationNumber, otherModifiers] = match4;
      return {
        digit: parseInt(digit, 10),
        accidental: (accidental as '#' | 'b' | 'n') || '',
        octaveModifier: calculateOctaveModifier(octave),
        durationModifiers: [durationNumber, ...parseDurationModifiers(otherModifiers)],
        isRest: false,
        specialSymbol: undefined
      };
    }

    return {
      digit: 0,
      accidental: '',
      octaveModifier: 0,
      durationModifiers: [],
      isRest: false,
      specialSymbol: undefined
    };
  }

  const [, digit, accidental, octave, modifiers] = match;

  return {
    digit: parseInt(digit, 10),
    accidental: (accidental as '#' | 'b' | 'n') || '',
    octaveModifier: calculateOctaveModifier(octave),
    durationModifiers: parseDurationModifiers(modifiers),
    isRest: false,
    specialSymbol: undefined
  };
}

/**
 * 计算八度修饰符
 */
function calculateOctaveModifier(octaveStr: string): number {
  let modifier = 0;
  for (const char of octaveStr) {
    if (char === "'") {
      modifier += 1;
    } else if (char === ',') {
      modifier -= 1;
    }
  }
  return modifier;
}

/**
 * 解析时值修饰符
 */
function parseDurationModifiers(modifiers: string): string[] {
  const result: string[] = [];
  let i = 0;

  while (i < modifiers.length) {
    const char = modifiers[i];

    if (char === '-') {
      result.push('-');
      i++;
    } else if (char === '_') {
      result.push('_');
      i++;
    } else if (char === '=') {
      result.push('=');
      i++;
    } else if (char === '.') {
      result.push('.');
      i++;
    } else if (char === '/') {
      // 检查前面是否有数字（例如 3/4 的情况）
      let fraction = '/';
      i++;

      // 收集后面的数字
      while (i < modifiers.length && /\d/.test(modifiers[i])) {
        fraction += modifiers[i];
        i++;
      }

      // 如果结果中最后一个元素是纯数字，把它们合并成一个分数
      if (result.length > 0 && /^\d+$/.test(result[result.length - 1])) {
        const lastNumber = result.pop() || '';
        result.push(lastNumber + fraction);
      } else {
        result.push(fraction);
      }
    } else if (/\d/.test(char)) {
      // 纯数字（可能后面跟着 /）
      let number = '';
      while (i < modifiers.length && /\d/.test(modifiers[i])) {
        number += modifiers[i];
        i++;
      }
      result.push(number);
    } else {
      i++;
    }
  }

  return result;
}

/**
 * 音名数组（按半音排列，升号）
 */
const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * 音名数组（按半音排列，降号）
 */
const noteNamesFlat = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/**
 * 大调音阶偏移（相对于基音）
 */
const majorScaleOffset = [0, 2, 4, 5, 7, 9, 11];

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
 * 获取基音的八度
 */
function getBaseOctave(baseNote: string): number {
  const match = baseNote.match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : 4;
}

/**
 * 获取基音的音名（去除八度）
 */
function getBaseNoteName(baseNote: string): string {
  return baseNote.replace(/\d+$/, '');
}

/**
 * 将解析后的简谱音符转换为科学谱
 */
function convertNoteToScientific(note: ParsedNote, baseNote: string): string {
  // 特殊符号直接返回
  if (note.specialSymbol) {
    return note.specialSymbol;
  }

  // 休止符
  if (note.isRest) {
    let rest = 'z';
    if (note.durationModifiers.length > 0) {
      rest += note.durationModifiers.join('');
    }
    return rest;
  }

  // 获取基音信息
  const baseOctave = getBaseOctave(baseNote);
  const baseNoteName = getBaseNoteName(baseNote);

  // 计算音名
  const baseSemitone = getNoteSemitone(baseNoteName);
  const scaleOffset = majorScaleOffset[note.digit - 1];
  const accidentalOffset = getAccidentalOffset(note.accidental);

  let targetSemitone = (baseSemitone + scaleOffset + accidentalOffset) % 12;
  if (targetSemitone < 0) targetSemitone += 12;

  // 根据升降号选择正确的音名映射表
  let finalNoteName: string;
  if (note.accidental === 'b') {
    // 使用降号映射表
    finalNoteName = noteNamesFlat[targetSemitone];
  } else {
    // 使用升号映射表（默认）
    finalNoteName = noteNames[targetSemitone];
  }

  // 计算八度
  let octave = baseOctave + note.octaveModifier;

  // 检查是否跨越八度边界（例如：B# 应该是 C5，而不是 B4#）
  const originalSemitone = (baseSemitone + scaleOffset) % 12;
  if (note.accidental === '#' && originalSemitone >= 11) {
    // B# → C5
    finalNoteName = 'C';
    octave += 1;
  }

  // 组合音名和八度
  const scientificNote = finalNoteName + octave;

  // 添加时值修饰符
  if (note.durationModifiers.length > 0) {
    return scientificNote + note.durationModifiers.join('');
  }

  return scientificNote;
}

/**
 * 快速转换函数（使用默认选项）
 */
export function quickConvert(jianpu: string): string {
  return jianpuToScientific(jianpu);
}

/**
 * 批量转换多个简谱字符串
 */
export function batchConvert(
  jianpuArray: string[],
  options?: JianpuToScientificOptions
): string[] {
  return jianpuArray.map(jianpu => jianpuToScientific(jianpu, options));
}

/**
 * 验证简谱格式
 */
export function validateJianpuNotation(jianpu: string): boolean {
  const tokens = tokenizeJianpu(jianpu);
  return tokens.every(token => {
    // 特殊符号
    const specialSymbols = ['|', ':', '(', ')', '[', ']', '||', '|:', ':|', '::', '|::', '::|'];
    if (specialSymbols.includes(token)) return true;

    // 三连音
    if (token.startsWith('(')) return true;

    // 休止符
    if (token === '0' || token === '-' || token.startsWith('0') || token.startsWith('-')) {
      return true;
    }

    // 音符
    const match = token.match(/^([1-7])([#bn]?)([',]*)([-_=.]*(\/\d+)?)?$/);
    return match !== null;
  });
}
