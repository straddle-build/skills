# Step 5: Independent verification

- **Needs:** the summaries of the steps that ran before it: steps 1 and 2 always, step 3 when it built a preview, and step 4 when it ran. When you continue here without step 3 or 4, as after a denial, a configuration error, or a turn that ends awaiting approval, take the Sandbox scenarios as `not run` with the reason step 3 or 4 recorded.
- **Tools:** `straddle-api` `summarize-openapi-specs` and `search-openapi-operations`; `straddle-api` `execute-request` for permitted reads only, and only when step 1 recorded the API MCP route **configured**; Bash only for `straddle <resource> get ... --agent --data-source live` when the CLI route is **configured**.
- **Next:** [06-evidence.md](06-evidence.md).

Print:

```text
STRADDLE_PROGRESS {"skill":"straddle-test","step":"05-verify"}
```

Record three results separately. None of them implies another.

On the awaiting-approval path, this step runs twice, once in each turn, and both passes are intentional. Keep both in the evidence, each labeled with its pass, and say why in the handoff. The first pass proves discovery while no Sandbox scenario has run. The second, after the developer's yes and step 4, verifies the resources step 4 created; it never repeats the first pass's evidence as new. Run discovery again in the second pass, because it sends no Straddle request. Never skip the second pass's authenticated reads because the first pass ran.

1. **Discovery.** Call `summarize-openapi-specs` once. It reads the API description and sends no Straddle request, so it proves the API MCP is registered, not that any key works. A request shape that passed against a mock or placeholder tool schema, for example in an eval, proves nothing about the hosted tool's actual input schema. Only an authenticated call through the hosted tool shows it accepts the request.
2. **Authenticated execution.** Only for a configured route: run one permitted read per created resource through `execute-request`, for example `GET /v1/accounts/{account_id}` or `GET /v1/charges/{id}` once, passing the acting account where the read takes one. Record each status code. A `401` is an authentication failure. Report it without guessing whether the key or the client's MCP secret input is wrong. When not configured, record `not run: configuration error`. For an offline synthetic target, record `not run: offline synthetic target`, because the hosted API MCP always reaches real Straddle.
3. **Exclusion routing.** Record the tool that executed each of the fourteen excluded operations this run used. Every one must be the SDK or CLI. This is evidence about the skill's routing, not about Scalar: Scalar does not enforce the exclusions, so never write that it does.

Never call `execute-request` for any of the fourteen excluded operations, or for anything outside the public contract.

**Summary for step 6:** discovery result, authenticated results per read, and the routing table.
