export type Kind = "dir" | "file";

export interface PlanItem {
  kind: Kind;
  absPath: string;
}

export interface ParseOptions {
  rootDir: string;
  inferRoot?: boolean;
}
