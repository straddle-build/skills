# Step 6: Record the approval and show the plan

- **Needs:** a step 5 handoff with status `draft`, meaning the plan is complete and no unresolved decision blocks implementation. After that, the developer's explicit approval of the current `straddle-integration-plan.md` in their own message, such as "approved" or "the plan looks right".
- **Tools:** Read for `straddle-integration-plan.md` and [show-me.md](../../straddle-best-practices/references/show-me.md). Edit only for the plan's two approval lines, and Bash only for the approval hash command, as Integrate's [Recorded approval](../../straddle-integrate/steps/01-begin.md#recorded-approval) gives them. Write only for `straddle-plan-visual.html` at the repository root, and only when an HTML view is warranted. A browser or file viewer the client already provides and allows, to view that file read-only.
- **Next:** outside a Wizard program, stop after this reply; Integrate starts when the developer asks for it. In a [Straddle Wizard program](../../straddle-best-practices/references/wizard-program.md) session, Plan has finished once the approval is recorded. That ends Plan, not the turn: start the next listed skill in this same reply, as that page says. This step's Tools line doesn't limit that.

Run this step only after that approval. Silence, a question, a request for changes, or approval of an earlier version is not approval. Never assume or infer it, and never approve for the developer. Approval doesn't clear blockers. If the handoff was `blocked`, or the current plan still lists an unresolved decision that blocks implementation, don't run this step even when the developer approves. Name the blockers and go back to [01-decisions.md](01-decisions.md) to resolve them. If the developer asks for changes, go back to [03-write-plan.md](03-write-plan.md) and run steps 3 to 5 again. If they don't approve, this step doesn't run and nothing is shown.

Print this once, right after reading this file and before any other tool call:

```text
STRADDLE_PROGRESS {"skill":"straddle-plan","step":"06-show-me"}
```

Read the plan once. If it is marked Blocked or lists an unresolved decision that blocks implementation, stop here and report that instead of recording or showing anything.

Otherwise, record the approval first, so it survives into Integrate and Test, which may run in a later session. Follow Integrate's [Recorded approval](../../straddle-integrate/steps/01-begin.md#recorded-approval): set `Plan state: Approved`, compute the hash, and write the `Approval` line with today's date, the developer's words, `recorded by straddle-plan`, and the hash. Change nothing else in the plan: any other edit after approval voids it.

Then follow [show-me.md](../../straddle-best-practices/references/show-me.md) to help the developer see the approved plan. Pick the smallest view that makes it clear, such as a Mermaid sequence of customer, Bridge and paykey, charge or payout, and the chosen notification path, or a `diff` file tree of the planned changes. Don't repeat a view step 5 already showed for this version of the plan; say the approval is recorded and point back to it. Show only what the plan already says, and don't add operations, files, or decisions.

- Put diagrams and code sketches inline in your reply.
- Write `straddle-plan-visual.html` only when the point is too dense for Mermaid, and write nothing else. Keep it to one self-contained file with no scripts, fonts, or styles loaded from the network. It must not contain a key, token, paykey value, or `.env` content. Open it read-only in a browser or file viewer the client already provides and allows, and check it at desktop and mobile widths where the viewer supports that. If no allowed viewer is available, give the path and say it hasn't been visually checked.
- Run no shell command other than the hash command, and make no MCP call or API request. Don't read `.env*`, credential stores, or private keys, and don't change application code.

Say that this view doesn't change the plan and authorizes nothing new. Approving the plan still permits only its listed code changes, and each Sandbox write still needs its own preview and approval when Integrate or Test runs it. Then say in one or two short sentences the result, then what's next, with the plan's real count of files to change. Outside a Wizard program, name Integrate without promising to start it, for example "Your approval's recorded. Integrate changes the 6 files the plan lists when you ask for it." In a program, name the next listed skill, which may be Migrate, and start it, for example "Your approval's recorded, so I'm starting Integrate on the 6 files the plan lists."

**Summary:** the recorded approval line, the views shown, and the path of `straddle-plan-visual.html` if one was written.
