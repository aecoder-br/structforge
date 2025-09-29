import { access } from "node:fs/promises";

async function check(p) {
  try { await access(p); } catch { throw new Error(`Missing ${p}`); }
}
await Promise.all([
  check("dist/index.js"),
  check("dist/index.d.ts"),
  check("dist/cli.js")
]);
