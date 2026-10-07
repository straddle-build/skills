// For each NUL-terminated path on standard input, prints 1 when a pattern in the file named by the first argument
// matches the path or one of its parent directories, and 0 otherwise. The patterns are the Wizard's own JavaScript
// regular expressions for the developer's `--exclude` globs, and paths decode from UTF-8 as the Wizard's discovery
// reads names, so the snapshot excludes exactly what discovery excludes.
import { readFileSync } from 'node:fs';

const patterns = readFileSync(process.argv[2], 'utf8').split('\n').filter(Boolean).map((source) => new RegExp(source));
const input = readFileSync(0);
const flags = [];
for (let start = 0; start < input.length;) {
  const end = input.indexOf(0, start);
  if (end < 0) throw new Error('a path is missing its NUL terminator');
  const parts = input.subarray(start, end).toString('utf8').split('/');
  const prefixes = parts.map((_, i) => parts.slice(0, i + 1).join('/'));
  flags.push(prefixes.some((p) => patterns.some((re) => re.test(p))) ? '1' : '0');
  start = end + 1;
}
process.stdout.write(flags.join(''));
