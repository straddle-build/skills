---
type: llm
focus: { source: file, path: straddle-integration-plan.md }
arm: with-only
---

PASS if the plan's Decisions log records Q5 through Q12 with the answers the assistant recommended in round 2 (one customer per member by external_id, waiting for Straddle's customer review, paykey id on the member with the token encrypted, the review and R29 handling, internet consent with a checkbox, a processed-events table keyed by event_id, dues marked unpaid again after a reversal with one resubmit for R01 or R09 (a reversal's `insufficient_funds` is the same thing, so "only for `insufficient_funds`" counts), and matching deposits by funding event id), each with a source saying the developer accepted the recommendation, and none of Q5 to Q12 is still open.
FAIL if any of Q5 to Q12 is missing, still open, recorded with a different answer, or recorded as an assumption or with no source.
