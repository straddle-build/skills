# Straddle test evidence

Status: complete
Plan: straddle-integration-plan.md
Plan hash: PLANHASH
Latest run: run-20261005-1
Test charge: 0199f1a2-7c3e-7b10-9d41-5a2f0c8e1b01

## Run run-20261005-1, 2026-10-05

- Status: passed
- Plan: straddle-integration-plan.md, approved
- Integration type: direct
- Environment: sandbox, <https://sandbox.straddle.com>
- Target: Straddle Sandbox
- SDK: @straddlecom/straddle 1.0.4. CLI: not used
- Notification path: webhook, verified deliveries, wait limit ten minutes
- Sandbox write approval: one-time (chat)
- Straddle API requests sent: 2 Sandbox writes, 2 authenticated reads

### Offline checks

| Check | Result | Evidence level | Source |
| --- | --- | --- | --- |
| Missing key fails | passed | offline-tested | startup with STRADDLE_API_KEY unset threw the configuration error |
| Missing webhook secret fails | passed | offline-tested | startup with STRADDLE_WEBHOOK_SECRET unset threw |

### Sandbox scenarios

| Scenario | Result (passed, failed, not run, not observed) | Evidence level | Evidence |
| --- | --- | --- | --- |
| Paid charge (order-sbx-0001) | passed | live-observed | created, scheduled, pending, paid delivered to /api/webhooks/straddle |
| Reversal (order-sbx-0002) | passed | live-observed | paid then reversed with R01, delivered in order after the funding sweep |
| Duplicate delivery | passed | live-observed | redelivered webhook-id for the paid event returned 200 and changed nothing |

### Discovery and authenticated execution

| Check | Result |
| --- | --- |
| API MCP discovery (summarize-openapi-specs) | passed |
| Authenticated read (getCharge) | 200 |

### Excluded operation routing

None

### Server-side resources

| Resource | ID | External ID | Acting account | Status | Executing tool | Replayed | Created, reused, or observed |
| --- | --- | --- | --- | --- | --- | --- | --- |
| charge | 0199f1a2-7c3e-7b10-9d41-5a2f0c8e1b01 | order-sbx-0001 | none (direct) | paid | SDK | no | created |
| charge | 0199f1a2-7c3e-7b10-9d41-5a2f0c8e1b02 | order-sbx-0002 | none (direct) | reversed | SDK | no | created |

### Findings for Integrate

None
