const fs = require('fs');
const path = require('path');

// 源目录
const gitDir = path.join(__dirname, '../script/git');
const noteDir = path.join(__dirname, '../script/note');
// 目标目录
const targetDir = path.join(__dirname, 'src/content/posts');

// 确保目标目录存在
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 处理单个文件
function processFile(filePath, category) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath, '.md');

  // 如果已经包含frontmatter，跳过
  if (content.startsWith('---')) {
    console.log(`Skipping ${filePath} (already has frontmatter)`);
    return;
  }

  // 提取标题：使用第一行非空行，去掉#号
  let title = fileName;
  const lines = content.split('\n');
  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('# ')) {
      title = line.substring(2).trim();
      break;
    }
  }

  // 构建frontmatter
  const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
published: ${new Date().toISOString().split('T')[0]}
draft: false
description: ""
tags: [${category}]
---
`;

  const newContent = frontmatter + content;
  const targetPath = path.join(targetDir, path.basename(filePath));
  fs.writeFileSync(targetPath, newContent, 'utf8');
  console.log(`Processed ${filePath} -> ${targetPath}`);
}

// 处理目录
function processDirectory(dir, category) {
  if (!fs.existsSync(dir)) {
    console.log(`Directory ${dir} does not exist`);
    return;
  }

  const files = fs.readdirSync(dir);
  let count = 0;
  for (const file of files) {
    if (file.endsWith('.md')) {
      processFile(path.join(dir, file), category);
      count++;
    }
  }
  console.log(`Processed ${count} files from ${dir}`);
}

// 主函数
function main() {
  console.log('开始添加frontmatter...');
  // 先清空目标目录（可选，备份原有文件）
  // 备份原有文件
  const backupDir = path.join(__dirname, 'src/content/posts-backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const existingFiles = fs.readdirSync(targetDir);
  for (const file of existingFiles) {
    if (file.endsWith('.md')) {
      fs.renameSync(path.join(targetDir, file), path.join(backupDir, file));
    }
  }
  console.log(`备份了 ${existingFiles.length} 个原有文件到 ${backupDir}`);

  // 处理git和note目录
  processDirectory(gitDir, 'git');
  processDirectory(noteDir, 'note');
  console.log('完成！');
}

main();