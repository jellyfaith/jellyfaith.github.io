---
title: "PyTorch Profiling 入门指南：从矩阵乘法到 CUDA 内核"
published: 2026-05-31
draft: false
description: "HuggingFace 推出《Profiling in PyTorch》系列，本文为第一部分，手把手教你使用 torch.profiler 分析最简单的矩阵乘法与偏置加法操作，逐步解读 CPU 与 GPU 轨迹，并揭示 torch.compile 带来的变化。"
tags: [ai-update, 工具, 开源]
---

## 背景

性能优化是深度学习开发中不可或缺的一环，但 profiling 工具往往因学习曲线陡峭而被开发者推迟使用。PyTorch 内置的 `torch.profiler` 虽然功能强大，其生成的密集彩色轨迹图和令人望而生畏的事件名称却让初学者望而却步。HuggingFace 近期发布了《Profiling in PyTorch》系列博客，旨在以循序渐进的方式帮助开发者掌握 profiling 技能。本文是该系列的开篇，从一个最简单的矩阵乘法加偏置操作入手，从零开始解读 profiler 返回的数据。

## 核心内容分析

### 从最简单的操作开始

系列的第一部分使用一个极简脚本 `01_matmul_add.py`，仅包含矩阵乘法（matmul）和加法（bias add）两个操作。作者指出，profiling 的起点不必复杂——先理解最简单的操作，再逐步扩展到 `nn.Linear`、小型 MLP，最终在第三部分用于大型语言模型（LLM）。

### 理解 GPU 内核与 CPU 调度

文章首先明确了两个关键概念：
- **GPU 内核（kernel）**：在 GPU 上并行运行的程序。
- **CPU 调度与启动（schedules and launches）**：CPU 负责将 PyTorch 操作转换为一个或多个 GPU 内核并启动它们。

这两个概念是所有后续分析的基础。当你在 PyTorch 中执行一个操作时，它会被自动翻译成对应的 GPU 内核。

### 使用 torch.profiler

文章采用问题驱动的方式：打开一条 trace，然后追问“为什么这里会发生这个？”。作者逐步展示如何设置 `torch.profiler`，并解读返回的表格和轨迹（CPU 车道、GPU 车道以及两者间的可疑间隙）。重点包括：
- 从 Python 调用到 CUDA 内核的完整事件链。
- 当使用 `torch.compile` 时，哪些行为发生了变化，更有趣的是哪些行为**没有**变化。

### 实践指导

文章提供了完整的脚本链接，并建议读者在单独标签页中打开，边阅读边执行。使用 NVIDIA A100-SXM4-80GB GPU 运行示例。这种“打开脚本跟着做”的方式降低了学习门槛。

## 行业影响/专业点评

这篇教程填补了 PyTorch profiling 入门资源的空白。对于希望优化模型训练和推理性能的开发者来说，理解 profiler 的输出是必备技能。文章不仅介绍工具用法，更强调“通过提问来学习”的思维模式，这比单纯的步骤说明更有价值。后续第二、三部分将扩展到更复杂的模型和 LLM，预计将为社区提供从入门到进阶的完整 learning path。

---
[来源](https://huggingface.co/blog/torch-profiler)
