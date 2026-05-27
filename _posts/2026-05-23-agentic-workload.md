---
layout: post
title: "Agentic System Workload Optimization"
date: 2026-05-23
description: From query-plan optimization to agent-native serving, and why agentic systems need macro workload characterization.
image: /assets/img/blog/agentic-workload-preview.png
og_image: /assets/img/blog/agentic-workload-preview.png
tags: [agentic-systems, LLM-serving, workload-optimization]
categories: research
toc:
  sidebar: left
---
**Agentic System Workload Optimization: From Query Plans to Agent-Native Serving**

The question I care about is simple:

> As LLM applications move from single calls to multi-step, multi-agent, and tool-using workflows, what exactly should a serving system optimize?

My current answer is that the optimization target is shifting from an isolated LLM request to an **agentic workload**: a structured execution process with dependencies, state, repeated sub-computation, heterogeneous resource phases, and bursty downstream effects.

This note uses four recent papers to trace that shift:

1. **Halo / Helium** treat agentic workflows as query plans or DAGs.
2. **Pythia** treats agentic traffic as a predictable production serving workload.
3. **Scepsy** treats agentic execution as aggregate demand over a GPU cluster.

The papers approach the problem from different layers, but they point to the same direction: LLM serving is becoming workflow-aware. At the same time, they also expose a gap that I find more interesting than any single optimization technique: we still do not have a mature macro-level characterization of agentic workloads themselves.

## 1. From Requests to Workloads

Traditional LLM serving mostly optimizes one request or one model invocation at a time. Continuous batching, PagedAttention, prefix caching, speculative decoding, and KV-cache management are all powerful techniques, but the serving layer usually sees requests as approximately independent. It does not know whether a request is the first planner call in a long workflow, a near-final verifier call, or one branch in a fan-out phase.

Agentic workloads break this assumption. A single user task may expand into LLM calls, tool calls, retrieval, SQL/API operations, code execution, and repeated self-correction. These steps have internal dependencies: chains, fan-out/fan-in, loops, tree search, debate, review, and retries. They also create uneven resource phases across GPU prefill/decode, CPU tools, network calls, storage, and context loading.

This is why I think the core of agentic system optimization is not simply making one LLM inference faster. It is making agentic execution understandable, predictable, and schedulable as a workload.

## 2. Halo: Workflow as Query Plan

**Halo: [Batch Query Processing and Optimization for Agentic Workflows](https://arxiv.org/abs/2509.02121)** starts from a database perspective. Its key move is to compile multiple agentic workflows into structured query-plan DAGs, then optimize them as a batch.

The intuition is natural: if several workflows share prompts, contexts, tools, or subgraphs, the system should not treat them as unrelated API calls. Once a workflow is represented as a DAG, a processor can reason about common subgraphs, shared computation, CPU/GPU pipelining, cache reuse, and placement.

Halo is valuable because it makes an explicit analogy between agentic execution and query processing. It says that orchestration is not enough. If an agent framework only launches steps while the serving system only sees isolated LLM calls, then no layer has a global view of the plan.

What this paper suggests to me:

- Agentic workflows need a plan-level optimization layer, not just a faster model server.
- The useful optimization unit may be a batch of structurally related workflows.
- CPU tool operators and GPU LLM operators should be scheduled together, because pipeline bubbles and resource imbalance happen across that boundary.

The limitation is also clear. Halo works best when workflows have visible and relatively fixed DAGs. Many real agentic systems, especially coding agents and open-ended research agents, do not behave like clean static plans. They replan, retry, pause for tools, and branch based on uncertain intermediate results. So Halo gives a strong abstraction, but it also reveals the cost of assuming too much structure.

## 3. Helium: LLM Calls as First-Class Operators

**Helium: [Efficient LLM Serving for Agentic Workflows: A Data Systems Perspective](https://arxiv.org/abs/2603.16104)** extends the same database-oriented line of thought. Its most useful framing is "LLM-as-operator": LLM invocations should not be hidden inside opaque UDFs. They should be visible to the optimizer.

This matters because many LLM-specific optimizations depend on visibility. KV cache, prompt cache, and operator output cache cannot be planned well if the system only sees black-box function calls. Helium uses a DSL/DAG to express batched workflows, then lets the optimizer perform pruning, common subgraph elimination, and cache-aware replacement such as `CacheFetch`.

I like this paper because it turns caching from a runtime trick into an optimization object. Passive prefix caching relies on accidental similarity. A workflow-aware optimizer can reason about repeated prompt templates, shared prefixes, and reused operator outputs before execution.

What this paper suggests to me:

- "LLM-as-operator" is a useful systems abstraction for agentic execution.
- Cache planning should move upward from local runtime policy to workflow-level optimization.
- Prompt, KV, and operator-output caches may need to be managed together rather than as separate mechanisms.

But Helium shares Halo's main assumption: the system needs a visible workflow graph and direct access to the serving stack. That may fit controlled platforms, but it is harder in enterprise settings where requests come from mixed frameworks, tools run outside the model server, and APIs hide the full workflow. Recent agent products also seem less dependent on repeated multi-agent debate templates and more dependent on dynamic, tool-heavy execution.

## 4. Pythia: Workflow as Predictable Serving Trace

**Pythia: [Exploiting Workflow Predictability for Efficient Agent-Native LLM Serving](https://arxiv.org/abs/2604.25899)** feels like a shift from idealized workflow graphs to production serving traces. Instead of assuming that the serving system can fully inspect every workflow DAG, Pythia asks whether lightweight metadata and historical traces are enough to optimize a mixed request stream.

In Pythia, each LLM request carries fields such as:

```json
{
  "workflow_type_id": "coding_assistant",
  "workflow_id": "session_123",
  "agent_id": "engineer"
}
```

The gateway uses historical profiles to attach predicted properties:

```json
{
  "predicted_output_len": [1000, 1300],
  "predicted_path_regex": "planner -> explorer{3,4} -> engineer{3,6} -> reviewer -> verifier"
}
```

This small amount of metadata changes the serving problem. A router no longer has to balance only by request count. It can route by predicted token/KV pressure. A scheduler no longer has to use FCFS. It can prioritize requests that are close to completing a workflow or likely to unblock an idle downstream model. An autoscaler no longer has to react after a queue has already exploded. It can look ahead along predicted workflow phases.

The paper's production traces highlight three important workload properties:

- Prefix reuse is fragile because agent prompts vary and tool gaps can evict useful cache entries.
- Resource footprints differ sharply across roles such as planner, engineer, reviewer, and verifier.
- Bursts propagate through the workflow graph, so upstream phases can create downstream queue spikes.

A simple coding-agent example makes the point:

```text
planner -> explorer -> engineer -> reviewer -> verifier
```

Traditional serving may stack several long engineer requests on one GPU, delay short verifier requests, and start scaling only after the burst has moved to another phase. Pythia instead uses predicted output length, workflow position, downstream idle risk, and phase lookahead to route, prioritize, preempt, and scale more deliberately.

What this paper suggests to me:

- Even partial workflow metadata can be extremely valuable.
- Workload predictability does not require a perfect static DAG; statistical profiles may be enough.
- The serving layer should distinguish agent roles, not just models and prompts.

This is the closest of the four papers to a real workload perspective. Its limitation is that it depends on platform observability and metadata interfaces. If third-party agents do not expose workflow IDs, agent roles, or path hints, the serving layer has to infer structure from much weaker signals. The paper also leaves open how stable these profiles remain under high request variety.

## 5. Scepsy: Workflow as Aggregate Cluster Demand

**Scepsy: [Serving Agentic Workflows Using Aggregate LLM Pipelines](https://arxiv.org/abs/2604.15186)** looks at the problem from the cluster allocation side. Agentic workflows may call multiple LLMs, and the number of models can exceed the number of available GPUs. Exact execution is hard to predict because workflows branch, loop, and generate variable-length outputs. But Scepsy observes that each LLM's aggregate share of total execution time can still be stable enough for resource allocation.

Its core idea is to collect low-level LLM invocation traces, build an Aggregate LLM Pipeline, and search over allocation choices such as replica count, tensor parallel degree, fractional GPU share, and topology-aware placement.

Compared with Pythia, Scepsy is less about online scheduling for each request and more about offline or periodic cluster configuration. It asks: given an agentic workload with multiple models, how should limited GPU resources be divided?

What this paper suggests to me:

- Not all useful workload structure has to be graph-level structure.
- Aggregate per-model demand can be enough for cluster-level optimization.
- For arbitrary agent frameworks, low-level invocation traces may be easier to collect than complete workflow DAGs.

The main caveat is that Scepsy assumes tool and orchestration time is small. That may not hold for tool-heavy agents, browser agents, data analysts, or coding agents that spend substantial time outside the LLM server.

## 6. The Shared Direction

These four papers operate at different layers, but I read them as parts of the same transition:

| Layer | Paper | Optimization target |
| --- | --- | --- |
| Query plan / batch workflow | Halo | Consolidated workflow DAG, CPU-GPU scheduling |
| Query optimizer / cache | Helium | LLM-as-operator, proactive KV/prompt cache |
| Serving runtime / production trace | Pythia | Workflow predictability, lookahead scheduling, autoscaling |
| Cluster allocation | Scepsy | Multi-LLM GPU allocation, fractional GPU placement |

Halo and Helium start from system abstraction: if the workflow graph is visible, optimize it like a query plan. Pythia starts from production traces: if workflows are statistically predictable, use that predictability in the serving runtime. Scepsy starts from GPU clusters: if exact execution is dynamic, optimize around aggregate model demand.

The common claim is stronger than any one paper: the serving system should no longer treat agentic requests as independent model calls.

## 7. The Missing Layer: Macro Workload Characterization

The more I read these papers, the more I feel that the missing piece is not another isolated scheduler. It is a systematic workload study for agentic systems.

Current papers often use workload analysis as motivation rather than as the main contribution. Their benchmarks and workflow patterns are either synthetic, platform-specific, or locally realistic. We still lack something comparable to classic production workload studies in databases and cloud systems: cross-application, cross-industry, cross-platform measurements that tell us what agentic workloads actually look like.

Some reasons are understandable:

- Real agent traces are sensitive. User inputs, enterprise documents, code, tool calls, API responses, and intermediate reasoning may all involve privacy concerns.
- Agentic applications are evolving quickly. Coding agents, deep research agents, data analysts, browser agents, and customer support agents may have very different workload shapes.
- Systems papers need controlled evaluation, so fixed DAGs and synthetic patterns are easier to benchmark.

But without macro characterization, many optimization assumptions remain uncertain. For example:

- What is the graph-shape distribution of mainstream agentic workloads?
- How much time is spent in LLM inference, tools, orchestration, network calls, and human waiting?
- How much real prefix/KV/tool-result reuse exists across users or sessions?
- How often do workflows replan, retry, fail, branch, or self-correct?
- Which agent roles dominate latency, cost, KV pressure, and queueing delay?

These questions matter because they decide which optimizations are worth building. If workflows are mostly fixed and repeated, Halo/Helium-style plan optimization becomes very attractive. If workflows are dynamic but statistically predictable, Pythia-style metadata and profiling become more important. If exact graph structure is unavailable but model-level demand is stable, Scepsy-style aggregate allocation may be the practical path.

## 8. My Current Hypothesis

My current hypothesis is that agentic infrastructure will evolve in a direction similar to database systems: from local execution tricks toward workload-aware resource management.

In databases, the important abstraction was not just a faster operator. It was the query plan, the optimizer, the workload, and eventually the separation of storage, compute, and pricing models around different workload classes. Agentic systems may follow a similar path. The infrastructure will need to understand plans when they are visible, infer profiles when they are not, and allocate resources based on workload phases rather than isolated calls.

This also suggests a business-side shift. Enterprise agentic workloads, especially large-scale software engineering tasks, look increasingly different from consumer chat traffic. They demand longer context, larger KV capacity, more tool execution, more retries, and stronger guarantees around latency and completion. I expect this divergence to push agentic infrastructure companies toward OLAP-like pricing and resource-management models, where users pay not only for tokens but for long-running, stateful, workflow-level compute.

So my takeaway from these papers is not simply that agentic serving needs better batching or caching. It is that the field needs to define the workload itself. Once we know what agentic workloads really look like, the right optimizers, schedulers, cache hierarchies, and pricing models become much easier to reason about.
