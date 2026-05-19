---
title: "PaddleOCR 3.5 接入 Transformers 后端：文档解析与 RAG 的桥梁"
published: 2026-05-19
draft: false
description: "PaddleOCR 3.5 发布，支持 Hugging Face Transformers 作为推理后端，使 PP-OCRv5 和 PaddleOCR-VL 1.5 等模型能无缝融入基于 Transformers 的文档 AI 工作流。"
tags: [ai-update, 工具, 开源]
---

## 背景

在 RAG（检索增强生成）和文档 AI 应用中，最关键的瓶颈往往不在大模型本身，而是文档预处理阶段。开发者需要将 PDF、扫描件、截图、表格、图表、公式等复杂页面布局转化为可靠的结构化数据。如果这一摄入步骤薄弱，下游 LLM 可能会遗漏关键信息、检索到错误的上下文，或产生不可靠的回答。

PaddleOCR 是业界领先的开源 OCR 和文档解析工具集，提供 PP-OCRv5 系列 OCR 模型和 PaddleOCR-VL 1.5 系列文档解析模型。然而，传统上 PaddleOCR 使用 PaddlePaddle 动态图或静态图作为后端，与 Hugging Face 生态中的 Transformers 库存在集成壁垒。

## 核心内容：Transformers 后端支持

PaddleOCR 3.5 版本的关键变化是引入了更灵活的推理引擎接口。开发者现在可以通过设置 `engine="transformers"` 参数，让支持的 PaddleOCR 模型使用 Hugging Face Transformers 作为推理后端。同时，通过 `engine_config` 可以配置 dtype、设备放置、注意力实现等后端选项。

这一改变的实质是解耦了模型层和推理后端层：
- **应用层**：使用 OCR 和文档解析输出的应用（如 RAG、智能体、文档 AI）
- **模型层**：OCR 和文档解析能力（PP-OCRv5、PaddleOCR-VL 1.5）
- **推理后端层**：运行模型的运行时（Paddle 静态图、Paddle 动态图、Transformers）

PaddleOCR 3.5 主要在推理后端层进行了扩展，使得 PaddleOCR 的模型能力能够自然地融入以 Transformers 为中心的环境。开发者无需手动调用每个内部组件，PaddleOCR 负责管理背后的 pipeline。

## 行业影响与专业点评

PaddleOCR 3.5 的这一更新对文档 AI 生态具有重要价值。对于已经使用 Hugging Face Transformers 的团队，现在可以直接在现有系统中集成高质量的 OCR 和文档解析功能，无需引入 PaddlePaddle 作为依赖。这降低了技术栈的复杂性，加速了文档预处理管线的构建。

尤其是对于 RAG 系统，文档解析的准确性直接影响检索质量。PaddleOCR 3.5 使得开发者可以轻松地将强大的中文和多语言 OCR 能力融入基于 Transformers 的检索链，从而提升整体系统的鲁棒性。此外，该版本还提供了在线 Demo，方便开发者快速体验。

---
[来源](https://huggingface.co/blog/PaddlePaddle/paddleocr-transformers)
