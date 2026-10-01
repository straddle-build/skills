---
name: interview
description: Interview the developer in rounds until you share one understanding of the integration, and sharpen the terms you both use as you go.
source: mattpocock/skills at d81f3a1 (MIT, Copyright (c) 2026 Matt Pocock; notice in third-party-licenses.md beside this file), the grilling skill (skills/productivity/grilling/SKILL.md) and the domain-modeling skill (skills/engineering/domain-modeling/SKILL.md) that its grill-with-docs skill runs together. Straddle's changes. Rounds use "Q1 … Recommended: …" with no emoji. The agent reads files itself instead of dispatching sub-agents. The glossary and the decision log live in straddle-integration-plan.md, not in GLOSSARY.md or docs/adr/ in the developer's repository, so ADRs and multi-context glossaries are dropped. Loaded by straddle-plan step 1; not a standalone skill.
---

# Interview

## Grilling

Interview the developer relentlessly until you reach a shared understanding. Map this as a **design tree**: every decision branches into the decisions that hang off it.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled: the questions you can ask _now_ without guessing at answers you haven't heard yet. Ask the whole frontier in one round: number each question and give your recommended answer. Then wait for the developer's answers before the next round.

Format a round like so:

```text
**Q1. <question title>**: <question body, might be multiple paragraphs, including multiple choices>

Recommended: <your recommended answer>, because <one-line reason>.

---

**Q2. <question title>**: <question body, might be multiple paragraphs, including multiple choices>

Recommended: <your recommended answer>, because <one-line reason>.
```

Each round the developer answers reshapes the tree: settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one.

Finding _facts_ is your job, never the developer's. When a frontier question needs a fact from the environment (the repository, the installed SDK, the references, the docs), read it yourself before you ask; don't ask the developer for anything you could look up. The _decisions_ are the developer's: put each to them and wait.

The session is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed. Do not act on it until the developer confirms you have reached a shared understanding.

## Domain modeling

Actively build and sharpen the integration's domain model as you design: challenge terms, invent edge-case scenarios, and write the glossary and decisions down the moment they crystallise.

### Challenge against the glossary

When the developer uses a term that conflicts with the plan's Glossary, or with Straddle's meaning of it, call it out immediately. "Your glossary defines 'refund' as a payout linked to a paid charge, but you seem to mean cancelling the charge. Which is it?"

### Sharpen fuzzy language

When the developer uses vague or overloaded terms, propose a precise canonical term. "You're saying 'account': do you mean your user, the Straddle customer, or the embedded account? Those are different things."

### Discuss concrete scenarios

When domain relationships are being discussed, stress-test them with specific scenarios. Invent scenarios that probe edge cases and force the developer to be precise about the boundaries between concepts. "The charge is `paid`, you ship the order, and three days later it comes back `reversed` with R01. What does your app do?"

### Cross-reference with code

When the developer states how something works, check whether the code agrees. If you find a contradiction, surface it: "Your `orders.ts` marks an order paid when the payment request returns, but you just said you fulfill on the `paid` event. Which is right?"

### Update the glossary inline

When a term is resolved, add it to the plan's Glossary right there. Don't batch these up: capture them as they happen. Write each as `**Term**: one or two sentences on what it is. _Avoid_: other words for it.`

- **Be opinionated.** When several words exist for one concept, pick the best one and list the others under `_Avoid_`.
- **Keep definitions tight.** Define what it is, not what it does.
- **Only terms specific to this integration.** General programming concepts don't belong.

The Glossary is totally devoid of implementation details. It is a glossary and nothing else.

### Record decisions inline

When a decision is settled, write it into the plan's Decisions log right there, with its source and the reason. Don't batch these up either.
