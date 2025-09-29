import path from "node:path";

export function defaultScaffoldFor(absPath: string): string {
  const base = path.basename(absPath);
  const ext = path.extname(absPath).toLowerCase();
  const bare = new Set(["Dockerfile", "Makefile", "LICENSE", "README"]);
  if (bare.has(base)) return base === "README" ? `# README\n` : "";
  if (ext === ".tsx") return `export default function Component(){return null}\n`;
  if (ext === ".ts") return ``;
  if (ext === ".js") return ``;
  if (ext === ".md") return `# ${base}\n`;
  if (ext === ".json") return `{}\n`;
  if (ext === ".sql") return ``;
  if (ext === ".py") return ``;
  if (ext === ".yml" || ext === ".yaml") return ``;
  if (ext === ".env" || base.startsWith(".env")) return ``;
  return "";
}
