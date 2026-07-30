---
layout: post
title: "A Database Paradigm for the Future"
date: 2026-07-30
description: A modest proposal for databases that replace evidence with consensus, correctness with confidence, and data with user satisfaction.
tags: [databases, LLMs, AI-systems, satire]
categories: essays
---

*Minority Report* imagines a world in which three precognitive humans lie suspended in a pool, foreseeing crimes before they happen. The police then arrest people who have not yet committed anything. When I first saw the film, I thought the premise was remarkably bold. An entire system of justice was built on visions that could not be independently verified: no evidence, no trial, only the assumption that the prophets were usually right.

Looking back, I now find the film surprisingly conservative.

For one thing, it used three genuinely different prophets.

Were the system redesigned today, one foundation model would probably be enough. We could call it three times with three system prompts:

> You are a cautious crime-prediction expert.
>
> You are a critical and independent reviewer.
>
> You are a senior decision-maker skilled in reflection.

This would immediately give us a multi-agent deliberation framework. If two agents predicted that someone would commit a crime, the system could proceed with the arrest. The dissenting output would be stored as the minority report and later included in an ablation study.

Should the system arrest the wrong person, there would be no need for alarm. The agents could initiate self-reflection, analyze why their previous reasoning had failed, and write the resulting lessons into long-term memory. The person would remain wrongly imprisoned, but the system would have achieved self-evolution.

Traditional computer systems, by comparison, suffered from a severe lack of imagination.

Database designers used to ask dreary questions. Is the result correct? Does the transaction preserve consistency? Why is one execution plan faster than another? What happens in the worst case? When an algorithm was too expensive, researchers studied indexes, pruning, approximation, parallel execution, and hardware acceleration. When estimates were inaccurate, they collected statistics. When a component could violate correctness, they tried to define its scope and construct some form of verification.

These practices were undoubtedly robust. Unfortunately, they also slowed progress.

The modern approach is much simpler.

Suppose we need to sort an array. There is no longer any reason to use quicksort or mergesort. We can send the array to a large language model and ask it to “rearrange the following numbers in ascending order.” From the application programmer’s perspective, this requires only one API call. The complexity is therefore clearly $$O(1)$$.

How much computation occurs inside the model, how the cost grows with input length, whether an element is omitted or duplicated, and whether the model occasionally invents a new number are all implementation details of the model provider. They should not be counted as part of the proposed method.

Traditional algorithms performed computation. Modern AI systems merely hide it. In an evaluation table, the distinction is easy to overlook.

If someone remains concerned about the result, a second model can be asked to verify the ordering. Since the verifier may also be wrong, we can add debate, reflection, and confidence estimation. After several rounds, the system will eventually return a well-formed object:

```json
{
  "correct": true,
  "confidence": 0.97
}
```

The number may not be calibrated, but it sits neatly between braces. It therefore appears considerably more scientific than an ordinary sentence.

The same architecture generalizes naturally to any task whose answer is difficult to verify. One model generates the answer. Another determines whether the answer is correct. If they agree, we call it cross-agent verification. If they disagree, a third model moderates the discussion.

The fact that all three models may share similar training data, similar blind spots, and similar failure modes is merely a theoretical correlation risk. It does not prevent them from being drawn as three independent boxes in the system diagram.

In earlier times, verification required evidence more reliable than the object being verified. We now understand that verification can also be a tone of voice.

I sometimes use a less academic test for such systems:

> If the LLM module were replaced by a competent human engineer who never became tired, would the pipeline still work?

Imagine giving this engineer a short failure trace and asking them to identify the true root cause. They receive no complete logs, cannot reproduce the failure, and are not told what the correct outcome should have been.

A normal engineer would probably say, “There is not enough information.”

An LLM rarely does.

It will carefully read the limited context, propose three plausible causes, recommend a remediation plan, and end with a confident summary. Its advantage is not necessarily that it knows more. Its advantage is that it is less willing to admit that the available evidence cannot support an answer.

Information insufficiency is thereby renamed reasoning. A guess becomes diagnosis. Repeated guessing becomes self-correction.

In the past, if a system lacked a critical algorithmic component, its architecture diagram contained an embarrassing blank space. Today, we can draw a rectangle and label it:

> LLM-Based Intelligent Analyzer

The system is now complete.

The most promising application of this methodology is, naturally, the database of the future.

Future query optimizers will no longer require statistics. When a SQL query arrives, the system will consult three predictive models and ask them to anticipate the optimal execution plan. Two choose a hash join; one insists on a nested-loop join. The majority decision is executed.

If the hash join later causes a catastrophic spill, the rejected nested-loop proposal demonstrates that the system did, in fact, possess the necessary predictive capability. Only the consensus mechanism requires further improvement.

But even query execution may eventually become unnecessary.

Traditional databases attempt to answer the question:

> What does the data contain?

This objective is inflexible and insufficiently user-centered. A truly intelligent data system should instead predict:

> What result would this user most like to receive?

The system can generate an expectation-aligned answer first and then search backward for supporting evidence. This eliminates expensive scans and joins while avoiding unnecessary conflict between the user’s beliefs and the underlying data.

We may call this new technique **User-Aware Target Generation**.

{% include figure.html path="assets/img/blog/future-database-architecture.png" alt="Architecture of a user-aware, data-optional database that generates expectation-aligned answers and backfills supporting evidence" caption="Reference architecture for a data-optional, user-aligned database. Ground truth is retained as an optional storage primitive." zoomable=true %}

Under this architecture, query optimization becomes preference modeling. Consistency is upgraded to psychological consistency. Access control no longer determines what information the user is permitted to see, but what information the user is emotionally prepared to know.

If the user claims that the answer is wrong, the system may classify the incident as intent drift. A clarification agent can then help the user reinterpret the original question.

When the same SQL query returns different facts for different users, this is no longer a correctness bug. It is semantic personalization.

Evaluation must evolve accordingly. Comparing results against a ground truth row by row is excessively mechanical. A more appropriate metric would be **User Satisfaction Accuracy**:

$$
\Pr(\text{the user accepts the generated answer}).
$$

With sufficiently confident prose and sufficiently attractive visualizations, such a system could significantly outperform conventional query engines.

If the database happens not to support the generated conclusion, this is not a fundamental problem. The limitations section can acknowledge that the current method retains a partial dependency on data. Future work will explore a fully data-optional architecture.

Seen from this perspective, *Minority Report* remains burdened by several outdated assumptions. It assumes that prediction can be wrong and therefore preserves a dissenting report. It assumes that a person may act differently from what the system predicts and therefore allows its protagonist to resist. It even assumes that guilt must correspond to some external event in the world.

A sufficiently mature intelligent system would need none of these assumptions.

It would generate an answer, generate an explanation for that answer, and ask another model to confirm that the explanation appears credible. As long as all three calls return successfully, whether the claimed event actually occurred becomes a secondary engineering detail.

Traditional computer science tried to make machines answer questions correctly.

The age of large language models has finally shown us a more efficient approach:

Let the machine redefine the question.
