---
title: "Cohere开源首个代理编码MoE模型North Mini Code：30B参数3B激活，性能超越同级"
published: 2026-06-12
draft: false
description: "Cohere发布North Mini Code，一个30B参数（3B激活）的MoE模型，专为代理编码任务设计，在Artificial Analysis编码指数上超越Qwen3.5、Gemma 4等模型，采用Apache 2.0许可，支持OpenCode等代理。"
tags: [ai-update, 模型, 开源]
---

## 背景

大型语言模型在代码生成领域的竞争日益激烈，但大多数模型仍侧重于传统的代码补全或单步生成。真正的软件工程工作流是复杂的、多步骤的，涉及代码编辑、终端操作、调试等代理任务。2026年6月9日，Cohere通过Hugging Face博客正式发布了North Mini Code，这是Cohere新模型家族中的第一个，专门为代理软件工程任务设计和训练。

## 核心内容分析

### 模型架构与规模
North Mini Code是一个基于Transformer的稀疏混合专家（MoE）模型，总参数量为30B，但每个token仅激活3B参数。这种设计在保持高性能的同时大幅降低了推理成本。架构上，它采用了交错滑动窗口自注意力和全局自注意力（3:1比例），前馈块为MoE块，包含128个专家，每个token激活8个专家。每个专家块使用SwiGLU激活，路由器在logits上应用sigmoid激活函数后再进行top-k选择。此外，在稀疏层之前还有一个单密集层。

### 针对编码的后期训练
Cohere使用了两阶段级联监督微调（SFT）和基于可验证奖励的强化学习（RLVR）进行后期训练。第一阶段SFT数据聚焦于编码能力，并与更广泛的数据混合以保证鲁棒性和可用性。第二阶段SFT进一步精细化。RLVR阶段则针对软件工程和终端任务进行优化。这种多阶段训练策略使模型能够适应多种代理框架（scaffold），而不是只针对单一框架优化。

### 性能表现
在Artificial Analysis的编码指数上，North Mini Code获得了33.4分，超过了Qwen3.5（35B-A3B）、Gemma 4（26B-A4B）、Devstral Small 2（24B密集）等相似规模模型，甚至超过了更大的模型如Nemotron 3 Super（120B-A12B）、Mistral Small 4（119B-A6B）和Devstral 2（123B）。它在其规模类别中名列前茅。

## 行业影响
North Mini Code的发布标志着开源代理编码模型的一个重要里程碑。它证明了通过精心设计的MoE架构和针对代理任务的训练，可以在相对较小的活跃参数规模下达到甚至超越更大密集模型的能力。Apache 2.0许可使得开发者可以自由使用、修改和部署该模型，这将加速开源社区在代理编码工具（如OpenCode）上的创新。同时，Cohere首次进入开发者模型领域，显示其战略从企业级向更广泛的开发者生态扩展。

---
[来源](https://huggingface.co/blog/CohereLabs/introducing-north-mini-code)
