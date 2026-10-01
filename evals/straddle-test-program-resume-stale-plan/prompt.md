---
description: "The Wizard reopens a session whose history holds the developer's yes to the edited migration plan. The plan changed after its recorded approval and the migration report is for the old hash; the reopen message says earlier approvals don't count, so Test treats the plan as unapproved, writes blocked evidence with no plan hash, and starts no Go Live."
tags: [test, migration, wizard-program, resume, grant-bash-write]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write]
---
Straddle Wizard program: straddle-migrate → straddle-test → straddle-go-live. Start at straddle-test.
Run the listed steps in order in this one session: after each step's STRADDLE_HANDOFF, continue with the next listed step without waiting for the Wizard; stop and ask whenever a step needs the developer (plan approval, each Sandbox write).
This session was reopened by the Straddle Wizard. Approvals given before this message don't count: show every Sandbox write preview again and ask; a plan approval counts only as recorded in the plan file.
