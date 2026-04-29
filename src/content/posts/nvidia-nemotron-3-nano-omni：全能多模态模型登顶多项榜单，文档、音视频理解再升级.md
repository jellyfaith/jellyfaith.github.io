---
title: "NVIDIA Nemotron 3 Nano Omni：全能多模态模型登顶多项榜单，文档、音视频理解再升级"
published: 2026-04-29
draft: false
description: "NVIDIA 发布 Nemotron 3 Nano Omni 多模态模型，融合文本、图像、视频、音频理解，在多个基准上达到最优，并实现高吞吐和低成本推理。"
tags: [ai-update, 模型, 多模态]
---

## 背景

2026年4月28日，NVIDIA 在 HuggingFace 上正式发布了 Nemotron 3 Nano Omni，这是其 Nemotron 系列的最新成员。该模型将原本的视觉-语言系统扩展为全面的全模态（omni-modal）模型，能够同时处理文本、图像、视频和音频。这一发布标志着 NVIDIA 在端侧多模态智能方向上迈出了重要一步，旨在为文档分析、语音识别、长音视频理解、计算机使用代理以及通用推理等实际场景提供强大动力。

## 核心内容分析

Nemotron 3 Nano Omni 的核心架构由三部分组成：Nemotron 3 混合 Mamba-Transformer 混合专家（MoE）骨干网络、C-RADIOv4-H 视觉编码器以及 Parakeet-TDT-0.6B-v2 音频编码器。这种设计保留了精细的视觉细节，同时原生支持音频理解，并能扩展到非常长的多模态上下文，适用于密集图像、文档、视频以及混合模态推理任务。训练采用分阶段多模态对齐和上下文扩展，随后进行偏好优化和多模态强化学习。

在基准测试中，Nemotron 3 Nano Omni 展现了强大的竞争力。在文档理解方面，它在 MMLongBench-Doc 上达到 57.5 分（较前代 Nemotron Nano V2 VL 的 38.0 大幅提升），在 OCRBenchV2-En 上以 65.8 分领先。在视频和音频理解方面，它在 WorldSense 和 DailyOmni 上排名靠前，并在 VoiceBench 上取得最高准确率。此外，它在 MediaPerf 上被评为最具成本效益的开源视频理解模型。值得注意的是，与另一款开源全模态模型 Qwen3-Omni 相比，Nemotron 3 Nano Omni 在多个领域表现更优，例如在 CharXiv 推理上达到 63.6 分（Qwen3-Omni 为 61.1），在 OSWorld 代理任务上达到 47.4 分（Qwen3-Omni 为 29.0）。

推理效率方面，Nemotron 3 Nano Omni 相比竞品在多模态用例上实现了高达 9 倍的吞吐量和 2.9 倍的单流推理速度。NVIDIA 同时提供了 BF16、FP8 和 NVFP4 三种精度的检查点下载，方便不同硬件场景部署。

## 行业影响与专业点评

Nemotron 3 Nano Omni 的推出标志着多模态模型向实用化、高效率迈出了关键一步。其优秀的文档理解和长上下文支持，对于金融、法律、医疗等需要处理大量混合格式文档的行业具有直接价值。同时，音频与视频的原生理解能力，使得该模型非常适合构建智能客服、会议助手、内容审核等应用。在成本控制上，高吞吐和低延迟设计降低了对算力的需求，有利于在企业级场景中大规模部署。对比同类开源模型，Nemotron 3 Nano Omni 在多个任务上展现了领先性，且提供了完整的技术报告和开源权重，有望推动社区在多模态智能方向上进一步发展。

---
[来源](https://huggingface.co/blog/nvidia/nemotron-3-nano-omni-multimodal-intelligence)
