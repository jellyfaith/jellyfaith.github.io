---
title: "NVIDIA推出Nemotron 3 Nano Omni：全能多模态模型，文档、音频、视频一站式理解"
published: 2026-05-02
draft: false
description: "NVIDIA发布Nemotron 3 Nano Omni，融合文本、图像、视频、音频理解能力，采用混合Mamba-Transformer MoE架构，在多个文档和音频基准上取得SOTA，且推理速度比竞品快9倍。"
tags: [ai-update, 模型, 开源]
---

## 背景

多模态AI正从“视觉+语言”迈向“全模态”时代。2026年4月28日，NVIDIA发布Nemotron 3 Nano Omni，这是一个全新的全模态理解模型，能够同时处理文本、图像、视频和音频输入。该模型建立在Nemotron多模态系列基础上，从强视觉语言系统扩展为更广泛的“文本+图像+视频+音频”一体化模型。

## 核心内容：架构与性能分析

### 模型架构

Nemotron 3 Nano Omni采用混合架构，底层是Nemotron 3混合Mamba-Transformer专家混合（MoE）骨干网络。视觉部分使用C-RADIOv4-H编码器，音频部分使用Parakeet-TDT-0.6B-v2编码器。这种设计旨在保留精细视觉细节，添加原生音频理解能力，并扩展到极长多模态上下文，适用于密集图像、文档、视频和混合模态推理。

训练配方采用阶段性多模态对齐和上下文扩展，随后进行偏好优化和多模态强化学习。这使得模型能够同时处理多个模态的信息，并在模态间进行推理。

### 基准性能亮点

Nemotron 3 Nano Omni在多个权威基准上表现卓越：
- **文档理解**：OCRBenchV2-En得分65.8（对比Nemotron Nano V2 VL的61.2），MMLongBench-Doc得分57.5（对比V2的38.0，大幅提升），CharXiv推理63.6（V2仅41.3）。
- **GUI理解**：ScreenSpot-Pro得分57.8（V2仅5.5），OSWorld得分47.4（V2仅11.0）——在GUI相关任务上实现数量级提升。
- **视频理解**：Video-MME得分72.2（V2数据未提供），在WorldSense和DailyOmni等视频和音频排行榜上也领先。
- **音频理解**：VoiceBench上取得最高准确率。

与另一款开源全模态模型Qwen3-Omni（30B-A3B）相比，Nemotron 3 Nano Omni在许多领域表现出优势，例如MMLongBench-Doc上57.5 vs 49.5，CharXiv上63.6 vs 61.1。

### 效率优势

Nemotron 3 Nano Omni在效率上同样突出：在多模态用例上，吞吐量比竞品最高提升9倍，单流推理速度提升2.9倍。这表明NVIDIA不仅追求准确率，也注重实际部署时的计算效率。

## 行业影响与专业点评

Nemotron 3 Nano Omni的发布标志着开源全模态模型的又一里程碑。此前，开源多模态模型大多聚焦于视觉语言任务，对音频和视频的支持较弱。Nemotron 3 Nano Omni通过统一架构同时支持四种模态，为实际应用（如文档分析、视频内容审核、语音助手、GUI自动化）提供了更完整的解决方案。

值得注意的是，模型在GUI理解任务上的巨大提升（ScreenSpot-Pro从5.5到57.8，OSWorld从11.0到47.4）可能推动Agent和桌面自动化的进一步发展。结合其长上下文能力，该模型在复杂工作流自动化中具有巨大潜力。

NVIDIA公布了BF16、FP8和NVFP4三种精度的检查点，方便不同硬件环境部署。Apache 2.0许可也降低了商用门槛。

## 总结

Nemotron 3 Nano Omni展现了NVIDIA在多模态AI领域的技术深度，通过创新的混合架构和训练策略，实现了文本、图像、视频、音频的全方位理解，并在效率和准确性上取得平衡。对于需要处理多模态数据的开发者，这是一个值得关注的开源选择。

---
[来源](https://huggingface.co/blog/nvidia/nemotron-3-nano-omni-multimodal-intelligence)
