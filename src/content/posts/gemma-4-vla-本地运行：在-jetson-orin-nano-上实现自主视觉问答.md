---
title: "Gemma 4 VLA 本地运行：在 Jetson Orin Nano 上实现自主视觉问答"
published: 2026-04-24
draft: false
description: "NVIDIA 展示 Gemma 4 VLA 在 Jetson Orin Nano Super 上本地运行，模型自主决定是否调用摄像头回答问题，无需关键词触发。"
tags: [ai-update, 模型, 工具]
---

## 背景

多模态大模型（VLA）通常依赖云端算力，但边缘设备上的本地推理正成为新趋势。NVIDIA 的 Asier Arranz 在 Hugging Face 博客上发布了一个演示：基于 Gemma 4 的 VLA 系统成功在 Jetson Orin Nano Super（8GB）上运行，实现了语音交互与自主视觉感知的全本地化流程。

## 核心内容

该演示的完整流程为：用户语音输入 → Parakeet STT 语音识别 → Gemma 4 模型处理 → （若需要）调用摄像头拍照 → Kokoro TTS 语音合成输出。关键创新在于模型能自主判断是否需要“睁眼”：当用户问题涉及视觉信息时（如“桌上有几本书？”），Gemma 4 会自动触发拍照，并结合图像内容回答，而非简单描述画面。整个逻辑无需关键词触发或硬编码规则，完全由模型基于上下文决策。

NVIDIA 提供了完整的部署脚本（Gemma4_vla.py），在 Jetson 上需安装系统包、Python 环境，并本地编译 llama.cpp 以服务 Gemma 4 模型（Q4_K_M 量化版本）。硬件要求仅为 8GB RAM 的 Jetson Orin Nano Super、普通 USB 摄像头和扬声器。特别的是，该方案还使用了 vision projector（mmproj），确保模型具备视觉感知能力。

## 行业影响

这一演示表明，具备自主视觉决策能力的 VLA 模型已能在低功耗边缘设备上运行，摆脱云端依赖。对于机器人、智能家居、工业检测等实时性要求高的场景意义重大。同时，其开源代码降低了开发门槛，推动多模态 AI 的本地化部署落地。
