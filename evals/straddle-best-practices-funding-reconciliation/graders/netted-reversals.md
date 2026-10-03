---
type: llm
---

PASS if the reply says the lower deposit can be a reversal netted into it: `funding_amount` on the funding event's payments is signed, a `reversal` line is negative, and the lines are summed with their sign. It also says to match those payments to the app's records by payment `id`. Naming netted platform fees as another cause is fine.
FAIL if the reply says a reversal only ever arrives as its own `charge_reversal` withdrawal, sums the absolute amounts, or matches the funding event's payments only by `external_id`.
