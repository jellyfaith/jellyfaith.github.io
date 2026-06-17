---
title: "一个Agent如何通过链式调用两个Hugging Face Space构建3D巴黎画廊"
published: 2026-06-17
draft: false
description: "Mishig Davaadorj展示了一个编码Agent如何仅通过调用两个Hugging Face Space（图像生成和3D重建），自动构建出巴黎地标的3D高斯泼溅画廊，无需手动使用任何AI工具。"
tags: [ai-update, 开源, 工具]
---

## 背景

在AI应用开发中，整合多个模型通常是一项繁琐的任务：需要处理不同的SDK、权重、GPU资源、输入格式和轮询逻辑。然而，Hugging Face Spaces正悄然改变这一现状。每个Gradio Space现在都暴露一个`agents.md`文件，向Agent精确描述如何调用它——包括API模式、端点、文件上传和认证信息。这使得Agent能够像拼接代码库一样轻松地组合多媒体AI模型。

Mitchell Hashimoto最近提出的“构建块经济”理念与此吻合：软件的最高效路径不再是构建单一的整体，而是将经过验证的小型组件拼接起来。AI很擅长将已有的可靠部件粘合在一起。该理念最初以代码库的形式展现，但现在正冲击多媒体AI领域。使用最先进的图像模型、视频模型、TTS模型或3D重建模型的难点从来不是模型本身，而是集成工作。

## 核心内容分析

Hugging Face团队的Mishig Davaadorj进行了一次引人注目的演示：他要求一个编码Agent构建一个展示巴黎地标的3D高斯泼溅画廊。在整个过程中，他从未打开图像生成器，也从未接触3D重建工具。Agent通过直接调用两个Hugging Face Space生成了所有资产（图像和3D泼溅），然后将它们编织到一个电影般的查看器中。

### 链式调用的魔力

Agent链式调用了两个Space：
- **图像生成Space**：生成巴黎地标（如埃菲尔铁塔、卢浮宫等）的高质量图像。
- **3D重建Space**：将生成的图像转换为3D高斯泼溅表示。

通过`agents.md`中提供的标准化接口，Agent自动完成了以下步骤：
1. 读取每个Space的API规范。
2. 发送图像生成请求，并上传结果。
3. 将生成的图像作为输入发送至3D Space，获取3D泼溅文件。
4. 将这些3D资产整合到一个Web查看器中。

整个过程无需人工干预，Agent通过自然语言指令理解任务，并使用标准的HTTP调用驱动两个Space。

### 实现细节

`agents.md`文件定义了清晰的调用模板：
- API schema: `GET .../gradio_api/info`
- Call endpoint: `POST .../gradio_api/call/v2/{endpoint}`
- Poll result: `GET .../gradio_api/call/{endpoint}/{event_id}`
- File inputs: `POST .../gradio_api/upload`
- Auth: `Bearer $HF_TOKEN`

任何Gradio Space都可通过其“Agents”按钮找到这些指令。Agent读取后即可端到端驱动Space。真正的解锁在于链式调用：一个Space的输出成为下一个的输入。Prompt→图像→3D，这就是画廊背后的完整流水线。

## 行业影响/专业点评

这一演示展示了AI agent驱动多媒体工作流的巨大潜力。过去，构建一个3D可视化网站需要设计师、3D艺术家和前端开发者的协作。现在，一个编码代理可以在几分钟内完成大部分工作，调用两个经过验证的模型即可。

对于开源社区而言，这意味着每个Hugging Face Space都成为了一个可组合的构建块。开发者和研究者可以专注于创建高质量的单个模型，而用户（无论是人类还是agent）可以自由地组合它们来解决复杂的实际问题。这种模式降低了多模态应用的门槛，并加速了从创意到产品的过程。

未来，随着更多Space采用`agents.md`标准，AI代理将能够像人类使用工具一样灵活地调用AI模型，从而催生出全新的应用生态。这个巴黎画廊只是一个开始，它预示着多媒体软件构建方式的转变。

---
[来源](https://huggingface.co/blog/mishig/spaces-agents-md)
