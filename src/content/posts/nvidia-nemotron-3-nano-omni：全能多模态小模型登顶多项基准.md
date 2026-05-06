---
title: "NVIDIA Nemotron 3 Nano Omni：全能多模态小模型登顶多项基准"
published: 2026-05-06
draft: false
description: "NVIDIA发布Nemotron 3 Nano Omni，支持文本、图像、视频和音频理解，在文档、视频和语音基准上取得领先，推理速度比竞品快9倍。"
tags: [ai-update, 模型, 多模态]
---

## 背景

4月28日，NVIDIA推出Nemotron 3 Nano Omni，一款全能多模态理解模型。它将Nemotron系列从纯视觉-语言扩展到文本+图像+视频+音频。模型采用混合Mamba-Transformer混合专家架构，结合C-RADIOv4-H视觉编码器和Parakeet-TDT-0.6B-v2音频编码器，旨在处理真实世界中的复杂多模态任务，包括文档分析、多图推理、自动语音识别、长音视频理解、智能体计算机使用和通用推理。

## 核心内容分析

### 架构设计：高效融合多种模态

Nemotron 3 Nano Omni的骨干网络是Nemotron 3混合Mamba-Transformer MoE（混合专家）架构，这使其在保持较小参数规模的同时获得较高的计算效率。视觉编码器C-RADIOv4-H专门保留了精细的视觉细节，音频编码器Parakeet则赋予模型原生音频理解能力。整个架构经过扩展以支持非常长的多模态上下文（例如密集图像、文档、视频以及混合模态推理）。

训练配方采用分阶段多模态对齐和上下文扩展，随后进行偏好优化和多模态强化学习。这意味着模型并非简单拼接不同模态的编码器，而是经过精心设计的联合训练，使各模态信息能够有效融合。

### 基准测试：全面领先

Nemotron 3 Nano Omni在多个多模态领导板上实现了最佳准确率：

- **文档理解**：MMLongBench-Doc得分57.5，远超Nemotron Nano V2 VL的38.0和Qwen3-Omni 30B-A3B的49.5；OCRBenchV2-En得分65.8。
- **GUI智能**：ScreenSpot-Pro得分57.8，OSWorld得分47.4，均大幅领先前代和竞品。
- **视频理解**：Video-MME得分72.2（对比Qwen3-Omni的63.0尚未公布完整数据）。
- **音频理解**：在WorldSense、DailyOmni和VoiceBench上同样取得领先。

值得注意的是，Nemotron 3 Nano Omni还是MediaPerf上最具成本效益的开放视频理解模型。与竞品相比，它在多模态用例中吞吐量高达9倍，单流推理速度提升2.9倍。

### 开源与可用性

NVIDIA发布了BF16、FP8和NVFP4三种精度的检查点，均可在HuggingFace上下载。完整的模型架构、训练配方、数据流程和基准测试结果都在伴随技术报告中公开，便于社区复现和进一步研究。

## 行业影响/专业点评

Nemotron 3 Nano Omni的推出标志着多模态小模型的又一里程碑。它不仅在学术基准上击败了比自己规模大得多的模型（Qwen3-Omni 30B-A3B），还通过高效的MoE和混合架构实现了远超竞品的吞吐量。对开发者而言，这意味着可以在不牺牲性能的前提下显著降低部署成本。

特别值得注意的是其在GUI智能（如ScreenSpot-Pro和OSWorld）上的表现，这暗示了模型在自动化计算机操作（如智能体控制浏览器、操作桌面应用）方面的巨大潜力。结合长多模态上下文支持，Nemotron 3 Nano Omni有望成为构建多模态智能体的理想基础模型。

NVIDIA延续了开放策略，将模型开源并公开详细技术报告，有助于推动多模态领域的研究和应用。对于需要处理复杂文档、视频和音频的企业用户，Nemotron 3 Nano Omni提供了一个极具竞争力的选择。

---
[来源](https://huggingface.co/blog/nvidia/nemotron-3-nano-omni-multimodal-intelligence)
