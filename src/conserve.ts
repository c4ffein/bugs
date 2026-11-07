// bun run conserve: the no-lost-bugs check (PLAN.md §1).
// For every registered source: its snapshot matches the registry, the importer
// reproduces the registered count, and every item has exactly one disposition
// in data/sources/<source>/items.toml, pointing at a real bug or set aside
// with a reason. Also: every bug uuid is well-formed and unique, and every
// bug [[source]] ref names a registered source item.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { itemsOf } from "./importers";
import { DATA, ROOT, UUID, bugs, readToml, registry, sha256, snapshotPath } from "./lib";

const problems: string[] = [];
const say = (m: string) => problems.push(m);
const verbose = process.argv.includes("-v");

const allBugs = await bugs();
const byUuid = new Map<string, string>();
for (const b of allBugs) {
  if (typeof b.uuid !== "string" || !UUID.test(b.uuid)) say(`${b.file}: uuid missing or not a v4 uuid`);
  else if (byUuid.has(b.uuid)) say(`${b.file}: uuid ${b.uuid} also used by ${byUuid.get(b.uuid)}`);
  else byUuid.set(b.uuid, b.file);
}

const itemsBySource = new Map<string, Set<string>>();
let totalItems = 0, totalMapped = 0, totalAside = 0;
for (const s of await registry()) {
  const snap = snapshotPath(s);
  if (!existsSync(snap)) { say(`${s.id}: no snapshot (run bun run snapshot)`); continue; }
  const bytes = new Uint8Array(await Bun.file(snap).arrayBuffer());
  if (sha256(bytes) !== s.sha256) say(`${s.id}: snapshot sha256 differs from the registry`);
  if (s.items === "pending") { say(`${s.id}: item count not frozen yet (${s.note ?? "count by hand"})`); continue; }
  const keys = itemsOf(new TextDecoder().decode(bytes), s);
  itemsBySource.set(s.id, new Set(keys));
  if (keys.length !== s.items) say(`${s.id}: importer finds ${keys.length} items, registry says ${s.items}`);
  totalItems += keys.length;

  const f = join(DATA, "sources", s.id, "items.toml");
  const recs: any[] = existsSync(f) ? ((await readToml(f)).item ?? []) : [];
  const disp = new Map<string, any>();
  for (const r of recs) {
    if (disp.has(r.key)) say(`${s.id}: "${r.key}" has two dispositions`);
    disp.set(r.key, r);
    if (!keys.includes(r.key)) say(`${s.id}: disposition for "${r.key}", which is not an item of the source`);
  }
  let mapped = 0, aside = 0;
  const missing: string[] = [];
  for (const k of keys) {
    const r = disp.get(k);
    if (!r) { missing.push(k); continue; }
    const kinds = ["bug", "out_of_scope", "moved"].filter((x) => typeof r[x] === "string");
    if (kinds.length !== 1) { say(`${s.id}: "${k}" needs exactly one of bug = "<uuid>", out_of_scope = "<reason>", moved = "<path>"`); continue; }
    if (r.bug && !byUuid.has(r.bug)) { say(`${s.id}: "${k}" maps to ${r.bug}, which is no bug`); continue; }
    if (kinds[0] === "out_of_scope" && !r.out_of_scope.trim()) { say(`${s.id}: "${k}" is set aside without a reason`); continue; }
    if (r.moved && !existsSync(join(ROOT, r.moved))) { say(`${s.id}: "${k}" moved to ${r.moved}, which doesn't exist`); continue; }
    r.bug || r.moved ? mapped++ : aside++;
  }
  totalMapped += mapped; totalAside += aside;
  if (missing.length) {
    say(`${s.id}: ${missing.length} of ${keys.length} items unaccounted` +
      (verbose ? missing.map((k) => `\n    ${k}`).join("") : `  (first: ${missing[0]})`));
  }
}

for (const b of allBugs) {
  for (const src of b.source ?? []) {
    const m = String(src.ref ?? "").match(/^([^#]+)#(.+)$/);
    if (!m) { say(`${b.file}: source ref "${src.ref}" is not <source-id>#<item>`); continue; }
    const items = itemsBySource.get(m[1]);
    if (!items) say(`${b.file}: source ref "${src.ref}": no such source (or its count is pending)`);
    else if (!items.has(m[2])) say(`${b.file}: source ref "${src.ref}": no such item`);
  }
}

console.log(`${allBugs.length} bugs; ${totalItems} source items: ${totalMapped} mapped or moved, ${totalAside} set aside, ${totalItems - totalMapped - totalAside} unaccounted`);
for (const p of problems) console.log(`  ${p}`);
if (problems.length) { console.log(`conserve: FAIL (${problems.length} problems${verbose ? "" : "; -v lists every unaccounted item"})`); process.exit(1); }
console.log("conserve: ok");
