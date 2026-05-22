---
title: "PaddleOCR 3.5：拥抱Transformers生态，OCR与文档解析迎来新后盾"
published: 2026-05-22
draft: false
description: "PaddleOCR 3.5版本引入Transformers作为推理后端，支持PP-OCRv5和PaddleOCR-VL等模型通过Hugging Face Transformers运行，为RAG和Document AI提供更灵活文档预处理方案。"
tags: [ai-update, 工具, 开源]
---

## 背景

在构建RAG（检索增强生成）系统或文档智能（Document AI）应用时，一个常被低估的关键步骤是“文档摄入”（document ingestion）。在LLM真正发挥作用之前，开发者需要将PDF、扫描件、截图、表格、图表、公式以及复杂页面布局转化为可靠的结构化数据。如果这一步做不好，下游LLM可能会遗漏关键信息、检索错误上下文，甚至产生不可靠的回答。

光学字符识别（OCR）和文档解析技术正是解决文档摄入的核心工具。PaddleOCR作为百度PaddlePaddle生态的明星项目，一直以其高精度和丰富的功能（包括PP-OCRv5文本识别模型和PaddleOCR-VL视觉-语言文档解析模型）在国内和国际上拥有广泛用户。但长期以来，PaddleOCR主要依赖PaddlePaddle的动态图或静态图作为推理后端，与Hugging Face生态的云原生、Transformer优先的开发环境存在一定隔阂。

2026年5月18日，PaddleOCR 3.5正式发布，带来了一项关键变革：**Transformers成为其支持的推理后端之一**。这意味着，用户可以使用Hugging Face Transformers库来运行PaddleOCR的模型，同时保留PaddleOCR提供的高级图像管线和模型能力。

## 核心内容分析

### 变革的核心：灵活的推理后端接口

PaddleOCR 3.5引入了更灵活的推理引擎接口。开发者只需通过设置 `engine="transformers"` 参数，即可选择Transformers作为后端，同时通过 `engine_config` 传递后端特定选项，如 `dtype`（数据类型）、设备映射和注意力实现方式。

关键点在于：**PaddleOCR自身仍然负责图像处理和管线管理**——包括文本检测、方向分类、文本识别（PP-OCRv5）或视觉-语言解析（PaddleOCR-VL）等步骤的编排。Transformers仅作为运行底层模型的推理引擎。这种分层架构如下图所示：
- **应用层**：RAG、代理、文档AI等应用程序，使用OCR和文档解析的输出。
- **模型层**：PaddleOCR提供的能力，包括PP-OCRv5和PaddleOCR-VL等模型系列。
- **推理后端层**：运行模型的具体运行时，包括Paddle静态图、Paddle动态图和新的Transformers后端。

PaddleOCR 3.5的更新主要集中在推理后端层：PaddleOCR继续提供模型和管线，而Transformers为支持的模型提供了一种自然融入Hugging Face工作流的选项。

### 为什么重要？

对于构建RAG和文档AI的开发者来说，工作流通常围绕Hugging Face生态组织：使用Transformers加载模型、通过`datasets`处理数据、用`accelerate`进行分布式训练。PaddleOCR之前要求同时安装PaddlePaddle框架，增加了依赖复杂性和学习成本。

现在，如果开发者熟悉Transformers，他们可以直接用 `from transformers import AutoModel` 的方式加载PaddleOCR支持的模型（需要在模型组织中明确标注），而无需额外引入PaddlePaddle。这会大大加速OCR功能在已有Transformers项目中的集成。

同时，PaddleOCR 3.5还提供了Hugging Face Spaces上的在线演示，让用户无需本地安装即可体验新后端的效果。

### 模型支持与未来展望

目前支持Transformers后端的模型包括PP-OCRv5系列（文本检测、方向分类、识别）和PaddleOCR-VL 1.5文档解析模型。PaddlePaddle团队表示将持续扩展支持列表。随着越来越多文档AI任务需要跨框架协作，这种“模型能力来自Paddle，推理运行在Transformers”的模式可能会成为行业趋势。

## 行业影响/专业点评

PaddleOCR 3.5的发布不仅仅是版本迭代，更是**框架生态融合的标志性事件**。长期以来，中文OCR和文档解析领域由PaddleOCR主导，而Hugging Face生态则在通用NLP和图像处理占据上风。两者的割裂导致开发者在构建完整系统时面临选择困难。

启用Transformers后端意味着：
1. **降低复杂性**：开发者可以在不安装PaddlePaddle的情况下使用PaddleOCR的高精度模型。这对于已经采用Hugging Face生态的团队是一个巨大的利好。
2. **加速创新**：文档AI管道中可以更灵活地组合不同框架的模型——例如，用PaddleOCR做OCR，用sentence-transformers做嵌入，用LLM做问答，全部在统一的Transformers环境中完成。
3. **生态共赢**：PaddleOCR获得了更广泛的用户触达，Hugging Face获得了领域专用的高质量OCR模型。这种开放式合作鼓励了更多框架间的互操作性。

对于RAG和文档智能领域的从业者，PaddleOCR 3.5意味文档摄入环节有了更可靠的选项。随着LLM应用越来越依赖结构化文档知识，OCR的质量和集成便利性将成为系统成败的关键因素。PaddlePaddle团队选择拥抱Transformers，无疑是一个明智且务实的发展方向。

---

[来源](https://huggingface.co/blog/PaddlePaddle/paddleocr-transformers)
