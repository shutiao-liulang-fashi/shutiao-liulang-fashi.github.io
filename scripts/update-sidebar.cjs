const dirMap = {};

const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, '..', 'pages');
const CONFIG_FILE = path.join(__dirname, '..', 'valaxy.config.ts');
const EXCLUDED_DIRS = [''];
const EXCLUDED_FILES = ['404.md', 'index.md'];

// 从文件名/目录名中提取排序权重和清理后的名称
function extractOrderInfo(name) {
  // 匹配格式：数字_ 或 数字- (如 1_, 2-, 10_, 20-)
  const match = name.match(/^(\d+)[_-]/);
  if (match) {
    return {
      order: parseInt(match[1], 10),
      cleanName: name.substring(match[0].length)
    };
  }
  // 没有数字前缀，使用默认大值，排在后面
  return {
    order: 9999,
    cleanName: name
  };
}

// 从 markdown 文件中提取标题
function extractTitle(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // 优先提取 frontmatter 中的 title 字段
    if (lines[0].trim() === '---') {
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === '---') break;
        // 支持 title: 'xxx', title: "xxx", title: xxx 三种格式
        const match = line.match(/^title:\s*['"]?(.+?)['"]?$/);
        if (match) return match[1].trim();
      }
    }

    // 其次提取第一个 # 标题
    for (const line of lines) {
      const match = line.match(/^#\s+(.+)$/);
      if (match) return match[1].trim();
    }

    // 最后使用文件名作为备选
    return null;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

// 获取目录名称作为标题
function getName(dirName) {
  return dirMap[dirName] || dirName;
}

// 递归扫描目录，返回树形结构
function scanDirectoryTree(dirPath, relativePath = '') {
  const result = {
    files: [],
    subdirs: {}
  };

  try {
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // 递归扫描子目录
        const subPath = path.join(relativePath, item);
        result.subdirs[item] = scanDirectoryTree(fullPath, subPath);
      } else if (item.endsWith('.md') && !EXCLUDED_FILES.includes(item)) {
        result.files.push(item);
      }
    }
  } catch (error) {
    console.error(`Error scanning ${dirPath}:`, error.message);
  }

  return result;
}

// 递归构建 sidebar items
function buildSidebarItems(tree, parentDir = '') {
  const items = [];

  // 合并所有项目（文件和目录），一起排序
  const allItems = [];

  // 处理文件
  for (const file of tree.files) {
    const orderInfo = extractOrderInfo(file);
    allItems.push({
      type: 'file',
      file,
      ...orderInfo
    });
  }

  // 处理子目录
  for (const [dirName, subTree] of Object.entries(tree.subdirs)) {
    const orderInfo = extractOrderInfo(dirName);
    allItems.push({
      type: 'dir',
      dirName,
      subTree,
      ...orderInfo
    });
  }

  // 统一排序：先按权重，再按名称
  allItems.sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    const nameA = a.type === 'file' ? a.file : a.dirName;
    const nameB = b.type === 'file' ? b.file : b.dirName;
    return nameA.localeCompare(nameB);
  });

  // 添加排序后的项目
  for (const item of allItems) {
    if (item.type === 'file') {
      // 处理文件
      const filePath = path.join(PAGES_DIR, parentDir, item.file);
      const extractedTitle = extractTitle(filePath);
      const title = extractedTitle || getName(item.cleanName) || item.cleanName;
      const link = `/${path.join(parentDir, item.file).replace(/\.md$/, '').replace(/\\/g, '/')}`;
      items.push({ text: title, link });
    } else {
      // 处理目录
      const subPath = path.join(parentDir, item.dirName);
      const indexFile = path.join(PAGES_DIR, subPath, 'index.md');
      let dirTitle = getName(item.cleanName);

      // 尝试从 index.md 提取标题
      if (fs.existsSync(indexFile)) {
        const indexTitle = extractTitle(indexFile);
        if (indexTitle) dirTitle = indexTitle;
      }

      // 递归构建子目录的 items
      const subItems = buildSidebarItems(item.subTree, subPath);

      if (subItems.length > 0) {
        // 有子文件，创建带 items 的配置
        items.push({
          text: dirTitle,
          link: `/${subPath.replace(/\\/g, '/')}/`,
          collapsed: false,
          items: subItems
        });
      } else {
        // 没有子文件，只显示目录本身
        items.push({
          text: dirTitle,
          link: `/${subPath.replace(/\\/g, '/')}/`
        });
      }
    }
  }

  return items;
}

// 生成 sidebar 配置
function generateSidebar() {
  const sidebar = [];
  const items = fs.readdirSync(PAGES_DIR);

  // 按排序权重排序主目录
  const dirsWithOrder = items.map(item => {
    const fullPath = path.join(PAGES_DIR, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !EXCLUDED_DIRS.includes(item)) {
      const orderInfo = extractOrderInfo(item);
      return { item, fullPath, stat, ...orderInfo };
    }
    return null;
  }).filter(Boolean);

  dirsWithOrder.sort((a, b) => {
    // 先按排序权重排序
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    // 权重相同时按字母顺序排序
    return a.item.localeCompare(b.item);
  });

  for (const { item, fullPath, cleanName } of dirsWithOrder) {
    const indexFile = path.join(fullPath, 'index.md');
    let dirTitle = getName(cleanName);

    // 尝试从 index.md 提取标题
    if (fs.existsSync(indexFile)) {
      const indexTitle = extractTitle(indexFile);
      if (indexTitle) dirTitle = indexTitle;
    }

    // 扫描目录树
    const tree = scanDirectoryTree(fullPath);
    const subItems = buildSidebarItems(tree, item);

    if (subItems.length > 0) {
      // 有子文件，创建带 items 的配置
      sidebar.push({
        text: dirTitle,
        link: `/${item}/`,
        collapsed: false,
        items: subItems
      });
    } else {
      // 没有子文件，只显示目录本身
      sidebar.push({
        text: dirTitle,
        link: `/${item}/`
      });
    }
  }
  return sidebar;
}

// 格式化 sidebar 为 TypeScript 代码
function formatSidebar(sidebar) {
  const lines = [];
  for (const item of sidebar) {
    if (item.items && item.items.length > 0) {
      lines.push('  {');
      lines.push(`    text: '${item.text}',`);
      lines.push(`    link: '${item.link}',`);
      lines.push(`    collapsed: ${item.collapsed},`);
      lines.push('    items: [');
      for (const subItem of item.items) {
        lines.push('      {');
        lines.push(`        text: '${subItem.text}',`);
        lines.push(`        link: '${subItem.link}',`);
        if (subItem.items && subItem.items.length > 0) {
          lines.push(`        collapsed: ${subItem.collapsed},`);
          lines.push('        items: [');
          for (const subSubItem of subItem.items) {
            lines.push('          {');
            lines.push(`            text: '${subSubItem.text}',`);
            lines.push(`            link: '${subSubItem.link}',`);
            lines.push('          },');
          }
          lines.push('        ]');
        }
        lines.push('      },');
      }
      lines.push('    ]');
      lines.push('  },');
    } else {
      lines.push('  {');
      lines.push(`    text: '${item.text}',`);
      lines.push(`    link: '${item.link}',`);
      lines.push('  },');
    }
  }
  return lines.join('\n');
}

// 更新配置文件
function updateConfig() {
  try {
    const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const newSidebar = generateSidebar();

    // 找到 sidebar 数组的开始和结束位置
    const sidebarStart = content.indexOf('const sidebar = [');
    const sidebarEnd = content.indexOf('] as any', sidebarStart) + 1;

    if (sidebarStart === -1 || sidebarEnd === -1) {
      console.error('❌ 找不到 sidebar 数组');
      return;
    }

    // 生成新的 sidebar 代码
    const newSidebarCode = `const sidebar = [\n${formatSidebar(newSidebar)}\n]`;
    //console.log(newSidebarCode)
    // 替换旧内容
    const newContent = content.substring(0, sidebarStart) + newSidebarCode + content.substring(sidebarEnd);
    fs.writeFileSync(CONFIG_FILE, newContent, 'utf-8');

    console.log('✅ Sidebar 更新成功！');
    console.log(`📁 发现 ${newSidebar.length} 个主目录`);
    for (const item of newSidebar) {
      if (item.items) {
        console.log(`   - ${item.text}: ${item.items.length} 个项目`);
      } else {
        console.log(`   - ${item.text}`);
      }
    }
  } catch (error) {
    console.error('❌ 更新失败:', error.message);
  }
}

updateConfig();
