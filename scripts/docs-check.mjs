#!/usr/bin/env node
// Docs consistency checks — run via `node scripts/docs-check.mjs`.
// 1. Markdown link targets and `#anchors` resolve (explicit <a id> or heading slug).
// 2. Root playbooks carry the required front-matter keys.
// 3. Every root playbook is listed in the README index.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = process.cwd();
const INDEX = 'README.md';
const REQUIRED_FRONTMATTER = ['audience', 'read-when', 'canonical-for', 'updated'];
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build']);
const errors = [];

const files = [];
(function walk(dir) {
  for (const entry of readdirSync(join(root, dir))) {
    if (SKIP_DIRS.has(entry)) continue;
    const rel = dir === '.' ? entry : `${dir}/${entry}`;
    if (statSync(join(root, rel)).isDirectory()) {
      walk(rel);
    } else if (entry.endsWith('.md')) {
      files.push(rel.replace(/\\/g, '/'));
    }
  }
})('.');

const read = (rel) => readFileSync(join(root, rel), 'utf8');

const anchorCache = new Map();
function anchorsIn(rel) {
  if (anchorCache.has(rel)) {
    return anchorCache.get(rel);
  }
  const text = read(rel);
  const set = new Set([...text.matchAll(/<a id="([^"]+)"/g)].map((match) => match[1]));
  for (const line of text.split('\n')) {
    const heading = /^#{1,6}\s+(.+?)\s*$/.exec(line);
    if (heading) {
      set.add(
        heading[1]
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .trim()
          .replace(/\s/g, '-'),
      );
    }
  }
  anchorCache.set(rel, set);
  return set;
}

for (const file of files) {
  const text = read(file);
  for (const match of text.matchAll(/\]\(([^)\s#]+\.md)(?:#([^)\s]+))?\)/g)) {
    const base = dirname(file) === '.' ? '' : dirname(file);
    const target = join(base, match[1]).replace(/\\/g, '/');
    if (!existsSync(join(root, target))) {
      errors.push(`${file} — missing link target ${target}`);
    } else if (match[2] && !anchorsIn(target).has(match[2])) {
      errors.push(`${file} — missing anchor #${match[2]} in ${target}`);
    }
  }
}

const playbooks = files.filter((file) => !file.includes('/') && file !== INDEX);
for (const file of playbooks) {
  const front = /^---\n([\s\S]*?)\n---/.exec(read(file));
  if (!front) {
    errors.push(`${file} — missing front-matter block`);
    continue;
  }
  for (const key of REQUIRED_FRONTMATTER) {
    if (!new RegExp(`^${key}:`, 'm').test(front[1])) {
      errors.push(`${file} — front-matter missing "${key}"`);
    }
  }
}

const indexText = read(INDEX);
const linked = new Set(
  [...indexText.matchAll(/\]\(([^)\s#]+\.md)\)/g)].map((match) => match[1].replace(/\\/g, '/')),
);
for (const file of playbooks) {
  if (!linked.has(file)) {
    errors.push(`${INDEX} — ${file} is not listed in the index`);
  }
}

if (errors.length > 0) {
  console.error(`docs-check failed (${errors.length}):`);
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}
console.log(`docs-check passed (${files.length} markdown files, ${playbooks.length} playbooks)`);
