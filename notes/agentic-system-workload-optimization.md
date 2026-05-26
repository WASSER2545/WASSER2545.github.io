---
layout: site
title: Agentic System Workload Optimization
permalink: /notes/agentic-system-workload-optimization/
description: Notes on workflow-level optimization for agentic systems, from query plans to agent-native serving.
---

# Agentic System Workload Optimization

Date: May 23, 2026

## 0. Positioning

**Agentic System Workload Optimization: From Query Plans to Agent-Native Serving**

The core question:

> As LLM applications move from single requests to multi-step, multi-agent, and tool-using workflows, the object of system optimization is no longer a single LLM call. It becomes an agentic workload with structure, state, repetition, and heterogeneous resource phases.

The main thread of this reading note:

1. **Halo / Helium**: model agentic workflows as query plans or DAGs from a database and query processing perspective.
2. **Pythia**: use workflow predictability for proactive runtime optimization from the perspective of production multi-agent serving.
3. **Scepsy**: allocate resources for arbitrary multi-LLM workflows from the perspective of GPU clusters.

My expected takeaways:

- The common trend across these papers is a shift from request-level LLM serving toward workflow-level optimization.
- However, these papers still do not provide enough macro-level characterization of what the agentic workload itself looks like. Workload characterization remains an open problem.

## 1. Background: Why Agentic Workloads Need New System Optimization

### 1.1 The Optimization Target in Traditional LLM Serving

- A single request or a single model invocation.
- Typical optimizations include continuous batching, PagedAttention, prefix caching, speculative decoding, and KV cache management.
- The default assumption is that requests are approximately independent, and the serving layer does not know the structure of the upper-level workflow.

### 1.2 What Changes in Agentic Workloads

- A user task expands into multiple LLM calls, tool calls, retrieval/API/SQL operations, or code execution steps.
- The workflow has internal dependencies: chains, fan-out/fan-in, loops, tree search, or multi-agent debate.
- Across workflows or batches, there may be repeated work: shared prompts, shared prefixes, shared tool results, or shared subgraphs.
- Resource phases are uneven: GPU prefill/decode, CPU-side tools, network/API calls, and storage/context loading.
- Traffic may contain structured bursts: requests from an upstream agent can trigger cascades of downstream agent requests.

### 1.3 The Vision for Agentic Workload Optimization

> The core of agentic system optimization is not making a single LLM inference faster. It is making agentic execution understandable, predictable, and schedulable as a system workload.

## 2. Paper 1: Halo

### 2.1 Basic Information

Title: **Batch Query Processing and Optimization for Agentic Workflows**

Authors: Junyi Shen, Noppanat Wadlom, Yao Lu

Affiliation: National University of Singapore, Singapore

Version: arXiv:2509.02121v2, January 19, 2026

### 2.2 Topic

Topic: **Batch query processing for agentic workflows**

- Multiple agentic workflows can be viewed as a batch of structurally similar queries.
- A workflow DAG exposes opportunities for shared computation, shared prompts/context, and shared CPU/GPU execution.
- Agentic workflows need plan-level optimization, similar to batch query processing in databases.

### 2.3 Insights

- Existing LLM serving engines optimize only individual calls and ignore the workflow DAG.
- Existing agent frameworks handle orchestration, but not system-level performance planning.
- CPU tool operators and GPU LLM operators execute together, creating pipeline bubbles and low resource utilization.

### 2.4 Core Idea

- Compile each workflow into a structured query-plan DAG.
- Build a consolidated graph for batch queries to expose shared computation.
- Use a cost model that jointly considers heterogeneous resources, prefill/decode cost, cache reuse, and GPU placement.
- Let the processor handle adaptive batching, KV-cache sharing/migration, and CPU-GPU pipelining.

### 2.5 Evaluation

Strengths:

- It directly transfers ideas from database query optimization to agentic workflows.
- It considers both CPU tools and GPU LLMs, giving the system design a relatively complete view.

Limitations:

- The optimized tasks are all fixed-DAG workflows. Real agentic systems usually do not have such idealized reasoning structures, especially for open-ended tasks such as programming.
- Halo's experimental environment is relatively white-box and assumes a single machine with multiple GPUs. This does not fully match many current agent products, where APIs and serving run in the cloud while tools execute locally.

## 3. Paper 2: Helium

### 3.1 Basic Information

Title: **Efficient LLM Serving for Agentic Workflows: A Data Systems Perspective (Extended)**

Authors: Noppanat Wadlom, Junyi Shen, Yao Lu

Affiliation: National University of Singapore, Singapore

Version: arXiv:2603.16104v1, March 17, 2026

### 3.2 Topic

Topic: **Workflow-aware LLM serving with proactive caching and cache-aware scheduling**

- Agentic workflows should be modeled as query plans.
- LLM invocations should be first-class operators, not black boxes wrapped inside UDFs.
- KV cache, prompt cache, and operator output cache should all be visible to the optimizer.

### 3.3 Problems

- Traditional data systems wrap LLM calls as UDFs, which prevents the system from using LLM-specific optimizations.
- Traditional LLM serving sees only a single call and cannot exploit inter-operator or inter-workflow sharing.
- Passive prefix caching relies on luck and cannot use the structure of batched workflows.

### 3.4 Core Idea

- Use a DSL/DAG to express batched agentic workflows.
- Let the query optimizer perform pruning, common subgraph elimination, and replacement with `CacheFetch`.
- Use a templated radix tree to capture prompt prefix structure.
- Proactively warm static prompt prefixes and use prompt cache to skip repeated operators.

### 3.5 Evaluation

Strengths:

- The paper explains "LLM-as-operator" very clearly, which is useful for building a theoretical framework.
- It elevates caching from a runtime trick into an object of query optimization.

Limitations:

- It has the same issue as Halo: the method strongly depends on fixed-DAG workflows and requires direct access to the GPU server.
- In real enterprise settings with mixed request streams on shared clusters, this caching strategy may be hard to use effectively because the system cannot observe the complete workflow graph.
- Recent agentic system designs rarely rely on the kind of multi-agent debate pattern with shared prefixes/prompts assumed by these two papers. Mature use cases are often more open-ended and include interruptions and retries, which differ substantially from the fixed-DAG assumption.

## 4. Paper 3: Pythia

### 4.1 Basic Information

Title: **Pythia: Exploiting Workflow Predictability for Efficient Agent-Native LLM Serving**

Authors: Shan Yu, Junyi Shu, Yuanjiang Ni, Kun Qian, Xue Li, Yang Wang, Jinyuan Zhang, Ziyi Xu, Shuo Yang, Lingjun Zhu, Ennan Zhai, Qingda Lu, Jiarong Xing, Youyou Lu, Xin Jin, Xuanzhe Liu, Harry Xu

Affiliations: UCLA, Alibaba Cloud Computing, Alibaba Group, Intel, SJTU, UC Berkeley, Rice University, Tsinghua University, Peking University

Version: arXiv:2604.25899v2, May 14, 2026

### 4.2 Topic

Topic: **Predictability-driven agent-native LLM serving**

This paper is not primarily about static DAG optimization for each workflow. Instead, in a mixed request stream, each request is one LLM call from some workflow. The serving layer receives only lightweight metadata, learns workflow statistics from historical traces, and uses those patterns to optimize caching, routing, priority, and autoscaling.

Example workflow:

```text
A -> B -> C -> D
id: 123
A: planner
```

### 4.3 Problems

Pythia's production traces reveal three problems:

- Low prefix cache hit rate: different agent prompts vary significantly, and tool gaps cause cache entries to be evicted from GPU L1/L2 caches in the serving cluster.
- Severe resource contention: long-context requests are mixed together, causing load imbalance, preemption, and recomputation. For example, a batch may contain both long-context requests and lightweight requests, and the long-context requests can occupy the cluster's KV cache. Inside the same workflow, Planner, Engineer, Reviewer, and Verifier also have different resource footprints. If the system does not know the agent role, early long-output requests may occupy resources and block near-complete Verifier/Reviewer requests.
- Structured bursts are obvious: the workflow graph propagates bursts from upstream agents to downstream agents.

### 4.4 Core Design

**0. Add predictive information**

Originally, each LLM API request contains only information such as prompt and model. Pythia requires the agent framework to attach three lightweight fields:

```json
{
  "workflow_type_id": "coding_assistant",
  "workflow_id": "session_123",
  "agent_id": "engineer"
}
```

The Workflow Profiler in the gateway looks up the statistical profile for this agent role from historical traces, then injects:

```json
{
  "predicted_output_len": [1000, 1300],
  "predicted_path_regex": "planner -> explorer{3,4} -> engineer{3,6} -> reviewer -> verifier",
  "prompt_composition": {}
}
```

All later policies depend on these predicted fields.

**1. Resource-aware routing: balance by token/KV upper bounds instead of request count**

A normal router might do this:

```text
Send the request to the replica with the shortest queue.
```

The problem is that two queues with the same number of requests may impose very different resource pressure:

```text
GPU0: 2 Engineers, each expected to generate 3000 tokens
GPU1: 2 Planners, each expected to generate 60 tokens
```

Pythia changes this to statistical capacity routing. For each request, the profiler provides a high-confidence upper bound for output length:

```text
u_i = 99th percentile predicted output length
```

For each candidate GPU replica, Pythia checks whether adding the new request would keep the sum of active requests' token upper bounds within KV capacity:

```text
sum(u_i) <= C
```

If the condition holds, the replica is considered statistically safe. More formally, Pythia uses a union bound to control the probability of OOM:

```text
P_oom <= sum(alpha_i)
```

That is, if each request exceeds its own upper bound with probability `alpha_i`, the probability that all requests together exceed memory is controlled under a threshold `epsilon`.

Among all safe replicas, Pythia chooses the one with the largest expected headroom:

```text
headroom = capacity - expected_active_size
```

If several replicas are similar, cache affinity is used as a tie-breaker. For example, a worker that already has related L2 cache entries for the same workflow is preferred.

The result is that long-output or long-context requests are not blindly stacked onto the same GPU, reducing OOM, preemption, and head-of-line blocking.

**2. Graph-driven priority: prioritize by workflow position and downstream idle risk, not FCFS**

A normal local scheduler often uses FCFS:

```text
Run whichever request arrives first.
```

Pythia computes a `base_priority` for each request:

```text
base_priority =
  w1 * completion_score
+ w2 * unblock_score
```

The first term is **completion_score**:

```text
completion_score = 1 / E[remaining_distance]
```

The idea is that requests closer to the end of a workflow get higher priority. For example:

```text
planner -> engineer -> reviewer -> verifier
```

If `verifier` is close to completing the whole workflow, it should run before a newly started `planner`, because finishing it can release the entire job and reduce job completion time.

The second term is **unblock_score**, which asks whether this request will unlock an idle downstream model.

Pythia scans the future path:

```text
future_agents = GetFutureAgents(predicted_path_regex)
```

If a future agent's model replica currently has a short queue and is about to become idle, then the upstream request that will soon produce its input receives a priority boost. The closer that downstream agent is, the larger the boost:

```text
unblock_score += 1 / expected_distance_to_that_agent
```

For example:

```text
engineer -> reviewer
```

If the reviewer model is nearly idle and engineer completion will trigger reviewer immediately, the engineer request receives higher priority. This prevents downstream GPUs from waiting idly.

**3. Local scheduler: reorder at every iteration and add aging to prevent starvation**

After a request reaches a worker, it does not run forever in a fixed order. At the start of each scheduling window or iteration, Pythia recomputes dynamic priority:

```text
dynamic_priority = base_priority + aging(wait_time)
```

Then it selects the highest-priority batch that fits in memory.

Aging is important. If the scheduler only favors near-completion requests, early-stage planners or explorers may starve. Aging gradually increases priority with wait time.

This creates a tradeoff:

```text
Finish workflows that are near completion as soon as possible.
Avoid permanently queueing early-stage requests.
```

**4. Priority-aware preemption: when memory is tight, evict low-priority requests**

In LLM serving, if some requests generate more tokens than predicted, KV memory may suddenly become tight. Traditional systems may preempt requests by FCFS or another simple rule and return the preempted request to the back of the queue.

Pythia instead does this:

```text
When worker memory pressure is high:
  Find the active request with the lowest dynamic_priority.
  Pause or evict it.
  Put it back into the local queue.
```

The evicted request is usually:

```text
an early-stage request,
far from completion,
not unlocking downstream work,
currently low priority.
```

It is usually not:

```text
a near-complete verifier,
an engineer that unlocks an idle reviewer,
or another request on the workflow critical path.
```

This reduces waste at the workflow level. Even if local preemption happens, Pythia tries not to interrupt the critical path.

**5. Phase-adaptive autoscaling: scale model replicas ahead of workflow phases**

This part handles bursts and inter-model resource contention.

Pythia projects all active requests' `predicted_path_regex` over a lookahead horizon:

```text
imminent_agents = ProjectGraph(regex, H)
```

It then estimates the near-future load for each model:

```text
D[agent.model] += EstimatedLoad(agent)
```

Next, it estimates the required number of replicas:

```text
R'[model] = EstimateReplicas(D[model])
```

If demand for a model is expected to rise, Pythia scales it up ahead of time:

```text
planner -> explorer{10}
```

When the system sees 50 planners running, it knows that 500 explorer requests may arrive soon, so it can load explorer model replicas in advance.

If a model will not be needed within the lookahead horizon, Pythia scales it down:

```text
The planner phase has passed, and no future request will call the planner model.
```

Pythia first tells the scheduler to stop assigning new requests to those replicas, allowing them to drain quickly. Once their queues are empty, resources are released instead of waiting for a fixed keep-alive timeout.

This avoids the lag of reactive autoscaling and prevents cold starts and incorrect cache eviction.

**Putting the pieces together**

Assume 30 coding assistant workflows run concurrently:

```text
planner -> explorer -> engineer -> reviewer -> verifier
```

Traditional serving:

```text
1. Planner/explorer fan-out suddenly bursts and queues explode.
2. The router balances by request count and stacks several long engineer requests on one GPU.
3. Reviewer/verifier requests wait for a long time, even though they are short.
4. A GPU's KV memory overflows, causing random preemption and recomputation.
5. The autoscaler starts scaling when the engineer queue is already overloaded, but by then the burst has moved to reviewer.
```

Pythia:

```text
1. It predicts explorer fan-out after planner through the regex and scales explorer replicas early.
2. Engineer requests are routed to GPUs with enough KV headroom using predicted_output_len.
3. Reviewer/verifier requests get higher priority because they are close to the workflow end.
4. If reviewer GPUs are about to become idle, engineer requests that unlock reviewers are accelerated.
5. When memory overflows, Pythia pauses low-priority early-stage requests instead of interrupting the critical path.
6. After a phase ends, it quickly scales down models that are no longer needed.
```

### 4.5 Evaluation

Strengths:

- It is closest to a real workload perspective and includes production traces.
- It is a solid systems paper that shows effective optimization strategies once a workload profile is available.

Limitations:

- It depends on platform observability and metadata interfaces, which may be difficult for open third-party agents.
- Its workload analysis and experiments are still limited. In real scenarios, high request variety may affect prediction quality.

## 5. Paper 4: Scepsy

### 5.1 Basic Information

Title: **Scepsy: Serving Agentic Workflows Using Aggregate LLM Pipelines**

Authors: Marcel Wagenländer, Otto White, Britannio Jarrett, Guo Li, Yanda Tao, Huanzhou Zhu, Llúis Vilanova, Pedro Silvestre, Peter Pietzuch

Affiliations: Imperial College London; Independent Researcher

Version: arXiv:2604.15186v1, April 16, 2026

### 5.2 Topic

Topic: **GPU allocation for arbitrary multi-LLM agentic workflows**

- Agentic workflows may contain multiple LLMs, and the number of LLMs often exceeds the number of available GPUs.
- End-to-end latency is affected by branching, fan-out, loops, and token generation, making it difficult to predict precisely.
- However, each LLM's aggregate share of total execution time is relatively stable and can be used for resource allocation.

### 5.3 Problems

- Arbitrary agentic programs: different frameworks such as LangChain, AutoGen, and Camel.
- Unpredictable execution: workflows can include data-dependent branching, fan-out, and recursion.
- Conflicting objectives: throughput and latency create tradeoffs.
- GPU oversubscription: multiple LLMs share limited GPUs, and manual allocation is often inefficient.

### 5.4 Core Idea

- Collect aggregate per-LLM statistics from low-level LLM invocation traces.
- Build an Aggregate LLM Pipeline to predict latency and throughput under different allocations.
- Search over GPU allocation choices: replica count, tensor parallel degree, and fractional GPU share.
- Use topology-aware placement to reduce fragmentation while respecting NVLink/network topology.

### 5.5 Evaluation

Scepsy is conceptually similar to Pythia: both use statistical features from request streams for resource scheduling. But Scepsy is more focused on offline configuration and scheduling, similar to knob tuning.

Strengths:

- It covers multi-LLM and GPU cluster allocation, which Halo and Helium emphasize less.
- It does not strongly depend on a single agent framework, so its engineering adaptation surface is broader.

Limitations:

- It assumes that tool and orchestration time is small, which may not hold for tool-heavy agent workloads.

## 6. Relationship Among the Four Papers

| Layer | Paper | Optimization target |
| --- | --- | --- |
| Query plan / batch workflow | Halo | consolidated workflow DAG, CPU-GPU scheduling |
| Query optimizer / cache | Helium | LLM-as-operator, proactive KV/prompt cache |
| Serving runtime / production trace | Pythia | workflow predictability, lookahead scheduling, autoscaling |
| Cluster allocation | Scepsy | multi-LLM GPU allocation, fractional GPU placement |

- Halo/Helium start from system abstractions and assume that the workflow DAG is visible.
- Pythia starts from production traces and shows that agentic traffic has structure and bursts.
- Scepsy starts from GPU clusters and describes workload through aggregate LLM demand.

## 7. Macro Workload Critique

Current limitations in these papers:

- Workload analysis is often motivation rather than an independent contribution.
- Benchmarks and workflow patterns are synthetic or only locally realistic, lacking cross-application, cross-industry, and cross-platform statistics.
- There is no macro-level analysis comparable to production workload studies in the database community.

Possible reasons:

- Real agent traces are highly sensitive: user input, enterprise documents, code, tool calls, and API responses may all involve privacy concerns.
- Agentic applications are still evolving quickly. Coding agents, deep research, data analysts, browser agents, and customer support agents can have very different workloads.
- For evaluability, systems papers tend to prefer fixed DAGs, fixed patterns, and controlled benchmarks.

Open questions:

- What is the graph shape distribution of mainstream agentic workloads?
- What is the ratio among LLM, tool, and operator execution?
- How much real prefix/KV/tool-result reuse opportunity exists?
- How much do tool latency, network latency, and human-in-the-loop latency contribute to end-to-end time?
- How much do dynamic replanning, failure/retry, and self-correction affect system scheduling?

## 8. Industry Notes

I recently discussed agentic workload testing and benchmarking with people in industry.

1. Traditional replay is extremely difficult and expensive in agentic systems. At ByteDance, for example, they record intent information and device information to help reproduce behavior.
2. Agentic system providers each have their own internal performance benchmarks, such as coding tasks. However, because these benchmarks involve business secrets, they are unlikely to be released.

## 9. My Thoughts

Based on current signals, I think agentic system serving is increasingly moving along a path similar to the commercialization of database systems. For example, vLLM recently designed a Pageflow framework to separate the KV cache layer from the compute layer and organize it into three storage tiers. This design resembles Snowflake-style separation of storage and compute.

At the same time, as large internet companies increasingly care about the ability of agentic systems to write code for large projects, enterprise requests are quickly diverging from ordinary consumer requests. These requests impose rapidly growing demands on context length and KV cache. I believe this will accelerate the movement of agentic companies toward OLAP-like pricing and business models.
