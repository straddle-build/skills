# Step 2: Review

- **Needs:** the session files and their changed lines from step 1.
- **Tools:** Read, Glob, Grep. Outside a Wizard review, Bash only for `git cat-file blob <snapshot>:<path> | diff - <path>`.
- **Next:** [03-report.md](03-report.md).

Print:

```text
STRADDLE_PROGRESS {"skill":"straddle-payment-review","step":"02-review"}
```

## What counts as caused by the session

A finding needs a session line at its file:line, or a session change that makes older code reachable in a riskier way, such as a new route that calls an unchanged helper with no authorization of its own. Cite the session line. Read unchanged middleware, session and auth setup, router registration, configuration, and callers to decide whether a changed line is safe, because a route that looks open may sit behind a router-level guard. A risk entirely in code the session didn't change is out of scope. Don't report it, not even as a note.

A modified file is not session code as a whole. A defect on a line that reads the same in the start version is pre-existing, even when the session edited other lines of that file. Compare the start version with the current file before you attribute a finding.

## Checks

Apply each check to every session file. A money-moving route is any request handler, server action, or RPC that creates a Straddle customer, paykey, charge, payout, or refund, directly or through a helper it calls.

First learn how the app already decides who may act: its session or token middleware, API keys, signed links, roles, or routes only its own server calls. Any of these can identify the caller, so don't require a particular login style and don't propose adding one. Every money-moving route needs some caller identity under that model and a check that the caller owns the order or customer. A route with no caller identity at all is a finding, even when the app's other routes are open too.

| ID | Look for | Risk | Severity |
| --- | --- | --- | --- |
| R1 | A money-moving route a caller can reach with no authenticated identity, by session, token, API key, signed link, or server-only call, in the handler or its middleware chain | Anyone who can reach the route can create charges, payouts, or refunds | Critical |
| R2 | A money-moving route that takes an order, customer, charge, paykey, or payout ID from the request and acts on it without checking, under the app's own model, that the caller may act on that record (IDOR) | One caller moves money on another user's order or account | High, Critical for payouts and refunds |
| R3 | An amount or currency read from the request body, query, or a client-set field and passed to a Straddle create, rather than loaded from the server's own order, cart, or price record | The client chooses what it pays or what is paid out | Critical |
| R4 | A webhook handler that parses JSON or uses a body parser before verifying the signature, verifies without the request headers, or skips verification when the signing secret is missing or empty instead of failing closed | Forged events mark charges paid or trigger payouts | Critical |
| R5 | A Straddle key, webhook signing secret, or paykey token in client code (browser bundles, `public/`, client components, `NEXT_PUBLIC_*` or `VITE_*` variables), a log statement, an error response body, or a test or fixture | Secret exposed to users, log readers, or the repository | Critical for a key or signing secret in client code, High otherwise |
| R6 | A money-moving `POST`, `PUT`, `PATCH`, or `DELETE` authenticated by a cookie session with no CSRF token, `SameSite=Strict` session cookie, or origin check. Not a finding when the route authenticates with a bearer header | A third-party page triggers payments as the signed-in user | High |
| R7 | Error recovery keyed on a status class (any 400, 422, or 4xx) instead of the specific refusal, such as reusing a customer on any 4xx from a customer create | A refused request, such as an invalid ZIP, becomes a successful checkout | High |
| R8 | The app saves a usable order, customer, or payment record before the Straddle create it depends on succeeds, and doesn't mark it provisional or remove it when the create is refused | A refused create leaves an order the app treats as paid or ready | High |
| R9 | A Sandbox-only shortcut (customer reuse by email, simulation calls, prefilled bank numbers, test paykeys) not behind an explicit environment check that makes it unreachable in production | Sandbox behavior runs against live money | High |
| R10 | A server that accepts a bank-link result (paykey, token, or customer ID) posted by the browser without retrieving the paykey from Straddle and requiring its customer to match the order | One customer pays with another customer's bank account | Critical |
| R11 | A Straddle SDK client created without pinning its own logger level, so `STRADDLE_LOG=debug` can print request bodies. A redacted fetch logger alone doesn't cover this | Paykey tokens reach logs | High |
| R12 | Webhook verification on lossily decoded text instead of the exact raw bytes, one signing secret shared across endpoints, or FIFO deliveries verified without their own header prefixes. Not a finding when the verifier gets the raw bytes, or decodes text strictly and rejects invalid UTF-8 before verifying; cite the code that shows which | Valid events are rejected, a forged body that decodes to the same text verifies, or a secret for one endpoint verifies another's | High |
| R13 | A webhook rejection that logs signatures, tokens, or bodies instead of only the failing stage and header names, or a handler that does slow work before acknowledging instead of persisting and acknowledging within the delivery timeout | Secrets in logs, or retried and duplicated deliveries | Medium |
| R14 | A refund or payout route with no explicit confirmation, no server-side guard against a repeated submission, or no check that the charge isn't already refunded | A double click or replay moves money twice | High |

Then apply the Safety (S1 to S5), Notifications (N1 to N9), and SDK drift (K1 to K4) rows of Audit's [checks](../../straddle-audit/references/checks.md) to the session lines. Use each row's "Confirm with" column when the installed SDK decides the answer, reading the installed package source under the dependency directory. An Audit row that repeats a check above is reported once, under the check above. Severity for Audit rows: S1, N2, N3, and N4 are Critical. S2, S5, K3, and K4 are High. The rest are Medium.

Use Low for a hardening gap with no direct path to moving money or exposing a secret.

## Each finding

Record the severity, the session file:line (the line in the current working tree), the risk in one sentence naming who could do what, and the fix in one sentence. Drop a suspicion that the code you read rules out, such as a guard in middleware you opened. Keep a finding you couldn't rule out at the severity above, and say in its risk what you couldn't confirm.
