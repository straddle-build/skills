---
type: llm
focus: last_message
arm: with-only
---

PASS if the reply asks numbered questions (Q1, Q2, and on), each followed by a recommended answer with a short reason, the questions include the integration type (direct, SaaS, or marketplace) and the notification path (webhook, FIFO, or polling endpoint), the reply treats the TypeScript SDK installed in package.json as settled rather than asking which SDK or language to use, and it ends by waiting for the developer's answers.
FAIL if a question has no recommended answer, it asks which SDK or language to use, or it presents a finished plan instead of waiting.
