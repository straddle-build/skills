#!/usr/bin/env node
// Parse every skill's SKILL.md front matter the way `npx skills add` does, and fail on any skill it would skip.
// The skills installer (vercel-labs/skills) splits front matter with the expression below, parses it with the
// `yaml` package, and silently drops a skill whose front matter doesn't parse or lacks a string name and
// description (EG-1010). scripts/validate-package parses a YAML subset and can't see those errors.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { parse } from 'yaml';

const FRONTMATTER = /^﻿?---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export function checkSkill(text) {
  const match = text.match(FRONTMATTER);
  if (!match) return ['SKILL.md must start with front matter between --- lines'];
  let data;
  try {
    data = parse(match[1]);
  } catch (error) {
    return [`front matter does not parse as YAML: ${error.message.split('\n')[0]}`];
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return ['front matter must be a YAML mapping'];
  return ['name', 'description']
    .filter((key) => typeof data[key] !== 'string' || !data[key])
    .map((key) => `${key} must be a non-empty string`);
}

export function skillFiles(root) {
  const skills = join(root, 'skills');
  return readdirSync(skills)
    .map((name) => join(skills, name, 'SKILL.md'))
    .filter((path) => statSync(path, { throwIfNoEntry: false })?.isFile())
    .sort();
}

if (import.meta.main) {
  const root = resolve(import.meta.dirname, '..', '..');
  const paths = process.argv.length > 2 ? process.argv.slice(2).map((path) => resolve(path)) : skillFiles(root);
  let failed = 0;
  for (const path of paths) {
    for (const message of checkSkill(readFileSync(path, 'utf8'))) {
      console.error(`${relative(root, path)}: ${message}`);
      failed += 1;
    }
  }
  if (failed) process.exit(1);
  console.log(`${paths.length} skill front matter blocks parse`);
}
