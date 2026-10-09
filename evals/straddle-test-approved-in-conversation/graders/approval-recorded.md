---
type: regex
target: { source: file, path: straddle-integration-plan.md }
pattern: '^- Plan state: Approved[ \t]*\n- Approval: \d{4}-\d{2}-\d{2}, "[^"\n]+", recorded by straddle-test, sha256 4130347ed02056f8afdd1cc068ceea2a27c139af0f24e6524d33496ad020f4df[ \t]*$'
flags: m
arm: with-only
---
