import path from "node:path";
import { PlanItem, ParseOptions } from "./types.js";
import { computeDepth, hasExtension, isBareKnownFile, looksLikeDirToken, safeJoin, splitPrefixContent, stripBullets, stripTrailingComments } from "./utils.js";

export interface ParseResult {
  plan: PlanItem[];
  baseRoot: string;
}

export function parseToPlan(input: string, opts: ParseOptions): ParseResult {
  const rootDir = path.resolve(opts.rootDir);
  let lines = input.split(/\r?\n/)
    .map(l => l.replace(/\t/g, "    "))
    .map(l => l.replace(/\s+$/, ""))
    .filter(l => l.trim().length > 0);

  let baseRoot = rootDir;
  if (opts.inferRoot) {
    const firstContent = sanitizeContent(lines[0]);
    if (!firstContent.includes("/") && firstContent.endsWith("/")) {
      baseRoot = safeJoin(rootDir, firstContent.slice(0, -1));
      lines = lines.slice(1);
    }
  }

  const plan: PlanItem[] = [];
  const seen = new Set<string>();
  const stack: string[] = [];
  stack[0] = baseRoot;

  for (const raw of lines) {
    const { prefix, content: unclean } = splitPrefixContent(raw);
    const depth = computeDepth(prefix);
    const content0 = sanitizeContent(unclean);
    if (!content0) continue;

    if (content0.startsWith("/")) {
      const rel = content0.replace(/^\/+/, "");
      addAny(rel, 0);
      continue;
    }

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
    out = out.replace(/^(?:[│├└]?[─\-])\s*/, "");
    out = stripTrailingComments(out);
    out = out.trim();
    out = out.replace(/\/\s+$/, "/");
    out = out.replace(/\s+\((?:opcional|optional)[^)]*\)\s*$/i, "");
    return out;
  }

  function addAny(rel: string, depth: number) {
    const isDir = rel.endsWith("/") || (!hasExtension(path.basename(rel)) && !isBareKnownFile(path.basename(rel)));
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

  plan.sort((a, b) => a.kind === b.kind ? a.absPath.localeCompare(b.absPath) : (a.kind === "dir" ? -1 : 1));
  return { plan, baseRoot };
}
