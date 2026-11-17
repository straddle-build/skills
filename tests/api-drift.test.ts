import { describe, expect, test } from "bun:test";
import { checkReferences, checkSDKs, compareVersions, parseSpec, SDK_SOURCES } from "../scripts/check-api-drift";

const approval = { file: "skills/straddle-best-practices/references/writes-and-approval.md", text: "| Operation ID | Request |\n| --- | --- |\n| `createThing` | `POST /v1/things` |" };
const source = (text: string) => ({ file: "skills/example/SKILL.md", text });
function spec() {
  return { openapi: "3.1.1", paths: {
    "/v1/things": { post: { operationId: "createThing" }, get: { parameters: [{ $ref: "#/components/parameters/Filter" }] } },
    "/v1/things/{id}": { parameters: [{ name: "id", in: "path" }], get: { operationId: "getThing" } },
  }, components: { parameters: { Filter: { name: "external_id", in: "query" } }, schemas: { Thing: { properties: { nickname: { type: "string" } } } } } };
}

describe("skill drift diagnostics", () => {
  test("accepts valid paths, query examples, headers and inherited path parameters", () => {
    const contract = spec();
    expect(checkReferences(contract, contract, [approval, source("`GET /v1/things?external_id=<id>`\n```\nGET /v1/things/{id}\n```\n`external_id` and `nickname`")])).toEqual([]);
  });

  test("reports every new write method and reveal/unmask read at the approval table", () => {
    const contract: any = spec();
    for (const method of ["post", "put", "patch", "delete"]) contract.paths[`/v1/new-${method}`] = { [method]: { operationId: method } };
    contract.paths["/v1/private"] = { get: { operationId: "getUnmaskedThing" } };
    contract.paths["/v1/things/reveal"] = { get: {} };
    const problems = checkReferences(contract, spec(), [approval]);
    expect(problems).toHaveLength(6);
    for (const problem of problems) expect(problem).toMatchObject({ file: approval.file, line: 1 });
    expect(problems.map(p => p.message)).toContain("add approval entry: GET /v1/private (getUnmaskedThing)");
  });

  test("reports stale approval entries and renamed operation IDs at their source lines", () => {
    const contract: any = spec();
    contract.paths["/v1/things"].post.operationId = "newCreate";
    const list = { ...approval, text: approval.text + "\n| `gone` | `DELETE /v1/gone` |" };
    expect(checkReferences(contract, spec(), [list])).toEqual([
      { file: approval.file, line: 3, message: "update operation ID for POST /v1/things: createThing -> newCreate" },
      { file: approval.file, line: 4, message: "remove or correct approval entry: DELETE /v1/gone is absent from the spec" },
      { file: approval.file, line: 4, message: "update API reference: DELETE /v1/gone is absent from the spec" },
    ]);
  });

  test("checks method-specific references, paths without methods and code fences", () => {
    const contract = spec();
    const problems = checkReferences(contract, contract, [approval, source("```\nPUT /v1/things\n```\n`/v1/gone`")]);
    expect(problems.map(p => [p.line, p.message])).toEqual([
      [2, "update API reference: PUT /v1/things is absent from the spec"],
      [4, "update API reference: /v1/gone is absent from the spec"],
    ]);
  });

  test("detects deleted parameters and fields in prose using the published baseline", () => {
    const baseline = spec(), contract = spec();
    contract.paths["/v1/things"].get.parameters = [];
    // A response field with the same name must not hide a removed query parameter.
    (contract.components.schemas.Thing.properties as any).external_id = { type: "string" };
    delete (contract.components.schemas.Thing.properties as any).nickname;
    expect(checkReferences(contract, baseline, [approval, source("`external_id`\n`nickname`")]).map(p => p.message)).toEqual([
      "update API parameter/field reference: external_id is absent from the spec",
      "update API parameter/field reference: nickname is absent from the spec",
    ]);
  });

  test("query parameters must exist on the referenced operation, including local refs", () => {
    const contract = spec();
    const problems = checkReferences(contract, contract, [approval, source("`GET /v1/things/{id}?external_id=x`\n`POST /v1/things?missing=x`")]);
    expect(problems.map(p => p.message)).toEqual([
      "update query parameter external_id on GET /v1/things/{id}",
      "update query parameter missing on POST /v1/things",
    ]);
  });

  test("does not mistake provider path fragments for Straddle API routes", () => {
    expect(checkReferences(spec(), spec(), [approval, source("`api/v1/echeck/`, `/v2/transactions`, `https://provider.test/v1/example`")])).toEqual([]);
  });

  test("malformed contracts and approval tables fail closed", () => {
    expect(() => parseSpec("openapi: 3.1.1\npaths: {}\n")).toThrow("expected an OpenAPI");
    expect(() => checkReferences(spec(), spec(), [{ ...approval, text: "no table" }])).toThrow("no approval table entries");
  });
});

describe("published SDK versions", () => {
  const pins = { python: { package: "straddle", version: "1.0.5" } };
  const files = [source("| Python SDK | `straddle` 1.0.5 | PyPI. |\n| Ruby SDK | `straddle` 1.0.4 |\nAn observation from CLI v1.0.2; `straddle` 1.0.1."),
    { file: "kit/release-inputs.json", text: '  "sdks": {\n    "python": {\n      "version": "1.0.5",\n      "minimum_version": "1.0.5"\n    }\n  },\n  "cli": {\n    "version": "0.1.0"' },
    { file: "kit/manifest.yaml", text: 'sdks:\n  python:\n    version: "1.0.5"\n    minimum_version: "1.0.5"\ncli:\n  version: "0.1.0"' }];

  test("reports stale pins in skills, release inputs and generated manifest, leaving historical evidence alone", async () => {
    const problems = await checkSDKs(files, pins, async () => JSON.stringify({ info: { version: "1.0.6" } }));
    expect(problems.map(p => [p.file, p.line])).toEqual([
      ["skills/example/SKILL.md", 1], ["kit/release-inputs.json", 3], ["kit/release-inputs.json", 4], ["kit/manifest.yaml", 3], ["kit/manifest.yaml", 4],
    ]);
    for (const problem of problems) expect(problem.message).toContain("1.0.5 -> 1.0.6");
  });

  test("current or ahead pins pass and registry errors fail with every affected location", async () => {
    expect(await checkSDKs(files, pins, async () => JSON.stringify({ info: { version: "1.0.5" } }))).toEqual([]);
    expect(await checkSDKs(files, pins, async () => JSON.stringify({ info: { version: "1.0.4" } }))).toEqual([]);
    const problems = await checkSDKs(files, pins, async () => { throw new Error("HTTP 503"); });
    expect(problems).toHaveLength(5);
    expect(problems.every(p => p.message.includes("HTTP 503"))).toBe(true);
    expect(await checkSDKs(files, pins, async () => "{}")).toHaveLength(5);
  });

  test("registry adapters extract their published version and ignore NuGet prereleases", () => {
    expect(SDK_SOURCES.typescript.version({ version: "1.2.3" })).toBe("1.2.3");
    expect(SDK_SOURCES.ruby.version({ version: "1.2.3" })).toBe("1.2.3");
    expect(SDK_SOURCES.go.version({ Version: "v1.2.3" })).toBe("v1.2.3");
    expect(SDK_SOURCES.dotnet.version({ versions: ["1.9.0", "1.10.0", "2.0.0-rc.1"] })).toBe("1.10.0");
  });

  test("semantic ordering compares numeric components and prereleases", () => {
    expect(compareVersions("v1.10.0", "1.9.0")).toBe(1);
    expect(compareVersions("1.0.0-rc.2", "1.0.0-rc.10")).toBe(-1);
    expect(compareVersions("1.0.0-rc.1", "1.0.0")).toBe(-1);
    expect(compareVersions("1.0.0+meta", "1.0.0")).toBe(0);
  });
});
