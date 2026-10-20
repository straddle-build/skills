import http.server
import json
import shutil
import subprocess
import sys
import tempfile
import threading
import unittest
from importlib.machinery import SourceFileLoader
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SCRIPT = REPO / "scripts" / "validate-package"
FIXTURES = REPO / "tests" / "fixtures" / "policy"
# Stored as <skill-name>.md, not SKILL.md, so recursive skill installers never list them as skills.
SKILL_FIXTURES = REPO / "tests" / "fixtures" / "skill-frontmatter"
validator = SourceFileLoader("validate_package", str(SCRIPT)).load_module()

PACKAGE_FILES = ("plugin.json", "mcp.json", ".claude-plugin", ".codex-plugin", ".cursor-plugin", "assets")
KNOWN_GATES = [(f"skills/{skill}", "skill", "required skill is missing")
               for skill in sorted(validator.REQUIRED_SKILLS)]


def offline(url):
    raise AssertionError(f"unexpected network request to {url}")


def lint(path, **kwargs):
    kwargs.setdefault("remote", offline)
    return sorted((d.line, d.rule) for d in validator.lint_file(path, path.name, **kwargs))


def run_cli(*args, cwd=REPO):
    result = subprocess.run([sys.executable, str(SCRIPT), *args], cwd=cwd, capture_output=True, text=True)
    return result.returncode, result.stdout.splitlines()


def materialize_skill(test, stored):
    """Copy a stored fixture to <temp>/<skill-name>/SKILL.md and return (temp root, SKILL.md path)."""
    root = Path(tempfile.mkdtemp())
    test.addCleanup(shutil.rmtree, root)
    skill = root / Path(stored).stem / "SKILL.md"
    skill.parent.mkdir()
    shutil.copy(SKILL_FIXTURES / stored, skill)
    return root, skill


class PolicyLintTest(unittest.TestCase):
    def test_positive_fixtures_pass(self):
        for path in sorted((FIXTURES / "pass").rglob("*.md")):
            with self.subTest(path=path.name):
                self.assertEqual(lint(path), [])

    def test_negative_fixtures_report_rule_and_line(self):
        expected = {
            "resource-polling.md": [(3, "resource-polling"), (7, "resource-polling"), (16, "resource-polling"),
                                    (20, "resource-polling"), (23, "resource-polling"), (26, "resource-polling"),
                                    (29, "resource-polling"), (31, "resource-polling"), (33, "resource-polling")],
            "excluded-operations.md": [(3, "excluded-operation"), (5, "excluded-operation"),
                                       (10, "excluded-operation"), (16, "excluded-operation")],
            "cross-rule-framing.md": [(5, "credentials"), (10, "credentials"), (16, "credentials"), (19, "credentials"),
                                      (23, "credentials")],
            "credentials.md": [(3, "credentials"), (5, "credentials"), (7, "credentials"), (10, "credentials"),
                               (14, "credentials"), (15, "credentials"),
                               (19, "credentials"), (20, "credentials")],
            "links.md": [(3, "links"), (3, "links"), (5, "links")],
            "negative-framing-ends.md": [(9, "resource-polling")],
            "table-rows.md": [(5, "resource-polling"), (6, "excluded-operation")],
        }
        actual = {path.name: lint(path) for path in (FIXTURES / "fail").rglob("*.md")}
        self.assertEqual(actual, expected)

    def test_cli_exits_nonzero_on_negative_fixtures_and_zero_on_positive(self):
        code, lines = run_cli("--offline", str(FIXTURES / "fail" / "resource-polling.md"))
        self.assertEqual(code, 1)
        self.assertIn("tests/fixtures/policy/fail/resource-polling.md:7: resource-polling: code repeatedly reads an "
                      "ordinary API resource with a delay; use a webhook, FIFO or polling endpoint for status changes",
                      lines)
        code, lines = run_cli("--offline", *map(str, sorted((FIXTURES / "pass").rglob("*.md"))))
        self.assertEqual((code, lines), (0, []))

    def test_skill_frontmatter_is_checked_on_materialized_skill_files(self):
        _, valid = materialize_skill(self, "straddle-example.md")
        self.assertEqual(lint(valid), [])
        self.assertEqual(run_cli("--offline", str(valid)), (0, []))
        root, invalid = materialize_skill(self, "straddle-mismatch.md")
        found = validator.lint_file(invalid, "straddle-mismatch/SKILL.md", remote=offline)
        self.assertEqual(sorted((d.path, d.line, d.rule) for d in found),
                         [("straddle-mismatch/SKILL.md", 1, "frontmatter")] * 2)
        code, lines = run_cli("--offline", str(invalid), cwd=root)
        self.assertEqual(code, 1)
        self.assertEqual([line.split(": ")[:2] for line in lines],
                         [["straddle-mismatch/SKILL.md:1", "frontmatter"]] * 2)

    def test_webhook_guidance_passes_the_policy_lint(self):
        guide = REPO / "skills" / "straddle-best-practices" / "references" / "receiving-webhooks.md"
        self.assertEqual(lint(guide, remote=lambda url: 200), [])

    def test_remote_links_must_return_200_after_redirects(self):
        class Handler(http.server.BaseHTTPRequestHandler):
            def do_HEAD(self):
                self.handle_request(head=True)

            def do_GET(self):
                self.handle_request(head=False)

            def handle_request(self, head):
                routes = {"/ok": (200, None), "/moved": (301, "/ok"), "/missing": (404, None),
                          "/head-refused": (405 if head else 200, None)}
                status, location = routes.get(self.path, (404, None))
                self.send_response(status)
                if location:
                    self.send_header("Location", location)
                self.end_headers()

            def log_message(self, *args):
                pass

        server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        self.addCleanup(server.server_close)
        self.addCleanup(server.shutdown)
        base = f"http://127.0.0.1:{server.server_port}"
        with tempfile.TemporaryDirectory() as tmp:
            page = Path(tmp) / "links.md"
            page.write_text(f"# Links\n\n[ok]({base}/ok) and [moved]({base}/moved).\n\n"
                            f"[missing]({base}/missing) and [refused head]({base}/head-refused).\n")
            found = validator.lint_file(page, "links.md", checked_hosts=("127.0.0.1",), allowlist=(),
                                        remote=validator.fetch_status)
        self.assertEqual([(d.path, d.line, d.rule) for d in found],
                         [("links.md", 5, "links")])


class PackageTest(unittest.TestCase):
    def setUp(self):
        self.remote = lambda url: 200
        self.root = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.root)
        for name in PACKAGE_FILES:
            source = REPO / name
            (shutil.copytree if source.is_dir() else shutil.copy)(source, self.root / name)

    def check(self):
        package = validator.Package(self.root, self.remote)
        package.check()
        return sorted((d.path, d.rule, d.message) for d in package.diagnostics)

    def edit_json(self, rel, change):
        path = self.root / rel
        value = json.loads(path.read_text())
        change(value)
        path.write_text(json.dumps(value))

    def new_gates(self):
        return [d for d in self.check() if d not in KNOWN_GATES]

    def test_committed_package_reports_only_known_gates(self):
        self.assertEqual(self.check(), sorted(KNOWN_GATES))

    def test_every_client_route_must_send_the_api_key(self):
        self.edit_json("mcp.json", lambda v: v["mcpServers"]["straddle-api"].pop("headers"))
        self.edit_json(".codex-plugin/plugin.json", lambda v: v["mcpServers"]["straddle-api"].pop("bearer_token_env_var"))
        self.edit_json("plugin.json", lambda v: v.update({"$schema": validator.AGENT_PLUGIN_SCHEMA}))
        self.assertEqual([(path, rule) for path, rule, _ in self.new_gates()], [
            (".codex-plugin/plugin.json", "package"),
            ("mcp.json", "mcp"),
            ("plugin.json", "codex"),
        ])

    def test_invalid_plugin_name_and_version_drift(self):
        self.edit_json("plugin.json", lambda v: v.update(name="Straddle_Kit", version="0.1.0"))
        for rel in (".claude-plugin/plugin.json", ".codex-plugin/plugin.json"):
            self.edit_json(rel, lambda v: v.update(version="0.1.0"))
        self.edit_json(".claude-plugin/marketplace.json", lambda v: v["metadata"].update(version="0.1.0"))
        self.edit_json(".claude-plugin/marketplace.json", lambda v: v["plugins"][0].update(version="0.1.0"))
        self.edit_json(".cursor-plugin/plugin.json", lambda v: v.update(name="Straddle_Kit", version="0.2.0"))
        self.assertEqual(self.new_gates(), [
            (".claude-plugin/marketplace.json", "package", "must list plugin 'Straddle_Kit' exactly once"),
            (".claude-plugin/plugin.json", "package", "name must match plugin.json name 'Straddle_Kit'"),
            (".codex-plugin/plugin.json", "package", "name must match plugin.json name 'Straddle_Kit'"),
            (".cursor-plugin/plugin.json", "version", "version must match plugin.json version '0.1.0'"),
            ("plugin.json", "agent-plugins",
             "$.name does not match ^(?!.*(?:--|\\.\\.))[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$"),
        ])

    def test_skills_install_commands_must_pin_the_plugin_release_tag(self):
        version = json.loads((self.root / "plugin.json").read_text())["version"]
        (self.root / "docs").mkdir()
        (self.root / "README.md").write_text(f"npx skills add straddle-build/skills#v{version} --skill '*'\n"
                                             "npx skills add straddle-build/skills --list\n")
        (self.root / "docs" / "install.md").write_text("Run `npx skills add straddle-build/skills#main`.\n")
        self.assertEqual(sorted((path, rule) for path, rule, _ in self.new_gates()), [
            ("README.md", "version"),
            ("docs/install.md", "version"),
        ])
        self.assertIn(("docs/install.md", "version", f"skills install source must be straddle-build/skills#v{version}, "
                       "the plugin.json release tag; found #main"), self.check())

    def test_codex_legal_urls_are_required_and_must_resolve(self):
        privacy = "https://legal.straddle.com/legal/legal/privacy-policy"
        self.remote = lambda url: 404 if url == privacy else 200
        self.assertEqual(self.new_gates(), [(".codex-plugin/plugin.json", "links",
                                             f"interface.privacyPolicyURL {privacy} returned 404, expected 200")])
        self.edit_json(".codex-plugin/plugin.json", lambda v: v["interface"].pop("termsOfServiceURL"))
        self.assertIn((".codex-plugin/plugin.json", "codex", "interface.termsOfServiceURL is required"), self.check())

    def test_codex_icon_must_be_square_png(self):
        shutil.copy(REPO / "assets" / "logo.png", self.root / "assets" / "wide.png")
        data = bytearray((self.root / "assets" / "wide.png").read_bytes())
        data[16:20] = (1024).to_bytes(4, "big")
        (self.root / "assets" / "wide.png").write_bytes(bytes(data))
        self.edit_json(".codex-plugin/plugin.json", lambda v: v["interface"].update(composerIcon="./assets/wide.png"))
        self.assertEqual(self.new_gates(), [(".codex-plugin/plugin.json", "asset",
                                             "interface.composerIcon file ./assets/wide.png must be square, found "
                                             "1024x512")])

    def test_eval_cases_are_discovered_per_skill(self):
        skill = self.root / "skills" / "straddle-setup"
        skill.mkdir(parents=True)
        (skill / "SKILL.md").write_text("---\nname: straddle-setup\ndescription: d\nmetadata:\n  version: 0.1.0\n---\n")
        self.assertIn(("skills/straddle-setup", "eval", "no eval case named straddle-setup-* under evals/"),
                      self.check())
        case = self.root / "evals" / "straddle-setup-reports-missing-key"
        (case / "mocks" / "straddle-admin").mkdir(parents=True)
        (case / "prompt.md").write_text("Check my Straddle setup.\n")
        (case / "mocks" / "straddle-admin" / "tool.md").write_text("ok\n")
        (self.root / "evals" / "mocks" / "straddle-api").mkdir(parents=True)
        self.assertEqual([d for d in self.new_gates() if d[0] != "skills/straddle-setup" or d[1] != "skill"], [
            ("evals/straddle-setup-reports-missing-key", "eval", "case has no graders/*.md"),
            ("evals/straddle-setup-reports-missing-key/mocks/straddle-admin", "eval",
             "mock server must be one of ['straddle-api', 'straddle-docs']"),
        ])

    def test_skill_that_adds_charge_polling_fails_with_file_and_line(self):
        shutil.copytree(REPO / "scripts", self.root / "scripts")
        skill = self.root / "skills" / "straddle-setup"
        skill.mkdir(parents=True)
        (skill / "SKILL.md").write_text(
            "---\nname: straddle-setup\ndescription: Check setup.\nmetadata:\n  version: 0.1.0\n---\n\n# Setup\n\n"
            "```ts\nfor (;;) {\n  const charge = await client.charges.get(id);\n  await sleep(2000);\n}\n```\n")
        code, lines = run_cli("--offline", cwd=self.root)
        self.assertEqual(code, 1)
        self.assertIn("skills/straddle-setup/SKILL.md:12: resource-polling: code repeatedly reads an ordinary API "
                      "resource with a delay; use a webhook, FIFO or polling endpoint for status changes", lines)


if __name__ == "__main__":
    unittest.main()
