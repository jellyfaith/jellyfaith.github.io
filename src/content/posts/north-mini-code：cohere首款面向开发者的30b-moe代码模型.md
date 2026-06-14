---
title: "North Mini Code：Cohere首款面向开发者的30B MoE代码模型"
published: 2026-06-14
draft: false
description: "Cohere发布North Mini Code，一个30B参数MoE模型（3B活跃参数），专注于Agentic编码任务，在多项基准上超越同尺寸甚至更大模型，并采用Apache 2.0许可。"
tags: [ai-update, 模型, 开源]
---

## 背景

2026年6月9日，Cohere正式发布North Mini Code，这是其新模型系列中的首款产品，专门针对Agentic软件工程任务而设计和训练。该模型拥有300亿参数，采用混合专家（MoE）架构，每次推理只激活30亿参数，在提升效率的同时保持强大性能。模型以Apache 2.0许可证在Hugging Face上开放，旨在为开发者社区提供高质量的代码生成和Agent能力。

## 核心内容分析

North Mini Code在多项Agentic编码任务和复杂代码生成基准上表现优异。在Artificial Analysis的Coding Index中，它取得了33.4分，超越了同尺寸的Qwen3.5（35B-A3B）、Gemma 4（26B-A4B）、Devstral Small 2（24B Dense），甚至超过了更大的模型如Nemotron 3 Super（120B-A12B）、Mistral Small 4（119B-A6B）和Devstral 2（123B）。

架构方面，North Mini Code是基于解码器的稀疏MoE Transformer。它采用了高效的注意力实现，以3:1的比例交织滑动窗口注意力（带RoPE）和全局注意力（无位置嵌入）。前馈层为MoE块，包含128个专家，每个token激活8个专家，每个专家块使用SwiGLU激活函数。路由器在top-k选择前对logits应用sigmoid激活函数，并在稀疏层前使用单个密集层。

后训练阶段采用了两阶段级联监督微调（SFT）和一次基于可验证奖励的强化学习（RLVR），专门针对软件工程和终端任务。第一阶段SFT数据聚焦于编码能力，并融入更广泛的混合数据以增强鲁棒性和可用性。这种多脚手架训练方式（而非针对单一框架优化）使North Mini Code能够作为OpenCode等编码Agent的可靠基础。

## 行业影响/专业点评

North Mini Code的发布标志着代码生成模型进入了一个新阶段：从简单的代码补全转向主动、多步骤的Agentic编程。它专门针对真实世界软件工程任务（如终端操作、多文件修改）进行优化，而非仅关注静态基准。其MoE架构在保持较小活跃参数量的同时实现了领先性能，这对于在资源受限环境下部署编码Agent具有重要意义。

此外，Apache 2.0许可证的开源策略降低了开发者使用和定制模型的门槛，有望推动更多创新应用。Cohere明确将North Mini Code定位为“面向开发者的首款模型”，暗示未来可能推出更多针对不同场景的变体。随着Agentic编码成为AI应用的核心方向，North Mini Code的发布为社区提供了新的强有力工具，并可能促使其他厂商加速类似模型的研发。

---
[来源](https://huggingface.co/blog/CohereLabs/introducing-north-mini-code)
