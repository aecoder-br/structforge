#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { parseToPlan } from "./parser.js";
import { executePlan } from "./executor.js";

function parseArgs(args: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith("--")) {
      const k = a.slice(2);
      const next = args[i + 1];
      if (!next || next.startsWith("--")) out[k] = true;
      else { out[k] = next; i++; }
    }
  }
  return out;
}

async function readInput(fromFile?: string): Promise<string> {
  if (fromFile) {
    const buf = await fs.readFile(fromFile);
    return buf.toString("utf8");
  }
  const chunks: string[] = [];
  return await new Promise((resolve, reject) => {
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", c => chunks.push(String(c)));
    process.stdin.on("end", () => resolve(chunks.join("")));
    process.stdin.on("error", reject);
  });
}

function help() {
  const h = `
structforge, text to filesystem scaffolder

Usage:
  structforge --root <dir> [--infer-root] [--gitkeep] [--dry-run] [--verbose] [--from <file>]

Options:
  --root <dir>       Root directory where the structure will be created. Default '.'
  --infer-root       Use the first line that ends with '/' as a sub root
  --gitkeep          Create .gitkeep in empty directories
  --dry-run          Do not create anything, only print the plan
  --verbose          Log each created item
  --from <file>      Read input from a file instead of stdin
  --help             Show this help

Example:
  structforge --root . --infer-root --gitkeep --from tree.txt
`;
  process.stdout.write(h);
}

(async function main() {
  const argv = parseArgs(process.argv.slice(2));
  if (argv.help) { help(); process.exit(0); }

  const rootDir = path.resolve(String(argv.root ?? "."));
  const inferRoot = Boolean(argv["infer-root"]);
  const gitkeep = Boolean(argv.gitkeep);
  const dryRun = Boolean(argv["dry-run"]);
  const verbose = Boolean(argv.verbose);
  const fromFile = typeof argv.from === "string" ? argv.from : undefined;

  const input = await readInput(fromFile);
  if (!input.trim()) {
    process.stderr.write("[error] Empty input. Use --from <file> or provide stdin.\n");
    process.exit(1);
  }

  try {
    const { plan, baseRoot } = parseToPlan(input, { rootDir, inferRoot });
    await executePlan(plan, { dryRun, verbose, gitkeep });
    const msg = dryRun ? "Dry run complete. Nothing was created." : `Structure created at: ${baseRoot}`;
    process.stdout.write(msg + "\n");
  } catch (e: any) {
    process.stderr.write(`[error] ${e?.message ?? String(e)}\n`);
    process.exit(1);
  }
})();
