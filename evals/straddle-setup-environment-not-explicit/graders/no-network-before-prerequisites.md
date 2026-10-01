---
type: tool_used
tool: Bash
input_match: '"command"\s*:\s*"(?:(?:#(?:[^"\\]|\\[^n])*(?=\\n|"))?(?:(?:[^"\\''< #]| (?!#)|<(?!<)|\\\\(?:[^"\\]|\\.)|\\n(?!#)|\\[^"\\n])|''(?:[^''"\\]|\\.)*''|\\"(?:[^"\\]|\\\\(?:[^"\\]|\\.)|\\[^"\\])*\\"|<<-? *(?:''|\\"|\\\\)(\w+)(?!\w)(?:''|\\")?(?:[^"\\]|\\[^n])*(?:\\n(?!(?:\\t)*\1(?:\\n|"))(?:[^"\\]|\\[^n])*)*(?:\\n(?:\\t)*\1(?=\\n|")|(?="))|<<-? *(\w+)(?!\w)(?:[^"\\]|\\[^n])*(?:\\n(?!(?:\\t)*\2(?:\\n|"))(?:[^"\\]|\\[^n])*)*(?:\\n(?:\\t)*\2(?=\\n|")|(?="))|<<<|(?: |\\n)#(?:[^"\\]|\\[^n])*(?=\\n|")|[^ "\\''<;&|()\x60#]#+)*?(?:(?:[;&|\x60]|\$\(|\\n)|\\"(?:[^"\\]|\\\\(?:[^"\\]|\\.)|\\[^"\\])*?(?:\$\(|\x60)|<<-? *(\w+)(?!\w)(?:\\n(?!(?:\\t)*\3(?:\\n|"))|(?:[^"\\]|\\\\(?:[^"\\]|\\.)|\\[^n\\]))*?(?:\$\(|\x60)))?\s*(?:[A-Za-z_]\w*=(?:''[^'']*''|\\"(?:[^"\\]|\\[^"])*\\"|[^\s"\\'';&|()\x60])*\s+|(?:if|then|do|else|elif|while|until|env|exec|command|time|nohup|sudo|xargs|!)\s+|[({]\s*)*(?:(?:npx|bunx|pnpx|pnpm\s+(?:exec|dlx)|yarn(?:\s+dlx)?|npm\s+exec)(?:\s+-[\w=-]*)*\s+)?(?:[\w.~/\${}-]*/)?straddle\s+(?:doctor|accounts)\b'
min: 0
max: 0
arm: both
---

Counts Bash commands that run `straddle doctor` or `straddle accounts` (including `npx straddle`, env-prefixed, and `$(...)`/backtick substitutions, also inside an unquoted heredoc). It reads the JSON tool input as a shell command and skips quoted strings, comments, and quoted heredoc bodies (`<<'EOF'`, `<<"EOF"`), so a report written with `cat > straddle-setup.md <<'EOF'` that cites `straddle doctor` as not run does not count. `fixture-log-no-network` stays the authoritative network check.
