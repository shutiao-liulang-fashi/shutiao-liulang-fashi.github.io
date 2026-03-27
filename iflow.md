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
│   ├── GoToPage.vue   # 自动跳转组件
│   └── README.md
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
│   └── test/            # 测试页面
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
├── site.config.ts       # 站点配置
├── valaxy.config.ts     # Valaxy 配置
├── valaxy.config.router.ts  # 路由配置
├── package.json         # 项目依赖
├── tsconfig.json        # TypeScript 配置
├── Dockerfile           # Docker 配置
├── netlify.toml         # Netlify 配置
├── vercel.json          # Vercel 配置
└── nginx.conf           # Nginx 配置
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

## 自定义组件

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

## 导航结构

当前导航配置：[]

### 侧边栏结构

1. **开始** (`/start/`)


2. **占位**
   - 占位1 (`/start/`)
   - 占位2 (`/start/start/`)

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
- 项目说明文档
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

**最后更新**: 2026-03-27
