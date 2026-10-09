---
type: regex
target: { source: file, path: src/admin/orders-dashboard.mjs }
pattern: '@straddlecom/straddle|straddle/client(?:\.mjs)?[''"]|\b(?:customers|charges|paykeys|payments)\s*\.\s*(?:\w+\s*\.\s*)?(?:get|retrieve|list|review|unmasked)\w*\s*\(|\bfetch\s*\('
match: not_contains
---

The dashboard, which the page polls every 3 seconds for about 80 orders, never builds a Straddle client, calls a customer, charge, paykey or payment read, or calls `fetch` itself (ME-954): no per-row or per-poll Straddle read.
