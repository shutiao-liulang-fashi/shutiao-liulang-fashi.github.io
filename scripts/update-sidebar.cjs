const dirMap = {
  'start': '开始',
  'yueli': '乐理',
  'p_yueqin': '月琴',
  'staff': '五线谱',
  'ABCNotation': 'ABC 记谱法',
  'playground': '乐理游乐场',
};

const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, '..', 'pages');
const CONFIG_FILE = path.join(__dirname, '..', 'valaxy.config.ts');
const EXCLUDED_DIRS = [''];
const EXCLUDED_FILES = ['404.md', 'index.md'];



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

  // 添加文件
  for (const file of tree.files.sort()) {
    const filePath = path.join(PAGES_DIR, parentDir, file);
    const title = getName(path.basename(file, '.md')) || path.basename(file, '.md');
    const link = `/${path.join(parentDir, file).replace(/\.md$/, '/').replace(/\\/g, '/')}`;
    items.push({ text: title, link });
  }

  // 添加子目录
  for (const [dirName, subTree] of Object.entries(tree.subdirs).sort()) {
    const subPath = path.join(parentDir, dirName);
    const indexFile = path.join(PAGES_DIR, subPath, 'index.md');
    let dirTitle = getName(dirName);

    // 递归构建子目录的 items
    const subItems = buildSidebarItems(subTree, subPath);

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

  return items;
}

// 生成 sidebar 配置
function generateSidebar() {
  const sidebar = [];
  const items = fs.readdirSync(PAGES_DIR);

  for (const item of items) {
    const fullPath = path.join(PAGES_DIR, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !EXCLUDED_DIRS.includes(item)) {
      const indexFile = path.join(fullPath, 'index.md');
      let dirTitle = getName(item);

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
    console.log(newSidebarCode)
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
