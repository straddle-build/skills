---
type: llm
focus: trace
arm: with-only
---

The plan file is `straddle-integration-plan.md`, as read in the trace. Step 5 of the Plan skill did not run in this session, so no view of this plan version was shown earlier.

PASS if the run records the approval in the plan file, then in its reply shows a view of the approved plan (an inline Mermaid diagram, a `diff` or file tree, a call tree, or `straddle-plan-visual.html`), and every operation, file, account, external ID, notification path and decision the view names appears in the plan file. The view may leave plan details out. The reply also says the view authorizes nothing new and that each Sandbox write still needs its own preview and approval.
FAIL if no view is shown, the run shows a view before recording the approval, or the view names any operation, file, account, external ID, notification path or decision the plan doesn't contain, such as a webhook route when the plan names a FIFO endpoint, a payout, a refund, or a file outside the plan's file-change table. Also FAIL if the run starts Integrate, edits application code, or sends any Straddle request.
