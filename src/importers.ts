// An importer turns a source file's text into the list of item keys it holds.
// Keys must be unique within a source; they're what items.toml dispositions.

export type Source = {
  id: string;
  repo: string;
  commit: string;
  dirty?: boolean; // snapshot taken from uncommitted work on top of `commit`
  path: string;
  sha256?: string;
  items?: number | "pending";
  importer: string;
  select?: string; // toml/json: the array to read
  key?: string | string[]; // toml/json: the field holding the item key (the first present, if several)
  keys?: string[]; // manual: the keys, listed by hand
  note?: string;
};

type Importer = (text: string, s: Source) => string[];

const field = (x: any, k: string | string[], s: Source) => {
  for (const f of [k].flat()) if (typeof x?.[f] === "string" && x[f]) return x[f] as string;
  throw new Error(`${s.id}: item without a ${JSON.stringify(k)}: ${JSON.stringify(x).slice(0, 120)}`);
};

// Markdown helpers: headings and list/table items, outside code fences.
function mdLines(text: string): string[] {
  const out: string[] = [];
  let fence = false;
  for (const l of text.split("\n")) {
    if (/^\s*(```|~~~)/.test(l)) { fence = !fence; continue; }
    if (!fence) out.push(l);
  }
  return out;
}

export const importers: Record<string, Importer> = {
  toml: (text, s) => ((Bun.TOML.parse(text) as any)[s.select!] ?? []).map((x: any) => field(x, s.key!, s)),
  json: (text, s) => (JSON.parse(text)[s.select!] ?? []).map((x: any) => field(x, s.key!, s)),
  // The whole file is one item.
  file: (_text, s) => [s.path],
  // Items listed by hand in the registry (for prose sources).
  manual: (_text, s) => s.keys ?? [],
  // QUESTIONS_FOR_SCOTCH_TEAM.md: each "## " heading is an entry, except two
  // containers whose entries are their "### " headings ("Suggestions") or
  // their top-level bullets ("Resolved upstream").
  "pyscotch-questions": (text) => {
    const keys: string[] = [];
    let container: "suggestions" | "resolved" | null = null;
    for (const l of mdLines(text)) {
      let m;
      if ((m = l.match(/^## (.*)/))) {
        const h = m[1].trim();
        if (/^Suggestions\b/.test(h)) container = "suggestions";
        else if (/^Resolved upstream\b/.test(h)) container = "resolved";
        else { container = null; keys.push(h); }
        continue;
      }
      if (container === "suggestions" && (m = l.match(/^### (.*)/))) keys.push(`suggestion: ${m[1].trim()}`);
      if (container === "resolved" && (m = l.match(/^- \*\*(.+?)\*\*/))) keys.push(`resolved: ${m[1].trim()}`);
    }
    return keys;
  },
  // PyScotch's static-analysis history: the items of the "## Findings"
  // section. Files number them in five styles: "### 1. …", "### F1 — …",
  // "**F1 (high) — …", "**1. …", "1. **…". Keyed by number and title start.
  "static-analysis": (text) => {
    const keys: string[] = [];
    let on = false;
    for (const l of mdLines(text)) {
      if (/^## /.test(l)) { on = /^## Findings\b/.test(l); continue; }
      if (!on) continue;
      const m = l.match(/^(?:#{3,4} +\**|\*\*)(F\d+|F-minor|\d+\.)\**\s*(.*)/) ?? l.match(/^(\d+\.) \*\*(.*)/) ??
        l.match(/^#{3,4} +()(No (?:new|further) findings.*)/);
      if (m) keys.push(`${(m[1] || "-").replace(/\.$/, "")} ${m[2].replace(/[*`]/g, "").trim().slice(0, 70)}`);
    }
    return keys;
  },
  // Every table row (not header) and top-level bullet, keyed by its section
  // and its first cell (rows) or opening words (bullets).
  "md-rows": (text) => {
    const keys: string[] = [];
    const lines = mdLines(text);
    const isSep = (l = "") => /^\|(\s*:?-+:?\s*\|)+\s*$/.test(l);
    let section = "";
    lines.forEach((l, i) => {
      let m;
      if ((m = l.match(/^##+ (.*)/))) section = m[1].trim();
      else if (isSep(l) || isSep(lines[i + 1])) return; // separator, or the header above it
      else if ((m = l.match(/^\|([^|]*)\|/))) keys.push(`${section} | ${m[1].trim()}`);
      else if ((m = l.match(/^- (.*)/))) keys.push(`${section} - ${m[1].slice(0, 60).trim()}`);
    });
    return keys;
  },
};

export function itemsOf(text: string, s: Source): string[] {
  const imp = importers[s.importer];
  if (!imp) throw new Error(`${s.id}: unknown importer "${s.importer}"`);
  const keys = imp(text, s);
  const seen = new Set<string>();
  for (const k of keys) {
    if (seen.has(k)) throw new Error(`${s.id}: duplicate item key "${k}"`);
    seen.add(k);
  }
  return keys;
}
