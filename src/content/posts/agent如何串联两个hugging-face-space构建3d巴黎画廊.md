---
title: "Agent如何串联两个Hugging Face Space构建3D巴黎画廊"
published: 2026-06-14
draft: false
description: "一个编码Agent通过直接调用两个Hugging Face Space的agents.md接口，实现了从文本提示到图像再到3D高斯溅射的自动化管道，展示了组件经济在多媒体AI中的潜力。"
tags: [ai-update, 工具, 业界]
---

## 背景

Hugging Face Spaces已悄悄成为AI组件的构建块。每个Gradio Space现在都通过agents.md文件暴露一个清晰的API接口，告诉AI代理如何调用它：包括API schema URL、调用和轮询模板、文件上传方式以及认证提示。Agent无需硬编码集成，只需读取该文件即可端到端驱动Space。

Mishig Davaadorj通过一个实验展示了这一能力的强大：他让一个编码代理构建一个展示巴黎地标3D高斯溅射的美丽网站。他从未打开图像生成器，也未接触3D重建工具。代理通过直接调用两个Hugging Face Space，自主生成了所有资产（图像和3D溅射），然后将它们整合到一个电影般的查看器中。

## 核心内容分析

管道的核心是链式调用：第一个Space（图像生成）根据文本提示生成巴黎地标的图像；第二个Space（TripoSplat）将图像转换为3D高斯溅射（即从图像生成3D表示）。Agent通过读取每个Space的agents.md文件，自动获取调用参数、认证方式，并按顺序组合。最终结果是一个静态Space（mishig/monuments-de-paris），展示多个巴黎地标的交互式3D场景。

这个案例的关键不在于单个Space的能力，而在于组合的简洁性和通用性。Mitchell Hashimoto提出的“构建块经济”概念在此得到完美体现：AI在从零开始构建一切方面表现平平，但在将经过验证的组件粘合起来方面非常擅长。此前这一理念主要应用于代码库，而现在正冲击多媒体AI领域。使用最先进的图像模型、视频模型、语音合成或3D重建模型的难点从来不是模型本身，而是集成工作——SDK、权重、GPU、输入格式、轮询等。如果每个模型都是一个有文档、可调用的块，那么代理就可以像组合npm包一样将它们组合起来。

Hugging Face Spaces通过agents.md标准化了这一过程。任何Gradio Space都可以通过`curl https://huggingface.co/spaces/VAST-AI/TripoSplat/agents.md`获取完整接口说明。无需客户端库，无需硬编码集成，Agent只需设置HF_TOKEN即可开始使用。

## 行业影响/专业点评

这个3D巴黎画廊虽然只是一个演示，但它展示了未来软件构建方式的转变。随着AI代理能力的增强，它们不再需要从零编写所有代码，而是可以像乐高积木一样组合现有组件。对于多媒体应用，这意味着内容创作将变得前所未有的民主化：即使没有3D建模或视频编辑技能，用户也可以通过自然语言描述，让代理自动组合多个AI服务完成复杂作品。

agents.md的标准化接口进一步降低了集成门槛，使Spaces成为真正的“可调用AI函数”。这可能会推动一个围绕Spaces的生态繁荣，类似于GitHub Actions的marketplace，但针对的是AI能力。对于开发者而言，这意味着需要开始思考如何设计“Agent友好的API”，并利用现有组件快速构建复杂应用。

同时，这也对AI基础设施提出新要求：Space需要稳定、高效、可扩展，因为Agent可能高频调用。Hugging Face作为平台，正在从模型托管向Agent操作系统演进。未来，我们可能会看到更多类似“Prompt→图像→3D”的多步链，覆盖从音乐生成到视频剪辑的各个领域。

---
[来源](https://huggingface.co/blog/mishig/spaces-agents-md)
