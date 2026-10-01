# Step 1: Decisions

- **Needs:** the developer's request, the Setup report (`straddle-setup.md`) when one exists, and `straddle-integration-plan.md` when one exists.
- **Tools:** Read, Glob, Grep. Write and Edit only for `straddle-integration-plan.md`. Read files yourself: no sub-agents.
- **Next:** [02-sources.md](02-sources.md), once the frontier is empty and the developer confirms the shared understanding.

Print this once, right after reading this file and before any other tool call, even when the request already supplies every decision:

```text
STRADDLE_PROGRESS {"skill":"straddle-plan","step":"01-decisions"}
```

Interview the developer in rounds, as [interview.md](../references/interview.md) says, until the design tree below has no open branch. This step usually takes several turns. Each round ends your turn with no handoff, and this step continues when the developer answers.

## Before the first round

Read [straddle-best-practices](../../straddle-best-practices/SKILL.md), and `straddle-setup.md` if it exists. If `straddle-integration-plan.md` exists, read its Decisions and Glossary. Keep every answered row that still holds, and resume: the rows still `open` are the next round's first questions, with their numbers.

Then find the facts yourself, before you ask anything:

- **The repository.** Agent instructions, manifests and lockfiles, the installed Straddle SDK and its version, existing payment or bank-linking providers, the user, order, and account models, the routes and handlers where payments belong, any webhook handler, and the tests.
- **The product model.** The best-practices reference for each branch in play, from the table below.

If a reference can't be read, because it's missing or the read is denied, name it in your reply and ask for it back. Don't state its product facts from memory, and don't reopen or change an answer the developer already gave or accepted because of it.

A decision the repository or Setup settles goes into the Decisions log with its `file:line` or `Setup` as the source, and is not asked. The framework or language alone settles none of them. If the repository already pins a retired SDK release, such as PyPI `straddle` 0.x, the SDK decision is the move to the version in the best-practices table.

When `straddle-integration-plan.md` doesn't exist yet, create it with the title, the Status lines `- Plan state: Draft` and `- Approval: none`, and the Decisions, Glossary, and Unresolved decisions sections of [plan-template.md](../references/plan-template.md). Step 3 fills in the rest.

## The design tree

Seed the tree with these decisions. A branch opens once the decisions it hangs off are settled. Skip the branches the answers rule out, such as payouts for a charges-only integration or onboarding for a direct one, and add a branch for anything the repository makes risky, such as existing provider code or orders fulfilled before payment. A seeded branch whose answer depends on a risk branch you added waits until that branch is settled; say in the reply that it comes in a later round.

| Decision | Opens after | What to settle | Reference |
| --- | --- | --- | --- |
| Integration type | nothing | direct (`account`), SaaS, or marketplace | [platforms](../../straddle-best-practices/references/platforms.md) |
| Products | nothing | Pay by Bank charges, payouts, or both | [charges](../../straddle-best-practices/references/charges.md), [payouts](../../straddle-best-practices/references/payouts.md) |
| Bank connection | nothing | the Bridge widget (session token from `POST /v1/bridge/initialize`), bank account details (`POST /v1/bridge/bank_account`), a Plaid token (`POST /v1/bridge/plaid`), or a Quiltt token (`POST /v1/bridge/quiltt`). Offer only these. | [Bridge and paykeys](../../straddle-best-practices/references/bridge-and-paykeys.md) |
| Paykey storage | bank connection | where the paykey `id` and label live, and where the token is kept as a secret | [Bridge and paykeys](../../straddle-best-practices/references/bridge-and-paykeys.md) |
| Customer review | integration type | who decides customers in `review` (your team with a queue, or waiting for Straddle), and what a `rejected` customer sees | [customers and identity](../../straddle-best-practices/references/customers-identity.md) |
| Paykey review and blocks | bank connection | who decides paykeys in `review`, and what happens on an R29 block and its one-time unblock | [Bridge and paykeys](../../straddle-best-practices/references/bridge-and-paykeys.md) |
| Identity mapping | integration type | how an app user maps to a Straddle customer, and on platforms to an embedded account, by `external_id`. A customer's email is unique on the account, so offer only mappings that keep one customer per person: an existing customer is reused only after the shopper proves they own its email (a login, or a code emailed to them). Never offer a new customer per checkout or order, and never reuse a customer because someone typed its email. | [customers and identity](../../straddle-best-practices/references/customers-identity.md) |
| Consent | charges | how consent is collected (`internet` or `signed`) and where the record is kept | [ACH timing and consent](../../straddle-best-practices/references/ach-timing-and-consent.md) |
| Payout timing and funding | payouts | when the recipient's money is available, and keeping the linked bank account funded, since the `payout_withdrawal` comes first | [payouts](../../straddle-best-practices/references/payouts.md) |
| Account model | SaaS or marketplace | how your businesses map to embedded accounts | [platforms](../../straddle-best-practices/references/platforms.md) |
| Onboarding | account model | hosted iframe onboarding for the customer-facing path, and Sandbox accounts created through the API for testing | [platforms](../../straddle-best-practices/references/platforms.md) |
| Acting-account switching | account model | how the app selects and switches the acting account | [account scope](../../straddle-best-practices/references/account-scope.md) |
| SDK | nothing | TypeScript, Python, Ruby, C#, or Go | [best-practices versions](../../straddle-best-practices/SKILL.md#current-versions) |
| Notification path | nothing | webhook endpoint, FIFO endpoint, or polling endpoint | [notifications](../../straddle-best-practices/references/notifications.md) |
| Duplicate events | notification path | where event IDs are stored so a repeat or redelivery is ignored | [receiving-webhooks](../../straddle-best-practices/references/receiving-webhooks.md) |
| App behavior per status | products, notification path | what the app does on `paid`, `failed`, holds, and `reversed` after `paid`, such as an R01 after the order shipped | [charges](../../straddle-best-practices/references/charges.md), [returns and disputes](../../straddle-best-practices/references/returns-and-disputes.md) |
| Refunds and resubmits | app behavior per status | whether the app refunds a `paid` charge (`refundCharge`, a payout linked to the charge) and when it resubmits (`insufficient_funds` only: an R01 or R09 return, or a failed balance check, which is `failed` with `source` `watchtower` and no return code) | [refunds and resubmits](../../straddle-best-practices/references/refunds-and-resubmits.md), [charges](../../straddle-best-practices/references/charges.md) |
| Reconciliation | products | how funding events are matched to the bank statement and to your orders | [funding and reconciliation](../../straddle-best-practices/references/funding-and-reconciliation.md) |

Two product rules are not decisions. Don't ask them:

- **Customer phone.** Every customer create needs `phone` in E.164 ([customers and identity](../../straddle-best-practices/references/customers-identity.md)). Record it as a Decisions row with no number, source `customers-identity.md`, and when the app's user model has no phone, that the app collects one where the user signs up.
- **Balance check.** Record `config.balance_check: enabled` as a Decisions row with no number, source `charges.md`, as the recommendation ([charges](../../straddle-best-practices/references/charges.md)). Explain what another value changes only when the developer asks for one, and never offer `required` when the app creates paykeys from routing and account numbers.

## Asking a round

- Ask every frontier question at once, in the format in [interview.md](../references/interview.md): one question for each open branch. Don't fold a branch into another branch's question, and don't hold back a branch whose prerequisites are settled. Number them `Q1`, `Q2`, and on, continuing the Decisions log's numbering across rounds.
- Give each question a `Recommended:` answer and a one-line reason from the repository or the reference. Read each branch's reference before you ask it, in every round. A recommendation is advice. The developer still decides.
- Offer only what Straddle supports. When the developer wants to learn a status by reading a charge or payout again and again, explain that the polling endpoint is the supported way to pull events, and offer it. Do not plan a read loop.
- Show a picture with [show-me.md](../../straddle-best-practices/references/show-me.md) when it settles a question faster than prose, such as a sequence of `paid` and then `reversed` after the order shipped.
- Before you end the turn, add the round's questions to the Decisions log as `open (round N)` rows. End the reply with the questions and what you need from the developer.

## Recording answers

Write each answer into the Decisions log as it's given, with its source and the reason:

| The developer | Record |
| --- | --- |
| answers | their answer, source `developer`, and their reason or the one it rests on |
| accepts your recommendations, for some questions or all of them | each recommended answer, source `developer, accepted recommendation` |
| doesn't know | explain the choice in a sentence or two, then record your recommendation with source `assumption`, and say so. It's listed again when you summarize, for the developer to confirm or change. |
| gives an answer that contradicts the product model or the code | nothing yet. Say what the reference or the code says, with its link or `file:line`, and ask that question again in this reply's round, with a corrected recommendation. |
| hasn't decided, and can't answer now | `Unresolved`, and add it to Unresolved decisions with your recommendation |

When the developer uses a word that means something else in Straddle, ask what they mean, use Straddle's term from then on, and add the settled term to the Glossary. "Refund" is a real Straddle operation: `refundCharge` returns money from a `paid` charge as a payout linked to it. It isn't cancelling a charge, which works only before `pending`, and it isn't a return (`reversed`), which the customer's bank starts. "Account" can mean the app's user, a Straddle customer, or an embedded account.

A question a correction raises, such as which Straddle operation the developer means by a word, is asked in that same reply's round like any other question: numbered, with a `Recommended:` answer and its reason, and added to the Decisions log as `open`. Don't leave it for a later round.

## Finishing the interview

When the frontier is empty, summarize the shared understanding: the decisions, each `assumption`, and the Glossary. Ask the developer to confirm it or correct it, and go to step 2 only after they confirm. When the log already settles every branch and the developer asks you to write the plan, that's their confirmation.

When the developer tells you to take your recommendations for everything left and write the plan, record each one as `developer, accepted recommendation` and treat that as their confirmation. When they can't answer more now, record every open question as `Unresolved` with your recommendation, and go to step 2. Step 3 marks the plan `Blocked` if any of them blocks implementation.

If the developer will not choose an integration type or SDK, print `STRADDLE_ABORT` with that reason and stop.

**Summary for step 2:** that the plan's Decisions log holds every decision with its source, the assumptions and unresolved items, and the repository facts the interview found.
