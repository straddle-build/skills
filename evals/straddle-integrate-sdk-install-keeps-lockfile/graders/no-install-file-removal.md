---
type: tool_used
tool: Bash
input_match: '"command":"(?:[^"\\]|\\.)*(?:\b(?:rm|unlink|trash)\b(?:[^"\\]|\\.)*package(?:-lock)?\.json|\bgit\s+(?:checkout|restore|stash)\b(?:[^"\\]|\\.)*package(?:-lock)?\.json|--no-package-lock\b|--package-lock(?:=|\s+)false\b)'
min: 0
max: 0
arm: both
---

No Bash command deletes or reverts package.json or package-lock.json, or installs without writing the lockfile (ME-918).
