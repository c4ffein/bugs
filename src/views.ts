// What list, show and site share: the bugs and submissions loaded once, names
// resolved (id, uuid, alias), links in both directions, and a bug's detail as
// plain data that each view renders its own way.
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { type Bug, DATA, bugs, readToml } from "./lib";

// Known states in life order, then the closed ones. Unknown states sort after.
export const STATES = ["lead", "suspected", "unclear", "confirmed", "patch-ready", "reported", "fixed-upstream",
  "not-a-bug", "withdrawn", "duplicate", "split"];
// What `--open` and the site's open-only filter leave out.
export const CLOSED = ["not-a-bug", "withdrawn", "duplicate", "split", "fixed-upstream"];
export const isOpen = (b: Bug) => !CLOSED.includes(b.state);

const stateRank = (s: string) => (STATES.includes(s) ? STATES.indexOf(s) : STATES.length);
export const byStateOrder = (a: string, b: string) => stateRank(a) - stateRank(b) || a.localeCompare(b);

// "7.0.9" < "7.0.11"
export function compareVersions(a: string, b: string) {
  const x = a.split(/[.-]/), y = b.split(/[.-]/);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const c = (x[i] ?? "").localeCompare(y[i] ?? "", undefined, { numeric: true });
    if (c) return c;
  }
  return 0;
}

export const sortBugs = (bs: Bug[]) => [...bs].sort((a, b) => a.project.localeCompare(b.project) || a.id.localeCompare(b.id));

// Every version some bug has a presence column for (optionally one project's).
export const versionsOf = (bs: Bug[], project?: string) =>
  [...new Set(bs.filter((b) => !project || b.project === project).flatMap((b) => Object.keys(b.presence ?? {})))].sort(compareVersions);

export type Submission = { id: string; title?: string; state?: string; fixes?: string[]; [k: string]: any };

export async function submissions(): Promise<Submission[]> {
  const dir = join(DATA, "submissions");
  const out: Submission[] = [];
  for (const n of readdirSync(dir).filter((n) => n.endsWith(".toml")).sort()) out.push(await readToml(join(dir, n)));
  return out;
}

// Reverse labels: how a link `A rel B` reads from B's side.
const FORWARD: Record<string, string> = {
  "duplicate-of": "duplicate of", "split-into": "split into", "covered-by": "covered by",
  "incomplete-fix-of": "incomplete fix of", "introduced-by": "introduced by", "masked-by": "masked by",
  "same-root-cause": "same root cause as", related: "related to", "distinct-from": "distinct from",
};
const REVERSE: Record<string, string> = {
  "duplicate-of": "duplicated by", "split-into": "split from", "covered-by": "covers",
  "incomplete-fix-of": "fixed incompletely by", "introduced-by": "introduces", "masked-by": "masks",
  "same-root-cause": "same root cause as", related: "related to", "distinct-from": "distinct from",
};
export const forwardLabel = (rel: string) => FORWARD[rel] ?? rel;
export const reverseLabel = (rel: string) => REVERSE[rel] ?? `${rel} (reverse)`;
const SYMMETRIC = ["same-root-cause", "related", "distinct-from"];

export type Link = { label: string; rel: string; bug?: Bug; to: string; reason?: string; reverse: boolean };

export class Tracker {
  byName = new Map<string, Bug>();
  incoming = new Map<string, { from: Bug; link: any }[]>(); // bug id → links pointing at it
  fixedBy = new Map<string, Submission[]>(); // bug id → submissions listing it in `fixes`

  constructor(public bugs: Bug[], public submissions: Submission[] = []) {
    for (const b of bugs) for (const a of b.aliases ?? []) this.byName.set(a.toLowerCase(), b);
    for (const b of bugs) {
      this.byName.set(b.id.toLowerCase(), b);
      if (b.uuid) this.byName.set(b.uuid.toLowerCase(), b);
    }
    for (const b of bugs) for (const l of b.link ?? []) {
      const to = this.resolve(l.to);
      if (to) this.incoming.set(to.id, [...(this.incoming.get(to.id) ?? []), { from: b, link: l }]);
    }
    for (const s of submissions) for (const f of s.fixes ?? []) {
      const b = this.resolve(f);
      if (b) this.fixedBy.set(b.id, [...(this.fixedBy.get(b.id) ?? []), s]);
    }
  }

  resolve = (name: string) => (name ? this.byName.get(String(name).toLowerCase()) : undefined);

  // Forward links as stored, then the reverse ones; a symmetric pair stored on
  // both sides is shown once.
  links(b: Bug): Link[] {
    const out: Link[] = (b.link ?? []).map((l: any) => ({
      label: forwardLabel(l.rel), rel: l.rel, bug: this.resolve(l.to), to: l.to, reason: l.reason, reverse: false,
    }));
    for (const { from, link } of this.incoming.get(b.id) ?? []) {
      if (SYMMETRIC.includes(link.rel) && out.some((o) => o.rel === link.rel && o.bug === from)) continue;
      out.push({ label: reverseLabel(link.rel), rel: link.rel, bug: from, to: from.id, reason: link.reason, reverse: true });
    }
    return out;
  }
}

export async function load() {
  return new Tracker(await bugs(), await submissions());
}

// Fields shown first, in this order; the rest of a bug's scalar fields follow
// generically, so new fields (residue, unclear, …) show without code changes.
export const FIELD_ORDER = ["uuid", "id", "project", "title", "state", "state_before_duplicate", "unclear", "residue",
  "where", "kind", "severity", "confidence", "reach", "disclosure", "first_seen", "fixed_in", "fixed_by",
  "introduced_by", "aliases", "writeup", "notes"];
// Shown in their own sections, or not at all.
export const SECTIONS = ["file", "imported", "presence", "source", "discovery", "witness", "link"];

export function fields(b: Bug): [string, any][] {
  const keys = [...FIELD_ORDER.filter((k) => k in b), ...Object.keys(b).filter((k) => !FIELD_ORDER.includes(k) && !SECTIONS.includes(k))];
  return keys.map((k) => [k, b[k]]);
}

// A value on one line: scalars as they are, lists joined, tables as k=v.
export function flat(v: any): string {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.map(flat).join(", ");
  if (typeof v === "object") return Object.entries(v).map(([k, x]) => `${k}=${typeof x === "object" ? `{${flat(x)}}` : x}`).join(", ");
  return String(v);
}

export const presenceOf = (b: Bug) => Object.entries(b.presence ?? {}).sort(([a], [c]) => compareVersions(a, c)) as [string, string][];

export const discoveriesOf = (b: Bug) =>
  [...(b.discovery ?? [])].sort((x: any, y: any) => (x.date ?? "9").localeCompare(y.date ?? "9"));
export const discoveryDate = (d: any) => (d.date ? `${d.date}${d.date_is === "upper-bound" ? " or earlier" : ""}` : "undated");

// A witness without its kind, on one line.
export const witnessText = (w: any) => flat(Object.fromEntries(Object.entries(w).filter(([k]) => k !== "kind")));

// One line per imported record: its key fields, the long ones left out.
const short = (s: string, n = 70) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const KEY_FIELDS =["id", "local_id", "key", "status", "method", "group", "our_title", "title", "location", "where"];
export function importedSummary(rec: any): string {
  const parts = KEY_FIELDS.filter((k) => rec[k] !== undefined && rec[k] !== "" && typeof rec[k] !== "object").map((k) => `${k}=${short(String(rec[k]))}`);
  const more = Object.keys(rec).length - parts.length;
  return parts.join("  ") + (more > 0 ? `  (+${more} more)` : "");
}
