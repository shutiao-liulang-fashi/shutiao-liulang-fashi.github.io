/**
 * ABC 到 ABC 处理工具
 * 用于处理和优化传入的 ABC 字符串，特别是处理头部信息的合并
 */

export interface AbcConversionOptions {
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
 * ABC 头部信息
 */
interface AbcHeader {
  /** 参考编号 */
  X?: string;
  /** 标题 */
  T?: string;
  /** 作曲者 */
  C?: string;
  /** 来源 */
  O?: string;
  /** 地区 */
  A?: string;
  /** 拍号 */
  M?: string;
  /** 单位音符长度 */
  L?: string;
  /** 速度 */
  Q?: string;
  /** 部分 */
  P?: string;
  /** 调性 */
  K?: string;
  /** 记谱者 */
  Z?: string;
  /** 注释 */
  N?: string;
}

/**
 * 解析 ABC 头部信息
 */
function parseAbcHeader(abcString: string): AbcHeader {
  const header: AbcHeader = {};
  const lines = abcString.split('\n');

  for (const line of lines) {
    // 匹配字段：字母后跟冒号
    const match = line.match(/^([A-Za-z]):(.*)$/);
    if (match) {
      const [, field, value] = match;
      header[field as keyof AbcHeader] = value.trim();

      // 遇到 K: 字段后，头部信息结束
      if (field.toUpperCase() === 'K') {
        break;
      }
    }
  }

  return header;
}

/**
 * 提取 ABC 主体部分（去除头部）
 */
function extractAbcBody(abcString: string): string {
  const lines = abcString.split('\n');
  let bodyStartIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // 检查是否是 K: 字段（最后一个头部字段）
    if (line.match(/^K:/)) {
      bodyStartIndex = i + 1;
      break;
    }
  }

  if (bodyStartIndex === -1) {
    // 没有找到 K: 字段，返回整个字符串
    return abcString;
  }

  return lines.slice(bodyStartIndex).join('\n');
}

/**
 * 生成 ABC 头部信息
 */
function generateHeader(options: AbcConversionOptions): AbcHeader {
  const header: AbcHeader = {};

  // 默认 X:1，不需要作为参数传入
  header.X = '1';

  if (options.title) header.T = options.title;
  if (options.meter) header.M = options.meter;
  if (options.unitNoteLength) header.L = options.unitNoteLength;
  if (options.tempo) header.Q = options.tempo;
  if (options.key) header.K = options.key;

  return header;
}

/**
 * 合并头部信息（用户传入的优先）
 */
function mergeHeaders(
  userHeader: AbcHeader,
  defaultHeader: AbcHeader
): AbcHeader {
  const merged: AbcHeader = { ...defaultHeader };

  // 用户传入的头部信息优先级更高
  for (const key in userHeader) {
    if (userHeader[key as keyof AbcHeader]) {
      merged[key as keyof AbcHeader] = userHeader[key as keyof AbcHeader];
    }
  }

  return merged;
}

/**
 * 将头部对象转换为 ABC 字符串
 */
function headerToString(header: AbcHeader): string {
  const fields: string[] = [];

  // 必须字段顺序：X, T, M, L, Q, K
  const fieldOrder: (keyof AbcHeader)[] = ['X', 'T', 'C', 'O', 'A', 'M', 'L', 'Q', 'P', 'K', 'Z', 'N'];

  for (const field of fieldOrder) {
    if (header[field]) {
      fields.push(`${field}:${header[field]}`);
    }
  }

  return fields.join('\n');
}

/**
 * 处理 ABC 字符串
 * @param abcString 用户传入的 ABC 字符串（可能包含头部信息）
 * @param options 转换选项（作为默认值，用户传入的优先）
 * @returns 处理后的完整 ABC 字符串
 */
export function abcToAbc(
  abcString: string,
  options: AbcConversionOptions = {}
): string {
  const {
    key = 'C',
    meter = '4/4',
    tempo = '1/4=120',
    unitNoteLength = '1/4',
    title = 'ABC Notation'
  } = options;

  // 清理输入
  const cleanedInput = abcString.trim();
  if (!cleanedInput) {
    return '';
  }

  // 解析用户传入的 ABC 字符串
  const userHeader = parseAbcHeader(cleanedInput);
  const userBody = extractAbcBody(cleanedInput);

  // 生成默认头部
  const defaultHeader = generateHeader({
    key,
    meter,
    tempo,
    unitNoteLength,
    title
  });

  // 合并头部（用户传入的优先）
  const mergedHeader = mergeHeaders(userHeader, defaultHeader);

  // 组合头部和主体
  const headerString = headerToString(mergedHeader);
  const bodyString = userBody.trim();

  return `${headerString}\n${bodyString}`;
}

/**
 * 检查 ABC 字符串是否包含头部信息
 */
export function hasAbcHeader(abcString: string): boolean {
  const cleaned = abcString.trim();
  return cleaned.match(/^X:/) !== null;
}

/**
 * 验证 ABC 字符串格式
 */
export function validateAbcNotation(abcString: string): boolean {
  if (!abcString || !abcString.trim()) {
    return false;
  }

  const cleaned = abcString.trim();
  const lines = cleaned.split('\n');

  // 检查是否包含必要的头部字段
  const hasX = lines.some(line => line.match(/^X:/));
  const hasT = lines.some(line => line.match(/^T:/));
  const hasK = lines.some(line => line.match(/^K:/));

  // 如果没有头部，检查是否至少包含一些音符
  if (!hasX && !hasT && !hasK) {
    // 检查是否包含有效的音符
    const bodyOnly = cleaned.replace(/^[A-Za-z]:.*$/gm, '').trim();
    if (!bodyOnly) {
      return false;
    }
  }

  return true;
}

/**
 * 快速处理函数（使用默认选项）
 */
export function quickProcess(abcString: string): string {
  return abcToAbc(abcString);
}

/**
 * 提取 ABC 的调性
 */
export function extractKey(abcString: string): string | null {
  const header = parseAbcHeader(abcString);
  return header.K || null;
}

/**
 * 提取 ABC 的标题
 */
export function extractTitle(abcString: string): string | null {
  const header = parseAbcHeader(abcString);
  return header.T || null;
}

/**
 * 提取 ABC 的拍号
 */
export function extractMeter(abcString: string): string | null {
  const header = parseAbcHeader(abcString);
  return header.M || null;
}

/**
 * 提取 ABC 的速度
 */
export function extractTempo(abcString: string): string | null {
  const header = parseAbcHeader(abcString);
  return header.Q || null;
}
