---
type: tool_used
tool: Bash
input_match: '"command":"(?=(?:[^"\\]|\\.)*straddle-integration-plan\.md)(?:[^"\\]|\\.)*?(?:\b(?:sed|perl)\s+(?:-\w+\s+)*(?:-\w*i|--in-place)|\btee\s|>>?\s*(?:\\?["''])?(?:[\w./-]*/)?straddle-integration-plan\.md|write_text|writeFileSync|\.write\(|open\([^)]*,\s*\\?["''][wa])'
min: 0
max: 0
arm: both
---

Test records the approval with Edit, as its step 1 Tools line says. A Bash command that rewrites `straddle-integration-plan.md` (an in-place `sed` or `perl`, a redirect or `tee` into it, or an interpreter writing it) fails, even when the resulting file is right. The hash command, which only reads the plan, passes.
