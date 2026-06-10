---
title: "Cohere发布North Mini Code：30B MoE模型专为Agentic编码而生，性能超越同类开源模型"
published: 2026-06-10
draft: false
description: "Cohere发布其首个面向开发者的编码模型North Mini Code，采用混合专家架构（30B参数，3B激活），在代理编码任务中表现优异，超越Qwen3.5、Gemma 4等模型，并开源Apache 2.0。"
tags: [ai-update, 模型, 开源]
---

## 背景

2026年6月9日，Cohere在Hugging Face上正式发布了**North Mini Code**，这是Cohere首个专为开发者设计的编码模型。该模型拥有300亿参数，采用混合专家（MoE）架构，但每个token仅激活30亿参数，在保持高性能的同时大幅降低了推理成本。模型基于Apache 2.0许可证开源，可直接在Hugging Face上下载。

North Mini Code的发布标志着Cohere正式进入开发者工具领域，此前Coher专注于企业级大语言模型和检索增强生成（RAG）方案。这次的新模型完全针对**智能体软件工程任务（agentic coding）**优化，旨在成为编码代理（如OpenCode）的可靠基础模型。

## 核心内容分析

### 架构设计

North Mini Code是一个基于解码器变换器的稀疏混合专家模型。其注意力机制采用交错设计：每4层中有3层使用滑动窗口注意力（带RoPE位置编码），1层使用全局注意力（无位置嵌入）。前馈模块为MoE块，包含128个专家，每个token激活其中8个。每个专家块使用SwiGLU激活函数，路由器在top-k选择前对logits应用sigmoid激活。此外，在稀疏层之前使用了一个密集层。这种设计平衡了局部和全局上下文，同时保证了推理效率。

### 训练方法

Cohere采用两阶段级联监督微调（SFT）后跟可验证奖励的强化学习（RLVR）来训练模型。第一阶段SFT数据聚焦于编码能力，并融入更广泛的数据以保证鲁棒性和可用性。最终训练结果使模型在代理编码任务和复杂代码生成基准测试中表现突出。

### 性能表现

在Artificial Analysis的Coding Index上，North Mini Code获得了33.4分，超越了同尺寸的Qwen3.5（35B-A3B）、Gemma 4（26B-A4B）、Devstral Small 2（24B Dense），甚至超越了许多更大的模型如Nemotron 3 Super（120B-A12B）、Mistral Small 4（119B-A6B）和Devstral 2（123B）。这表明它在相同激活参数下达到了顶级水平。

在多个agent harness（如OpenCode）上进行评估，North Mini Code表现出稳定的质量，因为Cohere在训练时使用了多种scaffold而非针对单一框架优化，使其作为编码代理的通用基础更加可靠。

## 行业影响与专业点评

North Mini Code的出现为开源编码模型市场带来了新的竞争者。当前，Qwen、Gemma、DeepSeek等模型在编码领域竞争激烈，Cohere的加入进一步丰富了开发者选择。尤其值得关注的是，该模型采用MoE架构实现高参数低激活，使得它可以在消费级GPU上运行，同时保持强劲性能。

Apache 2.0许可证的采用消除了商业使用的顾虑，有望吸引更多企业将其集成到开发工具链中。Cohere强调该模型是“第一个面向开发者的模型”，暗示未来会发布更多尺寸的变体。

对于AI社区而言，North Mini Code的发布验证了MoE架构在编码智能体领域的有效性，并展示了基于多种scaffold训练而非单一框架的巨大优势。这可能会引导后续模型训练策略的调整。

---
[来源](https://huggingface.co/blog/CohereLabs/introducing-north-mini-code)
