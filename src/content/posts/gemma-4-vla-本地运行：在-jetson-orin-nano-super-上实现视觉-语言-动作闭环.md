---
title: "Gemma 4 VLA 本地运行：在 Jetson Orin Nano Super 上实现视觉-语言-动作闭环"
published: 2026-04-24
draft: false
description: "NVIDIA 展示 Gemma 4 VLA 在 Jetson Orin Nano Super 上的本地运行，模型自主决定是否调用摄像头回答用户问题，无需硬编码逻辑，实现了视觉、语言与动作的深度融合。"
tags: [ai-update, 模型, 边缘计算]
---

## 背景

2026年4月22日，NVIDIA 在 HuggingFace 博客上发布了一项引人注目的demo：在仅有8GB内存的 Jetson Orin Nano Super 开发板上，本地运行 Gemma 4 VLA（Vision-Language-Action）模型。这一演示展示了将大型多模态模型部署到边缘设备的潜力，并实现了语音交互、视觉感知和动作决策的闭环。

## 核心内容分析

### 从语音到视觉的自主决策

该demo的核心流程为：用户语音输入 → Parakeet STT（语音转文本） → Gemma 4 模型处理 → 必要时触发摄像头 → Kokoro TTS（文本转语音） → 扬声器输出。关键在于，Gemma 4 模型能够根据问题的上下文自主决定是否需要“睁开眼睛”（调用摄像头拍照）。例如，当用户询问“我面前有什么？”时，模型会自动触发摄像头拍摄图像，并结合图像内容生成回答；而简单的聊天问题则无需视觉输入。整个过程无需关键词触发或硬编码逻辑，完全由模型自主判断。

### 在资源受限设备上的运行

Jetson Orin Nano Super 仅有8GB内存，却运行了量化版 Gemma 4（Q4_K_M）。为了在如此有限的资源下运行，开发者进行了一系列优化：
- 使用 llama.cpp 原生构建，并启用 CUDA 加速和针对 Jetson 架构的优化（-DCMAKE_CUDA_ARCHITECTURES="87"）。
- 预分配8GB交换空间，防止 OOM 崩溃。
- 关闭不必要的系统服务（如 Docker、tracker-miner 等）以释放内存。
- 模型量化至 Q4_K_M 并固定图像 token 数为70（--image-min-tokens 70 --image-max-tokens 70），平衡性能与效果。

### 技术实现细节

demo 的核心是 Gemma 4 的视觉投影器（mmproj），没有它模型将无法处理视觉输入。整个系统仅需一个 Python 脚本（Gemma4_vla.py），首次运行时自动从 Hugging Face 拉取语音识别和语音合成模型。硬件方面，除了 Jetson 板，仅需一个普通的 USB 摄像头和扬声器。

## 行业影响/专业点评

这一演示具有重要意义：首先，它证明了大型 VLA 模型可以在消费级边缘设备上运行，打破了“大模型必须云端”的刻板印象。其次，模型自主决策是否使用视觉的能力，为更自然的人机交互提供了新范式——用户无需明确指令“拍照”，模型会根据语境智能切换模态。最后，NVIDIA 开源了全部脚本，降低了开发者复现和定制门槛。

可以预见，类似的边缘端 VLA 系统将加速在机器人、智能家居、辅助驾驶等领域的落地。尽管当前仅支持基础功能，但随着硬件性能提升和模型压缩技术发展，更复杂、更流畅的本地 VLA 体验指日可待。

[来源](https://huggingface.co/blog/nvidia/gemma4)
