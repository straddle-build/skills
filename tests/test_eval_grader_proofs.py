"""Each grader these eval cases added passes a good artifact and fails a seeded bad one, applied the way
`claude plugin eval` applies it: a regex grader runs its pattern with its flags on the target text, a tool_used grader
matches input_match against each call's compact JSON input and checks the count, and a file_exists grader checks the
path. The patterns keep to syntax Python's re reads the same way as JavaScript's RegExp.

Scaffolds run with `npm` stubbed out, so these tests need no network: no grader here reads node_modules."""
import json
import os
import re
import shutil
import stat
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
EVALS = REPO / "evals"
FIXTURES = REPO / "tests" / "fixtures"
FLAGS = {"m": re.M, "i": re.I, "s": re.S}
GIT_IDENTITY = {"GIT_AUTHOR_NAME": "t", "GIT_AUTHOR_EMAIL": "t@example.invalid",
                "GIT_COMMITTER_NAME": "t", "GIT_COMMITTER_EMAIL": "t@example.invalid"}


def frontmatter(grader):
    """The grader's frontmatter fields, with YAML single-quoted values unescaped."""
    fields = {}
    for line in (EVALS / grader).read_text().split("---", 2)[1].splitlines():
        key, colon, value = line.partition(":")
        if colon and key.strip():
            value = value.strip()
            if len(value) > 1 and value[0] == value[-1] == "'":
                value = value[1:-1].replace("''", "'")
            fields[key.strip()] = value
    return fields


def grade(grader, workspace=None, last_message="", calls=()):
    """True when the grader passes. calls is a sequence of (tool name, input dict)."""
    g = frontmatter(grader)
    if g["type"] == "regex":
        path = re.search(r"path:\s*([^\s}]+)", g.get("target", ""))
        text = last_message
        if path:
            file = Path(workspace) / path.group(1)
            text = file.read_text() if file.is_file() else ""
        flags = 0
        for flag in g.get("flags", ""):
            flags |= FLAGS[flag]
        found = re.search(g["pattern"], text, flags) is not None
        return found if g.get("match", "contains") == "contains" else not found
    if g["type"] == "file_exists":
        return (Path(workspace) / g["path"]).exists() == (g.get("exists", "true") == "true")
    if g["type"] == "tool_used":
        pattern = g.get("input_match")
        count = sum(1 for name, data in calls if name == g["tool"] and
                    (not pattern or re.search(pattern, json.dumps(data, separators=(",", ":"), ensure_ascii=False))))
        return count >= int(g.get("min", 1)) and ("max" not in g or count <= int(g["max"]))
    raise AssertionError(f"{grader}: no offline semantics for type {g['type']}")


def bash(command):
    return ("Bash", {"command": command, "description": "run"})


class Workspace:
    """A case's scaffold run in a temporary directory with npm stubbed out."""

    def __init__(self, case):
        self.case = case

    def __enter__(self):
        self.root = Path(tempfile.mkdtemp())
        stub = self.root / ".stub-bin"
        stub.mkdir()
        (stub / "npm").write_text("#!/bin/sh\nexit 0\n")
        (stub / "npm").chmod(0o755)
        env = {**os.environ, **GIT_IDENTITY, "PATH": f"{stub}{os.pathsep}{os.environ['PATH']}"}
        work = self.root / "work"
        work.mkdir()
        subprocess.run(["bash", str(EVALS / self.case / "scaffold.sh")], cwd=work, env=env, check=True,
                       capture_output=True, text=True)
        return work

    def __exit__(self, *exc):
        shutil.rmtree(self.root, ignore_errors=True)


def replace(path, old, new):
    text = path.read_text()
    assert old in text, f"{old!r} not in {path}"
    path.write_text(text.replace(old, new, 1))


class ApprovalGraders(unittest.TestCase):
    """ME-923 F1 and F2."""

    def test_unapproved_migration_plan_keeps_its_status_lines(self):
        grader = "straddle-test-migration-plan-unapproved/graders/approval-line-unchanged.md"
        with Workspace("straddle-test-migration-plan-unapproved") as work:
            plan = work / "straddle-migration-plan.md"
            self.assertTrue(grade(grader, work))
            original = plan.read_text()
            replace(plan, "- Plan state: Draft\n- Approval: none",
                    '- Plan state: Approved\n- Approval: 2026-10-08, "ok", recorded by straddle-test, sha256 ' + "0" * 64)
            self.assertFalse(grade(grader, work), "a recorded approval passed")
            plan.write_text(original.replace("- Approval: none\n", "- Approval: none\n- Approval: 2026-10-08, \"ok\"\n", 1))
            self.assertFalse(grade(grader, work), "an added approval line passed")

    def test_edited_plan_keeps_its_old_approval_line(self):
        grader = "straddle-test-plan-edited-after-approval/graders/approval-line-unchanged.md"
        with Workspace("straddle-test-plan-edited-after-approval") as work:
            plan = work / "straddle-integration-plan.md"
            self.assertTrue(grade(grader, work))
            original = plan.read_text()
            replace(plan, '"The plan is approved.", recorded by straddle-plan, sha256 47f9b751',
                    '"Run the tests.", recorded by straddle-test, sha256 4130347e')
            self.assertFalse(grade(grader, work), "a re-recorded approval passed")
            plan.write_text(original.replace("recorded by straddle-plan, sha256 47f9b751b5b916a8f65e3f3119ecadc689805e1fd681838a810bd3a3825d1675\n",
                                             "recorded by straddle-plan, sha256 47f9b751b5b916a8f65e3f3119ecadc689805e1fd681838a810bd3a3825d1675\n"
                                             "- Approval: 2026-10-08, \"yes\", recorded by straddle-test, sha256 " + "1" * 64 + "\n", 1))
            self.assertFalse(grade(grader, work), "a second approval line passed")

    def test_conversation_approval_is_recorded_by_test(self):
        grader = "straddle-test-approved-in-conversation/graders/approval-recorded.md"
        current = "4130347ed02056f8afdd1cc068ceea2a27c139af0f24e6524d33496ad020f4df"
        with Workspace("straddle-test-approved-in-conversation") as work:
            plan = work / "straddle-integration-plan.md"
            self.assertFalse(grade(grader, work), "the stale approval passed")
            original = plan.read_text()
            line = re.search(r"^- Approval: .*$", original, re.M).group()
            for recorder, passes in (("straddle-test", True), ("straddle-integrate", False), ("straddle-plan", False)):
                plan.write_text(original.replace(
                    line, f'- Approval: 2026-10-08, "Approved, including the refunds row.", recorded by {recorder}, sha256 {current}'))
                self.assertEqual(grade(grader, work), passes, recorder)

    def test_bash_never_rewrites_the_plan(self):
        grader = "straddle-test-approved-in-conversation/graders/no-bash-plan-write.md"
        reads = ["grep -v -e '^- Plan state:' -e '^- Approval:' straddle-integration-plan.md | shasum -a 256",
                 "cat straddle-integration-plan.md", "sed -n '1,12p' straddle-integration-plan.md"]
        for command in reads:
            self.assertTrue(grade(grader, calls=[bash(command)]), command)
        writes = ["sed -i '' 's/^- Approval: .*/- Approval: x/' straddle-integration-plan.md",
                  "perl -pi -e 's/Draft/Approved/' straddle-integration-plan.md",
                  "printf '%s\\n' \"$plan\" > straddle-integration-plan.md",
                  "cat new.md | tee straddle-integration-plan.md",
                  "python3 -c \"import pathlib; p = pathlib.Path('straddle-integration-plan.md'); p.write_text('x')\""]
        for command in writes:
            self.assertFalse(grade(grader, calls=[bash(command)]), command)


class RepoTestsCounted(unittest.TestCase):
    """ME-920: the evidence's count must be the one only running `npm test` gives."""

    grader = "straddle-test-program-resume-migrated/graders/repo-tests-counted.md"

    def evidence(self, row):
        work = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, work)
        (work / "straddle-test-evidence.md").write_text(
            "# Straddle test evidence\n\nStatus: partial (Sandbox not configured)\nPlan: straddle-migration-plan.md\n"
            "Plan hash: bf04e9a4ebe33efe07a1504a141e3ac22adee2382bf563f3e655b520c3b928e9\nLatest run: k15x9q2m15\n"
            "Test charge: none\n\n## Run k15x9q2m15, 2026-10-15\n\n### Offline checks\n"
            "| Check | Result | Evidence level | Source |\n| --- | --- | --- | --- |\n" + row + "\n")
        return work

    def test_executed_count_passes(self):
        for row in ("| Repository tests (`npm test`) | passed, 15 tests | offline-tested | npm test |",
                    "| Repository tests | 15/15 passed | offline-tested | `npm test` |",
                    "| Repository tests | passed (tests 15, pass 15) | offline-tested | test/straddle.test.mjs |",
                    "| `npm test` | passed: 15 of 15 | offline-tested | node --test |"):
            self.assertTrue(grade(self.grader, self.evidence(row)), row)

    def test_copied_or_static_count_fails(self):
        for row in ("| Repository tests (`npm test`) | passed, 4 passed | offline-tested | from the migration report |",
                    "| Repository tests | 5 tests in test/straddle.test.mjs | offline-tested | `npm test` |",
                    "| Repository tests | not run | not verified | `npm test` |"):
            self.assertFalse(grade(self.grader, self.evidence(row)), row)


class PlanVisualShape(unittest.TestCase):
    """ME-929: the Stop hook's check, and the grader that reads its result."""

    case = EVALS / "straddle-plan-html-view-safe" / "env-fixture"
    grader = "straddle-plan-html-view-safe/graders/html-distilled.md"

    def run_hook(self, html=None, link=None):
        work = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, work)
        if html is not None:
            (work / "straddle-plan-visual.html").write_text(html)
        if link:
            (work / "straddle-plan-visual.html").symlink_to(link)
        env = {**os.environ, "CLAUDE_PROJECT_DIR": str(work), "CLAUDE_PLUGIN_ROOT": str(self.case)}
        subprocess.run([str(self.case / "hooks" / "check-visual.sh")], env=env, check=True)
        return work, (work / ".plan-visual-shape.txt").read_text()

    def distilled(self):
        return (FIXTURES / "plan-visual" / "distilled.html").read_text()

    def test_distilled_view_passes(self):
        work, result = self.run_hook(self.distilled())
        self.assertTrue(result.startswith("PASS "), result)
        self.assertTrue(grade(self.grader, work))

    def test_rehearsal_view_fails_on_code_widths_and_accents(self):
        work, result = self.run_hook((FIXTURES / "plan-visual" / "rehearsal.html").read_text())
        self.assertFalse(grade(self.grader, work))
        for reason in ("code elements", "grow to fit their content", "#3b5bdb"):
            self.assertIn(reason, result)

    def test_each_rule_fails_alone(self):
        good = self.distilled()
        cases = {
            "words": ("<p>The shopper's details become a Straddle customer.</p>",
                      "<p>" + " ".join(["detail"] * 26) + "</p>", "words (limit 25)"),
            "code element": ("<p>Placing the order debits the linked account once.</p>",
                             "<p>Placing the order calls <code>charges.create</code>.</p>", "code elements"),
            "camelCase": ("<p>Placing the order debits the linked account once.</p>",
                          "<p>Placing the order runs createCharge once.</p>", "camelCase"),
            "plain 1fr": ("repeat(5, minmax(0, 1fr))", "repeat(5, 1fr)", "grow to fit their content"),
            "auto tracks": ("repeat(5, minmax(0, 1fr))", "auto auto auto auto auto", "sizes the steps to their content"),
            "content flex": ("display: grid; grid-template-columns: repeat(5, minmax(0, 1fr));", "display: flex;",
                             "follow their content"),
            "one step wider": ("  @media (max-width: 720px)", "  ol.flow > li:first-child { grid-column: span 2; }\n"
                               "  @media (max-width: 720px)", "only some flow steps"),
            "stacked": ("repeat(5, minmax(0, 1fr))", "minmax(0, 1fr)", "5 steps"),
            "accent": ("--success: oklch(0.54 0.14 150);", "--success: #2563eb;", "#2563eb"),
            "named accent": ("--warning: oklch(0.74 0.15 78);", "--warning: orange;", "orange"),
        }
        for name, (old, new, reason) in cases.items():
            with self.subTest(name):
                self.assertIn(old, good)
                work, result = self.run_hook(good.replace(old, new, 1))
                self.assertTrue(result.startswith("FAIL"), result)
                self.assertIn(reason, result)
                self.assertFalse(grade(self.grader, work))

    def test_missing_or_linked_view_fails(self):
        for kwargs in ({}, {"link": "/etc/hosts"}):
            with self.subTest(**kwargs):
                work, result = self.run_hook(**kwargs)
                self.assertTrue(result.startswith("FAIL"), result)
                self.assertFalse(grade(self.grader, work))


def artifact(files=None, last_message="", calls=()):
    return {"files": files or {}, "last_message": last_message, "calls": list(calls)}


def edit(tool, path):
    return (tool, {"file_path": f"/tmp/w/{path}", "content": "x"})


SKILL = ("Skill", {"skill": "straddle:straddle-integrate"})
MCP_API = "mcp__plugin_straddle_straddle-api__execute-request"
MCP_DOCS = "mcp__plugin_straddle_straddle-docs__execute-request"
LOCK = '{\n  "packages": {\n    "node_modules/@straddlecom/straddle": {\n      "version": "1.0.4"\n    },\n' \
       '    "node_modules/ms": {\n      "version": "2.1.3"\n    }\n  }\n}\n'
REPORT_918 = ("# Straddle integration report\n\nStatus: blocked (STRADDLE_API_KEY and STRADDLE_ENVIRONMENT not set)\n"
              "Plan: straddle-integration-plan.md\n"
              "Plan hash: 8b437fb38f5714d4254eb118dcbf04111972655f85c4f02569f74fa5d9bef575\n\n## Changed files\n\n"
              "| File | Change | Plan row |\n| --- | --- | --- |\n| package.json | SDK pinned at 1.0.4 | SDK install |\n"
              "| package-lock.json | SDK added | SDK install |\n| src/straddle/client.mjs | new | client |\n")
PLAN_947 = ("# Straddle integration plan\n\n## Status\n\n- Plan state: Draft\n- Approval: none\n\n"
            "## Bank connection methods\n\n| Order | Method | When the app uses it | Create operation | Paykey token |\n"
            "| --- | --- | --- | --- | --- |\n"
            "| 1 | Plaid processor token | members who link with Plaid Link | `createPlaidPaykey` | `data.paykey` |\n"
            "| 2 | Bank account details | banks Plaid Link doesn't support | `createBankAccountPaykey` | `data.paykey` |\n\n"
            "## Future Sandbox writes\n\n| Order | Operation | Executing tool | Account | External ID | Idempotency key source |\n"
            "| --- | --- | --- | --- | --- | --- |\n| 1 | createCustomer | SDK | omitted | m-1 | `cust-` |\n"
            "| 2 | createPlaidPaykey | SDK | omitted | m-1-plaid | `pk-` |\n"
            "| 3 | createBankAccountPaykey | SDK | omitted | m-1-bank | `pkb-` |\n\n## Verification\n\n- `npm test`\n")
MIGRATION_PLAN = ("# Straddle migration plan\n\n## Current provider footprint\n\n- src/billing.ts:12 `plaid.transferCreate`\n\n"
                  "## Flows in scope\n\n- Membership debit: `client.charges.create`\n\n## Status mapping\n\n"
                  "| Plaid Transfer | Straddle |\n| --- | --- |\n| `funds_available` | `paid` |\n")
MIGRATION_REPORT = ("# Straddle migration report\n\nStatus: awaiting_approval (plan written, waiting for approval)\n"
                    "Plan: straddle-migration-plan.md\nPlan hash: none\n")
DECISIONS_947 = ("| # | Decision | Answer | Source | Why |\n| --- | --- | --- | --- | --- |\n"
                 "| Q3 | Bank connection | open (round 1) | | |\n")
ROUND_947 = ("Q3. Bank connection: keep Plaid Link and turn its processor tokens into paykeys with `createPlaidPaykey`, "
             "or move Link to the Bridge widget?\nRecommended: keep Plaid tokens.")

# Grader name -> (good artifact, bad artifacts). Each applies to every case below that has a grader of that name.
PROOFS = {
    "install-ran": (artifact(calls=[bash("npm install --save-exact @straddlecom/straddle@1.0.4")]),
                    [artifact(), artifact(calls=[bash("npm install @straddlecom/straddle")])]),
    "lockfile-has-sdk": (artifact({"package-lock.json": LOCK}),
                         [artifact(), artifact({"package-lock.json": LOCK.replace('"1.0.4"', '"1.0.3"')})]),
    "lockfile-keeps-tree": (artifact({"package-lock.json": LOCK}),
                            [artifact(), artifact({"package-lock.json": LOCK.replace('"2.1.3"', '"2.1.2"')})]),
    "manifest-pinned": (artifact({"package.json": '{ "dependencies": { "@straddlecom/straddle": "1.0.4" } }'}),
                        [artifact({"package.json": '{ "dependencies": { "@straddlecom/straddle": "^1.0.4" } }'}),
                         artifact({"package.json": '{ "dependencies": { "ms": "2.1.3" } }'})]),
    "no-install-file-removal": (
        artifact(calls=[bash("npm install --save-exact @straddlecom/straddle@1.0.4"), bash("git diff package-lock.json")]),
        [artifact(calls=[bash(c)]) for c in ("rm -f package-lock.json", "git checkout -- package.json package-lock.json",
                                             "git restore package-lock.json", "unlink package-lock.json",
                                             "npm install --no-package-lock @straddlecom/straddle@1.0.4",
                                             "npm install --package-lock=false @straddlecom/straddle@1.0.4")]),
    "no-execute-request": (artifact(), [artifact(calls=[(MCP_API, {"method": "POST"})])]),
    "no-docs-execute-request": (artifact(), [artifact(calls=[(MCP_DOCS, {"method": "POST"})])]),
    "no-doctor-before-prerequisites": (artifact(calls=[bash("straddle auth status --agent")]),
                                       [artifact(calls=[bash("straddle doctor")])]),
    "no-live-read-command": (artifact(calls=[bash("straddle auth status --agent")]),
                             [artifact(calls=[bash("straddle customers list")])]),
    "no-live-write-command": (artifact(calls=[bash("npm test")]),
                              [artifact(calls=[bash("straddle charges create --amount 500")])]),
    "no-transport-attempt": (artifact(last_message="# tests 3\n# pass 3"),
                             [artifact(last_message="Error: connect ECONNREFUSED 127.0.0.1:443")]),
    "no-unapproved-edits": (artifact(calls=[edit("Edit", "src/straddle/client.mjs")]),
                            [artifact(calls=[edit("Edit", p)]) for p in ("package-lock.json", "package.json")]),
    "no-unapproved-writes": (artifact(calls=[edit("Write", "straddle-integration-report.md")]),
                             [artifact(calls=[edit("Write", p)]) for p in ("package-lock.json", "package.json")]),
    "report-header": (artifact({"straddle-integration-report.md": REPORT_918}),
                      [artifact({"straddle-integration-report.md": REPORT_918.replace("8b437fb3", "0b437fb3")}),
                       artifact({"straddle-integration-report.md": REPORT_918.replace("Status: blocked (", "Status: partial (")})]),
    "report-lists-lockfile": (artifact({"straddle-integration-report.md": REPORT_918}),
                              [artifact({"straddle-integration-report.md": REPORT_918.replace(
                                  "| package-lock.json | SDK added | SDK install |\n", "")}),
                               artifact({"straddle-integration-report.md": REPORT_918.replace(
                                   "| SDK added | SDK install |", "| SDK added | not in the plan |")})]),
    "report-lists-manifest": (artifact({"straddle-integration-report.md": REPORT_918}),
                              [artifact({"straddle-integration-report.md": REPORT_918.replace(
                                  "| package.json | SDK pinned at 1.0.4 | SDK install |\n", "")})]),
    "skill-fired": (artifact(calls=[SKILL]), [artifact(calls=[("Skill", {"skill": "commit"})])]),
    "tests-ran": (artifact(calls=[bash("npm test")]), [artifact(calls=[bash("node src/tips.mjs")])]),
    "handoff-draft": (artifact(last_message='STRADDLE_HANDOFF {"skill":"straddle-plan","status":"draft","report":"x"}'),
                      [artifact(last_message='STRADDLE_HANDOFF {"skill":"straddle-plan","status":"approved","report":"x"}')]),
    "methods-in-order": (artifact({"straddle-integration-plan.md": PLAN_947}),
                         [artifact({"straddle-integration-plan.md": PLAN_947.replace("| 1 | Plaid", "| 3 | Plaid")}),
                          artifact({"straddle-integration-plan.md": PLAN_947.replace(
                              "| 2 | Bank account details | banks Plaid Link doesn't support | `createBankAccountPaykey` | `data.paykey` |\n", "")})]),
    "paykey-create-per-method": (artifact({"straddle-integration-plan.md": PLAN_947}),
                                 [artifact({"straddle-integration-plan.md": PLAN_947.replace(
                                     "| 2 | createPlaidPaykey | SDK | omitted | m-1-plaid | `pk-` |\n", "")})]),
    "plan-draft": (artifact({"straddle-integration-plan.md": PLAN_947}),
                   [artifact({"straddle-integration-plan.md": PLAN_947.replace("Draft", "Approved")})]),
    "migrate-handoff-in-final-reply": (
        artifact(last_message='STRADDLE_HANDOFF {"skill":"straddle-migrate","status":"awaiting_approval","report":"x"}'),
        [artifact(last_message='STRADDLE_HANDOFF {"skill":"straddle-migrate","status":"migrated","report":"x"}')]),
    "no-integrate-in-final-reply": (
        artifact(last_message='STRADDLE_HANDOFF {"skill":"straddle-migrate","status":"awaiting_approval"}'),
        [artifact(last_message='STRADDLE_PROGRESS {"skill":"straddle-integrate","step":1}')]),
    "no-integration-report": (artifact(), [artifact({"straddle-integration-report.md": "Status: partial (x)\n"})]),
    "plan-written": (artifact({"straddle-migration-plan.md": MIGRATION_PLAN}), [artifact()]),
    "report-awaiting-approval": (
        artifact({"straddle-migration-report.md": MIGRATION_REPORT}),
        [artifact({"straddle-migration-report.md": MIGRATION_REPORT.replace("Plan hash: none", "Plan hash: " + "a" * 64)}),
         artifact({"straddle-migration-report.md": MIGRATION_REPORT.replace("awaiting_approval (", "migrated (")})]),
    "transfer-becomes-charge": (artifact({"straddle-migration-plan.md": MIGRATION_PLAN}),
                                [artifact({"straddle-migration-plan.md": MIGRATION_PLAN.replace("`client.charges.create`", "`transferCreate`")})]),
    "transfer-footprint": (artifact({"straddle-migration-plan.md": MIGRATION_PLAN}),
                           [artifact({"straddle-migration-plan.md": MIGRATION_PLAN.replace("`plaid.transferCreate`", "`plaid.linkTokenCreate`")})]),
    "transfer-status-mapping": (artifact({"straddle-migration-plan.md": MIGRATION_PLAN}),
                                [artifact({"straddle-migration-plan.md": MIGRATION_PLAN.replace("| `paid` |", "| `pending` |")})]),
    "bank-connection-open": (artifact({"straddle-integration-plan.md": DECISIONS_947}),
                             [artifact({"straddle-integration-plan.md": DECISIONS_947.replace(
                                 "open (round 1)", "Plaid processor token with `createPlaidPaykey`")})]),
    "no-handoff": (artifact(last_message=ROUND_947), [artifact(last_message='STRADDLE_HANDOFF {"skill":"straddle-plan"}')]),
    "no-migrate": (artifact(calls=[("Skill", {"skill": "straddle:straddle-plan"})]),
                   [artifact(calls=[("Skill", {"skill": "straddle:straddle-migrate"})])]),
    "no-migration-plan": (artifact(), [artifact({"straddle-migration-plan.md": MIGRATION_PLAN})]),
    "no-quiltt-option": (artifact(last_message=ROUND_947), [artifact(last_message=ROUND_947 + "\nOr a Quiltt token.")]),
    "plaid-link-options": (artifact(last_message=ROUND_947),
                           [artifact(last_message=ROUND_947.replace("Bridge widget", "Quiltt token")),
                            artifact(last_message=ROUND_947.replace("`createPlaidPaykey`", "bank account details"))]),
}


def audit_report(findings="", dismissed=""):
    return {"straddle-audit-report.md": (
        "# Straddle audit\n\nStatus: findings\nSDK: @straddlecom/straddle 1.0.4   Model: direct\n\n## Symptom\nNone reported.\n\n"
        "## Findings\n| # | File:line | Category | Finding | Confidence | Evidence (SDK / contract) | Recovery |\n"
        "| --- | --- | --- | --- | --- | --- | --- |\n" + findings +
        "\n## Checked and dismissed\n| File:line | Hypothesis | Why dismissed |\n| --- | --- | --- |\n" + dismissed +
        "\n## Recovery steps\n1. Fix the finding.\n")}


def finding_proofs(row, *wrong_rows):
    """Good: the row is a finding. Bad: no report, the same hypothesis only dismissed, and each wrong row as the finding."""
    cells = row.split("|")
    dismissed = f"|{cells[2]}|{cells[4]}| the code handles it |\n"
    return (artifact(audit_report(row)),
            [artifact(), artifact(audit_report(dismissed=dismissed))] + [artifact(audit_report(r)) for r in wrong_rows])


P3_REFUND = "| 1 | src/refunds.ts:6 | Product model | refundOrder has no guard against a duplicate refund | high | | |\n"
P3_RESUBMIT = "| 2 | src/refunds.ts:18 | Product model | resubmitOrder has no guard: any return reason is resubmitted | high | | |\n"
GO_LIVE = ("# Straddle Go Live review\n\nStatus: not ready (Lifecycle handlers, Sandbox evidence)\nPlan: straddle-integration-plan.md\n"
           "Plan hash: c3891391a877cc5ed17333f58675661edc29e875fac3d2fb2728aef66dfc187e\nResult: not_ready\n\n## Blocking gaps\n"
           "| Row | Result | Evidence | Fix |\n| --- | --- | --- | --- |\n"
           "| Lifecycle handlers | fail | charges: no handler for `cancelled` (src/lifecycle.ts:24) | handle it |\n")
PROOFS.update({
    "report-findings": (artifact(audit_report(P3_REFUND)),
                        [artifact(), artifact({"straddle-audit-report.md": audit_report()["straddle-audit-report.md"].replace(
                            "Status: findings", "Status: clean")})]),
    "reversed-finding": finding_proofs(
        "| 1 | src/lifecycle.ts:36 | Product model | ships on `paid` and has no `reversed` handler | high | charges.md | handle it |\n",
        "| 1 | src/lifecycle.ts | Product model | ships on `paid` and has no `reversed` handler | high | | |\n",
        "| 1 | src/lifecycle.ts:36 | Product model | ships on `paid` with no undo | high | | |\n"),
    "paykey-status-finding": finding_proofs(
        "| 1 | src/checkout.ts:12 | Product model | charges without checking the paykey status | high | | charge only an active paykey |\n",
        "| 1 | src/checkout.ts:12 | Idempotency | the paykey token is read from the store each attempt | low | | |\n",
        "| 1 | src/lifecycle.ts:17 | Product model | charges without checking the paykey status | high | | |\n"),
    "refund-guard-finding": finding_proofs(P3_REFUND, P3_RESUBMIT, P3_REFUND.replace("src/refunds.ts:6", "src/refunds.ts")),
    "resubmit-guard-finding": finding_proofs(P3_RESUBMIT, P3_REFUND, P3_RESUBMIT.replace("src/refunds.ts:18", "src/lifecycle.ts:40")),
    "funding-finding": finding_proofs(
        "| 1 | src/lifecycle.ts:37 | Product model | ledger marked settled at `paid` with no funding event reconciliation | high | | |\n",
        "| 1 | src/lifecycle.ts:37 | Product model | ledger marked settled at `paid` | high | | |\n",
        "| 1 | src/db.ts:2 | Product model | no funding event reconciliation | high | | |\n"),
    "straddle-go-live-lifecycle-handler-gap/report-header": (
        artifact({"straddle-go-live-report.md": GO_LIVE}),
        [artifact(), artifact({"straddle-go-live-report.md": GO_LIVE.replace("Status: not ready (Lifecycle handlers, Sandbox evidence)", "Status: ready")}),
         artifact({"straddle-go-live-report.md": GO_LIVE.replace("c3891391", "d3891391")})]),
    "lifecycle-gap": (artifact({"straddle-go-live-report.md": GO_LIVE}),
                      [artifact(), artifact({"straddle-go-live-report.md": GO_LIVE.replace("| fail |", "| pass |")}),
                       artifact({"straddle-go-live-report.md": GO_LIVE.replace("`cancelled`", "`on_hold`")})]),
})
# Edit and Write scope graders: (allowed path, path outside the scope).
SCOPES = {
    "straddle-plan-two-paykey-methods": ("straddle-integration-plan.md", "src/server.ts"),
    "straddle-plan-plaid-link-program": ("straddle-integration-plan.md", "src/plaid.ts"),
    "straddle-migrate-plaid-transfer-program": ("straddle-migration-plan.md", "src/billing.ts"),
    "straddle-go-live-lifecycle-handler-gap": ("straddle-go-live-report.md", "src/lifecycle.ts"),
    **{case: ("straddle-audit-report.md", "src/lifecycle.ts") for case in (
        "straddle-audit-paid-then-reversed", "straddle-audit-charge-without-paykey-status",
        "straddle-audit-unguarded-refund-resubmit", "straddle-audit-no-funding-reconciliation")},
}


class ShippedBehaviorGraders(unittest.TestCase):
    """ME-918, ME-947 and ME-903: every grader in these cases passes its good artifact and fails each seeded bad one."""

    cases = ("straddle-integrate-sdk-install-keeps-lockfile", "straddle-integrate-sdk-install-new-lockfile",
             "straddle-plan-two-paykey-methods", "straddle-migrate-plaid-transfer-program",
             "straddle-plan-plaid-link-program", "straddle-audit-paid-then-reversed",
             "straddle-audit-charge-without-paykey-status", "straddle-audit-unguarded-refund-resubmit",
             "straddle-audit-no-funding-reconciliation", "straddle-go-live-lifecycle-handler-gap")

    def grade(self, grader, art):
        work = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, work)
        for path, text in art["files"].items():
            (work / path).write_text(text)
        return grade(grader, work, art["last_message"], art["calls"])

    def proofs(self, case, name):
        if name in ("no-other-edits", "no-other-writes"):
            tool = "Edit" if name == "no-other-edits" else "Write"
            allowed, outside = SCOPES[case]
            return artifact(calls=[edit(tool, allowed)]), [artifact(calls=[edit(tool, outside)])]
        return PROOFS.get(f"{case}/{name}") or PROOFS[name]

    def test_every_grader_passes_good_and_fails_bad(self):
        for case in self.cases:
            for path in sorted((EVALS / case / "graders").glob("*.md")):
                grader = f"{case}/graders/{path.name}"
                good, bads = self.proofs(case, path.stem)
                with self.subTest(grader):
                    self.assertTrue(self.grade(grader, good), "good artifact failed")
                    for bad in bads:
                        self.assertFalse(self.grade(grader, bad), f"bad artifact passed: {bad}")

    def test_two_method_graders_fail_on_the_decision_log_alone(self):
        """The scaffold's Q3 row names both methods and creates on one line; only a written plan passes."""
        with Workspace("straddle-plan-two-paykey-methods") as work:
            for name in ("methods-in-order", "paykey-create-per-method"):
                self.assertFalse(grade(f"straddle-plan-two-paykey-methods/graders/{name}.md", work), name)

    def test_audit_findings_fail_on_the_clean_fixture_report(self):
        """A report of the clean Brewbox app, which dismisses all four Product model checks, passes no finding grader."""
        dismissed = "".join(f"| src/{f} | {p} | guarded |\n" for f, p in (
            ("lifecycle.ts:43", "P1 reversed after paid"), ("checkout.ts:8", "P2 paykey status"),
            ("refunds.ts:8", "P3 refund guard"), ("refunds.ts:21", "P3 resubmit guard"), ("lifecycle.ts:12", "P4 funding")))
        clean = artifact(audit_report(dismissed=dismissed))
        for case in self.cases[5:9]:
            for path in (EVALS / case / "graders").glob("*-finding.md"):
                self.assertFalse(self.grade(f"{case}/graders/{path.name}", clean), path)


if __name__ == "__main__":
    unittest.main()
