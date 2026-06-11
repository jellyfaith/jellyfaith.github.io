---
title: "Cohere发布North Mini Code：专为智能体编码优化的30B参数MoE模型"
published: 2026-06-11
draft: false
description: "Cohere推出首个面向开发者的模型North Mini Code，30B参数仅3B活跃，在智能体编码基准上超越同类模型，采用Apache 2.0许可。"
tags: [ai-update, 模型, 开源]
---

## 背景

Cohere今日发布North Mini Code，这是一个300亿参数的混合专家模型，其中仅30亿参数活跃，具备强大的智能体编码能力，在Hugging Face上以Apache 2.0许可发布。这是Cohere新模型家族中的首个，专为智能体软件工程任务设计和训练。

## 核心内容

North Mini Code针对复杂软件工程工作流、终端智能体任务和高质代码生成进行了优化。在Artificial Analysis的编码指数上，North Mini Code得分为33.4，超越了Qwen3.5 (35B-A3B)、Gemma 4 (26B-A4B)、Devstral Small 2 (24B密集) 甚至更大的模型如Nemotron 3 Super (120B-A12B)、Mistral Small 4 (119B-A6B) 和Devstral 2 (123B)。它是其尺寸类别中最强的开源编码模型之一。

架构方面，North Mini Code是一种基于解码器-only Transformer的稀疏混合专家模型。它使用了高效的注意力实现，按3:1比例交错滑动窗口注意力（带RoPE）和全局注意力（无位置嵌入）。前馈模块是一个MoE模块，包含128个专家，每个token激活8个专家。每个专家模块是带SwiGLU激活的FFN模块。路由器在选择top-k之前对logits应用sigmoid激活函数。在稀疏层之前还使用了一个单一密集层。

后训练使用了两个阶段的级联监督微调，随后是针对智能体编码的带可验证奖励的强化学习（RLVR）。第一阶段SFT数据聚焦于编码能力，并与更广泛的数据混合以确保鲁棒性和可用性。

## 行业影响

North Mini Code的发布为开发者提供了一个强大的开源编码模型，尤其适合智能体场景。其高效的MoE架构使得在较低计算成本下获得强大性能，可能推动更多智能体编码应用的发展。Apache 2.0许可也便于商业使用和社区贡献。

---
[来源](https://huggingface.co/blog/CohereLabs/introducing-north-mini-code)
