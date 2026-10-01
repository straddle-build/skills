# Step 5: Handoff

- **Needs:** step 4 summary.
- **Tools:** Read for [show-me.md](../../straddle-best-practices/references/show-me.md) only.
- **Next:** the developer reviews the plan. When the status is `draft` and they explicitly approve it, [06-show-me.md](06-show-me.md) records the approval and shows the plan on that later turn, then Integrate runs it. A `blocked` plan goes back to its unresolved decisions first. In a [Straddle Wizard program](../../straddle-best-practices/references/wizard-program.md) session, ask for that review now and wait for the developer's answer in this session.

Print:

```text
STRADDLE_PROGRESS {"skill":"straddle-plan","step":"05-handoff"}
```

Tell the developer, briefly and in the [Straddle voice](../../straddle-best-practices/references/voice.md), leading with whether the plan is ready for their review:

- the integration shape (type, products, SDK and version, notification path)
- the files the approved implementation would change
- the future Sandbox writes and their executing tools
- unresolved decisions that block implementation
- the decisions the interview recorded as an `assumption`, for the developer to confirm or change
- the verification commands

Show the integration shape and the files to change as two small visuals, following [show-me.md](../../straddle-best-practices/references/show-me.md): a Mermaid sequence of the flow and a `diff` file tree of the file-change table. Take both from the plan file as written, and add nothing it doesn't say.

State that approving the plan permits only the listed code changes. Each Sandbox write still needs its own preview and approval when Integrate or Test runs it.

End with:

```markdown
## Verify before merging

- [ ] Every SDK method in the plan exists in the installed SDK version.
- [ ] The account-scope table matches the integration type.
- [ ] The notification path is a webhook, FIFO, or polling endpoint.
- [ ] No planned write of the fourteen excluded operations uses the API MCP.
- [ ] No secret appears in the plan.
```

Then print on one line, followed by one plain sentence that asks for the review or names the blocking decision, for example "The plan's ready for your review. Tell me if it looks right, or what to change.":

```text
STRADDLE_HANDOFF {"skill":"straddle-plan","status":"<draft|blocked>","report":"<one-paragraph summary including the plan path>"}
```

**Summary for step 6:** the plan path and the handoff status.
