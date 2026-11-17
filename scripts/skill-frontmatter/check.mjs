#!/usr/bin/env node
import { readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'yaml';

const FRONTMATTER = /^﻿?---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '__pycache__']);
const SKILL_CONTAINERS = ['skills', 'skills/.curated', 'skills/.experimental', 'skills/.system'];
const MAX_CONTAINER_DEPTH = 3;

function checkSkill(text) {
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

function skillFiles(root) {
  const paths = new Set();
  const walk = (dir, depth = 1) => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const child = join(dir, entry.name);
      const skill = join(child, 'SKILL.md');
      if (statSync(skill, { throwIfNoEntry: false })?.isFile()) {
        paths.add(skill);
      } else if (depth < MAX_CONTAINER_DEPTH && !SKIP_DIRS.has(entry.name)) {
        walk(child, depth + 1);
      }
    }
  };
  for (const container of SKILL_CONTAINERS) walk(join(root, container));
  return [...paths].sort();
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
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
