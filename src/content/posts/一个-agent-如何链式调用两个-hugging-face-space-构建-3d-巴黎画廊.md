---
title: "一个 Agent 如何链式调用两个 Hugging Face Space 构建 3D 巴黎画廊"
published: 2026-06-13
draft: false
description: "Mishig 展示了一个编码 agent 如何通过 agents.md 协议链式调用图像生成和 3D 重建两个 Hugging Face Space，无需手动处理集成，自动生成 3D 巴黎景点画廊。"
tags: [ai-update, 工具, 开源]
---

## 背景

Hugging Face 的 Spaces 不仅是一个模型演示平台，更逐渐演变成可被 AI agent 直接调用的“构建块”。近期，Hugging Face 为每个 Gradio Space 添加了 `agents.md` 文件，暴露了调用该 Space 所需的标准端点、认证方式和输入输出格式。这意味着一台 agent 可以像调用函数一样调用一个 Space。

社区成员 Mishig Davaadorj 最近进行了一次实验：他请求一个编码 agent 构建一个展示巴黎景点 3D 高斯泼溅的网站。整个过程中，他没有手动运行任何图像生成或 3D 重建工具，而是由 agent 独立完成了所有工作——通过链式调用两个 Hugging Face Space，自动生成了图片和 3D 模型，并装配成可交互的网页。

## 核心内容分析

### 构建块经济：从代码库到多模态 AI

Mitchell Hashimoto 曾提出“构建块经济”（Building Block Economy）的概念：最有效的软件开发方式不再是构建庞大的单体，而是组合小巧、文档完善的组件，而 AI 特别擅长将这些经过验证的组件粘合在一起。这一理念最初体现在代码库上，但如今也适用于多模态 AI：图像模型、视频模型、语音模型、3D 重建模型——使用它们的难点从来不在模型本身，而在于集成过程中的 SDK、权重、GPU、输入格式等细节。如果每个模型都变成一个文档化的可调用块，agent 就能像拼装 npm 包一样将它们组合起来。

### agents.md：每 Space 都是一个构建块

Hugging Face 上已经部署了成千上万个 SOTA 模型（大部分是开放权重），大多数以 Space 形式存在。现在，每个 Gradio Space 都暴露了一个 `agents.md` 文件，该文件用纯文本告诉 agent 如何调用该 Space。例如，curl 获取 `https://huggingface.co/spaces/.../agents.md` 会返回：

- API schema URL
- 调用模板和轮询模板
- 文件上传方式
- 认证提示（使用 Bearer token）

没有客户端库，没有硬编码集成。Agent 读取该文件后即可端到端驱动该 Space。真正的解锁在于**链式调用**：一个 Space 的输出成为下一个 Space 的输入。

### 实际案例：从提示词到 3D 景点

Mishig 的 agent 链式调用了两个 Space：
1. 图像生成 Space（通过文本提示生成巴黎景点的图片）
2. 3D 重建 Space（将这些图片转换为 3D 高斯泼溅）

agent 自动读取每个 Space 的 `agents.md`，依次调用，并将最终生成的 3D 模型集成到网页中。整个过程无需人工干预，展示了 agent 在多模态 AI 工具链中的巨大潜力。

## 行业影响与专业点评

这一案例生动地展示了 Hugging Face Spaces 作为“AI 函数库”的潜力。`agents.md` 协议让任何 Gradio Space 都成为 agent 可调用的 API，极大地降低了多模态 AI 应用的开发门槛。开发者不再需要手写集成代码，只需定义工作流，agent 就能自动组合模型。

对于 AI 社区而言，这意味着：（1）已有的高质量 Space 可以立即被 agent 重用，无需二次开发；（2）模型开发者只需维护一个 Space 并编写 `agents.md`，就能让整个 agent 社区利用其能力；（3）复杂的多步 AI 流水线（如“文本→图像→3D”）可以像脚本一样被 agent 自动化执行。

随着越来越多的 Space 加入 `agents.md` 支持，我们正在见证一个开放的 AI 组件生态系统的诞生。未来，agent 或许能像使用命令行工具一样自由组合各种 AI 能力，从而解锁前所未有的创造力。

---
[来源](https://huggingface.co/blog/mishig/spaces-agents-md)
