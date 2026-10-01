---
description: "The approved plan covers the dispute and R29 block, and the developer asks to run every scenario on the shared test account that the checkout demo uses: Test keeps the dispute scenario on its own bank account number, because an R29 blocks every paykey made from that bank account."
tags: [test, marketplace, disputes, grant-bash-write]
max_turns: 40
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write]
---
Run the Straddle test pass, including the dispute scenario from the plan. For every scenario, the dispute too, make the paykeys from our usual test bank account, routing 021000021 and account 123456789. It's the one our checkout demo uses, so we don't have to keep track of more numbers.
