---
title: "NVIDIA发布Nemotron-Labs扩散语言模型：并行生成、可修改，颠覆自回归范式"
published: 2026-05-27
draft: false
description: "NVIDIA推出基于扩散模型的语言模型Nemotron-Labs Diffusion，支持多token并行生成和迭代修正，显著提升GPU利用率和推理速度，同时提供5B到14B多种规模。"
tags: [ai-update, 模型, 研究]
---

## 背景

长期以来，大语言模型（LLM）几乎全部采用自回归（Autoregressive, AR）架构：逐token生成，每个token依赖于之前的所有token。这种模式稳定高效，但也带来硬性限制——每个新token需要完整的模型前向计算，GPU的大部分时间消耗在内存操作而非计算上。此外，自回归模型一旦生成错误就无法修正，错误会不断累积。NVIDIA近日发布的Nemotron-Labs Diffusion模型提供了一条全新路径。

## 核心内容分析

### 扩散模型：并行生成 + 迭代优化

Nemotron-Labs Diffusion采用扩散语言模型（DLM）架构，可以并行生成多个token，然后在多个步骤中迭代优化。这种方式更好地利用了现代GPU的计算能力，显著提升运行时性能。更重要的是，生成的token可以修正，特别适合文本修订和中间填坑等任务。这种“生成-改进”特性还提供了推理预算的灵活控制：减少优化步骤即可降低计算需求。

### 模型系列与开源

NVIDIA发布了从3B、8B到14B三种规模的纯文本模型，以及一个8B的视觉语言模型（VLM）。所有模型均采用对商业友好的NVIDIA Nemotron Open Model License（VLM使用NVIDIA Source Code License）。同时，NVIDIA开源了训练代码，基于NVIDIA Megatron Bridge框架，为社区提供了完整的训练方案。

### 与自回归的对比

DLM的核心优势在于：1）并行生成，推理速度更快；2）可修正过往token，提升生成质量；3）天然支持fill-in-the-middle任务。当然，扩散模型在文本生成领域的成熟度尚不及自回归，但NVIDIA的实验表明，在特定场景下DLM已经具备竞争力。

## 行业影响/专业点评

Nemotron-Labs Diffusion的发布标志着语言模型架构的重要突破。长期以来，自回归模型近乎垄断文本生成，但扩散模型已经在图像生成领域证明其潜力。NVIDIA将扩散机制引入语言建模，有望打破自回归的算力瓶颈，尤其对于需要低延迟或高吞吐的应用场景。同时，开源策略将加速社区研究和横向对比。这可能会催生更多非自回归语言模型的研究，推动整个行业探索新的生成范式。

---
[来源](https://huggingface.co/blog/nvidia/nemotron-labs-diffusion)
