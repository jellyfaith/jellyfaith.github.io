# Jellyfaith 的 Blog

基于 [MultiTerm Astro](https://github.com/stelcodes/multiterm-astro) 主题构建的个人博客，部署于 [jellyfaith.github.io](https://jellyfaith.github.io)。

## 技术栈

- **框架**: [Astro](https://astro.build/) v5
- **样式**: [Tailwind CSS](https://tailwindcss.com/) v4
- **代码高亮**: Expressive Code + 50+ Shiki 主题
- **评论**: Giscus（基于 GitHub Discussions）
- **搜索**: Pagefind
- **数学公式**: KaTeX
- **字体**: JetBrains Mono Variable

## 功能特性

- 多主题切换（支持 50+ 配色方案）
- 暗色/亮色模式自适应
- GitHub 活动日历
- RSS Feed 与 Sitemap
- 自动生成社交预览图（Satori）
- 标签分类与文章归档
- 阅读时间估算
- 响应式设计

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建并预览
npm run build && npm run preview
```

## 配置

站点配置位于 `src/site.config.ts`，内容文件位于 `src/content/`。
