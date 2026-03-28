# Components 组件文档

本文档介绍 `components/` 目录下所有 Vue 组件的使用方法、参数说明和示例。

## 目录

- [AbcSvg](#abcsvg) - ABC记谱法五线谱渲染组件
- [GoToPage](#gotopage) - 自动跳转组件
- [YueLiNotes](#yuelinotes) - 乐理音符播放组件
- [YueLiNotesPlayground](#yuelinotesplayground) - 乐理练习场组件

---

## AbcSvg

ABC记谱法五线谱渲染组件，使用 abcjs 库将 ABC 记谱法渲染为五线谱。

### Props

| 参数名 | 类型 | 必需 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `abcStr` | `string` | ✅ | - | ABC记谱法字符串 |
| `options` | `ABCJS.RenderOptions` | ❌ | 见下方默认值 | abcjs 渲染选项 |
| `showTitle` | `boolean` | ❌ | `false` | 是否显示标题 |

#### 默认 options 值

```typescript
{
  responsive: "resize",
  scale: 1.0,
  paddingtop: 10,
  paddingbottom: 10,
  paddingleft: 10,
  paddingright: 10,
}
```

### 示例

#### 基础用法

```vue
<AbcSvg :abc-str="'C D E F | G A B c'" />
```

#### 自定义渲染选项

```vue
<AbcSvg
  :abc-str="'X:1\nT:My Tune\nM:4/4\nK:C\nC D E F | G A B c'"
  :options="{
    scale: 1.2,
    paddingtop: 20
  }"
/>
```

#### 显示标题

```vue
<AbcSvg
  :abc-str="'X:1\nT:小星星\nM:4/4\nK:C\nC C G G | A A G2'"
  :show-title="true"
/>
```

### 特性

- 响应式设计，自动适应容器宽度
- 音符多时自动换行
- 支持自定义渲染选项
- 自动横向滚动，确保五线谱可读性

---

## GoToPage

自动跳转组件，带加载动画和进度条。用于页面跳转时提供视觉反馈。

### Props

| 参数名 | 类型 | 必需 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `targetUrl` | `string` | ❌ | `'/'` | 跳转目标URL |

### 示例

#### 跳转到首页

```vue
<GoToPage />
```

#### 跳转到指定页面

```vue
<GoToPage targetUrl="/about" />
```

#### 跳转到外部链接

```vue
<GoToPage targetUrl="https://example.com" />
```

### 特性

- 全屏加载动画
- 进度条显示
- 延时 1.5 秒后跳转
- 保持浏览器 title 不变
- 渐变色背景效果

---

## YueLiNotes

乐理音符播放组件，支持简谱、科学谱、ABC谱三种记谱法的播放和显示。

### Props

| 参数名 | 类型 | 必需 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `notationType` | `'abc' \| 'jianpu' \| 'scientific'` | ✅ | - | 记谱法类型 |
| `notes` | `string` | ✅ | - | 音符字符串 |
| `conversionOptions` | `ConversionOptions` | ❌ | 见下方默认值 | 转换选项 |
| `showSheetMusic` | `boolean` | ❌ | `false` | 是否显示五线谱 |
| `showTitle` | `boolean` | ❌ | `false` | 是否显示五线谱标题 |

#### ConversionOptions 默认值

```typescript
{
  key: 'C',
  meter: '4/4',
  tempo: '120',
  unitNoteLength: '1/4',
  title: 'Notation'
}
```

**注意**：对于简谱，还需要添加 `baseNote` 属性。

### 示例

#### ABC记谱法

```vue
<YueLiNotes
  notation-type="abc"
  notes="X:1
T:小星星
M:4/4
L:1/4
Q:120
K:C
C C G G | A A G2 | F F E E | D D C2"
  :show-sheet-music="true"
  :show-title="true"
/>
```

#### 简谱

```vue
<YueLiNotes
  notation-type="jianpu"
  notes="1' 1' 5' 5' | 6' 6' 5'2 | 4' 4' 3' 3' | 2' 2' 1'2"
  :conversion-options="{
    key: 'C',
    meter: '4/4',
    tempo: '120',
    unitNoteLength: '1/4',
    title: '小星星',
    baseNote: 'C4'
  }"
  :show-sheet-music="true"
/>
```

#### 科学谱

```vue
<YueLiNotes
  notation-type="scientific"
  notes="C4 C4 G4 G4 | A4 A4 G42 | F4 F4 E4 E4 | D4 D4 C42"
  :conversion-options="{
    key: 'C',
    meter: '4/4',
    tempo: '120',
    unitNoteLength: '1/4',
    title: '小星星'
  }"
  :show-sheet-music="true"
/>
```

#### 基础用法（仅播放）

```vue
<YueLiNotes
  notation-type="scientific"
  notes="C4 D4 E4 F4 G4 A4 B4 c4"
/>
```

### 暴露的方法

| 方法名 | 参数 | 返回值 | 说明 |
|--------|------|--------|------|
| `play()` | - | `Promise<void>` | 播放音符 |
| `stop()` | - | `void` | 停止播放 |

### 使用 ref 调用方法

```vue
<script setup>
import { ref } from 'vue'
import YueLiNotes from './components/YueLiNotes.vue'

const notesPlayer = ref()

function playNotes() {
  notesPlayer.value?.play()
}

function stopNotes() {
  notesPlayer.value?.stop()
}
</script>

<template>
  <YueLiNotes
    ref="notesPlayer"
    notation-type="scientific"
    notes="C4 D4 E4 F4"
  />
  <button @click="playNotes">播放</button>
  <button @click="stopNotes">停止</button>
</template>
```

### 特性

- 点击音符显示区域即可播放
- 支持播放状态指示
- 可选显示五线谱
- 自动检测 ABC 格式的头部信息
- 实时错误提示
- 支持三种记谱法：简谱、科学谱、ABC谱

---

## YueLiNotesPlayground

乐理练习场组件，是一个综合性的音乐记谱法工具，支持三种记谱法的输入、转换、播放和渲染。

### Props

该组件不需要任何 props，是一个完整的独立工具。

### 功能特性

- **参数配置**：
  - 基音选择（C3-B5，共36个音高）
  - 拍号选择（2/4, 3/4, 4/4, 6/8, 3/8）
  - 速度选择（60-160 BPM）
  - 单位音符长度（1/1, 1/2, 1/4, 1/8, 1/16）
  - 自定义标题

- **三种记谱法支持**：
  - 简谱：支持高低八度（' 和 ,）、升降号
  - 科学谱：支持多八度（C3-C6）、升降号
  - ABC谱：支持完整 ABC 记谱法

- **自动转换**：
  - 简谱 ↔ 科学谱 ↔ ABC谱
  - 参数变化时自动重新计算和渲染

- **播放功能**：
  - 播放/停止/复位控制
  - 实时播放状态指示
  - 音频播放控制

- **五线谱渲染**：
  - 实时渲染五线谱
  - 响应式设计
  - 显示转换后的 ABC 字符串

### 示例

#### 基础用法

```vue
<YueLiNotesPlayground />
```

#### 自定义默认内容

该组件内置了默认的简谱内容，可以直接使用，也可以通过修改输入框来改变内容。

### 内置示例

组件默认包含《茉莉花》的简谱：

```
6/2 1'/2 |
2' 2'/2 1'/2 2'/2 3'/4 2'/4 1'/2 2'/2  |
3'/2 5'/2 5'/2 6'/2 3'  3'/2 5'/2 |
2' 2'/2 1'/2 2'/2 1'/2 1'/2 2'/2 |
3'2 0 |
6/2 1'/2 |
2' 2' 2'/2 3'/4 2'/4 1'/2 2'/2 |
3'/2 5'/2 5'/2 6'/2 3' 5'/2 3'/2 |
2' 5'/2 3'/2 2'/2 6/2 6/2 1'/2 |
1'2 0 |
```

### 使用场景

- 音乐教学和练习
- 记谱法学习和转换
- 旋律创作和编辑
- 音乐理论研究和验证
- 乐谱可视化演示

### 特性

- 完全独立的综合工具
- 标签切换界面，支持三种记谱法
- 参数变化时自动更新所有相关内容
- 实时五线谱渲染和播放
- 显示转换后的 ABC 字符串，便于学习和调试
- 响应式设计，适应各种屏幕尺寸

---

## 通用说明

### 记谱法格式

#### 简谱格式

- 基本音符：1-7
- 高八度：音符后加 '（如 1'）
- 低八度：音符后加 ,（如 1,）
- 升降号：# 或 b（如 4#, 7b）
- 时值修饰符：/2, /4, 2, 4, . 等
- 小节线：\|

示例：`1' 2' 3' 4' | 5' 6' 7' 1''`

#### 科学谱格式

- 基本音符：C-G
- 八度数字：3-6（如 C4, D5）
- 升降号：# 或 b（如 F#4, Bb5）
- 时值修饰符：/2, /4, 2, 4, . 等
- 小节线：\|

示例：`C4 D4 E4 F4 | G4 A4 B4 c4`

#### ABC记谱法格式

ABC记谱法是一种文本记谱法，包含头部和主体。

头部字段：
- `X:` - 索引号
- `T:` - 标题
- `M:` - 拍号
- `L:` - 单位音符长度
- `Q:` - 速度
- `K:` - 调性

示例：

```
X:1
T:小星星
M:4/4
L:1/4
Q:120
K:C
C C G G | A A G2 | F F E E | D D C2
```

### 样式定制

所有组件使用 CSS 变量定义样式，支持主题切换：

```scss
--va-c-bg: 背景色
--va-c-bg-soft: 柔和背景色
--va-c-text: 文本色
--va-c-text-light: 浅色文本
--va-c-primary: 主色调
--va-c-primary-dark: 深主色调
--va-c-error: 错误色
--va-c-success: 成功色
--va-c-warning: 警告色
--va-c-divider: 分隔线色
```

### 浏览器兼容性

- 需要支持 ES6+ 的现代浏览器
- 需要 Web Audio API 支持
- 推荐使用 Chrome、Firefox、Safari、Edge 的最新版本

### 性能优化

- 组件使用 `ref` 和 `computed` 进行响应式优化
- 播放器和渲染器在组件卸载时自动清理
- 五线谱渲染支持响应式重渲染
- 大量音符时建议分批次处理

---

## 相关文档

- [乐理规则文档](pages/yueli/规则/)
- [ABC记谱法标准](pages/yueli/规则/ABC规则V2_1_en.md)
- [简谱转换规则](pages/yueli/规则/简谱转换ABC规则V2_1.md)
- [科学谱转换规则](pages/yueli/规则/科学谱转换ABC规则V2_1.md)

---

## 更新日志

### 2026-03-28

- 重构组件结构，删除旧的 AnyNote 组件
- 新增 YueLiNotes 组件，简化播放功能
- 新增 YueLiNotesPlayground 组件，提供完整的练习场功能
- 更新 AbcSvg 组件，添加 showTitle 属性
- 优化组件性能和用户体验

---

**最后更新**: 2026-03-28