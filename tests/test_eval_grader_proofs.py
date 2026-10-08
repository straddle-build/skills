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


if __name__ == "__main__":
    unittest.main()
