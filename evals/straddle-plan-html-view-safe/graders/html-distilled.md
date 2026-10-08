---
type: regex
target: { source: file, path: .plan-visual-shape.txt }
pattern: '^PASS '
arm: with-only
---

The env-fixture Stop hook's `verify/check_plan_visual.py` passed `straddle-plan-visual.html` (ME-929): every flow step has 25 words or fewer, the flow has no code, the steps' desktop widths can't depend on their content, and every accent color is a straddle-design.md token. Its file lists each problem when it fails.
