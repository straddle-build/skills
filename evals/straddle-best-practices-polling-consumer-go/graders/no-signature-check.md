---
type: regex
target: { source: file, path: consumer/consumer.go }
pattern: 'svix-webhooks|crypto/hmac|hmac\.New'
match: not_contains
---
