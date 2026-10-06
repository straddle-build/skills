import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SESSION_STATE = ROOT / "skills/straddle-payment-review/scripts/session-state"
SCAFFOLD = ROOT / "tests/fixtures/payment-review-session/scaffold.sh"
IDENTITY = {"GIT_AUTHOR_NAME": "t", "GIT_AUTHOR_EMAIL": "t@example.invalid",
            "GIT_COMMITTER_NAME": "t", "GIT_COMMITTER_EMAIL": "t@example.invalid"}


def run(args, cwd, check=True):
    return subprocess.run(args, cwd=cwd, check=check, capture_output=True, text=True, env={**os.environ, **IDENTITY})


class SessionStateFromTheEvalScaffold(unittest.TestCase):
    """The session fixture scaffold snapshots the start state; compare reports what the session changed."""

    def setUp(self):
        self.repo = Path(tempfile.mkdtemp())
        run(["bash", str(SCAFFOLD)], self.repo)
        self.snapshot = json.loads((self.repo / ".straddle-wizard/session-baseline.json").read_text())["snapshot"]

    def compare(self):
        return run([str(SESSION_STATE), "compare", self.snapshot], self.repo, check=False)

    def changes(self):
        return self.compare().stdout.splitlines()[1:]

    def code_hash(self):
        return self.compare().stdout.splitlines()[0]

    def test_reports_only_the_session_changes(self):
        self.assertEqual(self.changes(), ["added src/checkout.ts", "modified src/tips.ts"])

    def test_code_hash_tracks_renames_deletions_and_modes(self):
        base = self.code_hash()
        self.assertEqual(base, "code-hash 51d22d3a7311d22b3a0e843698ce579482c446a8b726dd0c8d761c2845547c60")
        (self.repo / "src/checkout.ts").rename(self.repo / "src/pay.ts")
        self.assertEqual(self.changes(), ["added src/pay.ts", "modified src/tips.ts"])
        renamed = self.code_hash()
        (self.repo / "src/pay.ts").rename(self.repo / "src/checkout.ts")
        (self.repo / "src/legacy-payouts.ts").unlink()
        self.assertEqual(self.changes(), ["added src/checkout.ts", "deleted src/legacy-payouts.ts", "modified src/tips.ts"])
        deleted = self.code_hash()
        run(["git", "checkout", "--", "src/legacy-payouts.ts"], self.repo)
        os.chmod(self.repo / "src/admin-refunds.ts", 0o755)
        self.assertEqual(self.changes(), ["modified src/admin-refunds.ts", "added src/checkout.ts", "modified src/tips.ts"])
        executable = self.code_hash()
        os.chmod(self.repo / "src/admin-refunds.ts", 0o644)
        self.assertEqual(len({base, renamed, deleted, executable}), 4)
        self.assertEqual(self.code_hash(), base)

    def test_symlink_counts_as_its_link_text(self):
        os.symlink("/nonexistent/outside/the/repo", self.repo / "link.ts")
        self.assertEqual(self.changes(), ["added link.ts", "added src/checkout.ts", "modified src/tips.ts"])
        first = self.code_hash()
        os.remove(self.repo / "link.ts")
        os.symlink("/elsewhere", self.repo / "link.ts")
        self.assertNotEqual(self.code_hash(), first)

    def test_secret_shaped_and_review_files_are_outside_the_state(self):
        base = self.code_hash()
        (self.repo / "deep/er").mkdir(parents=True)
        for name in (".env.local", "deep/er/.env", "deep/er/server.pem", "deep/er/id.key", "straddle-payment-review.md"):
            (self.repo / name).write_text("x\n")
        self.assertEqual(self.code_hash(), base)
        self.assertEqual(self.changes(), ["added src/checkout.ts", "modified src/tips.ts"])

    def test_discovery_sensitive_and_user_excluded_paths_never_enter_the_snapshot(self):
        sensitive = [".npmrc", "id_rsa", "certs/certificate.CRT", "config/.aws/creds", ".ssh/known", "app/my-secrets.json",
                     "infra/prod.tfvars", "Credentials/token.txt", "private/notes.md", "deep/private/x.ts"]
        for name in sensitive + ["src/allowed.ts"]:
            (self.repo / name).parent.mkdir(parents=True, exist_ok=True)
            (self.repo / name).write_text("zqsentinel\n")
        (self.repo / ".straddle-wizard/payment-review-exclude").write_text("^(.*/)?private$\n")
        snapshot = run([str(SESSION_STATE), "snapshot"], self.repo).stdout.strip()
        stored = run(["git", "ls-tree", "-r", "--name-only", snapshot], self.repo).stdout.split()
        self.assertEqual([p for p in stored if p in sensitive], [])
        self.assertIn("src/allowed.ts", stored)
        for name in sensitive:
            (self.repo / name).write_text("zqsentinel changed\n")
        (self.repo / "src/allowed.ts").write_text("changed\n")
        self.snapshot = snapshot
        self.assertEqual(self.changes(), ["modified src/allowed.ts"])

    def test_fails_closed_without_output(self):
        self.snapshot = "0" * 40
        bad = self.compare()
        self.assertNotEqual(bad.returncode, 0)
        self.assertEqual(bad.stdout, "")
        if os.geteuid() != 0:
            self.snapshot = json.loads((self.repo / ".straddle-wizard/session-baseline.json").read_text())["snapshot"]
            os.chmod(self.repo / "src/checkout.ts", 0)
            unreadable = self.compare()
            os.chmod(self.repo / "src/checkout.ts", 0o644)
            self.assertNotEqual(unreadable.returncode, 0)
            self.assertEqual(unreadable.stdout, "")


class ExactBytesAndUnsupportedState(unittest.TestCase):
    """Paths and symlink targets compare byte for byte; state the script can't fingerprint fails closed."""

    def setUp(self):
        self.repo = Path(tempfile.mkdtemp())
        run(["git", "init", "-q"], self.repo)

    def state(self, *args):
        return run([str(SESSION_STATE), *args], self.repo, check=False)

    def test_whitespace_paths_and_symlink_newlines_survive_the_round_trip(self):
        for name in ("trailing ", " lead", "tab\tname"):
            (self.repo / name).write_text("x\n")
        os.symlink("target\n", self.repo / "link")
        snapshot = self.state("snapshot").stdout.strip()
        self.assertEqual(self.state("compare", snapshot).stdout.splitlines()[1:], [])
        os.remove(self.repo / "link")
        os.symlink("target", self.repo / "link")
        (self.repo / "trailing ").write_text("y\n")
        self.assertEqual(self.state("compare", snapshot).stdout.splitlines()[1:], ["modified link", "modified trailing "])

    def test_nested_repository_fails_closed(self):
        (self.repo / "app.ts").write_text("x\n")
        snapshot = self.state("snapshot").stdout.strip()
        run(["git", "init", "-q", "vendor/pay"], self.repo)
        (self.repo / "vendor/pay/charge.ts").write_text("charge(req.body.amount)\n")
        nested = self.state("compare", snapshot)
        self.assertEqual((nested.returncode, nested.stdout), (1, ""))
        self.assertIn("vendor/pay", nested.stderr)



class ConfiguredGitCommandsNeverRun(unittest.TestCase):
    """A repository whose config names filter, textconv, fsmonitor, pager, signing, and hook commands."""

    def test_snapshot_and_compare_run_none_of_them(self):
        repo = Path(tempfile.mkdtemp())
        run(["git", "init", "-q"], repo)
        run(["git", "commit", "-q", "--allow-empty", "-m", "start"], repo)
        (repo / ".gitattributes").write_text("*.ts filter=smoke diff=smoke\n")
        (repo / "payment.ts").write_text("pay()\n")
        for key, value in (("filter.smoke.clean", "touch ran-clean; cat"), ("filter.smoke.smudge", "touch ran-smudge; cat"),
                           ("diff.smoke.textconv", "touch ran-textconv; cat"), ("core.fsmonitor", "touch ran-fsmonitor; false"),
                           ("core.pager", "touch ran-pager; cat"), ("commit.gpgSign", "true"),
                           ("gpg.program", "touch ran-gpg; false"), ("diff.external", "touch ran-external")):
            run(["git", "config", key, value], repo)
        hooks = repo / ".git" / "smoke-hooks"
        hooks.mkdir()
        for hook in ("post-index-change", "reference-transaction", "post-commit"):
            (hooks / hook).write_text(f"#!/bin/sh\ntouch ran-hook-{hook}\n")
            (hooks / hook).chmod(0o755)
        run(["git", "config", "core.hooksPath", str(hooks)], repo)
        snapshot = run([str(SESSION_STATE), "snapshot"], repo).stdout.strip()
        (repo / "payment.ts").write_text("pay(amount)\n")
        out = run([str(SESSION_STATE), "compare", snapshot], repo).stdout.splitlines()
        self.assertEqual(out[1:], ["modified payment.ts"])
        self.assertEqual(run(["git", "cat-file", "blob", f"{snapshot}:payment.ts"], repo).stdout, "pay()\n")
        self.assertEqual(sorted(p.name for p in repo.iterdir() if p.name.startswith("ran-")), [])
        run(["git", "hash-object", "payment.ts"], repo)
        run(["git", "add", "payment.ts"], repo)
        self.assertEqual(sorted(p.name for p in repo.iterdir() if p.name.startswith("ran-")), ["ran-clean", "ran-fsmonitor", "ran-hook-post-index-change"])


if __name__ == "__main__":
    unittest.main()
