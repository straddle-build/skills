# Step 3: Choices

- **Needs:** step 2 summary.
- **Tools:** AskUserQuestion when available, otherwise ask in chat. Docs MCP (`straddle-docs`) `search-documentation` only. No writes.
- **Next:** [04-plan.md](04-plan.md).

Print:

```text
STRADDLE_PROGRESS {"skill":"straddle-migrate","step":"03-choices"}
```

Ask each unanswered choice with the repository evidence beside it. Do not infer any of them.

1. **Provider.** Confirm which provider is being migrated when the code contains more than one. Anything not in the supported list is "Other"; ask the developer to describe its flows.
2. **Integration model.** Direct account, SaaS, or marketplace. A provider's "connected account" or "sub-account" feature is a hint, not the answer.
3. **SDK.** The published Straddle SDK for the service's language, from the Current versions table in [straddle-best-practices](../../straddle-best-practices/SKILL.md). If no published SDK exists for that language, stop with status `blocked`.
4. **Bank linking for new customers**, when a payment flow or bank linking is in scope: Straddle Bridge widget, a Plaid processor token requested with `processor: straddle` (Bridge creates a paykey from it), a Quiltt token, or direct bank details.
5. **Existing customers' bank accounts.** Provider tokens and bank accounts do not transfer, so existing customers re-link through Bridge when they move to the Straddle path. If the app holds its own Plaid Items, say that Plaid can mint Straddle processor tokens from them, but that doing so uses stored customer data and is customer-data migration, which this skill never implements. Record it in the plan's Not moved section as a separate process for the developer.
6. **Consent**, when a payment flow is in scope. Show the authorization wording from step 2 and whose name it carries (the provider reference says what the provider stores). Ask who decides whether Straddle-path customers re-authorize (typically the developer's compliance owner) and record the decision, or `Unresolved`. Propose a new authorization on the Straddle path by default, and the `consent_type` (`internet` or `signed`) for each flow. Flag flows with no matching `consent_type` value, such as telephone authorization. An identity-only migration has no debit authorization to ask about.
7. **Notification path.** Webhook endpoint, FIFO endpoint, or polling endpoint. Propose the webhook endpoint by default, and a FIFO or polling endpoint only in the cases [notifications.md](../../straddle-best-practices/references/notifications.md) names. If the provider code polls payment status, runs report queries, or parses return files, the Straddle path uses one of these three instead.
8. **Status mapping.** Propose a mapping for every status and event in the step 2 behavior list, using the provider reference: payment statuses for payment flows, customer statuses for identity flows. Ask the developer to confirm it, calling out rows marked "proposal" there.
9. **Switch.** How the application selects Straddle: a feature flag, a per-customer or per-account setting, or a configuration value. Default off unless the developer says otherwise.
10. **Flows in scope.** Which of the step 2 flows move now, and confirmation that in-flight and future-dated payments finish on the provider.

Search the Docs MCP for the Straddle guide for each flow in scope and keep the citations. If the Docs MCP lists `execute-request`, do not call it.

Don't stop at this step to wait for answers. Carry every open choice into the plan as `Unresolved`, and ask the questions alongside the written plan. Writing the plan changes no other file, and nothing is edited before approval anyway. If the answers can't come in this run, stop after step 4 and hand off with `awaiting_approval`.

**Summary for step 4:** the choices with sources, the proposed status mapping, the consent and existing-account decisions, flows in scope, doc citations.
