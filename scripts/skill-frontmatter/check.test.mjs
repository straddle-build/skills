import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { checkSkill } from './check.mjs';

const here = import.meta.dirname;

test('accepts quoted, block and plain descriptions', () => {
  assert.deepEqual(checkSkill('---\nname: a\ndescription: "Use it: always."\n---\n# A\n'), []);
  assert.deepEqual(checkSkill('---\nname: a\ndescription: >-\n  Use it: always.\nmetadata:\n  version: 0.1.0\n---\n'), []);
  assert.deepEqual(checkSkill('---\nname: a\ndescription: Use it always.\n---\n'), []);
});

test('rejects a plain description containing ": ", which the skills installer skips', () => {
  const [message] = checkSkill('---\nname: a\ndescription: It answers questions itself: a request belongs elsewhere.\n---\n');
  assert.match(message, /does not parse as YAML/);
});

test('rejects missing front matter, a non-mapping and missing or non-string fields', () => {
  assert.match(checkSkill('# No front matter\n')[0], /must start with front matter/);
  assert.match(checkSkill('---\n- a\n---\n')[0], /must be a YAML mapping/);
  assert.deepEqual(checkSkill('---\nname: a\n---\n'), ['description must be a non-empty string']);
  assert.deepEqual(checkSkill('---\nname: 1\ndescription: d\n---\n'), ['name must be a non-empty string']);
});

test('the CLI exits nonzero and names the file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'skill-frontmatter-'));
  try {
    const path = join(dir, 'SKILL.md');
    writeFileSync(path, '---\nname: a\ndescription: x: y\n---\n');
    const run = spawnSync(process.execPath, [join(here, 'check.mjs'), path], { encoding: 'utf8' });
    assert.equal(run.status, 1);
    assert.match(run.stderr, /SKILL\.md: front matter does not parse as YAML/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('every skill in this repository parses', () => {
  const run = spawnSync(process.execPath, [join(here, 'check.mjs')], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
});
