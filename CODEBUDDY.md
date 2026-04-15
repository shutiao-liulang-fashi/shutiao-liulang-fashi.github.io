# CODEBUDDY.md

This file provides guidance to CodeBuddy when working with code in this repository.

## 常用命令

- **安装依赖**: `pnpm install` 或 `npm i`
- **开发模式**: `pnpm dev` — 启动开发服务器，访问 http://localhost:4859/
- **构建 SSG**: `pnpm build` — 构建静态站点输出到 `dist/`
- **构建 SPA**: `pnpm build:spa` — 构建单页应用模式
- **本地预览**: `pnpm serve` — 预览构建产物
- **RSS 订阅**: `pnpm rss` — 生成 RSS 订阅文件
- **Docker 部署**: `docker build . -t your-valaxy-blog-name:latest`

## 项目架构

这是一个基于 **Valaxy** 框架的静态博客/文档站点，主要用于音乐理论（乐理）教育，支持多种记谱法的展示和播放。

### 核心配置文件

- `valaxy.config.ts` — 主题配置，包含导航栏、侧边栏和页脚。侧边栏由 `scripts/update-sidebar.cjs` 自动生成。
- `site.config.ts` — 站点元数据配置（URL、语言、标题、搜索等）
- `package.json` — 依赖声明，使用 pnpm 管理，核心依赖为 `valaxy` 和 `valaxy-theme-press`

### 内容组织

- `pages/` — 所有页面内容，以 Markdown 形式编写。文件名/目录名使用 `数字_` 或 `数字-` 前缀控制排序（如 `0_start/`、`1_yueli/`）
- `pages/posts/` — 文章目录（当前未使用）
- 页面 frontmatter 中的 `title` 字段优先于 `#` 标题用于侧边栏显示

### 自定义扩展

- `components/` — 自定义 Vue 组件，自动全局注册。主要组件包括：
  - `YueLiNotes.vue` — 乐理音符组件，支持 ABC、简谱、科学记谱法三种格式
  - `PianoPlayground.vue`、`YueLiNotesPlayground.vue` — 交互式乐理游乐场
  - `core/` — 记谱法转换核心逻辑（ABC、简谱、科学记谱法互转）
- `layouts/` — 自定义布局文件，覆盖主题布局
- `styles/` — 样式覆盖，`index.scss` 和 `css-vars.scss` 会自动加载
- `locales/` — 国际化配置

### 音乐功能实现

使用 **abcjs** 库处理乐谱：
- `components/core/abcToAbc.ts` — ABC 到 ABC 转换
- `components/core/jianpuToAbc.ts` — 简谱转 ABC
- `components/core/scientificToAbc.ts` — 科学记谱法转 ABC
- `components/core/abcjsHandler.ts` — abcjs 封装，处理渲染和播放

### 构建与部署

- 主题使用 **UnoCSS** 进行原子化 CSS
- 部署支持多种平台：Docker + Nginx、GitHub Pages、Vercel、Netlify
- 根目录包含各平台的配置文件：`Dockerfile`、`nginx.conf`、`netlify.toml`、`vercel.json`
- `public/` 目录存放静态资源（如 mp3 音频文件）

### 开发注意事项

- 侧边栏自动生成逻辑在 `scripts/update-sidebar.cjs`，修改 pages 目录后会自动更新侧边栏
- 添加新组件后会自动全局注册，无需手动 import
- `devtools: false` 在 `valaxy.config.ts` 中禁用了开发工具
