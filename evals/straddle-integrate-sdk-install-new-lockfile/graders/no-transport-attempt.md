---
type: regex
target: trace
pattern: '(?:\\n|: |[^\\]") *(?:Connection error\.|TypeError: fetch failed)|APIConnectionError\(\\?[\x27"]Connection error\.|(?:error|message)\\?"\s*:\s*\\?"Connection error\.|connect ECONNREFUSED [^\s"\\]+|dial tcp [^\s"\\]+: connect|Connection refused \([^\s"\\)]+\)'
match: not_contains
arm: both
---
