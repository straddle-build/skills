import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';

const here = import.meta.dirname;

function runCheck(...paths) {
  return spawnSync(process.execPath, [join(here, 'check.mjs'), ...paths], { encoding: 'utf8' });
}

function writeFile(path, contents) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
}

test('the CLI accepts quoted, block and plain descriptions', () => {
  const dir = mkdtempSync(join(tmpdir(), 'skill-frontmatter-'));
  try {
    const paths = [
      ['quoted', '---\nname: a\ndescription: "Use it: always."\n---\n# A\n'],
      ['block', '---\nname: a\ndescription: >-\n  Use it: always.\nmetadata:\n  version: 0.1.0\n---\n'],
      ['plain', '---\nname: a\ndescription: Use it always.\n---\n'],
    ].map(([name, contents]) => {
      const path = join(dir, `${name}.md`);
      writeFile(path, contents);
      return path;
    });
    const run = runCheck(...paths);
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /3 skill front matter blocks parse/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the CLI rejects malformed and incomplete front matter', () => {
  const dir = mkdtempSync(join(tmpdir(), 'skill-frontmatter-'));
  try {
    const paths = [
      ['colon', '---\nname: a\ndescription: x: y\n---\n'],
      ['missing', '# No front matter\n'],
      ['list', '---\n- a\n---\n'],
      ['description', '---\nname: a\n---\n'],
      ['name', '---\nname: 1\ndescription: d\n---\n'],
    ].map(([name, contents]) => {
      const path = join(dir, `${name}.md`);
      writeFile(path, contents);
      return path;
    });
    const run = runCheck(...paths);
    assert.equal(run.status, 1);
    assert.match(run.stderr, /colon\.md: front matter does not parse as YAML/);
    assert.match(run.stderr, /missing\.md: SKILL\.md must start with front matter/);
    assert.match(run.stderr, /list\.md: front matter must be a YAML mapping/);
    assert.match(run.stderr, /description\.md: description must be a non-empty string/);
    assert.match(run.stderr, /name\.md: name must be a non-empty string/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the CLI finds nested skills in every installer container but skips excluded descendants', () => {
  const dir = mkdtempSync(join(tmpdir(), 'skill-frontmatter-'));
  try {
    const script = join(dir, 'scripts', 'skill-frontmatter', 'check.mjs');
    mkdirSync(dirname(script), { recursive: true });
    copyFileSync(join(here, 'check.mjs'), script);
    symlinkSync(join(here, 'node_modules'), join(dirname(script), 'node_modules'), 'dir');
    writeFile(join(dir, 'skills', 'payments', 'ach', 'SKILL.md'), '---\nname: ach\ndescription: x: y\n---\n');
    const nestedContainers = ['.curated', '.experimental', '.system'];
    for (const name of nestedContainers) {
      writeFile(join(dir, 'skills', name, 'payments', 'ach', 'debit', 'SKILL.md'),
                '---\nname: debit\ndescription: x: y\n---\n');
    }
    const skipped = ['node_modules', '.git', 'dist', 'build', '__pycache__'];
    for (const name of skipped) {
      writeFile(join(dir, 'skills', name, 'ignored', 'SKILL.md'), '---\nname: ignored\ndescription: x: y\n---\n');
    }
    const run = spawnSync(process.execPath, [script], { encoding: 'utf8' });
    assert.equal(run.status, 1);
    assert.match(run.stderr, /skills\/payments\/ach\/SKILL\.md: front matter does not parse as YAML/);
    for (const name of nestedContainers) {
      assert.ok(run.stderr.includes(`skills/${name}/payments/ach/debit/SKILL.md: front matter does not parse as YAML`));
    }
    for (const name of skipped) assert.ok(!run.stderr.includes(`skills/${name}/ignored`));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('every skill in this repository parses', () => {
  const run = runCheck();
  assert.equal(run.status, 0, run.stderr);
});
