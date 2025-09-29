import path from "node:path";
import { PlanItem, ParseOptions } from "./types.js";
import {
  hasExtension,
  isBareKnownFile,
  looksLikeDirToken,
  safeJoin,
  splitPrefixContent,
  stripBullets,
  stripTrailingComments,
} from "./utils.js";

export interface ParseResult {
  plan: PlanItem[];
  baseRoot: string;
}

export function parseToPlan(input: string, opts: ParseOptions): ParseResult {
  const rootDir = path.resolve(opts.rootDir);

  let lines = input
    .split(/\r?\n/)
    .map((l) => l.replace(/\t/g, "    "))
    .map((l) => l.replace(/\s+$/, ""))
    .filter((l) => l.trim().length > 0);

  // infer base root from a first-line token like "project/"
  let baseRoot = rootDir;
  if (opts.inferRoot && lines.length > 0) {
    const first = sanitizeContent(lines[0]);
    if (first.endsWith("/")) {
      const token = first.replace(/\/+$/, "");
      if (token && !token.includes("/")) {
        baseRoot = safeJoin(rootDir, token);
        lines = lines.slice(1);
      }
    }
  }

  const plan: PlanItem[] = [];
  const seen = new Set<string>();

  // directory stack by depth
  const stack: string[] = [];
  stack[0] = baseRoot;

  // ensure baseRoot is part of the plan
  addDir(baseRoot);

  for (const raw of lines) {
    const { prefix, content: unclean } = splitPrefixContent(raw);
    const depth = computeDepth(prefix);
    const content0 = sanitizeContent(unclean);
    if (!content0) continue;

    // "/foo/bar" relative to baseRoot
    if (content0.startsWith("/")) {
      const rel = content0.replace(/^\/+/, "");
      addAny(rel, 0);
      continue;
    }

    // token with slashes
    if (content0.includes("/")) {
      const isDir = content0.endsWith("/");
      const rel = isDir ? content0.slice(0, -1) : content0;
      const parent = stack[depth] ?? baseRoot;
      const abs = safeJoin(parent, rel);
      if (isDir) {
        addDir(abs);
        stack[depth + 1] = abs;
        stack.length = depth + 2;
      } else {
        addDir(path.dirname(abs));
        addFile(abs);
        stack.length = Math.max(1, depth + 1);
      }
      continue;
    }

    // bare token
    if (looksLikeDirToken(content0)) {
      const parent = stack[depth] ?? baseRoot;
      const abs = safeJoin(parent, content0.replace(/\/$/, ""));
      addDir(abs);
      stack[depth + 1] = abs;
      stack.length = depth + 2;
    } else {
      const parent = stack[depth] ?? baseRoot;
      const abs = safeJoin(parent, content0);
      addDir(path.dirname(abs));
      addFile(abs);
      stack.length = Math.max(1, depth + 1);
    }
  }

  function sanitizeContent(s: string): string {
    let out = s.trim();
    out = stripBullets(out);
    // drop a leading branch marker like "├─ " or "└─ " or "- "
    out = out.replace(/^(?:[│├└]\s*)?[─-]\s*/u, "");
    out = stripTrailingComments(out);
    out = out.trim();
    out = out.replace(/\/\s+$/, "/");
    out = out.replace(/\s+\((?:opcional|optional)[^)]*\)\s*$/i, "");
    return out;
  }

  function computeDepth(prefix: string): number {
    // remove the trailing branch marker (├─ or └─) so it doesn't count as indent
    let p = prefix.replace(/[├└]─\s*$/u, "");
    // if box pipes exist, depth equals number of pipes
    const pipes = (p.match(/│/g) || []).length;
    if (pipes > 0) return pipes;
    // otherwise, count groups of two spaces
    p = p.replace(/[├└─]/g, " ").replace(/\t/g, "    ");
    let groups = 0, acc = 0;
    for (const ch of p) {
      if (ch === " ") {
        acc++;
        if (acc === 2) { groups++; acc = 0; }
      } else {
        acc = 0;
      }
    }
    return groups;
  }

  function addAny(rel: string, depth: number) {
    const isDir =
      rel.endsWith("/") ||
      (!hasExtension(path.basename(rel)) && !isBareKnownFile(path.basename(rel)));
    const abs = safeJoin(baseRoot, rel.replace(/\/$/, ""));
    if (isDir) {
      addDir(abs);
      stack[depth + 1] = abs;
      stack.length = depth + 2;
    } else {
      addDir(path.dirname(abs));
      addFile(abs);
      stack.length = Math.max(1, depth + 1);
    }
  }

  function addDir(abs: string) {
    // include all ancestor directories under baseRoot
    const rel = path.relative(baseRoot, abs);
    if (rel && rel !== ".") {
      const parts = rel.split(path.sep).filter(Boolean);
      let cur = baseRoot;
      for (const seg of parts) {
        cur = safeJoin(cur, seg);
        pushDir(cur);
      }
    } else {
      pushDir(baseRoot);
    }
  }

  function pushDir(abs: string) {
    const key = `d:${abs}`;
    if (!seen.has(key)) {
      seen.add(key);
      plan.push({ kind: "dir", absPath: abs });
    }
  }

  function addFile(abs: string) {
    const key = `f:${abs}`;
    if (!seen.has(key)) {
      seen.add(key);
      plan.push({ kind: "file", absPath: abs });
    }
  }

  plan.sort((a, b) =>
    a.kind === b.kind
      ? a.absPath.localeCompare(b.absPath)
      : a.kind === "dir"
      ? -1
      : 1
  );

  return { plan, baseRoot };
}
