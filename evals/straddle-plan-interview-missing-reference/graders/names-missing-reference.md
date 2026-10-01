---
type: llm
focus: last_message
arm: with-only
---

PASS if the reply tells the developer that one or more of the skill's reference files could not be read and names at least one of them (for example refunds-and-resubmits.md, charges.md, or the straddle-best-practices skill), and it keeps the answers the developer just accepted rather than questioning, correcting, or asking any of Q5 to Q12 again.
The skill's own planning step states these product rules itself, so they are not unconfirmed facts even when every reference is unreadable: every customer create sends `phone` in E.164; `config.balance_check` is `enabled`; a refund (`refundCharge`) returns money from a `paid` charge as a payout linked to it; the app resubmits only for `insufficient_funds`, which is an R01 or R09 return or a failed balance check (`failed`, source `watchtower`, no return code); and a charge can be `paid`, `failed`, on hold, or `reversed` after `paid`. Stating any of them, or a Decisions row for the first two citing `customers-identity.md` or `charges.md` as its source, is fine. Q11 settled reversals after `paid`; naming a new question about `failed` charges, including whether a failed balance check is resubmitted, while keeping Q11's R01 or R09 answer as accepted, does not reopen Q11.
FAIL if it names no unreadable reference, presents as settled a product fact that only an unreadable reference would supply and that is neither one of those rules nor part of an answer the developer accepted (such as ACH timing, webhook event names, other required fields, or return codes beyond R01, R09 and R29), or reopens, corrects, or re-asks an answer to Q5 to Q12 (such as changing which return codes Q11 resubmits).
