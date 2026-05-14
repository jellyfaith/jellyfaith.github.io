---
title: "从 vLLM V0 到 V1：强化学习训练中“先求正确再求优化”的工程实践"
published: 2026-05-14
draft: false
description: "ServiceNow AI 团队在迁移 vLLM 推理引擎时发现四个导致训练指标偏离的关键问题：logprob 语义差异、运行时默认值、权重更新路径及 fp32 精度。通过逐一修复实现了后端一致性，强调 RL 训练中 engine 行为正确优先于算法改进。"
tags: [ai-update, 工具, 工程]
---

## 背景

在强化学习（RL）训练大型语言模型时，策略梯度算法（如 PPO、GRPO）需要精确的 token 对数概率（logprobs）来计算策略比率、KL 散度等关键量。任何后端推理引擎与训练器之间的 logprob 计算不一致，都会扭曲训练动态，导致奖励曲线偏移、训练不稳定。ServiceNow AI 团队在使用 PipelineRL 框架进行在线 RL 时，从旧版 vLLM V0（0.8.5）迁移至 V1（0.18.1）过程中遇到了这一典型问题。

## 核心内容：四个必须修复的差异

团队设定了明确的迁移目标：首先确保 V1 返回的 rollout logprobs 与 V0 完全一致，然后才考虑算法层面的变化。经过逐一排查，他们锁定了四个根本原因：

1. **rollout logprobs 的处理偏差**：V1 在生成 token 时消耗 logprobs 的方式与 V0 不同，导致训练器接收到的概率分布存在系统偏差。
2. **V1 特有的运行时默认值**：新版本的调度器、缓存策略等默认参数改变了计算图行为，影响了 logprobs 的精确值。
3. **权重更新路径不一致**：在飞行中更新模型权重时，V1 的权重同步机制与 V0 有细微差异，导致同一策略给出不同的 logprobs。
4. **FP32 lm_head**：V0 中最后的投影层（lm_head）以 FP32 精度运行，而 V1 默认可能使用更低精度（如 bf16），这改变了 softmax 后概率的数值分布。

通过将 lm_head 强制设为 FP32 并修正其他三项，最终 V1 跑的指标（clip rate、KL、熵、奖励）与 V0 参考线几乎完全重合（见图 1）。

## 行业影响与专业点评

这一案例揭示了**工程正确性在 RL 训练中的基础性作用**。许多团队在引入新推理引擎时，往往急于尝试新的强化学习算法，而忽略了后端行为的一致性。ServiceNow 团队采取的“先确保 backend 正确，再改进算法”的策略，值得所有从事 LLM 在线 RL 的工程团队借鉴。

更广泛地看，随着 vLLM、TensorRT-LLM 等推理引擎的快速迭代，不同版本间的行为差异可能成为训练的隐形陷阱。社区需要建立一套标准化的 logprob 校准测试流程，以确保训练管线在引擎升级后仍能稳定运行。

---
[来源](https://huggingface.co/blog/ServiceNow-AI/correctness-before-corrections)
