#!/bin/bash
# Eval-only fixture: when the run stops, check straddle-plan-visual.html against show-me.md's fixed shape and
# straddle-design.md's colors with verify/check_plan_visual.py, and leave the result in .plan-visual-shape.txt for
# the visual-shape grader.
#
# The check reads the page as data and runs nothing from the workspace: the system python3 runs isolated (-I -S)
# from / with the system PATH, so no module, path or PYTHON* variable the run planted is loaded. It opens the page
# without following a symlink, and renames its result over .plan-visual-shape.txt, so a planted link there is
# replaced, never followed.
set -u
export PATH=/usr/bin:/bin
[ -n "${CLAUDE_PROJECT_DIR:-}" ] && [ -n "${CLAUDE_PLUGIN_ROOT:-}" ] || exit 0
fixture=$(cd "$CLAUDE_PLUGIN_ROOT" && pwd -P) || exit 0
work=$(cd "$CLAUDE_PROJECT_DIR" && pwd -P) || exit 0
cd / || exit 0
/usr/bin/python3 -I -S "$fixture/verify/check_plan_visual.py" "$work" 2>> "$fixture/plan-visual-check.log" < /dev/null
exit 0
