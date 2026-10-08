---
description: "An approved plan has Integrate install the TypeScript SDK with npm in a repository with no lockfile yet (ME-918): the package-lock.json the install creates is kept, not deleted or skipped, package.json keeps the pinned SDK, and the report lists both files under the SDK install row."
tags: [integrate, direct, typescript, sdk-install, lockfile, grant-bash-write]
max_turns: 60
timeout_seconds: 1500
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
---
The Straddle plan is approved. Please implement it now: install the SDK the plan names, then add the client factory, the tip charge and the tests. We have not put the Sandbox key or environment into this shell yet, so this is code only today; no Sandbox setup until we do.
