// bun run list [--project p] [--state s]… [--kind k] [--text t] [--open]
// One line per bug: id, state, project, presence per version, title.
// --project, --state and --kind repeat (or take a comma list); --text matches
// id, title and where, case ignored; --open leaves out the closed states.
import type { Bug } from "./lib";
import { CLOSED, isOpen, load, presenceOf, sortBugs, versionsOf } from "./views";

export type Filters = { project: string[]; state: string[]; kind: string[]; text?: string; open: boolean };

export function parseFilters(argv: string[]): Filters {
  const f: Filters = { project: [], state: [], kind: [], open: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const value = () => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} needs a value`);
      return v;
    };
    if (a === "--open") f.open = true;
    else if (a === "--text") f.text = value();
    else if (a === "--project" || a === "--state" || a === "--kind") f[a.slice(2) as "project"].push(...value().split(","));
    else throw new Error(`unknown argument ${a}`);
  }
  return f;
}

export function filterBugs(all: Bug[], f: Filters): Bug[] {
  const text = f.text?.toLowerCase();
  return sortBugs(all.filter((b) =>
    (!f.project.length || f.project.includes(b.project)) &&
    (!f.state.length || f.state.includes(b.state)) &&
    (!f.kind.length || f.kind.includes(b.kind)) &&
    (!f.open || isOpen(b)) &&
    (!text || [b.id, b.title, b.where].some((s) => s?.toLowerCase().includes(text)))));
}

const MARK: Record<string, string> = { present: "+", "partially-fixed": "~", fixed: "-" };
export const presenceMark = (p: string | undefined) => (p === undefined ? "." : MARK[p] ?? "?");

// Lines of the table; `width` truncates each line (Infinity: no truncation).
export function table(bs: Bug[], width = Infinity): string[] {
  const versions = versionsOf(bs);
  const w = (k: (b: Bug) => string, min: number) => Math.max(min, ...bs.map((b) => k(b).length));
  const idW = w((b) => b.id, 2), stW = w((b) => b.state ?? "", 5), prW = w((b) => b.project, 7);
  const pvW = Math.max(versions.length, 8);
  const presence = (b: Bug) => {
    const p = b.presence ?? {};
    return Object.keys(p).length ? versions.map((v) => presenceMark(p[v])).join("") : "";
  };
  const cut = (s: string) => (s.length > width ? `${s.slice(0, width - 1)}…` : s);
  const row = (id: string, st: string, pr: string, pv: string, title: string) =>
    cut(`${id.padEnd(idW)}  ${st.padEnd(stW)}  ${pr.padEnd(prW)}  ${pv.padEnd(pvW)}  ${title}`);
  return [
    row("id", "state", "project", "presence", "title"),
    ...bs.map((b) => row(b.id, b.state ?? "", b.project, presence(b), b.title ?? "")),
  ];
}

if (import.meta.main) {
  let f: Filters;
  try { f = parseFilters(process.argv.slice(2)); } catch (e: any) {
    console.error(`list: ${e.message}\nusage: bun run list [--project p] [--state s]… [--kind k] [--text t] [--open]`);
    process.exit(2);
  }
  const shown = filterBugs((await load()).bugs, f);
  const width = process.stdout.columns || Number(process.env.COLUMNS) || Infinity;
  for (const line of table(shown, width)) console.log(line);
  const versions = versionsOf(shown);
  console.log(`\n${shown.length} bugs${f.open ? ` (open only: no ${CLOSED.join(", ")})` : ""}`);
  if (versions.length) console.log(`presence: ${versions.join(" ")}  (+ present, ~ partially fixed, - fixed, . not recorded)`);
}
