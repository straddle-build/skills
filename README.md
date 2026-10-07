# Straddle skills

Plan, build, test, and review a Straddle integration with your coding agent. The skills inspect your code and installed SDK, ask for the decisions that shape the integration, and leave a plan, code changes, or verification report you can inspect.

Install the skills directly in a compatible agent, or use the Straddle plugin to add the skills and hosted Docs MCP and API MCP connections together. The [skill catalog](docs/skills.md) helps you choose a task.

## Install

Choose the installation that fits your client.

| Installation | What it adds | Source |
| --- | --- | --- |
| [Portable skills](#install-portable-skills) | Skill instructions and their references | This repository's default branch |
| [Plugin for Claude Code or Codex](#install-the-plugin-in-claude-code-or-codex) | Skills, Docs MCP, and API MCP | A checksummed GitHub release |
| [Plugin for Cursor](#install-the-plugin-in-cursor) | Skills, Docs MCP, and API MCP | This repository's default branch |

### Install portable skills

Use Node.js 22.20 or later and an agent supported by the [skills installer](https://github.com/vercel-labs/skills). From your application directory, list the available skills:

```bash
npx skills add straddle-build/skills --list
```

Install the complete set, then choose your agent and installation scope when prompted:

```bash
npx skills add straddle-build/skills --skill '*'
```

Keep the set together because the skills share references and hand work to one another. Confirm the installed names with `npx skills list`, then start a new agent session. Use `npx skills list --global` if you selected a global installation.

For documentation search and API requests, [connect the hosted MCP servers](https://straddle-build-straddle-openapi.apidocumentation.com/connect-mcp) in your client. Docs MCP supplies documentation. API MCP discovers operations and sends Straddle API requests using your key.

### Install the plugin in Claude Code or Codex

Use Node.js 22.18 or later and a Claude Code or Codex installation with plugin commands available. The [Straddle Wizard](https://github.com/straddle-build/wizard) downloads a released plugin, verifies its checksum, and registers it with your client.

For Claude Code, install the plugin from your application directory:

```bash
npx @straddlecom/wizard@latest install --client claude
```

For Codex, use the matching client name:

```bash
npx @straddlecom/wizard@latest install --client codex
```

Confirm the download and installation prompts. Then check the result:

```bash
npx @straddlecom/wizard@latest status --json
```

In `clients`, find your client and confirm `plugin.state` is `installed` and `plugin.verified` is `true`. Start a new client session and confirm that `straddle-api` and `straddle-docs` appear in its MCP connections. This checks the installed files and server registration; Setup checks API configuration separately.

The [v0.1.2 plugin release](https://github.com/straddle-build/skills/releases/tag/v0.1.2) contains nine skills. The default branch also includes [Payment Review](docs/skills.md#review-changes-from-a-wizard-session). Direct GitHub marketplace installs follow the default branch; [packaging details](docs/packaging.md#install-paths) document those client commands.

### Install the plugin in Cursor

In the Cursor IDE, open **Add Marketplace**, choose **Import from GitHub**, and enter `https://github.com/straddle-build/skills`. Set **Scope** to **Team**, import the marketplace, and add **Straddle**. On Enterprise plans, a team administrator adds the marketplace.

Open **Configure** to set the plugin's **Straddle API key** field. Confirm that Cursor lists `straddle-setup`, `straddle-plan`, `straddle-integrate`, and `straddle-test`, plus the `straddle-api` and `straddle-docs` MCP servers. Cursor refreshes from the default branch.

## Check your application

Open your application directory in the agent. For Sandbox requests, make `STRADDLE_API_KEY` available in the client process and select the environment explicitly before starting it:

```bash
export STRADDLE_ENVIRONMENT=sandbox
```

For Cursor's plugin, supply the key in **Configure**. Docs MCP works without a key. Setup reports missing configuration and the next action to take.

Ask the agent to run Setup:

```text
Use the straddle-setup skill to check this repository and write straddle-setup.md.
```

Expect `straddle-setup.md` to list the application, SDK, CLI, environment, and MCP checks with readiness, blockers, and unknowns. Use that report to resolve prerequisites, then choose your next task.

## Choose your next task

Start with the skill that matches the work you want to do.

| Your task | Start here |
| --- | --- |
| Choose products, integration model, and SDK | [Get Started](docs/skills.md#choose-a-skill) |
| Plan and build an integration | [Plan, then Integrate](docs/skills.md#build-an-integration) |
| Add Straddle beside another provider | [Migrate](docs/skills.md#add-straddle-beside-another-provider) |
| Verify behavior and review readiness | [Test, then Go Live](docs/skills.md#verify-an-integration) |
| Investigate an existing integration | [Audit](docs/skills.md#investigate-existing-code) |

Application code uses the Straddle SDK. The [Straddle CLI](https://github.com/straddle-build/straddle-cli) supplies diagnostics and Sandbox helpers. The skills require a preview and explicit approval before Sandbox writes, and record which checks ran in their reports.

For a guided sequence through the stages, [start the Straddle Wizard](https://github.com/straddle-build/wizard). To run one stage in your own agent, use the [invocation examples](docs/skills.md#run-a-skill).

## Update your installation

For portable skills, rerun the installation from the same application directory and select the same scope:

```bash
npx skills add straddle-build/skills --skill '*'
```

For a Wizard-managed plugin, update the matching client:

```bash
npx @straddlecom/wizard@latest update --client claude
```

Replace `claude` with `codex` for Codex. Restart the client and repeat `status --json`. In Cursor, refresh the team marketplace or enable **Auto Refresh**, then check the installed skills and MCP servers in the IDE.

## Contribute

Skills live in `skills/<name>/SKILL.md`, with step files and references beside them. Each skill has evaluation cases under `evals/`.

Check package structure, skill policy, and the test suite from the repository root:

```bash
scripts/validate-package --offline
python3 -m unittest discover -s tests -v
```

See [package validation and releases](docs/packaging.md), [evaluation evidence](docs/eval-evidence.md), and the [account-scope test corpus](fixtures/account-scope/README.md) for the remaining checks and their scope. Report a reproducible issue in [GitHub Issues](https://github.com/straddle-build/skills/issues).

Licensed under [Apache 2.0](LICENSE). Adapted material is listed in [third-party notices](third_party/LICENSES.md).
