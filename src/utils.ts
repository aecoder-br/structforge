import path from "node:path";
import fs from "node:fs/promises";

export function hasExtension(name: string): boolean {
  if (!name) return false;
  if (name.startsWith(".") && name.includes(".")) return true;
  return /\.[A-Za-z0-9]+$/.test(name);
}

export function isBareKnownFile(name: string): boolean {
  return new Set([ "Dockerfile", "Makefile", "LICENSE", "README" ]).has(name);
}

export function looksLikeDirToken(token: string): boolean {
  return token.endsWith("/") || (!hasExtension(token) && !isBareKnownFile(token));
}

export function stripTrailingComments(s: string): string {
  s = s.replace(/(?:\s{2,}|\t)#.*$/, "");
  s = s.replace(/\s+\((?:opcional|optional)[^)]*\)\s*$/i, "");
  return s;
}

export function stripBullets(s: string): string {
  return s.replace(/^[-*•>]+\s+/, "");
}

export function splitPrefixContent(line: string): { prefix: string; content: string } {
  const m = line.match(/^([\s│├└─]*)(.*)$/);
  const prefix = m ? m[1] : "";
  const rest = m ? m[2] : line;
  return { prefix, content: rest.trim() };
}

export function computeDepth(prefix: string): number {
  const pipes = (prefix.match(/│/g) || []).length;
  let s = prefix.replace(/[│├└]/g, " ").replace(/\t/g, "    ");
  let groups = 0, i = 0, acc = 0;
  while (i < s.length) {
    if (s[i] === " ") {
      acc++;
      if (acc === 2) { groups++; acc = 0; }
    } else {
      acc = 0;
    }
    i++;
  }
  return pipes + groups;
}

export function safeJoin(rootDir: string, p: string): string {
  const normalized = path.normalize(p).replace(/^[A-Za-z]:/, "");
  if (normalized.split(path.sep).some(seg => seg === "..")) {
    throw new Error(`Using '..' is not allowed in: ${p}`);
  }
  const joined = path.resolve(rootDir, normalized);
  if (!joined.startsWith(path.resolve(rootDir))) {
    throw new Error(`Path escaped root: ${p}`);
  }
  return joined;
}

export async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
