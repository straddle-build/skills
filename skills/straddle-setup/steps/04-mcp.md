# Step 4: Docs MCP and API MCP

Print this marker once now, before any tool call, including ToolSearch or reading the next step:

```text
STRADDLE_PROGRESS {"skill":"straddle-setup","step":"04-mcp"}
```

- **Needs:** step 3 summary.
- **Tools:** the `straddle-docs` and `straddle-api` MCP tools named below, and nothing else from those servers.
- **Next:** [05-report.md](05-report.md).

Check the two servers separately and report them as separate rows. One working does not imply the other.

## Docs MCP (`straddle-docs`)

1. Record whether the server is registered and which tools it lists.
2. Run one `search-documentation` query, such as `webhook signature verification`. A relevant result is `passed`.
3. The Docs MCP must be search-only. If it lists `execute-request`, `search-openapi-operations`, or `summarize-openapi-specs`, report it as a **warning: Docs MCP exposes API execution tools**, do not call them, and continue. The hosted server publishes that tool list, so re-registering the client does not change it and the connect-mcp guide has no fix for it. The only next action is to leave those tools unused.

## API MCP (`straddle-api`)

1. Record whether the server is registered and which tools it lists. Registration and tool discovery are **discovery**, not verification. A registered server may have no key configured, which the listing cannot show.
2. Run `summarize-openapi-specs`. It reads the specification and sends no Straddle request. Report `discovery: passed` when it returns the specification. It says nothing about the key.
3. **Authenticated verification** needs one real permitted read through `execute-request`: `GET /v1/accounts` against `https://sandbox.straddle.com`, with no `Straddle-Account-Id`. Offer it only when all of these hold:
   - step 3 recorded the key as present and the environment as explicitly selected and exactly `https://sandbox.straddle.com`
   - the API MCP is registered and discovery passed
   - the call can name the Sandbox host explicitly

   If any prerequisite fails, do not offer or run it, even if the developer asks, and report `authenticated: not run (prerequisite failed: <which>)`. When they hold, run one `search-openapi-operations` query, `list accounts`, and take the call's IDs from that result as [tools.md](../../straddle-best-practices/references/tools.md) describes: `xScalarDocumentId` from the spec's `x-scalar-document-version-id`, and `xScalarOperationId` from the `x-scalar-operation-id` on the `/v1/accounts` path, never `listAccounts`. Open the offer with one plain sentence that says what you're offering, before any table or list, for example "API MCP discovery passed, so I can make one Sandbox read through it: `GET /v1/accounts`." Then, only after the developer says yes, call `execute-request` with those IDs, `method: GET`, `serverBaseUrl: https://sandbox.straddle.com`, and `path: /v1/accounts`. Never use any other `execute-request` operation in Setup.
4. Report `authenticated: passed`, `authenticated: failed (<status>)`, or `authenticated: not run (<reason>)`. A 401 means the client has no key configured, a wrong key, or a key for another environment. "Failed to get operation" means the operation ID was wrong, not the key: report it as `authenticated: failed (wrong operation ID)`. Never print the header or key.

If a server is not registered, say so and point to the published setup guide, `https://straddle-build-straddle-openapi.apidocumentation.com/connect-mcp`, which covers each client's documented secret input and the manual fallback. Do not register or configure it yourself.

**Summary for step 5:** for each server, registration, tools listed, discovery result, authenticated result (API MCP only), and any Docs MCP execution-tool warning.
