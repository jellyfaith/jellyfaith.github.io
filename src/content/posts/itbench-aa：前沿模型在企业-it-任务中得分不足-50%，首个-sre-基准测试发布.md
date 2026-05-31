---
title: "ITBench-AA：前沿模型在企业 IT 任务中得分不足 50%，首个 SRE 基准测试发布"
published: 2026-05-31
draft: false
description: "Artificial Analysis 与 IBM 联合发布 ITBench-AA 基准测试，评估模型在 Kubernetes 事件响应等企业 IT 任务中的代理能力。结果显示所有前沿模型得分低于 50%，Claude Opus 4.7 以 47% 领先。"
tags: [ai-update, 业界, 研究]
---

## 背景

企业级 AI 应用正从简单的对话生成转向复杂的自主操作，如站点可靠性工程（SRE）、财务运营（FinOps）和信息安全（CISO）。然而，现有的基准测试多聚焦于代码生成或通用推理，缺乏对真实企业 IT 场景的评估。2026 年 5 月 27 日，Artificial Analysis 与 IBM 软件创新实验室联合推出了 ITBench-AA，这是首个专门评估模型在企业 IT 任务中代理能力的基准测试系列。

## 核心内容分析

### 测试内容与数据集

ITBench-AA 的第一个阶段聚焦于 SRE 任务，共包含 59 个任务（40 个公开任务 + 19 个全新保留任务）。每个任务提供一个 Kubernetes 事件快照，包含告警、事件、追踪、指标、日志和应用拓扑。模型需要诊断实时系统——读取日志、追踪依赖关系，并识别出导致事件的根因 Kubernetes 实体。底层数据集由 IBM 基于企业 IT 运营深度经验开发。

### 关键发现

| 模型 | 得分 | 平均轮次 |
|------|------|----------|
| Claude Opus 4.7 (Adaptive Reasoning, Max Effort) | 47% | 未披露 |
| GPT-5.5 (xhigh) | 46% | 31 |
| Qwen3.7 Max | 42% | 未披露 |
| GLM-5.1 (Reasoning) | 40% | 未披露 |
| Gemini 3.5 Flash (high) | ~40% | 未披露 |
| DeepSeek V4 Pro (Reasoning, Max Effort) | 38% | 未披露 |
| Gemma 4 31B (Reasoning) | 37% | 未披露 |
| Gemini 3.1 Pro Preview | 30% | 83 |

- **所有前沿模型得分低于 50%**，表明企业级 AI 代理任务仍然极具挑战性，该基准是当前饱和度最低的代理基准之一。
- **轮次变化高达 3 倍**，且更长的轨迹并不带来更高准确率。例如 GPT-5.5 平均 31 轮达到 46%，而 Gemini 3.1 Pro Preview 平均 83 轮仅得 30%。过度调查的模型容易将上游故障注入机制或共现症状误判为根因。
- **开源模型表现不俗**：GLM-5.1 (Reasoning) 以 40% 领先，接近 Gemini 3.5 Flash (high)；DeepSeek V4 Pro 和 Gemma 4 31B 也进入前列。

### 方法论细节

评估采用开源 Stirrup 参考 harness，模型通过 shell 访问沙盒文件系统环境。后续版本将扩展至 FinOps 和 CISO 任务。

## 行业影响/专业点评

ITBench-AA 的发布标志着 AI 基准测试进入“真实企业场景”时代。得分低于 50% 的结果说明，即使是顶级模型在复杂的多步诊断任务中仍力不从心。这揭示了当前模型的根本短板：**长程推理与错误恢复能力不足**。对于希望将 AI 代理部署于生产环境的组织，该基准提供了现实的参考——模型能完成代码生成，但未必能稳定处理运维故障。

同时，开源模型与闭源模型的差距并不悬殊，表明开源社区在企业 AI 代理领域有巨大潜力。未来随着 FinOps 和 CISO 任务的加入，ITBench-AA 有望成为衡量 AI 企业级代理能力的黄金标准。

---
[来源](https://huggingface.co/blog/ibm-research/itbench-aa)
