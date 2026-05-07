---
title: "NVIDIA Nemotron 3 Nano Omni：融合Mamba与MoE的多模态全能小模型"
published: 2026-05-07
draft: false
description: "NVIDIA发布Nemotron 3 Nano Omni，采用混合Mamba-Transformer MoE架构，支持文本、图像、视频、音频的长上下文理解，在多项基准上领先。"
tags: [ai-update, 模型, 开源]
---

## 背景

2026年4月28日，NVIDIA在HuggingFace博客上正式发布了Nemotron 3 Nano Omni，这是一款面向文档、音频和视频代理的“全模态”（Omni-modal）理解模型。该模型扩展了Nemotron多模态家族，从纯视觉-语言系统升级为同时处理文本、图像、视频和音频的通用模型。在多个权威基准上，Nemotron 3 Nano Omni取得了最佳准确率，同时保持高推理效率，特别适合资源受限的落地场景。

## 核心内容分析

### 架构设计：混合专家与状态空间模型

Nemotron 3 Nano Omni的核心是其混合Mamba-Transformer MoE（Mixture-of-Experts）骨干网络。Mamba是一种基于状态空间模型的高效序列建模方法，能线性复杂度处理长序列；Transformer则提供强大的注意力机制。两者结合并采用专家混合架构，使得模型在保持精度的同时大幅降低计算成本。具体而言，它使用了Nemotron 3的混合Mamba-Transformer MoE骨干，搭配C-RADIOv4-H视觉编码器和Parakeet-TDT-0.6B-v2音频编码器。这种设计旨在保留精细视觉细节、原生支持音频理解，并能扩展到极长的多模态上下文，适用于密集图像、文档、视频及混合模态推理。

### 训练策略：多阶段对齐与强化学习

NVIDIA采用分阶段多模态对齐和上下文扩展训练方案，随后进行偏好优化和多模态强化学习。这种训练流程确保了模型在不同模态之间能够有效对齐，并利用强化学习提升在复杂任务上的表现。由于模型规模较小（Nano级），NVIDIA特别注重效率优化，最终实现了相比同级别替代方案高达9倍的吞吐量提升和2.9倍的单一流推理速度提升。

### 基准表现：全面领先

在文档理解方面，Nemotron 3 Nano Omni在MMLongBench-Doc上达到57.5，远超上一代Nemotron Nano V2 VL的38.0，也超越Qwen3-Omni 30B-A3B的49.5；在OCRBenchV2-En上获得65.8，优于V2 VL的61.2。在GUI代理任务中，ScreenSpot-Pro得分57.8（V2 VL仅5.5），OSWorld得分47.4（V2 VL 11.0，Qwen3-Omni 29.0），显示其强大的屏幕理解和操作能力。视频理解方面，Video-MME得分为72.2，音频理解在VoiceBench上获得最高准确率，且被MediaPerf评为最具成本效益的开放视频理解模型。

## 行业影响/专业点评

Nemotron 3 Nano Omni的发布标志着多模态AI模型的重要进展。它通过创新的混合架构，在保持小模型实用性的同时，实现了对标更大模型的性能。对于开发者而言，NVIDIA提供了BF16、FP8和NVFP4多种精度的检查点，便于在不同硬件上部署。该模型有望推动文档分析、智能助手、视频内容理解等领域的应用落地。尤其值得关注的是，NVIDIA将模型开源，为学术研究和工业应用提供了宝贵的资源。

---
[来源](https://huggingface.co/blog/nvidia/nemotron-3-nano-omni-multimodal-intelligence)
