#!/usr/bin/env bun
/** Compare hand-written skill references and kit SDK pins with published contracts. */
import { readFile, readdir } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { parseArgs } from "node:util";

export const ROOT = resolve(import.meta.dir, "..");
const APPROVAL = "skills/straddle-best-practices/references/writes-and-approval.md";
const METHODS = new Set(["get", "post", "put", "patch", "delete", "head", "options", "trace"]);
const WRITES = new Set(["post", "put", "patch", "delete"]);
const REGISTRY = "https://registry.scalar.com/@straddle/apis/straddle-api";
// This syntax is shared by paths in prose, tables, code fences and inline examples.
const PATH = /(?<![\w/])(?:(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|TRACE)\s+)?(\/v1\/[A-Za-z0-9_/{\}.~-]+)(?:\?([^\s`"')|]+))?/g;
const SPAN = /`([A-Za-z][A-Za-z0-9_.-]*)(?::[^`\n]*)?`/g;

type Spec = Record<string, any>;
type Source = { file: string; text: string };
type Problem = { file: string; line: number; message: string };

export async function download(url: string): Promise<string> {
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
}

export function parseSpec(text: string): Spec {
  const spec = Bun.YAML.parse(text) as Spec;
  if (!spec?.openapi?.startsWith("3.") || !Object.keys(spec.paths ?? {}).length)
    throw new Error("expected an OpenAPI 3 document with paths");
  return spec;
}

function deref(spec: Spec, value: any): any {
  const visited = new Set<string>();
  while (value?.$ref) {
    const ref = value.$ref;
    if (!ref.startsWith("#/") || visited.has(ref)) throw new Error(`unsupported or cyclic reference: ${ref}`);
    visited.add(ref);
    value = ref.slice(2).split("/").reduce((obj: any, key: string) => obj?.[key.replaceAll("~1", "/").replaceAll("~0", "~")], spec);
    if (!value) throw new Error(`unresolved reference: ${ref}`);
  }
  return value;
}

function operations(spec: Spec) {
  const result = new Map<string, any>();
  for (const [path, raw] of Object.entries(spec.paths)) {
    const item = deref(spec, raw);
    for (const [method, rawOp] of Object.entries(item)) {
      if (!METHODS.has(method)) continue;
      const op = deref(spec, rawOp);
      result.set(`${method.toUpperCase()} ${path}`, { ...op, parameters: [...(item.parameters ?? []), ...(op.parameters ?? [])] });
    }
  }
  return result;
}

function fields(spec: Spec): Set<string> {
  const names = new Set<string>();
  function visit(node: any) {
    if (!node || typeof node !== "object") return;
    for (const name of Object.keys(node.properties ?? {})) names.add(name);
    for (const child of Object.values(node)) visit(child);
  }
  visit(spec);
  return names;
}

function parameters(spec: Spec, ops: Map<string, any>) {
  const names = new Set<string>();
  for (const op of ops.values()) for (const param of op.parameters) names.add(deref(spec, param).name);
  return names;
}

export function checkReferences(spec: Spec, baseline: Spec, sources: Source[]): Problem[] {
  const problems: Problem[] = [];
  const ops = operations(spec), oldOps = operations(baseline);
  const oldParameters = parameters(baseline, oldOps), currentParameters = parameters(spec, ops);
  const oldFields = fields(baseline), currentFields = fields(spec);
  const oldNames = new Set([...oldParameters, ...oldFields]);
  const approval = sources.find(source => source.file === APPROVAL);
  if (!approval) throw new Error(`missing approval list: ${APPROVAL}`);
  const listed = new Set<string>();
  let tableLine = 1;
  for (const [index, line] of approval.text.split("\n").entries()) {
    if (/\| Operation ID \| Request \|/.test(line)) tableLine = index + 1;
    // Only table rows are approval entries, never a passing mention in prose.
    const row = line.match(/^\|\s*`([^`]+)`\s*\|\s*`([A-Z]+) (\/[^`]+)`\s*\|/);
    if (!row) continue;
    const key = `${row[2]} ${row[3]}`;
    listed.add(key);
    const op = ops.get(key);
    if (!op) problems.push({ file: APPROVAL, line: index + 1, message: `remove or correct approval entry: ${key} is absent from the spec` });
    else if (op.operationId !== row[1]) problems.push({ file: APPROVAL, line: index + 1, message: `update operation ID for ${key}: ${row[1]} -> ${op.operationId}` });
  }
  if (!listed.size) throw new Error(`${APPROVAL}: no approval table entries found`);
  for (const [key, op] of ops) {
    const method = key.split(" ")[0].toLowerCase();
    if ((WRITES.has(method) || /unmask|reveal/i.test(`${key} ${op.operationId ?? ""}`)) && !listed.has(key))
      problems.push({ file: APPROVAL, line: tableLine, message: `add approval entry: ${key} (${op.operationId ?? "no operationId"})` });
  }
  for (const source of sources) for (const [index, line] of source.text.split("\n").entries()) {
    const report = (message: string) => problems.push({ file: source.file, line: index + 1, message });
    for (const match of line.matchAll(PATH)) {
      const [, method, path, query] = match;
      const candidates = [...ops].filter(([key]) => key.endsWith(` ${path}`) && (!method || key.startsWith(`${method} `)));
      if (!candidates.length) { report(`update API reference: ${method ? method + " " : ""}${path} is absent from the spec`); continue; }
      // Placeholders and explicit query strings are checked against this operation,
      // rather than accepting a similarly named parameter on an unrelated route.
      for (const param of path.matchAll(/\{([^}]+)\}/g)) {
        if (!candidates.some(([, op]) => op.parameters.some((p: any) => { p = deref(spec, p); return p.in === "path" && p.name === param[1]; })))
          report(`update path parameter ${param[1]} on ${path}`);
      }
      for (const name of new URLSearchParams(query ?? "").keys()) {
        if (!candidates.some(([, op]) => op.parameters.some((p: any) => { p = deref(spec, p); return p.in === "query" && p.name === name; })))
          report(`update query parameter ${name} on ${method ? method + " " : ""}${path}`);
      }
    }
    // A pinned published baseline classifies bare parameter names in prose. Using
    // only today's spec would silently stop checking a name as soon as it vanished.
    for (const [, token] of line.matchAll(SPAN)) {
      const parts = token.split(".");
      if (parts.every(part => oldNames.has(part)) && parts.some(part => oldParameters.has(part) ? !currentParameters.has(part) : !currentFields.has(part)))
        report(`update API parameter/field reference: ${token} is absent from the spec`);
    }
  }
  return problems.filter((p, i, all) => all.findIndex(other => JSON.stringify(other) === JSON.stringify(p)) === i);
}

export function compareVersions(a: string, b: string): number {
  const parse = (v: string) => {
    const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-([^+]+))?(?:\+.*)?$/.exec(v);
    if (!match) throw new Error(`unsupported SDK version: ${v}`);
    return { numbers: match.slice(1, 4).map(Number), pre: match[4] };
  };
  const x = parse(a), y = parse(b);
  for (let i = 0; i < 3; i++) if (x.numbers[i] !== y.numbers[i]) return Math.sign(x.numbers[i] - y.numbers[i]);
  if (x.pre === y.pre) return 0;
  if (!x.pre) return 1;
  if (!y.pre) return -1;
  const left = x.pre.split("."), right = y.pre.split(".");
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    if (left[i] === right[i]) continue;
    if (left[i] === undefined) return -1;
    if (right[i] === undefined) return 1;
    const ln = /^\d+$/.test(left[i]), rn = /^\d+$/.test(right[i]);
    if (ln && rn) return Math.sign(Number(left[i]) - Number(right[i]));
    if (ln !== rn) return ln ? -1 : 1;
    return left[i] < right[i] ? -1 : 1;
  }
  return 0;
}

export const SDK_SOURCES: Record<string, { url: string; version: (data: any) => string }> = {
  typescript: { url: "https://registry.npmjs.org/@straddlecom/straddle/latest", version: d => d.version },
  python: { url: "https://pypi.org/pypi/straddle/json", version: d => d.info.version },
  ruby: { url: "https://rubygems.org/api/v1/versions/straddle/latest.json", version: d => d.version },
  dotnet: { url: "https://api.nuget.org/v3-flatcontainer/straddle/index.json", version: d => d.versions.filter((v: string) => !v.includes("-")).sort(compareVersions).at(-1) },
  go: { url: "https://proxy.golang.org/github.com/straddle-build/straddle-go/@latest", version: d => d.Version },
};

async function skillFiles(dir: string): Promise<Source[]> {
  const results: Source[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) results.push(...await skillFiles(path));
    else if (entry.isFile()) results.push({ file: relative(ROOT, path), text: await readFile(path, "utf8") });
  }
  return results.sort((a, b) => a.file.localeCompare(b.file));
}

export async function checkSDKs(sources: Source[], pins: Spec, fetchText = download): Promise<Problem[]> {
  const results = await Promise.all(Object.keys(pins).map(async language => {
    const source = SDK_SOURCES[language];
    if (!source) throw new Error(`no SDK registry configured for ${language}`);
    const locations: { file: string; line: number; version: string }[] = [];
    for (const file of sources) {
      let inSDK = false, inLanguage = false;
      for (const [index, line] of file.text.split("\n").entries()) {
        if (file.file === "kit/release-inputs.json") {
          if (/^  "sdks":/.test(line)) inSDK = true;
          else if (/^  "\w+":/.test(line)) inSDK = false;
          if (inSDK && /^    "\w+":/.test(line)) inLanguage = line.includes(`"${language}"`);
          if (!inSDK || !inLanguage || !/"(?:minimum_)?version":/.test(line)) continue;
        } else if (file.file === "kit/manifest.yaml") {
          if (/^sdks:/.test(line)) inSDK = true;
          else if (/^[a-z_]+:/.test(line)) inSDK = false;
          if (inSDK && /^  [a-z]+:/.test(line)) inLanguage = line.trim() === `${language}:`;
          if (!inSDK || !inLanguage || !/^    (?:minimum_)?version:/.test(line)) continue;
        } else {
          const label = ({ typescript: "TypeScript", python: "Python", ruby: "Ruby", dotnet: "C#", go: "Go" } as any)[language];
          // Version tables are pins; historical source observations are evidence.
          if (!line.startsWith(`| ${label} SDK |`)) continue;
        }
        for (const match of line.matchAll(/\bv?\d+\.\d+\.\d+(?:-[\w.-]+)?\b/g)) locations.push({ file: file.file, line: index + 1, version: match[0] });
      }
    }
    if (!locations.length) throw new Error(`no pin references found for ${language}`);
    try {
      const latest = source.version(JSON.parse(await fetchText(source.url)));
      compareVersions(latest, latest); // reject malformed/missing registry responses
      return locations.filter(loc => compareVersions(loc.version, latest) < 0).map(loc => ({ file: loc.file, line: loc.line, message: `update ${language} SDK pin ${loc.version} -> ${latest} (${source.url})` }));
    } catch (error) {
      return locations.map(loc => ({ file: loc.file, line: loc.line, message: `cannot verify ${language} SDK pin: ${String(error)}` }));
    }
  }));
  return results.flat();
}

async function main() {
  const { values } = parseArgs({ options: { spec: { type: "string" }, "baseline-spec": { type: "string" }, "contract-version": { type: "string" }, help: { type: "boolean" } } });
  if (values.help) { console.log("bun scripts/check-api-drift.ts [--contract-version X.Y.Z | --spec FILE] [--baseline-spec FILE]\nDefault: public current Scalar contract; SDK registries are always checked."); return; }
  if (values.spec && values["contract-version"]) throw new Error("choose --spec or --contract-version");
  if (values["contract-version"] && !/^\d+\.\d+\.\d+$/.test(values["contract-version"])) throw new Error("contract version must be X.Y.Z");
  const inputsText = await readFile(resolve(ROOT, "kit/release-inputs.json"), "utf8");
  const inputs = JSON.parse(inputsText);
  const url = `${REGISTRY}${values["contract-version"] ? "@" + values["contract-version"] : ""}?format=yaml`;
  const baselineURL = `${REGISTRY}@${inputs.contract.version}?format=yaml`;
  const [spec, baseline, files] = await Promise.all([
    (values.spec ? readFile(resolve(values.spec), "utf8") : download(url)).then(parseSpec),
    (values["baseline-spec"] ? readFile(resolve(values["baseline-spec"]), "utf8") : download(baselineURL)).then(parseSpec),
    skillFiles(resolve(ROOT, "skills")),
  ]);
  console.log(`API drift: ${values.spec ?? url} (info.version=${spec.info?.version}); parameter baseline: ${values["baseline-spec"] ?? baselineURL}`);
  if (values["contract-version"] && spec.info?.version !== values["contract-version"]) throw new Error("published contract info.version does not match requested version");
  const problems = checkReferences(spec, baseline, files);
  problems.push(...await checkSDKs([...files, { file: "kit/release-inputs.json", text: inputsText }, { file: "kit/manifest.yaml", text: await readFile(resolve(ROOT, "kit/manifest.yaml"), "utf8") }], inputs.sdks));
  for (const problem of problems) console.error(`${problem.file}:${problem.line}: ${problem.message}`);
  console.log(`API drift: ${problems.length} issue(s); ${files.length} skill files checked`);
  if (problems.length) process.exitCode = 1;
}

if (import.meta.main) main().catch(error => { console.error(`API drift check failed: ${error.message}`); process.exitCode = 1; });
