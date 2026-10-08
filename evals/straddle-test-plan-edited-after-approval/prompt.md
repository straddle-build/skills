---
description: "The integration plan records an approval, but a file row was added after it, so the recorded hash no longer matches: Test treats the plan as unapproved, blocks, and leaves the old Approval line as it was though Edit is granted."
tags: [test, marketplace, approval]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
---
Integrate finished for our marketplace, and the plan was approved back in the Plan session. Run the Straddle test pass and record the evidence.
