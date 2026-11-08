// bun run show <id|uuid|alias> [--full]: one bug in full. Links are shown in
// both directions (the reverse ones found by scanning every bug), with the
// submissions that fix it. The [imported.*] source records are summarised,
// one line each; --full prints them entirely.
import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import { type Bug, ROOT } from "./lib";
import {
  type Tracker, discoveriesOf, discoveryDate, fields, flat, importedSummary, load, presenceOf, residueOf, witnessText,
} from "./views";

// A record printed TOML-like, for reading (scripts never write TOML).
const key = (k: string) => (/^[\w-]+$/.test(k) ? k : JSON.stringify(k));
function dump(v: any, path: string, out: string[]) {
  const scalars = Object.entries(v).filter(([, x]) => !isTable(x) && !isTableList(x));
  for (const [k, x] of scalars) out.push(`${key(k)} = ${JSON.stringify(x)}`);
  for (const [k, x] of Object.entries(v)) {
    const p = `${path}.${key(k)}`;
    if (isTable(x)) { out.push("", `[${p}]`); dump(x, p, out); }
    else if (isTableList(x)) for (const t of x as any[]) { out.push("", `[[${p}]]`); dump(t, p, out); }
  }
}
const isTable = (x: any) => x && typeof x === "object" && !Array.isArray(x);
const isTableList = (x: any) => Array.isArray(x) && x.length > 0 && x.every(isTable);

export function showText(t: Tracker, b: Bug, full = false): string {
  const out: string[] = [];
  const section = (name: string) => out.push("", name);
  const ref = (x?: Bug) => (x ? `${x.id} [${x.state}] ${x.title ?? ""}` : "");

  out.push(`${b.id}  [${b.state}]`, `  ${b.title ?? ""}`, "");
  const fs = fields(b).filter(([k]) => !["id", "title", "state"].includes(k));
  const w = Math.max(...fs.map(([k]) => k.length));
  for (const [k, v] of fs) out.push(`${k.padEnd(w)}  ${flat(v)}`);
  out.push(`${"file".padEnd(w)}  ${relative(ROOT, b.file ?? "")}`);
  const writeup = `data/writeups/${b.id}.md`;
  if (!b.writeup && existsSync(join(ROOT, writeup))) out.push(`${"writeup".padEnd(w)}  ${writeup}`);

  const presence = presenceOf(b);
  if (presence.length) {
    section("presence");
    for (const [v, p] of presence) out.push(`  ${v.padEnd(8)}  ${p}${p === "partially-fixed" && residueOf(b, v) ? `  (residue: ${residueOf(b, v)})` : ""}`);
  }
  if (b.discovery?.length) {
    section("discoveries");
    for (const d of discoveriesOf(b)) out.push(`  ${discoveryDate(d).padEnd(22)}  ${d.by ?? "?"}${d.ref ? `  (${d.ref})` : ""}`);
  }
  if (b.source?.length) {
    section("sources");
    for (const s of b.source) out.push(`  ${s.ref ?? flat(s)}`);
  }
  if (b.witness?.length) {
    section("witnesses");
    for (const x of b.witness) out.push(`  ${(x.kind ?? "?").padEnd(12)}  ${witnessText(x)}`);
  }
  const links = t.links(b);
  if (links.length) {
    section("links");
    const lw = Math.max(...links.map((l) => l.label.length));
    for (const l of links) {
      out.push(`  ${l.label.padEnd(lw)}  ${l.bug ? ref(l.bug) : `${l.to} (no such bug)`}`);
      if (l.reason) out.push(`  ${"".padEnd(lw)}    why: ${l.reason}`);
    }
  }
  const subs = t.fixedBy.get(b.id) ?? [];
  if (subs.length) {
    section("submissions");
    for (const s of subs) out.push(`  ${s.id} [${s.state ?? "?"}] ${s.title ?? ""}`);
  }
  const imported = Object.entries(b.imported ?? {});
  if (imported.length) {
    section(full ? "imported records" : "imported records (--full prints them)");
    for (const [src, rec] of imported) {
      if (!full) { out.push(`  ${src}: ${importedSummary(rec)}`); continue; }
      out.push("", `[imported.${key(src)}]`);
      dump(rec, `imported.${key(src)}`, out);
    }
  }
  return out.join("\n");
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const full = args.includes("--full");
  const names = args.filter((a) => a !== "--full");
  if (names.length !== 1) {
    console.error("usage: bun run show <id|uuid|alias> [--full]");
    process.exit(2);
  }
  const t = await load();
  const b = t.resolve(names[0]);
  if (!b) {
    const near = t.bugs.filter((x) => x.id.includes(names[0].toLowerCase())).map((x) => x.id);
    console.error(`show: no bug ${names[0]}${near.length ? `; did you mean: ${near.slice(0, 10).join(", ")}` : ""}`);
    process.exit(1);
  }
  console.log(showText(t, b, full));
}
