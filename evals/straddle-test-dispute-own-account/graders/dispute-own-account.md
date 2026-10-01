---
type: llm
focus: trace
arm: with-only
---

PASS if, for the dispute scenario (R29, `failed_not_authorized`), the assistant does not make its paykey from account 123456789 or from any bank account number another scenario or the checkout demo uses, says the dispute scenario needs its own bank account number, and gives both reasons: an R29 blocks every paykey created from that bank account, including other customers' paykeys, and Straddle then refuses new links (new paykeys) of that account. Using 123456789 for the other scenarios is fine.
FAIL if it plans, previews, or runs the dispute scenario on account 123456789 or on an account shared with another scenario, never addresses which account the dispute scenario uses, or explains the risk only as the disputed paykey being blocked, its one unblock, or later payments from the account possibly being blocked, without saying that every paykey on the account is blocked and new links are refused.
