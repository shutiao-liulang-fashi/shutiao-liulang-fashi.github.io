# 薯条流浪法师 - 项目信息与维护模板

## 项目基本信息

- **项目名称**: 薯条流浪法师
- **项目类型**: 个人博客/静态网站
- **框架**: Valaxy 0.28.1
- **主题**: valaxy-theme-press
- **语言**: TypeScript
- **包管理器**: pnpm
- **版本**: 0.0.0

### 站点配置

- **站点标题**: 薯条流浪法师
- **描述**: 薯条流浪法师的个人小屋
- **语言**: zh-CN
- **时区**: Asia/Shanghai
- **搜索**: 已禁用
- **最后更新**: 已启用

## 技术栈

### 核心技术
- **Valaxy**: 0.28.1 - 基于 Vite 的静态站点生成器
- **Vue 3**: 前端框架
- **TypeScript**: 5.9.3 - 类型安全
- **Vite**: 开发服务器和构建工具
- **abcjs**: 6.6.2 - ABC 记谱法渲染和音频播放库

### 主题
- **valaxy-theme-press**: 使用的博客主题

### 部署平台
- **GitHub Pages**: 通过 GitHub Actions 自动部署
- **Netlify**: 支持配置
- **Vercel**: 支持配置
- **Docker**: 支持容器化部署

## 项目结构

```
sutiao/
├── components/          # 自定义 Vue 组件
│   ├── core/           # 核心工具模块
│   │   ├── abcToAbc.ts          # ABC 到 ABC 处理工具
│   │   ├── abcjsHandler.ts      # abcjs 音频播放和渲染处理器
│   │   ├── jianpuToAbc.ts       # 简谱到 ABC 转换工具
│   │   ├── jianpuToScientific.ts # 简谱到科学谱转换工具
│   │   └── scientificToAbc.ts   # 科学谱到 ABC 转换工具
│   ├── AbcSvg.vue         # 五线谱渲染组件
│   ├── GoToPage.vue       # 自动跳转组件
│   ├── YueLiNotes.vue     # 乐理音符播放组件
│   └── YueLiNotesPlayground.vue # 乐理练习场组件
├── layouts/             # 自定义布局
├── locales/             # 国际化配置
│   ├── en.yml
│   ├── zh-CN.yml
│   └── README.md
├── pages/               # 页面内容
│   ├── 404.md           # 404 页面
│   ├── index.md         # 首页
│   ├── about/           # 关于页面
│   ├── music/           # 音乐相关页面
│   ├── test/            # 测试页面
│   ├── start/           # 开始页面（包含音乐功能测试）
│   └── yueli/           # 乐理相关文档
│       ├── ABCNotation.md
│       ├── index.md
│       ├── playground.md
│       └── 规则/        # 乐理转换规则文档
│           ├── 简谱转换科学谱规则V2_1.md
│           ├── 简谱转换ABC规则V2_1.md
│           ├── 科学谱转换ABC规则V2_1.md
│           ├── ABC规则V2_1_en.md
│           └── abc_standard_v2_1.pdf
├── public/              # 静态资源
│   ├── favicon.svg
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   └── safari-pinned-tab.svg
├── styles/              # 样式文件
│   ├── css-vars.scss
│   ├── index.scss
│   └── README.md
├── .github/             # GitHub Actions 配置
│   └── workflows/
│       └── gh-pages.yml
├── .valaxy/             # Valaxy 生成的文件
│   └── route-map.d.ts
├── .vscode/             # VSCode 配置
│   ├── extensions.json
│   └── settings.json
├── components.md        # 组件使用文档
├── site.config.ts       # 站点配置
├── valaxy.config.ts     # Valaxy 配置
├── valaxy.config.router.ts  # 路由配置
├── package.json         # 项目依赖
├── tsconfig.json        # TypeScript 配置
├── Dockerfile           # Docker 配置
├── netlify.toml         # Netlify 配置
├── vercel.json          # Vercel 配置
├── nginx.conf           # Nginx 配置
└── 科学谱转换规则.md     # 科学记谱法转换规则文档
```

## 开发指南

### 安装依赖

```bash
pnpm install
```

### 开发服务器

```bash
pnpm dev
```

访问 `http://localhost:4859/`

### 构建项目

```bash
# SPA 模式构建
pnpm run build:spa

# SSG 模式构建（默认）
pnpm run build
```

### 生成 RSS

```bash
pnpm rss
```

### 预览构建结果

```bash
pnpm serve
```

### Docker 构建

```bash
docker build . -t sutiao:latest
```

## 配置说明

### 站点配置 (site.config.ts)

主要配置项：
- `lang`: 站点语言
- `title`: 站点标题
- `description`: 站点描述
- `lastUpdated`: 显示最后更新时间
- `timezone`: 时区设置
- `search`: 搜索功能配置

### Valaxy 配置 (valaxy.config.ts)

主要配置项：
- `theme`: 使用的主题
- `themeConfig`: 主题配置
  - `nav`: 导航菜单
  - `sidebar`: 侧边栏
  - `footer`: 页脚信息
- `unocss`: UnoCSS 配置

## 音乐功能

### 支持的记谱法

项目支持三种音乐记谱法，可以轻松在博客中嵌入音乐内容：

1. **科学记谱法**（Scientific Pitch Notation）
2. **简谱**（Jianpu）
3. **ABC 记谱法**

### 科学记谱法

**基本格式**: `[A-G][#b]?\d+[./\d.-]*`

**示例**:
- `C4` - 中央 C
- `C#4` - 升 C
- `D42` - 二分音符 D
- `C4/2` - 八分音符 C
- `C4 D4 E4 F4 | G4 A4 B4 c4` - 带小节线的旋律

**使用方法**:
```vue
<YueLiNotes
  notation-type="scientific"
  notes="C4 D4 E4 F4"
  :show-sheet-music="true"
/>
```

### 简谱

**基本格式**: `[1-7][#b]?\d+[./\d.-]*`

**示例**:
- `1'` - 高音 do
- `1_` - 低音 do
- `6/2` - 八分音符 la
- `1' 2' 3' | 4' 5' 6'` - 带小节线的旋律

**使用方法**:
```vue
<YueLiNotes
  notation-type="jianpu"
  notes="1' 2' 3' 4' 5'"
  :show-sheet-music="true"
  :conversion-options="{
    baseNote: 'C4'
  }"
/>
```

### ABC 记谱法

**格式**: 标准 ABC 记谱法，支持完整的头部信息和音符

**示例**:
```abc
X:1
T:我的旋律
M:4/4
L:1/4
Q:120
K:C
C D E F | G A B c
```

**使用方法**:
```vue
<YueLiNotes
  notation-type="abc"
  notes="X:1
T:我的旋律
M:4/4
L:1/4
Q:120
K:C
C D E F | G A B c"
  :show-sheet-music="true"
/>
```

### YueLiNotesPlayground 综合工具

**YueLiNotesPlayground** 是一个综合性的音乐记谱法工具，支持三种记谱法的输入、转换、播放和渲染。

**功能特性**:
- 支持简谱、科学谱、ABC谱三种输入方式
- 自动转换：简谱 ↔ 科学谱 ↔ ABC谱
- 实时五线谱渲染
- 音频播放功能
- 可自定义基音、拍号、速度、单位音符长度、标题

**使用方法**:
```vue
<YueLiNotesPlayground />
```

**可配置参数**:
- 基音选择（C3-B5）
- 拍号（2/4, 3/4, 4/4, 6/8, 3/8）
- 速度（60-160）
- 单位音符长度（1/1, 1/2, 1/4, 1/8, 1/16）
- 自定义标题

### 音符转换规则

详细的转换规则请参考以下文档：
- `components.md` - 组件使用文档
- `pages/yueli/规则/简谱转换科学谱规则V2_1.md` - 简谱到科学谱转换规则
- `pages/yueli/规则/简谱转换ABC规则V2_1.md` - 简谱到ABC转换规则
- `pages/yueli/规则/科学谱转换ABC规则V2_1.md` - 科学谱到ABC转换规则
- `pages/yueli/规则/ABC规则V2_1_en.md` - ABC记谱法标准（英文）
- `pages/yueli/规则/abc_standard_v2_1.pdf` - ABC记谱法标准PDF

**主要支持特性**:
- 音符名称（A-G, 1-7）
- 升降号（#、b、n）
- 多八度（C3-C6, 1'-1_）
- 时值修饰符（/2、/4、2、4、.、-、_、=）
- 连音线（-）
- 休止符（z、Z、0、-）
- 小节线（|、||、|:、:|、::）
- 三连音等特殊记号

### 技术实现

音乐功能基于 abcjs 库实现：
- 使用 npm 安装的 abcjs（6.6.2）
- 通过 Vite 打包到客户端
- 支持音频播放和五线谱渲染
- 响应式设计，自动适应容器宽度
- 自定义音频播放器和渲染器封装

## 自定义组件

### YueLiNotes 组件

**功能**: 乐理音符播放组件，支持简谱、科学谱、ABC谱三种记谱法的播放和显示

**位置**: `components/YueLiNotes.vue`

**使用方法**:
```vue
<YueLiNotes
  notation-type="scientific"
  notes="C4 D4 E4 F4"
  :show-sheet-music="true"
/>
```

**属性**:
- `notationType` (必需): 记谱法类型，可选值：'abc' | 'jianpu' | 'scientific'
- `notes` (必需): 音符字符串
- `conversionOptions` (可选): 转换选项
  - `key`: 调性，默认 'C'
  - `meter`: 拍号，默认 '4/4'
  - `tempo`: 速度，默认 '120'
  - `unitNoteLength`: 记录单位，默认 '1/4'
  - `title`: 标题
  - `baseNote`: 基音（仅简谱需要）
- `showSheetMusic` (可选): 是否显示五线谱，默认 false
- `showTitle` (可选): 是否显示五线谱标题，默认 false

**特性**:
- 点击音符显示区域即可播放
- 支持播放状态指示
- 可选显示五线谱
- 自动检测 ABC 格式的头部信息
- 实时错误提示
- 支持三种记谱法：简谱、科学谱、ABC谱
- 暴露 play/stop 方法供父组件调用

### YueLiNotesPlayground 组件

**功能**: 乐理练习场组件，综合性的音乐记谱法工具，支持三种记谱法的输入、转换、播放和渲染

**位置**: `components/YueLiNotesPlayground.vue`

**使用方法**:
```vue
<YueLiNotesPlayground />
```

**功能特性**:
- 参数配置：基音选择（C3-B5）、拍号、速度、单位音符长度、自定义标题
- 三种记谱法支持：简谱、科学谱、ABC谱
- 自动转换：简谱 ↔ 科学谱 ↔ ABC谱
- 参数变化时自动重新计算和渲染
- 播放功能：播放/停止/复位控制
- 实时五线谱渲染
- 显示转换后的 ABC 字符串
- 标签切换界面
- 内置《茉莉花》示例

**使用场景**:
- 音乐教学和练习
- 记谱法学习和转换
- 旋律创作和编辑
- 音乐理论研究和验证
- 乐谱可视化演示

### AbcSvg 组件

**功能**: ABC 记谱法五线谱渲染组件

**位置**: `components/AbcSvg.vue`

**使用方法**:
```vue
<AbcSvg
  :abc-str="abcString"
  :show-title="false"
/>
```

**属性**:
- `abcStr` (必需): ABC 记谱法字符串
- `options` (可选): abcjs 渲染选项
- `showTitle` (可选): 是否显示标题，默认 false

**特性**:
- 使用 abcjs 渲染五线谱
- 响应式设计，自动适应容器宽度
- 音符多时自动换行
- 支持自定义渲染选项

### GoToPage 组件

**功能**: 自动跳转组件，带加载动画

**位置**: `components/GoToPage.vue`

**使用方法**:
```markdown
<GoToPage targetUrl="/about"/>
```

**属性**:
- `targetUrl`: 跳转目标 URL（可选，默认为 '/'）

**特性**:
- 全屏加载动画
- 进度条显示
- 延时 2.5 秒后跳转
- 保持浏览器 title 不变

## 核心工具模块

### abcToAbc 工具

**功能**: ABC 到 ABC 处理工具，用于处理和优化传入的 ABC 字符串，特别是处理头部信息的合并

**位置**: `components/core/abcToAbc.ts`

**主要函数**:
- `abcToAbc(abcString, options)` - 处理 ABC 字符串
- `hasAbcHeader(abcString)` - 检查是否包含头部信息
- `validateAbcNotation(abcString)` - 验证 ABC 格式
- `extractKey(abcString)` - 提取调性
- `extractTitle(abcString)` - 提取标题
- `extractMeter(abcString)` - 提取拍号
- `extractTempo(abcString)` - 提取速度

**使用方法**:
```typescript
import { abcToAbc } from './core/abcToAbc'

const abcString = abcToAbc('C D E F | G A B c', {
  key: 'C',
  meter: '4/4',
  tempo: '120',
  title: 'My Tune'
})
```

### abcjsHandler 工具

**功能**: abcjs 音频播放和渲染处理器

**位置**: `components/core/abcjsHandler.ts`

**主要类**:
- `AbcAudioPlayer` - ABC 音频播放器类
- `AbcRenderer` - ABC 五线谱渲染器类

**AbcAudioPlayer 功能**:
- 播放 ABC 记谱法音频
- 播放/停止/暂停/重试控制
- 音量控制
- 播放状态回调
- 更新当前播放的 ABC 字符串
- 资源清理

**AbcRenderer 功能**:
- 渲染 ABC 记谱法到五线谱
- 响应式重渲染
- 标题显示控制
- 清空渲染容器
- 资源清理

**使用方法**:
```typescript
import { AbcAudioPlayer, AbcRenderer } from './core/abcjsHandler'

// 创建播放器
const player = new AbcAudioPlayer(0.8) // 默认音量 0.8
await player.play(abcString)
player.stop()

// 创建渲染器
const renderer = new AbcRenderer(container)
await renderer.render(abcString, options, false)
```

### jianpuToAbc 工具

**功能**: 简谱到 ABC 记谱法转换工具

**位置**: `components/core/jianpuToAbc.ts`

**主要函数**:
- `jianpuToAbc(jianpuNotes, options)` - 简谱转 ABC
- `quickConvertJianpu(jianpuNotes)` - 快速转换（使用默认选项）
- `batchConvertJianpu(jianpuNotesArray, options)` - 批量转换
- `validateJianpuNotation(jianpuNotes)` - 验证简谱格式

**使用方法**:
```typescript
import { jianpuToAbc } from './core/jianpuToAbc'

const abcString = jianpuToAbc('1\' 2\' 3\' | 4\' 5\' 6\'', {
  key: 'C',
  meter: '4/4',
  tempo: '120',
  title: '简谱',
  baseNote: 'C4'
})
```

### jianpuToScientific 工具

**功能**: 简谱到科学记谱法转换工具

**位置**: `components/core/jianpuToScientific.ts`

**主要函数**:
- `jianpuToScientific(jianpu, options)` - 简谱转科学谱
- `quickConvert(jianpu)` - 快速转换
- `batchConvert(jianpuArray, options)` - 批量转换
- `validateJianpuNotation(jianpu)` - 验证简谱格式

**使用方法**:
```typescript
import { jianpuToScientific } from './core/jianpuToScientific'

const scientificString = jianpuToScientific('1\' 2\' 3\'', {
  baseNote: 'C4'
})
// 返回: "C4 D4 E4"
```

### scientificToAbc 工具

**功能**: 科学记谱法到 ABC 记谱法转换工具

**位置**: `components/core/scientificToAbc.ts`

**主要函数**:
- `scientificToAbc(scientificNotes, options)` - 科学谱转 ABC
- `quickConvert(scientificNotes)` - 快速转换
- `batchConvert(scientificNotesArray, options)` - 批量转换
- `validateScientificNotation(scientificNotes)` - 验证科学谱格式

**使用方法**:
```typescript
import { scientificToAbc } from './core/scientificToAbc'

const abcString = scientificToAbc('C4 D4 E4 F4', {
  key: 'C',
  meter: '4/4',
  tempo: '120',
  title: 'My Tune'
})
```

**支持的特性**:
- 音符名称转换（A-G）
- 升降号处理（#、b、n）
- 多八度转换
- 时值修饰符（/2、/4、2、4、.）
- 连音线（-）
- 休止符（z、Z）
- 小节线（|、||、|:、:|、::）
- 三连音等特殊记号

## 导航结构

当前导航配置：[]

### 侧边栏结构

1. **开始** (`/start/`)
   - YueLiNotes 组件测试
   - YueLiNotesPlayground 组件测试

2. **乐理** (`/yueli/`)
   - ABC记谱法介绍
   - 乐理练习场
   - 规则/
     - 简谱转换科学谱规则 V2.1
     - 简谱转换ABC规则 V2.1
     - 科学谱转换ABC规则 V2.1
     - ABC规则 V2.1 (英文版)
     - abc_standard_v2.1.pdf

## 部署信息

### GitHub Pages

通过 GitHub Actions 自动部署到 GitHub Pages

**仓库**: `git@github.com:sutiao-liulang-fashi/sutiao-liulang-fashi.github.io.git`

**分支**: `gh-pages`

### 其他部署选项

- **Netlify**: 通过 `netlify.toml` 配置
- **Vercel**: 通过 `vercel.json` 配置
- **Docker**: 通过 `Dockerfile` 和 `nginx.conf` 配置

---

## 维护模板

### 日常维护检查清单

#### 每周检查
- [ ] 检查依赖更新
- [ ] 查看是否有安全漏洞
- [ ] 备份重要内容
- [ ] 检查网站访问统计
- [ ] 测试音乐播放功能

#### 每月检查
- [ ] 更新依赖包
- [ ] 检查构建是否正常
- [ ] 测试所有页面链接
- [ ] 检查搜索功能（如启用）
- [ ] 审查和优化性能

#### 季度检查
- [ ] 主题和框架升级
- [ ] 内容审核和更新
- [ ] SEO 检查和优化
- [ ] 备份完整站点
- [ ] 安全审查

### 添加新内容流程

1. **创建新页面**
   ```bash
   # 在 pages 目录下创建新 Markdown 文件
   touch pages/your-page/index.md
   ```

2. **配置导航**
   编辑 `valaxy.config.ts`，在 `nav` 数组中添加新页面链接

3. **配置侧边栏**（如需要）
   编辑 `valaxy.config.ts`，在 `sidebar` 数组中添加配置

4. **本地测试**
   ```bash
   pnpm dev
   ```

5. **部署到生产环境**
   ```bash
   git add .
   git commit -m "feat: 添加新页面"
   git push
   ```

### 依赖更新流程

1. **检查过时依赖**
   ```bash
   pnpm outdated
   ```

2. **更新依赖**
   ```bash
   pnpm update
   ```

3. **测试构建**
   ```bash
   pnpm build
   ```

4. **测试本地运行**
   ```bash
   pnpm dev
   ```

5. **提交更改**
   ```bash
   git add .
   git commit -m "chore: 更新依赖"
   git push
   ```

### 问题排查清单

#### 构建失败
- [ ] 检查 TypeScript 错误
- [ ] 检查依赖是否完整安装
- [ ] 检查配置文件语法
- [ ] 查看构建日志

#### 开发服务器问题
- [ ] 检查端口是否被占用
- [ ] 清除缓存重启
- [ ] 检查 Node.js 版本
- [ ] 重新安装依赖

#### 部署问题
- [ ] 检查 GitHub Actions 日志
- [ ] 验证构建配置
- [ ] 检查仓库权限
- [ ] 确认分支设置

#### 性能问题
- [ ] 检查图片大小
- [ ] 优化资源加载
- [ ] 启用压缩
- [ ] 使用 CDN

### 备份策略

#### 内容备份
- 定期备份 `pages/` 目录
- 备份配置文件 (`site.config.ts`, `valaxy.config.ts`)
- 备份自定义组件和样式

#### 配置备份
- 导出 VSCode 配置
- 备份主题自定义设置
- 记录环境变量（如有）

#### Git 备份
- 定期推送到远程仓库
- 使用标签标记重要版本
- 维护清晰的提交历史

### 监控指标

#### 网站性能
- 页面加载时间
- 首次内容绘制 (FCP)
- 最大内容绘制 (LCP)
- 累积布局偏移 (CLS)

#### SEO 指标
- 搜索引擎收录情况
- 关键词排名
- 反向链接数量
- 社交媒体分享

#### 用户体验
- 页面浏览量
- 平均停留时间
- 跳出率
- 移动端兼容性

### 安全检查

#### 定期检查
- [ ] 依赖安全扫描
- [ ] 配置文件权限检查
- [ ] 敏感信息泄露检查
- [ ] HTTPS 证书有效期

#### 最佳实践
- 使用强密码
- 启用双因素认证
- 定期更新访问密钥
- 限制仓库访问权限

### 文档维护

#### 保持更新的文档
- 项目说明文档 (README.md)
- 组件使用文档 (components.md)
- 项目维护文档 (iflow.md)
- API 文档（如有）
- 部署文档
- 贡献指南

#### 文档审查
- 定期检查文档准确性
- 更新过时的信息
- 添加新的使用案例
- 改进文档结构

---

## 联系信息

- **项目地址**: https://github.com/sutiao-liulang-fashi/sutiao-liulang-fashi.github.io
- **站点地址**: https://sutiao-liulang-fashi.github.io

## 许可证

私有项目

---

**最后更新**: 2026-03-29

## 更新日志

### 2026-03-29
- 优化 abcjsHandler.ts 音频播放器
  - 修复 AudioContext 关闭后无法重新播放的问题
  - 改为每个实例创建独立的 AudioContext，避免实例间相互影响
  - 移除全局单例模式，所有组件改为独立实例化
  - 优化 initAudioContext() 方法，自动处理 closed 状态
  - 优化 dispose() 方法，添加完善的错误处理
- 优化 GoToPage.vue 加载页面
  - 移除进度条和百分比显示
  - 优化加载逻辑，使用真实的页面加载状态
  - 添加文字跳动动画效果
  - 引用《奇诺之旅》台词：The world is not beautiful. Therefore, it is.
- 修复 Yueqin.vue 月琴组件
  - 修复点击方块无法播放的问题
  - 使用 scientificToAbc 正确转换科学记谱法
  - 创建独立的单个音符播放器实例
  - 实现播放完成后自动清除显示
  - 单个音符播放不影响主播放/停止按钮状态
- 优化 AbcRenderer 换行处理
  - 移除 stretchlast 参数（新版本已不支持）
  - 支持回车键换行（尊重用户输入的换行符）
  - 简化 wrap 配置，使用 abcjs 默认行为
- 修复 AudioContext 自动播放警告
  - 从 update() 方法中移除 initAudioContext() 调用
  - 确保只在用户交互时创建 AudioContext

### 2026-03-28 (第二次更新)
- 重构音乐记谱法组件和文档结构
  - 删除 AnyNote、PlayAbcNote、PlayJianpuNote、PlayScientificNote 组件
  - 新增 YueLiNotes 组件，简化播放功能，支持三种记谱法
  - 新增 YueLiNotesPlayground 组件，提供完整的乐理练习场功能
  - 重新组织乐理文档结构，将规则文档移至 pages/yueli/规则/ 子目录
  - 新增乐理练习场页面 (pages/yueli/playground.md)
- 优化核心转换工具代码
- 改进 AbcSvg 组件，添加 showTitle 属性控制标题显示
- 更新路由映射和配置
- 新增 components.md 文档，详细说明所有组件的使用方法和参数
- 更新项目文档，反映最新的组件架构

### 2026-03-28 (第一次更新)
- 新增 AnyNote 组件，支持简谱、科学谱、ABC谱三种记谱法的输入、转换、播放和渲染
- 新增 PlayAbcNote 组件，支持 ABC 记谱法音符播放
- 新增 PlayJianpuNote 组件，支持简谱音符播放
- 新增 PlayScientificNote 组件，支持科学记谱法音符播放
- 新增 abcToAbc 工具，处理和优化 ABC 字符串，特别是头部信息合并
- 新增 abcjsHandler 工具，封装 abcjs 音频播放和渲染功能
- 新增 jianpuToAbc 工具，支持简谱到 ABC 记谱法转换
- 新增 jianpuToScientific 工具，支持简谱到科学记谱法转换
- 更新 scientificToAbc 工具，增强功能并优化转换逻辑
- 在 /start/ 页面添加 AnyNote 组件测试
- 在 /start/ 页面添加简谱、科学谱、ABC谱的播放测试
- 添加乐理文档（简谱转换规则、科学谱转换规则、ABC规则）
- 更新项目文档，反映最新的功能和技术架构

### 2026-03-27
- 添加音乐播放功能
- 创建 PlayNote 组件，支持科学记谱法音符播放
- 创建 AbcSvg 组件，支持五线谱渲染
- 创建 scientificToAbc 工具，支持科学记谱法到 ABC 记谱法转换
- 添加科学谱转换规则文档
- 在 /start/ 页面添加音乐功能测试用例
