/**
 * 科学记谱法到 ABC 记谱法转换工具
 * 基于 ABC 标准 v2.1
 */

export interface ConversionOptions {
  /** 调性，默认 C */
  key?: string;
  /** 拍号，默认 4/4 */
  meter?: string;
  /** 速度，默认 1/4=120 */
  tempo?: string;
  /** 记录单位，默认 1/4 */
  unitNoteLength?: string;
  /** 标题 */
  title?: string;
}

/**
 * 解析单个科学记谱法音符
 * 格式: [A-G][#b]?\d+[./\d.-]*
 */
export interface ParsedNote {
  /** 音名 (A-G) */
  noteName: string;
  /** 升降号 (sharp/flat/natural) */
  accidental: '#' | 'b' | 'n' | '';
  /** 八度 (0-9) */
  octave: number;
  /** 时值修饰符 */
  durationModifiers: string[];
  /** 连音线标记 */
  hasTie: boolean;
  /** 是否为休止符 */
  isRest: boolean;
  /** 特殊符号（小节线、反复记号等） */
  specialSymbol?: string;
}

/**
 * 科学记谱法到 ABC 记谱法转换函数
 * @param scientificNotes 科学记谱法音符字符串（空格分隔）
 * @param options 转换选项
 * @returns ABC 记谱法字符串
 */
export function scientificToAbc(
  scientificNotes: string,
  options: ConversionOptions = {}
): string {
  const {
    key = 'C',
    meter = '4/4',
    tempo = '1/4=120',
    unitNoteLength = '1/4',
    title = 'Scientific Notation'
  } = options;

  // 解析并转换音符
  const notes = parseNotes(scientificNotes);
  const abcNotes = notes.map(convertNoteToAbc).join(' ');

  // 生成 ABC 头部
  const header = generateHeader({
    title,
    meter,
    tempo,
    unitNoteLength,
    key
  });

  return `${header}\n${abcNotes}`;
}

/**
 * 解析科学记谱法音符字符串
 */
function parseNotes(scientificNotes: string): ParsedNote[] {
  const tokens = tokenize(scientificNotes);
  return tokens.map(parseToken);
}

/**
 * 将字符串分解为标记
 */
function tokenize(input: string): string[] {
  // 移除多余空格
  const cleaned = input.trim();
  if (!cleaned) return [];

  const tokens: string[] = [];
  let current = '';

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];

    // 空格分隔标记
    if (char === ' ' || char === '\t' || char === '\n') {
      if (current) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    // 特殊符号：小节线、反复记号等
    // 检查是否是组合符号（如 ||、|:、:|、::、|::、::|）
    if (char === '|' || char === ':') {
      if (current) {
        tokens.push(current);
        current = '';
      }

      // 检查是否是组合符号的开始
      if (i + 1 < cleaned.length) {
        const nextChar = cleaned[i + 1];
        const twoChars = char + nextChar;

        // 检查双字符组合
        if (['||', '|:', ':|', '::'].includes(twoChars)) {
          tokens.push(twoChars);
          i++; // 跳过下一个字符
          continue;
        }

        // 检查三字符组合（|::、::|）
        if (i + 2 < cleaned.length) {
          const thirdChar = cleaned[i + 2];
          const threeChars = twoChars + thirdChar;

          if (['|::', '::|'].includes(threeChars)) {
            tokens.push(threeChars);
            i += 2; // 跳过后面两个字符
            continue;
          }
        }
      }

      // 单个字符
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
 * 解析单个标记
 */
function parseToken(token: string): ParsedNote {
  // 检查是否为特殊符号（包括组合符号）
  const specialSymbols = ['|', ':', '(', ')', '[', ']', '||', '|:', ':|', '::', '|::', '::|'];
  if (specialSymbols.includes(token)) {
    return {
      noteName: '',
      accidental: '',
      octave: 0,
      durationModifiers: [],
      hasTie: false,
      isRest: false,
      specialSymbol: token
    };
  }

  // 检查是否为休止符
  if (token.toLowerCase() === 'z') {
    return {
      noteName: '',
      accidental: '',
      octave: 0,
      durationModifiers: [],
      hasTie: false,
      isRest: true,
      specialSymbol: undefined
    };
  }

  // 检查多小节休止符 Z4
  if (token.toLowerCase().startsWith('z') && token.length > 1) {
    return {
      noteName: '',
      accidental: '',
      octave: 0,
      durationModifiers: [token.substring(1)],
      hasTie: false,
      isRest: true,
      specialSymbol: undefined
    };
  }

  // 解析音符
  // 格式: [A-G][#b]?[0-9][./\d.-]*
  // 八度只匹配第一个数字，剩下的数字属于时值修饰符
  const match = token.match(/^([A-G])([#b])?(\d)([./\d.-]*)$/);
  if (!match) {
    // 如果无法解析，返回空音符
    return {
      noteName: '',
      accidental: '',
      octave: 0,
      durationModifiers: [],
      hasTie: false,
      isRest: false,
      specialSymbol: undefined
    };
  }

  const [, noteName, accidental, octaveStr, modifiers] = match;
  const octave = parseInt(octaveStr, 10);

  // 解析时值修饰符
  const durationModifiers: string[] = [];
  let hasTie = false;

  if (modifiers) {
    let i = 0;
    while (i < modifiers.length) {
      const char = modifiers[i];

      if (char === '-') {
        hasTie = true;
        i++;
      } else if (char === '.') {
        durationModifiers.push('.');
        i++;
      } else if (char === '/') {
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
      } else if (/\d/.test(char)) {
        // 整数时值 2, 4, 8 (可能有多位数，如 G416 表示16分音符)
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
    noteName,
    accidental: (accidental as '#' | 'b' | 'n') || '',
    octave,
    durationModifiers,
    hasTie,
    isRest: false,
    specialSymbol: undefined
  };
}

/**
 * 将解析后的音符转换为 ABC 记谱法
 */
function convertNoteToAbc(note: ParsedNote): string {
  // 特殊符号（小节线、反复记号等）直接返回
  if (note.specialSymbol) {
    return note.specialSymbol;
  }

  // 空音符或无效音符返回空字符串
  if (!note.noteName && !note.isRest) {
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

  // 转换音名和升降号
  let abcNote = convertNoteName(note.noteName, note.accidental);

  // 转换八度
  abcNote = convertOctave(abcNote, note.octave);

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
 * 转换音名和升降号
 */
function convertNoteName(noteName: string, accidental: string): string {
  if (!accidental) {
    return noteName;
  }

  switch (accidental) {
    case '#':
      return `^${noteName}`;
    case 'b':
      return `_${noteName}`;
    case 'n':
      return `=${noteName}`;
    default:
      return noteName;
  }
}

/**
 * 转换八度
 */
function convertOctave(noteName: string, octave: number): string {
  if (octave < 4) {
    // 低于 C4，使用逗号
    const commas = 4 - octave;
    return `${noteName}${','.repeat(commas)}`;
  } else if (octave === 4) {
    // C4-B4，使用大写
    return noteName.toUpperCase();
  } else if (octave === 5) {
    // C5-B5，使用小写
    return noteName.toLowerCase();
  } else {
    // 高于 C5，使用小写加单引号
    const apostrophes = octave - 5;
    return `${noteName.toLowerCase()}${'\''.repeat(apostrophes)}`;
  }
}

/**
 * 生成 ABC 头部信息
 */
function generateHeader(options: {
  title: string;
  meter: string;
  tempo: string;
  unitNoteLength: string;
  key: string;
}): string {
  return `X:1
T:${options.title}
M:${options.meter}
L:${options.unitNoteLength}
Q:${options.tempo}
K:${options.key}`;
}

/**
 * 快速转换函数（使用默认选项）
 */
export function quickConvert(scientificNotes: string): string {
  return scientificToAbc(scientificNotes);
}

/**
 * 批量转换多个音符字符串
 */
export function batchConvert(
  scientificNotesArray: string[],
  options?: ConversionOptions
): string[] {
  return scientificNotesArray.map(notes => scientificToAbc(notes, options));
}

/**
 * 验证科学记谱法格式
 */
export function validateScientificNotation(scientificNotes: string): boolean {
  const tokens = tokenize(scientificNotes);
  return tokens.every(token => {
    // 特殊符号（包括组合符号）
    const specialSymbols = ['|', ':', '(', ')', '[', ']', '||', '|:', ':|', '::', '|::', '::|'];
    if (specialSymbols.includes(token)) {
      return true;
    }

    // 休止符
    if (token.toLowerCase() === 'z') {
      return true;
    }

    // 多小节休止符
    if (token.toLowerCase().startsWith('z') && token.length > 1) {
      const number = token.substring(1);
      return /^\d+$/.test(number);
    }

    // 音符：八度只匹配第一个数字
    const match = token.match(/^([A-G])([#b])?(\d)([./\d.-]*)$/);
    return match !== null;
  });
}
