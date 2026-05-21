---
title: "PaddleOCR 3.5：拥抱Transformers生态，OCR与文档解析更加灵活"
published: 2026-05-21
draft: false
description: "PaddleOCR 3.5版本新增Transformers推理后端，支持PP-OCRv5和PaddleOCR-VL 1.5通过Hugging Face Transformers运行，简化了文档AI工作流与RAG系统的集成。"
tags: [ai-update, 工具, 开源]
---

## 背景

光学字符识别（OCR）和文档解析是许多AI应用的基础环节，尤其是在检索增强生成（RAG）系统中，从PDF、扫描文档、截图、表格、图表中提取结构化数据是第一步。然而，OCR工具往往与主流深度学习框架存在兼容性问题，开发者不得不在不同工具链之间切换，增加了集成复杂度。

PaddleOCR是百度PaddlePaddle团队开发的流行OCR工具包，包含PP-OCRv5（传统OCR）和PaddleOCR-VL 1.5（视觉语言文档解析）等系列模型。2026年5月18日发布的PaddleOCR 3.5版本，引入了一个重大变化：支持Hugging Face Transformers作为推理后端。这意味着开发者现在可以直接使用熟悉的Transformers接口来运行PaddleOCR模型，而无需依赖PaddlePaddle的完整图引擎。

## 核心内容分析

### 变革：引擎可插拔

PaddleOCR 3.5重构了推理引擎接口，允许用户通过engine参数选择后端。例如，设置engine="transformers"即可启用Transformers后端，同时可以通过engine_config配置dtype、设备（CPU/GPU）、注意力实现等参数。这使PaddleOCR能够无缝融入Hugging Face生态——开发者可以沿用已有的transformers代码习惯，甚至与其他Hugging Face模型组合使用。

技术栈分为三层：
- **推理后端层**：负责实际运行模型，目前支持Paddle静态图、Paddle动态图以及Transformers。
- **模型层**：提供OCR和文档解析能力，如PP-OCRv5、PaddleOCR-VL 1.5。
- **应用层**：开发者构建的RAG、智能文档处理Agent等。

这一改动主要影响推理后端层，模型层保持不变，意味着PaddleOCR原有的识别质量不受影响，只是运行时选择更灵活。

### 为什么重要

对于RAG和文档AI应用，文档摄入（ingestion）往往是瓶颈。传统流程中，PDF先经过OCR提取文字，再通过布局分析识别表格、标题等，最后送入语义分块。如果OCR工具不能与Transformers栈良好协同，开发者需要手动转换数据格式或编写胶水代码。

PaddleOCR 3.5消除了这一障碍。例如，开发者可以在一个Python脚本中，先使用transformers加载PaddleOCR模型进行文字检测和识别，然后直接用transformers的pipeline处理提取的文本，或者将输出直接喂给嵌入模型建立索引。这种端到端的兼容性大大简化了工作流。

官方还提供了一个Hugging Face Spaces上的实时演示，展示了如何通过简单的参数切换来运行PaddleOCR。

## 行业影响/专业点评

PaddleOCR 3.5的发布体现了文档AI领域的一个趋势：工具去中心化、生态融合。长期以来，PaddlePaddle和Hugging Face分属不同阵营，开发者往往需要在两个框架之间做出选择。现在，PaddleOCR主动拥抱Transformers后端，使得其丰富的OCR模型能够被更大的社区使用。

对于RAG开发者而言，这意味着可以更灵活地构建文档处理流水线。例如，在LlamaIndex或LangChain中集成PaddleOCR时，不再需要额外的适配器；直接通过transformers加载即可。同时，Transformers后端支持最新的注意力优化（如Flash Attention），可能带来性能提升。

当然，目前并非所有PaddleOCR模型都支持Transformers后端，首批支持的是PP-OCRv5和PaddleOCR-VL 1.5。但这一里程碑标志着PaddleOCR向开放生态迈出了关键一步。未来，随着更多模型适配，PaddleOCR有望成为文档AI领域的一个通用组件，而不仅仅是PaddlePaddle生态的专属工具。

总之，PaddleOCR 3.5降低了OCR和文档解析的集成门槛，让开发者能够专注于上层应用，而无需被底层框架所困扰。

---
[来源](https://huggingface.co/blog/PaddlePaddle/paddleocr-transformers)
