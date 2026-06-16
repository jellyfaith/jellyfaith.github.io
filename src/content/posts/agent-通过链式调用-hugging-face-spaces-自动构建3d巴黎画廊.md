---
title: "Agent 通过链式调用 Hugging Face Spaces 自动构建3D巴黎画廊"
published: 2026-06-16
draft: false
description: "作者展示了一个编码Agent仅通过调用两个Hugging Face Spaces（图像生成和3D重建）就自动构建了包含巴黎地标3D高斯溅射的交互式网站，体现了“构建块经济”在多媒体AI中的应用。"
tags: [ai-update, 工具, Agent]
---

## 背景

随着 AI 模型能力的提升，如何将它们集成到实际应用中成为了新的挑战。传统的做法需要复杂的 SDK、GPU 资源管理和格式转换。然而，Hugging Face Spaces 作为一种部署平台，正逐步演变为可被 Agent 直接调用的“构建块”。Mishig Davaadorj 在2026年6月9日发表的一篇博客中，通过一个生动的示例展示了这一趋势：一个编码 Agent 通过链式调用两个 Hugging Face Spaces，自动构建了一个展示巴黎地标的 3D 高斯溅射画廊网站，整个过程无需人工干预图像生成或 3D 重建。

## 核心内容分析

### 构建块经济

Mitchell Hashimoto 提出的“构建块经济”认为，最有效的软件构建方式不再是打造一个完整的单体应用，而是将经过验证的小型组件组装起来，而 AI（尤其是 Agent）非常擅长这种组装。这个理念在代码库领域已经得到验证，现在正冲击着多媒体 AI 领域。

### Hugging Face Spaces 的 agents.md 协议

每个 Gradio Space 都公开一个纯文本的 `agents.md`，它告诉 Agent 如何调用该 Space。例如，对于 TripoSplat Space，通过 `curl` 获取的内容包含：
- API 模式：获取 schema 的 URL
- 调用端点：用于发送请求
- 轮询结果：获取任务结果
- 文件上传：处理文件输入
- 认证：使用 `HF_TOKEN`

Agent 读取这些信息后，无需客户端库或硬编码集成，即可驱动整个 Space。真正的解锁在于“链式调用”：一个 Space 的输出成为下一个 Space 的输入。

### 实际示例：巴黎地标转为 3D 高斯溅射

作者命令 Agent 构建一个展示巴黎地标的网站。Agent 调用了两个 Space：
1. **图像生成 Space**：根据文本提示生成巴黎地标图像。
2. **3D 重建 Space**（例如 TripoSplat）：将图像转换为 3D 高斯溅射（Gaussian Splats）。

Agent 自动处理了从图像到 3D 的管线，并将结果嵌入到一个电影般的查看器中，最终生成了一个静态 Space（`mishig/monuments-de-paris`）。整个过程没有人工打开图像生成器或 3D 重建工具，Agent 完全自主完成了资产的创建与整合。

## 行业影响与专业点评

这个例子展示了 AI Agent 在多媒体内容创作中的巨大潜力。传统上，创建一个包含 3D 模型的交互式网站需要专业的设计师、3D 建模师和前端开发者。而现在，Agent 仅通过调用两个公开的 API 就可实现，这极大地降低了创作门槛。

更深远的意义在于，Hugging Face Spaces 的 `agents.md` 协议正在成为 AI 原生应用的标准接口。随着越来越多的模型以 Space 的形式部署，Agent 可以像拼乐高一样组合它们，完成复杂的任务。这种“构建块经济”将加速 AI 解决方案的迭代，并推动更多开发者参与创建可复用的 AI 组件。

然而，这也对 AI 组件提出了更高的要求：它们必须具有清晰的文档、稳定的接口和良好的兼容性。这或许会成为未来 AI 生态系统的核心特性。

---
[来源](https://huggingface.co/blog/mishig/spaces-agents-md)
