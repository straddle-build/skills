---
type: regex
target: { source: file, path: straddle-integration-plan.md }
pattern: '^- Plan state: Approved[ \t]*\n- Approval: [^\n]*\bsha256 4130347ed02056f8afdd1cc068ceea2a27c139af0f24e6524d33496ad020f4df[ \t]*$'
flags: m
arm: with-only
---
