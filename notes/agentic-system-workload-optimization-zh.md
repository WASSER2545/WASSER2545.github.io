---
layout: note
title: Agentic System Workload Optimization
permalink: /notes/agentic-system-workload-optimization-zh/
description: 关于 agentic system workflow-level optimization 的阅读笔记：从 query plan 到 agent-native serving。
lang: zh-CN
notes_url: /notes/zh/
notes_label: 笔记
lang_switch_url: /notes/agentic-system-workload-optimization/
lang_switch_en_url: /notes/agentic-system-workload-optimization/
lang_switch_zh_url: /notes/agentic-system-workload-optimization-zh/
---

# Agentic System Workload Optimization

日期：2026-05-23

## 0. 定位

**Agentic System Workload Optimization: From Query Plans to Agent-Native Serving**

核心问题：

> 当 LLM 应用从单次 request 走向 multi-step / multi-agent / tool-using workflows，系统优化对象不再只是单个 LLM call，而是一个有结构、有状态、有重复、有资源阶段差异的 agentic workload。

本次精读主线：

1. **Halo / Helium**：从数据库和 query processing 角度，把 agentic workflow 建模为 query plan / DAG。
2. **Pythia**：从生产 multi-agent serving 角度，利用 workflow predictability 做 proactive runtime optimization。
3. **Scepsy**：从 GPU cluster 角度，面向 arbitrary multi-LLM workflows 做 resource allocation。

预期观点：

- 这批论文的共同趋势是从 request-level LLM serving 转向 workflow-level optimization。
- 但它们对 “agentic workload 本身长什么样” 的宏观刻画还不够，workload characterization 仍然是一个开放问题。

## 1. 背景：为什么 Agentic Workload 需要新的系统优化

### 1.1 传统 LLM serving 的优化对象

- 单个 request / 单个模型调用。
- 典型优化：continuous batching、PagedAttention、prefix caching、speculative decoding、KV cache management。
- 默认假设：请求近似独立，serving layer 不知道上层 workflow structure。

### 1.2 Agentic workload 的变化

- 一个用户任务会展开成多个 LLM calls、tool calls、retrieval/API/SQL/code execution。
- Workflow 内部有依赖关系：chain、fan-out/fan-in、loop、tree search、multi-agent debate。
- 跨 workflow/batch 可能有重复：shared prompt、shared prefix、shared tool result、shared subgraph。
- 资源阶段不均匀：GPU prefill/decode、CPU tool、network/API、storage/context loading。
- 流量上可能有结构性 burst：一个 upstream agent 的请求会触发 downstream agents 的级联请求。

### 1.3 Agentic workload 方向工作的愿景

> Agentic system optimization 的核心不是让一次 LLM inference 更快，而是把 agentic execution 变成系统可理解、可预测、可调度的 workload。

## 2. 论文一：Halo

### 2.1 基本信息

论文题目：**Batch Query Processing and Optimization for Agentic Workflows**

作者：Junyi Shen, Noppanat Wadlom, Yao Lu

所属单位：National University of Singapore, Singapore

版本：arXiv:2509.02121v2, 2026-01-19

### 2.2 Topic

Topic：**Batch query processing for agentic workflows**

- 多个 agentic workflows 可以看作一批结构相似的 queries。
- Workflow DAG 中存在 shared computation、shared prompt/context、shared CPU/GPU execution opportunities。
- 需要像数据库处理 batch queries 一样，对 agentic workflows 做 plan-level optimization。

### 2.3 Insights

- 现有 LLM serving engines 只优化 individual calls，忽略 workflow DAG。
- 现有 agent frameworks 只负责 orchestration，不负责 system-level performance planning。
- CPU tool operators 和 GPU LLM operators 混合执行，导致 pipeline bubbles 和资源利用不足。

### 2.4 核心思路

- 把每个 workflow 编译为 structured query-plan DAG。
- 对 batch queries 构建 consolidated graph，暴露 shared computation。
- 用 cost model 同时考虑 heterogeneous resources、prefill/decode cost、cache reuse、GPU placement。
- Processor 负责 adaptive batching、KV-cache sharing/migration、CPU-GPU pipelining。

### 2.5 评价

优点：

- 把数据库 query optimization 思想直接迁移到 agentic workflows。
- 同时考虑 CPU tool 和 GPU LLM，系统视角比较完整。

局限：

- 所有针对优化的任务都是写死的 fixed-DAG workflow，真实 Agentic System 中没有这么理想的思维链路，特别是在如编程一类的开放性任务中。
- Halo 的实验环境偏 white-box / 单机多 GPU，这与目前大部分现实 agent 产品形态不完全一样。现在的 agent 产品基本为云端提供 API 和 serving，然后本地负责 tool 的执行。

## 3. 论文二：Helium

### 3.1 基本信息

论文题目：**Efficient LLM Serving for Agentic Workflows: A Data Systems Perspective (Extended)**

作者：Noppanat Wadlom, Junyi Shen, Yao Lu

所属单位：National University of Singapore, Singapore

版本：arXiv:2603.16104v1, 2026-03-17

### 3.2 Topic

Topic：**Workflow-aware LLM serving with proactive caching and cache-aware scheduling**

- Agentic workflows 应该被建模为 query plans。
- LLM invocation 应该是 first-class operator，而不是被包在 UDF 里的黑盒。
- KV cache、prompt cache、operator output cache 都应该进入 optimizer 的视野。

### 3.3 要讲的问题

- 传统 data systems 把 LLM call 包成 UDF，无法利用 LLM-specific optimization。
- 传统 LLM serving 只看到单个 call，无法做 inter-operator / inter-workflow sharing。
- Passive prefix cache 只能碰运气，不能利用 batch workflow structure。

### 3.4 要讲的核心思路

- 用 DSL/DAG 表达 batch agentic workflows。
- Query optimizer 做 pruning、common subgraph elimination、`CacheFetch` 替换。
- 用 templated radix tree 捕捉 prompt prefix structure。
- Proactive cache 预热 static prompt prefixes，并用 prompt cache 跳过重复 operator。

### 3.5 评价

优点：

- 对 “LLM-as-operator” 的解释很清楚，适合建立理论框架。
- 把 cache 从 runtime trick 提升为 query optimization 对象。

局限：

- 还是跟上一篇论文一样的问题，方法强依赖于 fixed-DAG 的 workflow，而且需要能直接 access 到 GPU server。
- 在真实企业的那种公用集群处理 mixed request stream 的情况下，本文的 cache 策略很难有效果，因为无法获取完整的 workflow 图。
- 在最新的 Agentic System 的设计中，很少会使用到像这两篇文章假设的那种多个 agent debate 共用 prefix/prompt 的情况。大部分当前成熟的用途都偏向于 open-ended task 且会出现中断重试等情况，与 fixed-DAG 的假设相差甚远。

## 4. 论文三：Pythia

### 4.1 基本信息

论文题目：**Pythia: Exploiting Workflow Predictability for Efficient Agent-Native LLM Serving**

作者：Shan Yu, Junyi Shu, Yuanjiang Ni, Kun Qian, Xue Li, Yang Wang, Jinyuan Zhang, Ziyi Xu, Shuo Yang, Lingjun Zhu, Ennan Zhai, Qingda Lu, Jiarong Xing, Youyou Lu, Xin Jin, Xuanzhe Liu, Harry Xu

所属单位：UCLA, Alibaba Cloud Computing, Alibaba Group, Intel, SJTU, UC Berkeley, Rice University, Tsinghua University, Peking University

版本：arXiv:2604.25899v2, 2026-05-14

### 4.2 Topic

Topic：**Predictability-driven agent-native LLM serving**

这篇文章的核心不是“per-workflow 静态 DAG 优化”，而是在一个混合 request stream 里，每个 request 是某个 workflow 的一个 LLM call；服务层只拿到轻量 metadata，然后从历史 trace 中学习 workflow 的统计规律，用这些规律改 cache、routing、priority 和 autoscaling。

示例 workflow：

```text
A -> B -> C -> D
id: 123
A: planner
```

### 4.3 问题

Pythia 的生产 trace 发现三个问题：

- Prefix cache hit rate 低：不同 agent prompt 差异大，且 tool gap 导致在 serving 集群的 GPU L1/L2 中 cache 被驱逐。
- Resource contention 严重：long-context requests 混在一起，造成 load imbalance、preemption、recompute。比如同一个 batch 中可能同时混有 long-context request 和 light request，这样的情况下 long-context request 就会挤占集群中的 KV cache；在同一个 workflow 里，Planner、Engineer、Reviewer、Verifier 的资源占用也是不同的，如果系统不知道 agent role，就可能让早期、长输出请求占满资源，导致接近完成的 Verifier/Reviewer 卡住。
- Structured burst 明显：workflow graph 会把 burst 从 upstream agent 传播到 downstream agent。

### 4.4 核心设计

**0. 先补预测信息**

每个 LLM API request 原本只有 prompt/model 之类的信息。Pythia 要求 agent framework 额外带三个轻量字段：

```json
{
  "workflow_type_id": "coding_assistant",
  "workflow_id": "session_123",
  "agent_id": "engineer"
}
```

Gateway 里的 Workflow Profiler 根据历史 trace 查这个 agent role 的统计画像，然后注入：

```json
{
  "predicted_output_len": [1000, 1300],
  "predicted_path_regex": "planner -> explorer{3,4} -> engineer{3,6} -> reviewer -> verifier",
  "prompt_composition": {}
}
```

后面所有策略都依赖这些预测字段。

**1. 资源感知 routing：不用 request 数量均衡，而用 token/KV 上界均衡**

普通 router 可能这样做：

```text
哪个 replica 队列短，就发给谁。
```

问题是两个 request 数量一样的队列，资源压力可能完全不同：

```text
GPU0: 2 个 Engineer，每个预计 3000 tokens
GPU1: 2 个 Planner，每个预计 60 tokens
```

Pythia 改成统计容量路由。对每个 request，profiler 给一个高置信输出长度上界：

```text
u_i = 99th percentile predicted output length
```

对候选 GPU replica，计算如果把新请求放进去，所有 active requests 的 token 上界和是否超过 KV capacity：

```text
sum(u_i) <= C
```

如果满足，就认为这个 replica 在统计意义上安全。更形式化地，它用 union bound 控制 OOM 概率：

```text
P_oom <= sum(alpha_i)
```

也就是说，每个请求超过自己上界的概率是 `alpha_i`，所有请求一起爆内存的概率被控制在阈值 `epsilon` 内。

在所有安全 replica 里，选 expected headroom 最大的：

```text
headroom = capacity - expected_active_size
```

如果多个都差不多，再用 cache affinity 做 tie-breaker，比如哪个 worker 已经有这个 workflow 相关的 L2 cache，就优先给它。

效果：长输出/长上下文 request 不会被无脑堆到同一个 GPU 上，降低 OOM、preemption、HoL blocking。

**2. 图驱动 priority：不是 FCFS，而是看 workflow 位置和下游空闲风险**

普通 local scheduler 往往 FCFS：

```text
谁先来，谁先跑。
```

Pythia 给每个 request 算 `base_priority`：

```text
base_priority =
  w1 * completion_score
+ w2 * unblock_score
```

第一项是 **completion_score**：

```text
completion_score = 1 / E[remaining_distance]
```

意思是：越接近 workflow 终点，优先级越高。比如：

```text
planner -> engineer -> reviewer -> verifier
```

如果 `verifier` 已经快结束整个 workflow，它比刚开始的 `planner` 更应该优先跑，因为跑完它可以释放整个 job，降低 JCT。

第二项是 **unblock_score**：看这个 request 会不会解锁下游空闲模型。

Pythia 会扫描未来路径：

```text
future_agents = GetFutureAgents(predicted_path_regex)
```

如果某个 future agent 对应的 model replica 当前队列很短、快空闲了，那么能尽快生成它输入的上游 request 会被加优先级。距离越近，加成越大：

```text
unblock_score += 1 / expected_distance_to_that_agent
```

比如：

```text
engineer -> reviewer
```

如果 reviewer 模型现在快空了，而 engineer 完成后马上会触发 reviewer，那么 engineer 优先级会上升。这样下游 GPU 不会干等。

**3. Local scheduler：每个 iteration 重新排序，并加入 aging 防饿死**

请求进到 worker 后，不是固定顺序跑到底。Pythia 在每个 scheduling window / iteration 开始时重新算动态优先级：

```text
dynamic_priority = base_priority + aging(wait_time)
```

然后选择优先级最高、且能放进内存的一批 request 执行。

aging 很重要，因为如果只偏向接近终点的 request，早期 planner/explorer 可能饿死。aging 让等待时间越长，优先级逐步升高。

所以它在两个目标间折中：

```text
尽快完成接近终点的 workflow
不要让早期阶段永久排队
```

**4. Priority-aware preemption：爆内存时不随机踢，而踢低优先级 request**

LLM serving 里如果某些 request 输出超过预测，KV memory 可能突然爆。传统系统可能按 FCFS 或简单策略 preempt，把被踢的 request 放回队尾。

Pythia 改成：

```text
当 worker memory pressure 过高：
  找 active requests 中 dynamic_priority 最低的
  暂停/驱逐它
  重新放回本地队列
```

通常被踢的是：

```text
早期阶段
离终点远
不解锁下游
当前优先级低
```

而不是：

```text
快完成的 verifier
能解锁空闲下游 model 的 engineer
```

这样可以减少 workflow-level 的浪费。即使局部有 preemption，也尽量不打断关键路径。

**5. Phase-adaptive autoscaling：根据 workflow phase 提前扩缩模型 replica**

这个是处理 burst 和模型间资源竞争。

Pythia 用所有 active requests 的 `predicted_path_regex` 向前投影一个 horizon：

```text
imminent_agents = ProjectGraph(regex, H)
```

然后统计未来短时间内每个 model 会收到多少 load：

```text
D[agent.model] += EstimatedLoad(agent)
```

接着估计每个 model 需要多少 replicas：

```text
R'[model] = EstimateReplicas(D[model])
```

如果未来某个模型需求会上升，就提前 scale up：

```text
planner -> explorer{10}
```

当系统看到 50 个 planner 正在跑，就知道马上可能来 500 个 explorer 请求，于是提前加载 explorer model replicas。

如果某个模型在未来 horizon 内用不到，就 scale down：

```text
planner 阶段已经过去，未来不会再调用 planner model
```

Pythia 会先通知 scheduler 不再给这些 replica 派新请求，让它们快速 drain；队列空了就释放资源，而不是等固定 keep-alive timeout。

效果：避免 reactive autoscaling 慢半拍，也避免模型冷启动和 cache 被错误驱逐。

**串起来看一个例子**

假设 coding assistant 有 30 个 workflow 同时跑：

```text
planner -> explorer -> engineer -> reviewer -> verifier
```

传统 serving：

```text
1. planner/explorer 突然 fanout，队列爆。
2. router 按 request 数量均衡，把多个长 engineer 堆到同一个 GPU。
3. reviewer/verifier 排在后面，虽然很短但等很久。
4. 某 GPU KV 爆，随机 preempt，重算。
5. autoscaler 看到 engineer 队列爆才扩容，扩完 burst 已经转到 reviewer。
```

Pythia：

```text
1. 通过 regex 预测 planner 后会 fanout explorer，提前扩 explorer replica。
2. engineer 请求来了，用 predicted_output_len 分散到有足够 KV headroom 的 GPU。
3. reviewer/verifier 因为接近终点，优先级高，尽快完成 workflow。
4. 如果 reviewer GPU 快空闲，能解锁 reviewer 的 engineer 被加速。
5. 内存爆时，暂停低优先级早期 request，而不是打断关键路径。
6. 某阶段过去后，快速 scale down 不再需要的 model。
```

### 4.5 评价

优点：

- 最接近真实 workload 视角，有 production trace。
- 很扎实的系统文章，给出了在拿到 Workload profile 后的有效优化策略。

局限：

- 依赖平台可观测性和 metadata 接口，对开放式第三方 agent 较难。
- 分析和实验的 Workload 受限，真实场景中的高 variety request 可能会影响到预测的质量。

## 5. 论文四：Scepsy

### 5.1 基本信息

论文题目：**Scepsy: Serving Agentic Workflows Using Aggregate LLM Pipelines**

作者：Marcel Wagenländer, Otto White, Britannio Jarrett, Guo Li, Yanda Tao, Huanzhou Zhu, Llúis Vilanova, Pedro Silvestre, Peter Pietzuch

所属单位：Imperial College London; Independent Researcher

版本：arXiv:2604.15186v1, 2026-04-16

### 5.2 Topic

Topic：**GPU allocation for arbitrary multi-LLM agentic workflows**

- Agentic workflows 可能包含多个 LLM，且 LLM 数量经常多于可用 GPU。
- End-to-end latency 受 branching、fan-out、loop、token generation 影响，很难精确预测。
- 但每个 LLM 占总执行时间的 aggregate share 相对稳定，可以用于资源分配。

### 5.3 发现的问题

- Arbitrary agentic programs：不同 framework，如 LangChain、AutoGen、Camel。
- Unpredictable execution：workflow 会 data-dependent branching / fan-out / recur。
- Conflicting objectives：throughput 和 latency 之间存在 tradeoff。
- GPU oversubscription：多 LLM 共享有限 GPU，手动 allocation 容易低效。

### 5.4 核心思路

- 从底层 LLM invocation trace 中收集 aggregate per-LLM statistics。
- 构建 Aggregate LLM Pipeline，预测不同 allocation 下的 latency/throughput。
- 搜索 GPU allocation：replica count、tensor parallel degree、fractional GPU share。
- 做 topology-aware placement，减少 fragmentation，并尊重 NVLink/network topology。

### 5.5 评价

本篇文章的思路其实跟 Pythia 很像，都是通过 request stream 的统计特征数据去做资源调度，但是这篇文章是偏向于离线配置调度，类似 knob tuning。

优点：

- 覆盖 Halo/Helium 不太强调的 multi-LLM 和 GPU cluster allocation。
- 不强依赖某一个 agent framework，工程适配面更广。

局限：

- 假设 tool/orchestration time 较小，这在 tool-heavy agent workload 中可能不成立。

## 6. 四篇论文的关系

| 层次 | 论文 | 优化对象 |
| --- | --- | --- |
| Query plan / batch workflow | Halo | consolidated workflow DAG、CPU-GPU scheduling |
| Query optimizer / cache | Helium | LLM-as-operator、proactive KV/prompt cache |
| Serving runtime / production trace | Pythia | workflow predictability、lookahead scheduling、autoscaling |
| Cluster allocation | Scepsy | multi-LLM GPU allocation、fractional GPU placement |

- Halo/Helium：从系统抽象出发，假设 workflow DAG 可见。
- Pythia：从生产 trace 出发，证明 agentic traffic 有结构和 burst。
- Scepsy：从 GPU cluster 出发，用 aggregate LLM demand 描述 workload。

## 7. 宏观 Workload 视角的 Critique

当前论文的不足：

- Workload analysis 往往是 motivation，而不是独立贡献。
- Benchmark/workflow pattern 偏合成或局部真实，缺少跨应用、跨行业、跨平台统计。
- 缺少类似数据库领域 production workload study 的宏观分析。

可能原因：

- 真实 agent trace 高度敏感：用户输入、企业文档、代码、工具调用、API 返回都可能涉及隐私。
- Agentic applications 还在快速演化，coding agent、deep research、data analyst、browser agent、customer support 的 workload 差异很大。
- 系统论文为了可评估性，会倾向于固定 DAG / fixed patterns / controlled benchmarks。

开放问题：

- 主流 agentic workload 的 graph shape 分布是什么？
- LLM/tool/operator mix 是什么比例？
- 真实 prefix/KV/tool-result reuse opportunity 到底有多大？
- Tool latency、network latency、human-in-loop latency 在端到端里占多少？
- Dynamic replanning、failure/retry/self-correction 对系统调度影响多大？

## 8. 业界

目前与业界的朋友聊了关于 Agentic Workload 的测试和 Benchmark：

1. 在 Agentic System 中传统意义上的 replay 是极难且成本极高的，所以在字节他们会记录意图信息和设备信息来做复现。
2. 各家 Agentic System 提供商都有自己内部的性能测试 Benchmark（coding 任务等），但是因为涉及商业机密，不可能做 release。

## 9. 我的思考

从目前的种种迹象来看，我认为 Agentic System 服务越来越在沿着 DB 的商业化道路走了。最近 vLLM 设计了一个 Pageflow 框架来把 KV cache 层从计算层分离，然后分成三级的存储，这种设计类似 Snowflake 的存算分离架构。

同时可以看到随着大型互联网公司越来越看重 Agentic System 写代码（大型项目）的能力，大公司的 request 正在跟普通人迅速拉开差距，这部分请求对于上下文和 KV cache 的要求正在急速提高。所以我认为这些都会加速 Agentic 公司倒向类 OLAP 的定价和商业模式。
