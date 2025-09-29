import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { parseToPlan } from "../dist/parser.js";

function rels(plan, base) {
  return plan.map(p => ({ kind: p.kind, rel: path.relative(base, p.absPath).replaceAll("\\", "/") }));
}

test("indent-only tree", () => {
  const input = `
my-project/
  src/
    types.ts
    example.ts
  tsconfig.json
`.trim();
  const rootDir = process.cwd();
  const { plan, baseRoot } = parseToPlan(input, { rootDir, inferRoot: true });
  const items = rels(plan, baseRoot);
  const expectHas = [
    { kind: "dir", rel: "" },
    { kind: "dir", rel: "src" },
    { kind: "file", rel: "src/types.ts" },
    { kind: "file", rel: "src/example.ts" },
    { kind: "file", rel: "tsconfig.json" }
  ];
  for (const exp of expectHas) {
    assert(items.find(i => i.kind === exp.kind && i.rel === exp.rel), `missing ${exp.kind} ${exp.rel}`);
  }
});

test("ascii box-drawing tree", () => {
  const input = `
example-api/
├─ app/
│  ├─ main.py
│  ├─ core/
│  │  ├─ config.py
│  │  └─ logging.py
├─ requirements.txt
`.trim();
  const rootDir = process.cwd();
  const { plan, baseRoot } = parseToPlan(input, { rootDir, inferRoot: true });
  const items = rels(plan, baseRoot);
  for (const target of [
    "app", "app/main.py", "app/core", "app/core/config.py", "app/core/logging.py", "requirements.txt"
  ]) {
    assert(items.find(i => i.rel === target), `missing ${target}`);
  }
});

test("path-with-slashes inside tree", () => {
  const input = `
ui-library/
  .github/workflows/ci.yml
  src/
    index.ts
`.trim();
  const rootDir = process.cwd();
  const { plan, baseRoot } = parseToPlan(input, { rootDir, inferRoot: true });
  const items = rels(plan, baseRoot);
  for (const target of [
    ".github", ".github/workflows", ".github/workflows/ci.yml", "src/index.ts"
  ]) {
    assert(items.find(i => i.rel === target), `missing ${target}`);
  }
});
