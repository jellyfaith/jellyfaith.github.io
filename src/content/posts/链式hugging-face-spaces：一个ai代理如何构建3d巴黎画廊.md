---
title: "链式Hugging Face Spaces：一个AI代理如何构建3D巴黎画廊"
published: 2026-06-11
draft: false
description: "作者展示了一个编码代理通过调用两个Hugging Face Space，自动生成图片和3D高斯泼溅，无需手动操作即可构建巴黎纪念碑3D画廊。"
tags: [ai-update, 工具, 代理]
---

## 背景

Mishig Davaadorj让一个编码代理构建了一个展示巴黎纪念碑3D高斯泼溅的网站。他从未打开图像生成器，也从未接触3D重建工具。代理通过直接调用两个Hugging Face Space生成了所有资产（图像和3D泼溅），然后将它们连接到电影般查看器中。

## 核心内容

这一成果依赖于“构建块经济”理念：AI善于将经过验证的组件粘合在一起，而不是从头构建所有东西。Hugging Face Spaces已成为这样的构建块：每个Gradio Space都暴露了一个纯文本的 agents.md 文件，告诉代理如何调用它。该文件包含API模式、调用和轮询模板、文件上传方式以及认证提示。无需客户端库或硬编码集成，代理读取后即可端到端驱动Space。真正的解锁在于链式调用：一个Space的输出成为下一个的输入。提示→图像→3D，这就是整个画廊背后的流程。

代理链式调用了两个Space：
- 图像：ideogram-ai/ideogram4 将每个纪念碑转换为干净、深色背景的“样本”照片。
- 3D：VAST-AI/TripoSplat 将图像转换为3D高斯泼溅。

结果是一个静态Space（mishig/monuments-de-paris），展示了这种方法的可行性。

## 行业影响

这一演示展示了AI代理如何利用现有组件快速构建复杂多媒体应用。随着更多模型和工具以可调用块的形式发布，这种“链式代理”模式可能成为未来软件开发的常态，大幅降低创作门槛。

---
[来源](https://huggingface.co/blog/mishig/spaces-agents-md)
