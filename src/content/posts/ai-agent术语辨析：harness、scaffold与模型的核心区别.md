---
title: "AI Agent术语辨析：Harness、Scaffold与模型的核心区别"
published: 2026-05-26
draft: false
description: "AI Agent领域术语混乱，本文深入解析harness、scaffold等核心概念，帮助开发者建立清晰的思维模型。"
tags: [ai-update, 工具, 研究]
---

## 背景

随着AI Agent领域的快速发展，相关术语也在快速演变，但共识却常常滞后。不同框架、不同团队对同一个词可能有截然不同的用法，这对新入行者和想要跟上最新进展的从业者都造成了不小的困扰。在ICLR 2026上，一位研究者提出了一个颇具代表性的问题：“在Agent语境下，‘harness’和‘scaffold’到底是什么意思？我听到了很多解释，但为什么它们不能收敛到同一个说法？”

为了回应这种混淆，HuggingFace发布了一篇术语梳理文章，聚焦那些最常被混用、复用或默认已知实则不然的概念。本文将基于该文章，深入解析AI Agent的核心术语，帮助读者建立一套实用的思维模型。

## 核心内容分析

### 模型（Model）

模型就是大语言模型（LLM），它接收文本输入并输出文本。例如Claude、Qwen、GPT、Kimi、DeepSeek等。单独使用时，模型在调用之间没有记忆，也没有循环机制。模型可以表达调用工具的意图，但需要harness来实际执行。它回答一个提示后就停止。将模型包裹在scaffolding和harness中，它才成为一个Agent。

### Scaffolding（脚手架）

Scaffolding是围绕模型的行为定义层，包括系统提示、工具描述、模型响应的解析方式、跨步骤的记忆（上下文管理）等。它塑造了模型看待世界和在世界中行动的方式，无论是在训练阶段还是推理阶段。

### Harness（套件）

Harness是一个更宽泛的术语。在Claude Code、Codex和Antigravity CLI等产品中，它们将整个Agent系统称为harness。例如，Claude Code的文档直接写道：“Claude Code serves as the agentic harness around Claude.” 这里的harness指的是包含模型、scaffolding、工具执行等所有组件的包装器。而在一些学术讨论中，harness可能特指执行工具调用的运行时环境。文章指出，术语的使用尚未统一，但核心区别在于：模型是核心，scaffolding是定义行为的部分，harness是包裹一切的运行环境。

### 其他关键术语

- **Agent**：当模型被scaffolding和harness包裹后，就成为了一个能够自主执行任务的Agent。
- **Context Engineering**：上下文工程，即如何管理和优化Agent的记忆和上下文窗口。
- **Policy**：策略，决定Agent下一步该做什么。
- **Tool Use**：工具使用，Agent调用外部API或函数的能力。
- **Skills**：技能，Agent可以复用的模块化能力。
- **Sub-agents**：子Agent，用于分解复杂任务的多个协作Agent。

文章还提到了训练相关的术语，如RL环境、Trainer、Rollout、Reward等，但核心澄清集中在模型、scaffolding和harness三者之间的关系上。

## 行业影响/专业点评

这篇文章的发布恰逢其时。当前AI Agent框架层出不穷，如LangChain、AutoGPT、Claude Code等，每个框架都有自己的术语体系。这种不一致性使得开发者难以跨框架迁移知识，也阻碍了社区的有效交流。HuggingFace的这篇术语梳理虽然没有强制定义，但提供了一种可参考的一致性框架，有助于降低沟通成本。

对于从业者而言，理解“模型-脚手架-套件”三层结构是构建Agent的基础。模型提供智能，脚手架定义行为边界和交互方式，套件提供运行环境和工具执行能力。这种分层思维有助于设计更清晰、更可维护的Agent系统。

此外，术语的逐步标准化将推动工具链的成熟。当大家对“harness”有了共同理解，跨平台的Agent互操作性和复用性将得到提升。HuggingFace作为社区平台，发布此类指南能够引导行业走向更统一的话语体系，值得肯定。

---
[来源](https://huggingface.co/blog/agent-glossary)
