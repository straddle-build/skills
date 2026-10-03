---
description: Bank deposits are reconciled through funding events, not individual charges.
tags: [best-practices, product-model, funding, reconciliation]
max_turns: 12
allowed_tools: [Read, Glob, Grep, Skill]
---

Our accountant can't match the deposits on our bank statement to our Straddle charges: the amounts never equal any single charge, one deposit came in lower than the paid charges it lists, and sometimes money is withdrawn from our account for no charge we can find. How should our app reconcile Straddle payments to the bank statement?
