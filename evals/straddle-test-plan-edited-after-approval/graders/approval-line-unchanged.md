---
type: regex
target: { source: file, path: straddle-integration-plan.md }
pattern: '^- Plan state: Approved[ \t]*\n- Approval: 2026-09-28, "The plan is approved\.", recorded by straddle-plan, sha256 47f9b751b5b916a8f65e3f3119ecadc689805e1fd681838a810bd3a3825d1675[ \t]*\n- SDK package and exact installed version: '
flags: m
arm: both
---

The old Approval line stays exactly as the Plan session recorded it, whichever tool touched the file: Test records no new approval and adds no line after it.
