import fs from "node:fs/promises";
import path from "node:path";
import { PlanItem } from "./types.js";
import { defaultScaffoldFor } from "./defaults.js";

export interface ExecOptions {
  dryRun?: boolean;
  verbose?: boolean;
  gitkeep?: boolean;
}

export async function executePlan(plan: PlanItem[], opts: ExecOptions = {}) {
  const dirs = plan.filter(p => p.kind === "dir").map(p => p.absPath);
  const files = plan.filter(p => p.kind === "file").map(p => p.absPath);

  for (const d of dirs) {
    if (opts.dryRun) {
      info(`[dir]  ${rel(d)}`);
    } else {
      await fs.mkdir(d, { recursive: true });
      if (opts.verbose) info(`[dir]  ${rel(d)}`);
      if (opts.gitkeep) {
        const k = path.join(d, ".gitkeep");
        try { await fs.access(k); } catch { await fs.writeFile(k, ""); }
      }
    }
  }

  for (const f of files) {
    if (opts.dryRun) {
      info(`[file] ${rel(f)}`);
    } else {
      let exists = false;
      try { await fs.access(f); exists = true; } catch {}
      if (!exists) {
        await fs.writeFile(f, defaultScaffoldFor(f));
      }
      if (opts.verbose) info(`[file] ${rel(f)}${exists ? " (skip)" : ""}`);
    }
  }
}

function info(msg: string) {
  process.stdout.write(msg + "\n");
}
function rel(p: string) {
  return path.relative(process.cwd(), p);
}
