// bun run lint [--dups]: field, state and link rules (PLAN.md §4).
// Errors fail the run; warnings are listed. --dups also lists candidate
// duplicates: bugs whose `where` names the same file and function.
import { basename, join } from "node:path";
import { DATA, UUID, bugs, readToml, walk } from "./lib";

const STATES = ["lead", "suspected", "confirmed", "patch-ready", "reported", "fixed-upstream",
  "not-a-bug", "withdrawn", "duplicate", "split", "unclear"];
const PRESENCE = ["present", "partially-fixed", "fixed"];
const RELS = ["incomplete-fix-of", "introduced-by", "same-root-cause", "masked-by", "covered-by",
  "duplicate-of", "split-into", "related", "distinct-from"];
const DATE = /^\d{4}(-\d{2}(-\d{2})?)?$/;

const errors: string[] = [], warnings: string[] = [];
const all = await bugs();
const projects = new Set((await readToml(join(DATA, "projects.toml"))).project.map((p: any) => p.id));
const byId = new Map(all.map((b) => [b.id, b]));
const byUuid = new Map(all.map((b) => [b.uuid, b]));
const resolve = (x: string) => byId.get(x) ?? byUuid.get(x);

const aliasOwner = new Map<string, string>();
for (const b of all) {
  const at = (m: string) => `${b.id}: ${m}`;
  for (const k of ["uuid", "id", "project", "title", "state", "disclosure"]) if (!b[k]) errors.push(at(`no ${k}`));
  if (b.uuid && !UUID.test(b.uuid)) errors.push(at("uuid is not a v4 uuid"));
  if (basename(b.file) !== `${b.id}.toml`) errors.push(at(`file name ${basename(b.file)} differs from the id`));
  if (!projects.has(b.project)) errors.push(at(`unknown project ${b.project}`));
  else if (!b.id.startsWith(`${b.project}-`)) errors.push(at(`id doesn't start with ${b.project}-`));
  if (!STATES.includes(b.state)) errors.push(at(`unknown state ${b.state}`));
  if (!["public", "private"].includes(b.disclosure)) errors.push(at(`disclosure must be public or private`));
  for (const [v, p] of Object.entries(b.presence ?? {})) {
    if (!PRESENCE.includes(p as string)) errors.push(at(`presence ${v} = ${p}: unknown`));
    if (p === "partially-fixed" && !b.residue?.[v]) warnings.push(at(`partially-fixed in ${v} with no residue.${v}`));
  }
  for (const d of b.discovery ?? []) {
    if (!d.by) errors.push(at("discovery without by"));
    if (d.date && !DATE.test(d.date)) errors.push(at(`discovery date ${d.date} is not YYYY[-MM[-DD]]`));
  }
  for (const a of b.aliases ?? []) {
    if (aliasOwner.has(a)) errors.push(at(`alias ${a} also on ${aliasOwner.get(a)}`));
    aliasOwner.set(a, b.id);
  }
  for (const v of Object.keys(b.residue ?? {})) if (b.presence?.[v] !== "partially-fixed") errors.push(at(`residue.${v} but ${v} is not partially-fixed`));
  if ((b.state === "unclear") !== !!b.unclear) errors.push(at("state unclear needs an unclear line saying what's open, and only then"));
  const links = b.link ?? [];
  for (const l of links) {
    const to = resolve(l.to);
    if (!RELS.includes(l.rel)) errors.push(at(`link rel ${l.rel}: unknown`));
    if (!to) { errors.push(at(`link to ${l.to}: no such bug`)); continue; }
    if (to.id === b.id) errors.push(at("links to itself"));
    if (l.rel === "duplicate-of" && ["duplicate", "split"].includes(to.state)) errors.push(at(`duplicate of ${to.id}, which is itself a ${to.state}`));
  }
  const dupOf = links.filter((l: any) => l.rel === "duplicate-of").length;
  if ((b.state === "duplicate") !== (dupOf === 1)) errors.push(at("state duplicate needs exactly one duplicate-of link, and only then"));
  const parts = links.filter((l: any) => l.rel === "split-into").length;
  if ((b.state === "split") !== (parts >= 2)) errors.push(at("state split needs two or more split-into links, and only then"));
}

// Submissions: `fixes` names real bugs; a merged one's bugs are fixed upstream.
for (const f of walk(join(DATA, "submissions"), ".toml").filter((f) => !f.includes("/v"))) {
  const s = await readToml(f);
  for (const id of s.fixes ?? []) {
    const b = resolve(id);
    if (!b) errors.push(`submission ${s.id}: fixes ${id}, no such bug`);
    else if (s.state === "merged" && b.state !== "fixed-upstream") warnings.push(`submission ${s.id} is merged but ${b.id} is ${b.state}`);
  }
}

if (process.argv.includes("--dups")) {
  // file:function from `where` ("src/x.c: f()" or "src/x.c:12-30 (f)"), case-folded
  const keyOf = (w = "") => {
    const file = w.match(/[\w/.-]+\.(c|h|y|l|f90|in|txt|cmake|sh)\b/)?.[0];
    const fn = w.match(/\b([A-Za-z_]\w*)\s*\(\)/)?.[1] ?? w.match(/\(([A-Za-z_]\w*)[ )]/)?.[1];
    return file && fn ? `${basename(file)}:${fn}`.toLowerCase() : undefined;
  };
  const linked = (a: any, b: any) => [...(a.link ?? []), ...(b.link ?? [])].some((l: any) => [a.id, b.id, a.uuid, b.uuid].includes(l.to));
  const groups = new Map<string, any[]>();
  for (const b of all) {
    if (["duplicate", "split"].includes(b.state)) continue;
    const k = keyOf(b.where);
    if (k) groups.set(k, [...(groups.get(k) ?? []), b]);
  }
  let n = 0;
  for (const [k, g] of [...groups].sort()) {
    if (g.length < 2 || g.every((a) => g.every((b) => a === b || linked(a, b)))) continue;
    n++;
    console.log(`candidates ${k}:`);
    for (const b of g) console.log(`  ${b.id} [${b.state}] ${b.title}`);
  }
  console.log(`${n} candidate groups (same file and function, not linked to each other)\n`);

  // Same file, overlapping line ranges, both located on 7.0.18 (the review
  // and PyScotch records): `file.c:12-30` or `file.c:12, 40-41`.
  const ranges = (b: any): [string, number, number][] => {
    const rec = b.imported?.["pyscotch-7.0.18-review"] ?? b.imported?.["pyscotch-7.0.18-new"];
    if (!rec) return [];
    const w = rec.location_7_0_18 || rec.location || "";
    const out: [string, number, number][] = [];
    for (const m of w.matchAll(/([\w.-]+\.(?:c|h|y))((?::|, ?)(?:\d+(?:-\d+)?))+/g)) {
      for (const r of m[0].slice(m[1].length).matchAll(/(\d+)(?:-(\d+))?/g)) out.push([m[1], +r[1], +(r[2] ?? r[1])]);
    }
    return out;
  };
  const live = all.filter((b) => !["duplicate", "split", "not-a-bug", "withdrawn"].includes(b.state));
  const rs = live.map((b) => [b, ranges(b)] as const).filter(([, r]) => r.length);
  const pairs: string[] = [];
  for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
    const [a, ra] = rs[i], [b, rb] = rs[j];
    if (linked(a, b)) continue;
    const hit = ra.find(([f, x, y]) => rb.some(([g, u, v]) => f === g && x <= v && u <= y));
    if (hit) pairs.push(`  ${hit[0]}:${hit[1]}-${hit[2]}  ${a.id} | ${b.id}\n      ${a.title}\n      ${b.title}`);
  }
  console.log(pairs.join("\n"));
  console.log(`${pairs.length} candidate pairs (same file, overlapping lines on 7.0.18, not linked)\n`);
}

for (const w of warnings) console.log(`  warning: ${w}`);
for (const e of errors) console.log(`  error: ${e}`);
console.log(`lint: ${all.length} bugs, ${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length ? 1 : 0);
