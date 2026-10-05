# Step 4: Triage

- **Needs:** step 2 installed-SDK path and the step 3 hypotheses.
- **Tools:** Read, Glob, Grep over application code, the installed SDK source, and the contract (Docs MCP, API MCP discovery tools, or the published reference). No writes, no requests.
- **Next:** [05-report.md](05-report.md).

Print:

```text
STRADDLE_PROGRESS {"skill":"straddle-audit","step":"04-triage"}
```

For each hypothesis, open the installed SDK source that the code calls and the contract entry for the operation, and decide:

- **Confirmed.** The installed source and the contract show the behavior the hypothesis predicts. Cite the SDK file and line alongside the application `path:line`.
- **Refuted.** The installed source or the contract shows it is fine (for example the SDK already sends the header from a parameter the code passes, or the model omits the header by design). Drop it, and list it under "Checked and dismissed" with the reason.
- **Unverifiable.** The dependency tree is not installed or the behavior depends on runtime configuration you cannot see. Keep it at low confidence and say what would settle it.

Assign confidence:

| Confidence | Meaning |
| --- | --- |
| high | Confirmed in the installed SDK source and the contract, and the code path is reachable. |
| medium | The code pattern is clear, but configuration or call order outside the file could change the outcome. |
| low | A heuristic match, or the installed SDK could not be read. |

Write a concrete recovery for every confirmed finding: the code change, the test that would prove it, and, when data in Straddle is affected, the SDK or CLI operation the developer would run after their own preview and approval (for example look up the charge by exact external ID before any resubmit).

**Summary for step 5:** confirmed findings with evidence, confidence, and recovery; unverifiable findings at low confidence with what would settle them; dismissed hypotheses with reasons. Dismiss a P check only when code shows the handling, never because nothing matched.
