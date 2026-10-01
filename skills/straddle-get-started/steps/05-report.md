# Step 5: Report

- **Needs:** summaries from steps 2 to 4.
- **Tools:** none. Get Started writes no file.
- **Next:** the skill named in the report, run by the developer.

Print, only after reading this file (never before):

```text
STRADDLE_PROGRESS {"skill":"straddle-get-started","step":"05-report"}
```

Open with two or three plain sentences in the [Straddle voice](../../straddle-best-practices/references/voice.md): what the repository shows, the choice that matters most, and the next skill. Then reply in this shape:

```markdown
# Straddle Get Started

Status: routed | needs_input | blocked

## What the repository shows
| Fact | Evidence |
| --- | --- |

## Your choices
| Choice | Answer | Source |
| --- | --- | --- |
| Product | | developer / open |
| Integration model | | developer / open |
| SDK | | developer / open |
| Notification path | | developer / open |

## Route
- SDK and install command for the chosen language
- Account scope in one sentence for the chosen model
- Documentation to read first (from the Docs MCP)
- Next skill and why

## Open questions
```

Under Open questions, list only choices whose source is `open`. A choice the developer stated is not an open question. Don't re-offer it with alternatives or ask the developer to confirm it, unless repository evidence contradicts it.

End with the checklist below. Leave every box unchecked. The checklist is for the developer to tick after checking, not a record of what the skill verified.

```markdown
## Verify before merging

- [ ] Every repository fact cites a file you can open.
- [ ] Product, integration model, SDK, and notification path were answered by you, not inferred.
- [ ] No `.env` content, key, or token appears in this report.
- [ ] Nothing was installed, configured, or created.
```

Then print the handoff on one line, followed by one or two short sentences: the result, then what's next:

```text
STRADDLE_HANDOFF {"skill":"straddle-get-started","status":"<status>","report":"<one-paragraph summary of the route and open questions>"}
```
