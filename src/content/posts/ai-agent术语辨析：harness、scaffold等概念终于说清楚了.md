---
title: "AI Agent术语辨析：Harness、Scaffold等概念终于说清楚了"
published: 2026-05-27
draft: false
description: "针对AI Agent领域术语混乱的现状，HuggingFace发布权威术语表，厘清Harness、Scaffold、Model等核心概念，帮助从业者建立统一理解。"
tags: [ai-update, 模型]
---

## 背景

AI Agent领域发展迅猛，但伴随着技术迭代，术语体系却陷入了混乱。同一个词在不同框架中有不同含义，新概念层出不穷又快速消失。在ICLR 2026上，一位研究者提出困惑：“Harness和Scaffold在Agent语境下到底指什么？为什么大家无法达成一致解释？”这促使HuggingFace的Sergio Paniego和Aritra Roy Gosthipaty撰写了这篇术语指南，旨在为从业者提供一个实用的心智模型。

## 核心内容分析

### Model：纯粹的LLM

Model仅指大语言模型（如Claude、Qwen、GPT等），它接收文本并生成文本，本身没有记忆和循环能力。模型可以表达调用工具的意图，但需要Harness来实际执行。它回答一个提示后即停止。只有包裹上Scaffolding和Harness，才成为Agent。

### Scaffolding：行为定义层

Scaffolding是模型周围的行为定义层，包括系统提示、工具描述、响应解析逻辑、跨步骤的上下文管理等。它决定了模型如何看待世界并采取行动，无论是在训练还是推理阶段。不同的产品或框架对Scaffolding的称呼可能不同，但核心作用一致。

### Harness：执行框架

Harness的概念更为宽泛。在Claude Code的文档中明确写道：“Claude Code serves as the agentic harness around Claude.”即Harness包含了所有让Agent运行的组件。而在一些定义中，Harness特指工具执行和外部环境交互的部分。作者指出，术语的模糊性源于不同框架的使用习惯，建议理解其本质而非强行统一。

### 其他关键术语

文章还定义了Agent（Model + Scaffolding + Harness）、Context Engineering（上下文工程）、Policy（策略）、Tool Use（工具使用）、Skills（技能）、Sub-agents（子代理）等。这些概念构成了Agent开发的基础框架。

## 行业影响/专业点评

术语统一是技术走向成熟的标志。当前AI Agent领域正处于“术语泡沫”期，类似早期云计算中PaaS、IaaS的混淆。这篇文章的价值不在于强制定义，而在于提供了一个可讨论的框架。对于开发者而言，理解这些区别能避免在框架选择时产生误解；对于企业采购而言，清晰的术语有助于评估不同Agent方案的真实能力。随着Agent系统逐渐进入生产环境，建立共同的语言基础将变得更加重要。

---
[来源](https://huggingface.co/blog/agent-glossary)
