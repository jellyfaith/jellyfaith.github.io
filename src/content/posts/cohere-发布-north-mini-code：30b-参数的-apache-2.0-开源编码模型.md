---
title: "Cohere 发布 North Mini Code：30B 参数的 Apache 2.0 开源编码模型"
published: 2026-06-13
draft: false
description: "Cohere 推出 North Mini Code，一个 30B 参数（3B 激活）的 MoE 模型，专为 agent 化软件工程任务设计，在编码基准上超越多款更大模型，并采用 Apache 2.0 许可。"
tags: [ai-update, 模型, 开源]
---

## 背景

2026 年 6 月 9 日，Cohere 正式发布了其新模型家族的首个成员——**North Mini Code**。这是一个 30B 参数的混合专家（MoE）模型，实际每 token 仅激活 3B 参数，专注于 agent 化编码任务，并以 Apache 2.0 开源许可发布在 Hugging Face 上。这是 Cohere 首次专门为开发者设计的模型，旨在为自动软件工程（Agentic Software Engineering）提供强大的基础模型。

## 核心内容分析

### 顶尖的编码性能

North Mini Code 在多个编码基准上表现出色。在 Artificial Analysis 的 Coding Index 上，它获得了 33.4 分，超越了 Qwen3.5 (35B-A3B)、Gemma 4 (26B-A4B)、Devstral Small 2 (24B Dense)，甚至超过了参数规模大得多的模型，如 Nemotron 3 Super (120B-A12B)、Mistral Small 4 (119B-A6B) 和 Devstral 2 (123B)。这使其成为同尺寸类别中最强的开源编码模型之一。

Cohere 强调，North Mini Code 并非针对单一 agent 框架优化，而是使用多种框架进行训练，使其能够可靠地服务于不同的 coding agent 实现，例如 OpenCode。

### 架构细节

North Mini Code 是一个 decoder-only 的稀疏 MoE Transformer。它采用 Cohere 高效的注意力实现，以 3:1 的比例交替使用滑动窗口注意力（带 RoPE）和全局注意力（无位置编码）。前馈块为 MoE 块，包含 128 个专家，每 token 激活其中 8 个。每个专家块使用 SwiGLU 激活函数。路由器在 top-k 选择前对 logits 应用 sigmoid 激活。此外，在稀疏层之前还有一个单独的密集层。

### 后训练流程：两阶段 SFT + RLVR

North Mini Code 的后训练采用两阶段级联监督微调（SFT），随后是针对 agent 编码的强化学习（RLVR）阶段，使用可验证奖励。第一阶段 SFT 数据专注于编码能力，同时融入更广泛的混合数据以保证鲁棒性和可用性。第二阶段进一步强化指令遵循和 agent 行为。RLVR 阶段则针对软件工程和终端任务进行优化，使模型学会如何在真实开发场景中做出正确决策。

## 行业影响与专业点评

North Mini Code 的发布标志着 Cohere 在开源模型领域迈出了重要一步。此前 Cohere 的模型主要面向企业场景，而 North Mini Code 直接面向开发者社区，尤其是对 agent 化编码感兴趣的人群。其 Apache 2.0 许可证意味着开发者可以自由使用、修改和商业化，这一点对于构建编码工具链来说非常友好。

从架构上看，30B 参数但仅 3B 激活的 MoE 设计使得推理效率远高于同等总参数的密集模型，同时性能足以对标甚至超越一些更大的模型。这对于在边缘设备或低成本环境中运行编码 agent 非常有价值。此外，Cohere 强调使用多种 agent 框架训练，避免了模型对特定框架的过拟合，提升了通用性。

随着 AI 辅助编程和 agent 化开发工具的普及，像 North Mini Code 这样专门为编码 agent 设计的开源模型将扮演越来越重要的角色。它可能成为 OpenCode 等工具的得力助手，并为更多创新应用铺平道路。

---
[来源](https://huggingface.co/blog/CohereLabs/introducing-north-mini-code)
