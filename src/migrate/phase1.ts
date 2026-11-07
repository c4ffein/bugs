// One-off Phase 1 migration (PLAN.md §5): generate the bug files and the
// import records from the snapshots, and move the files that come along
// (write-ups, submissions, kits, reports).
//
//   bun src/migrate/phase1.ts <hegel-c checkout> <pyscotch checkout>
//
// Re-runnable: an existing bug file keeps its uuid, and hand-written
// dispositions in an items.toml (marked `hand = true`) are kept. Everything
// a source record says is kept verbatim under [imported."<source-id>"]; the
// top-level fields are the normalised view.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { itemsOf } from "../importers";
import { DATA, ROOT, readToml, registry, snapshotPath } from "../lib";
import { toToml } from "./toml";

// RETIRED after Phase 2 (tag migration-final): the bug files are the source
// of truth now, edited by hand, and re-running this would overwrite them.
if (!process.argv.includes("--i-know-this-overwrites-hand-edits")) {
  console.error("phase1.ts is retired (tag migration-final): edit data/bugs/ directly; bun run verify checks nothing was lost.");
  process.exit(2);
}
const [HEGEL, PYSCOTCH] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (!HEGEL || !PYSCOTCH) { console.error("usage: phase1.ts <hegel-c checkout> <pyscotch checkout>"); process.exit(2); }

const sources = await registry();
// Phase 2 decisions (PLAN.md §5): aliases, duplicates, links, splits.
const phase2: any = await Bun.file(join(import.meta.dir, "phase2.json")).json();
const git = async (...args: string[]) => (await Bun.$`git -C ${PYSCOTCH} ${args}`.text()).trim();
const src = (id: string) => sources.find((s) => s.id === id)!;
const text = (id: string) => Bun.file(snapshotPath(src(id))).text();

// ---- existing uuids, so a re-run keeps them -------------------------------
const oldUuid = new Map<string, string>();
const walk = (d: string): string[] => existsSync(d) ? readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]) : [];
for (const f of walk(join(DATA, "bugs"))) {
  const b = await readToml(f);
  oldUuid.set(b.id, b.uuid);
}

type Bug = Record<string, any> & { id: string; project: string };
const bugs = new Map<string, Bug>();
const dispositions = new Map<string, Map<string, Record<string, string>>>(); // source → key → disposition

function bug(id: string, project: string): Bug {
  let b = bugs.get(id);
  if (!b) {
    b = { uuid: oldUuid.get(id) ?? crypto.randomUUID(), id, project, source: [], imported: {} };
    bugs.set(id, b);
  }
  return b;
}
function map(sourceId: string, key: string, b: Bug, discovery?: Discovery | null) {
  addDisp(sourceId, key, { bug: b.uuid });
  const ref = `${sourceId}#${key}`;
  b.source.push({ ref });
  if (discovery) (b.discovery ??= []).push({ ...discovery, ref });
}
// Who found a bug, and when: one per source item that is a finding of its
// own (not the 7.0.18 re-check of a 7.0.17 record, not a corpus entry).
// date_is: "stated" (the record says so) or "upper-bound" (git shows the
// record existed by then; it may be older).
type Discovery = { by: string; date?: string; date_is?: "stated" | "upper-bound" };
const REVIEWER = "Robert Perry (external review of 7.0.16)";
function aside(sourceId: string, key: string, reason: string) { addDisp(sourceId, key, { out_of_scope: reason }); }
function moved(sourceId: string, key: string, path: string) { addDisp(sourceId, key, { moved: path }); }
function addDisp(sourceId: string, key: string, d: Record<string, string>) {
  const m = dispositions.get(sourceId) ?? new Map();
  dispositions.set(sourceId, m);
  if (m.has(key)) throw new Error(`${sourceId}#${key} dispositioned twice`);
  m.set(key, d);
}
const union = (a: string[] = [], b: string[] = []) => [...new Set([...a, ...b])];

// The life-cycle order, to keep the furthest state when two sources merge.
const ORDER = ["lead", "suspected", "confirmed", "patch-ready", "reported", "fixed-upstream"];
const further = (a?: string, b?: string) => (!a ? b : !b ? a : ORDER.indexOf(a) >= ORDER.indexOf(b) ? a : b);

// ---- files that move ------------------------------------------------------
function copy(from: string, to: string) {
  if (!existsSync(from)) throw new Error(`missing ${from}`);
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
}
// hegel-c write-ups (working tree: they have uncommitted edits, like the ledger)
for (const f of readdirSync(join(HEGEL, "docs/findings"))) copy(join(HEGEL, "docs/findings", f), join(DATA, "writeups", f));
// PyScotch: reports, kits and the rest of upstream/, from the registered commit
for (const d of ["reports", "repro", "proposals", "experiments", "report-templates", "README.md"]) {
  const to = d === "reports" ? join(ROOT, "reports/scotch") : d === "repro" ? join(ROOT, "witnesses/scotch") : join(ROOT, "upstream", d);
  rmSync(to, { recursive: true, force: true });
  copy(join(PYSCOTCH, "upstream", d), to);
}

// Where a hegel-c path lives after the move.
function hegelPath(p: string): string {
  if (p.startsWith("docs/findings/")) return `data/writeups/${p.slice("docs/findings/".length)}`;
  if (p.startsWith("submissions/")) return `data/${p}`;
  return `hegel-c:${p}`; // stays in hegel-c (tests, pins)
}

// ---- hegel-c findings ------------------------------------------------------
const hegel = Bun.TOML.parse(await text("hegel-c-findings")) as any;
// Same bugs as PyScotch review findings (hegel-c's PYSCOTCH_HANDOFF.md).
const SAME_AS_REVIEW: Record<string, string> = { "GRA-02": "scotch-kgraphmapfm-domnnbr", "GRA-08": "scotch-graphgeomloadchac-cleanup" };

for (const f of hegel.finding) {
  const b = bug(f.id, f.project);
  Object.assign(b, {
    title: f.title, where: f.where, kind: f.kind, confidence: f.confidence, reach: f.reach,
    disclosure: "public", // hegel-c's ledger is a public repo
    state: further(b.state, f.status),
  });
  if (f.fixed_by) b.fixed_by = f.fixed_by;
  if (f.introduced) b.introduced_by = f.introduced;
  if (f.writeup) b.writeup = hegelPath(f.writeup);
  if (f.pin) (b.witness ??= []).push({ kind: "hegel-c-pin", repo: "https://github.com/c4ffein/hegel-c", ref: "pending", pin: f.pin });
  for (const r of f.related ?? []) (b.link ??= []).push({ to: r.to, rel: r.rel });
  b.imported["hegel-c-findings"] = f;
  map("hegel-c-findings", f.id, b, { by: f.found_by, date: f.found, date_is: "stated" });
}

// ---- hegel-c submissions: records move, with their folders -------------------
mkdirSync(join(DATA, "submissions"), { recursive: true });
for (const s of hegel.submission) {
  const rec = { ...s };
  if (s.dir) {
    copy(join(HEGEL, s.dir), join(DATA, "submissions", s.id));
    rec.dir = `data/submissions/${s.id}`;
  }
  const out = `data/submissions/${s.id}.toml`;
  await Bun.write(join(ROOT, out), toToml(rec, `# Moved from hegel-c docs/findings.toml [[submission]] (source hegel-c-submissions).\n# \`fixes\` names bugs by id.`));
  moved("hegel-c-submissions", s.id, out);
}

// ---- hegel-c corpus: stays in hegel-c ---------------------------------------
const corpus = (Bun.TOML.parse(await text("hegel-c-corpus")) as any).target;
for (const t of corpus) {
  if (t.finding) map("hegel-c-corpus", t.finding, bugs.get(t.finding)!);
  else aside("hegel-c-corpus", t.fixed_by, "an upstream-fixed rediscovery target: hegel-c benchmark data, stays in hegel-c's corpus");
}

// ---- hegel-c: the libhegel bug (TODO.md + the upstream draft) ----------------
{
  const b = bug("libhegel-float-simplest-nonzero", "libhegel");
  Object.assign(b, {
    title: "a float drawn between two drawn floats hits the internal error `FloatChoice::simplest: no valid float for this choice` in ~3% of runs",
    where: "libhegel/src/native/core/choices.rs:707 (FloatChoice::simplest)",
    kind: "internal-error", confidence: "high", reach: "live",
    disclosure: "public", // in hegel-c's public TODO.md
    state: "confirmed",
    versions_seen: ["0.48.0", "0.49.0"],
    repro: "HEGEL_SEED=40, hegel-c tests/from-hegel-rust/test_floats_f64_bounds",
    writeup: "data/writeups/libhegel-float-simplest-nonzero.md",
    witness: [{ kind: "hegel-c-test", repo: "https://github.com/c4ffein/hegel-c", ref: "pending", test: "tests/from-hegel-rust/test_floats_f64_bounds.c" }],
    upstream: { tracker: "https://github.com/hegeldev/hegel/issues", state: "draft, not posted" },
  });
  copy(join(HEGEL, "docs/upstream/float-simplest-nonzero-internal-error.md"), join(DATA, "writeups/libhegel-float-simplest-nonzero.md"));
  map("hegel-c-todo", src("hegel-c-todo").keys![0], b, { by: "hegel-c", date: "2026-11-06", date_is: "stated" });
  map("hegel-c-upstream-float", src("hegel-c-upstream-float").path, b);
  aside("hegel-c-upstream-collection-size", src("hegel-c-upstream-collection-size").path,
    "a feature request for hegeldev/hegel (collection sizes), not a bug; stays in hegel-c");
}

// ---- PyScotch findings.json: review findings and PyScotch's own ------------
const PRESENCE: Record<string, string> = { "still-present": "present", "partially-fixed": "partially-fixed", fixed: "fixed" };
const json = { "7.0.17": JSON.parse(await text("pyscotch-7.0.17-review")), "7.0.18": JSON.parse(await text("pyscotch-7.0.18-review")) };
const VERSIONS = ["7.0.17", "7.0.18"] as const;
// When each findings.json first appeared in PyScotch: an upper bound for its new records.
const firstCommit: Record<string, string> = {};
for (const v of VERSIONS) firstCommit[v] = (await git("log", "--format=%ad", "--date=short", "--", `upstream/reports/${v}/findings.json`)).split("\n").pop()!;
const REVIEW_FOUND = "2026-10-07"; // Robert Perry's review of 7.0.16 (reports/*/meta.json)

const reviewBugId = (id: string) => SAME_AS_REVIEW[id] ?? `scotch-${id.toLowerCase()}`;
const newBugId = (id: string) => `scotch-${id.toLowerCase()}`;
const reviewIds = new Set(json["7.0.18"].findings.map((f: any) => f.id));
const newIds = new Set(json["7.0.18"].new.map((f: any) => f.local_id));
// PyScotch sometimes cites a long local id in short form: PS2-G20-2 for
// PS2-G20-dgraph-io-dmesh-2.
const shortForm = new Map<string, string>();
for (const id of newIds as Set<string>) {
  const m = id.match(/^(PS\d*-G\d+)-[a-z].*-(\d+)$/);
  if (m) shortForm.set(`${m[1]}-${m[2]}`, id);
}
const aliasOf = new Map<string, string>();
for (const [bugId, as] of Object.entries(phase2.aliases as Record<string, string[]>)) for (const a of as) aliasOf.set(a, bugId);
const anyBugId = (id: string) => reviewIds.has(id) ? reviewBugId(id) : newIds.has(id) ? newBugId(id)
  : shortForm.has(id) ? newBugId(shortForm.get(id)!) : aliasOf.get(id);
const unresolved: string[] = [];

for (const kind of ["review", "new"] as const) {
  const list = kind === "review" ? "findings" : "new";
  const keyOf = (f: any) => (kind === "review" ? f.id : f.local_id);
  for (const v of VERSIONS) {
    for (const f of json[v][list]) {
      const key = keyOf(f);
      const id = kind === "review" ? reviewBugId(key) : newBugId(key);
      const b = bug(id, "scotch");
      const sid = `pyscotch-${v}-${kind}`;
      b.imported[sid] = f;
      // A discovery once: the first version that has the record.
      const firstHere = v === "7.0.17" || !json["7.0.17"][list].some((x: any) => keyOf(x) === key);
      map(sid, key, b, !firstHere ? null : kind === "review"
        ? { by: REVIEWER, date: REVIEW_FOUND, date_is: "stated" }
        : { by: "pyscotch", date: firstCommit[v], date_is: "upper-bound" });
      if (PRESENCE[f.status]) (b.presence ??= {})[v] = PRESENCE[f.status];
      // What remains in a partly fixed version: that version's record title
      // says it ("checks now unconditional, but empty lists still accepted").
      if (f.status === "partially-fixed") (b.residue ??= {})[v] = f.our_title;
      if (v !== "7.0.18" && b.title) continue; // the latest version fills the fields below
      const merged = id in hegelIds();
      if (!merged) {
        // The title from the first version that has the record: 7.0.18 titles
        // of fixed bugs describe the fix ("now counts edges once").
        b.title ??= json["7.0.17"][list].find((x: any) => keyOf(x) === key)?.our_title ?? f.our_title;
        b.where = f.location_7_0_18 || f.location || f.location_7_0_17;
      }
      const sev = f.severity || f.claimed_severity;
      if (sev) b.severity = sev;
      b.disclosure = "public"; // published in PyScotch's public repo
      b.first_seen ??= kind === "review" ? "7.0.16" : v;
      // State from the latest version's status.
      const st = f.status === "fixed" ? "fixed-upstream" : f.status === "not-a-bug" ? "not-a-bug"
        : f.status === "inconclusive" ? "suspected"
        : kind === "review" ? "reported" // the review went upstream: fixes cite "[report R. Perry]"
        : "confirmed"; // PyScotch's own report draft was never sent
      b.state = st === "not-a-bug" ? st : further(merged ? b.state : undefined, st);
      if (f.repro) {
        const kit = `witnesses/scotch/${f.repro}`;
        if (!existsSync(join(ROOT, kit))) throw new Error(`${id}: kit ${kit} missing`);
        b.witness = [...(b.witness ?? []).filter((w: any) => w.kind !== "kit"), { kind: "kit", path: kit }];
      }
      const rel = union(f.related_review_ids, f.related_ids).filter((r) => r !== key);
      if (rel.length) {
        b.link = (b.link ?? []).filter((l: any) => l.rel !== "related");
        for (const r of rel) {
          const to = anyBugId(r);
          if (to) b.link.push({ to, rel: "related" });
          else if (/^[A-Z]+\d*-[A-Z0-9-]+$/.test(r)) unresolved.push(`${id} related ${r}`);
          // else prose ("COR (arch_cmpltw.c:259 …)", a group name): kept in [imported] only
        }
      }
    }
  }
}
function hegelIds(): Record<string, true> { return Object.fromEntries(hegel.finding.map((f: any) => [f.id, true])); }

// ---- static-analysis no-finding lines, PyScotch's own bugs, hegel branch ---
for (const s of sources.filter((s) => s.importer === "static-analysis")) {
  for (const k of itemsOf(await text(s.id), s)) {
    if (/No (new|further) findings/.test(k)) aside(s.id, k, "not a finding: the file says nothing more was found");
  }
}
{
  const s = src("pyscotch-findings-md");
  for (const k of itemsOf(await text(s.id), s)) {
    if (k.startsWith("PyScotch bugs")) aside(s.id, k, "a PyScotch binding bug (fixed 2026-07-12): stays in PyScotch");
    else if (k.startsWith("Process findings")) aside(s.id, k, "a PyScotch process note, not a Scotch bug: stays in PyScotch");
  }
}
{
  const b = bugs.get("scotch-hgraphordercp-disconnected")!;
  map("scotch-hegel-bug-report", src("scotch-hegel-bug-report").keys![0], b);
  const r = src("scotch-hegel-report");
  map("scotch-hegel-report", r.keys![0], b); // the same finding as hegel-c's ledger entry: no second discovery
  for (const k of r.keys!.slice(1)) aside(r.id, k, "the report itself lists it under \"Other findings (not bugs)\"");
}

// ---- prose items reconciled by judgement (src/migrate/reconcile.json) -------
// One decision per item of QUESTIONS.md, FINDINGS.md's Scotch rows, the
// coloring write-up and the static-analysis leads: the same bug as an
// existing one, the same as a QUESTIONS.md entry, a new bug, or not a bug.
{
  const decisions: any[] = await Bun.file(join(import.meta.dir, "reconcile.json")).json();
  const seen = new Set<string>();
  for (const d of decisions) {
    const k = `${d.source}#${d.key}`;
    if (seen.has(k)) throw new Error(`reconcile: ${k} decided twice`);
    seen.add(k);
    const s = src(d.source);
    if (!s) throw new Error(`reconcile: unknown source ${d.source}`);
    if (!itemsOf(await text(s.id), s).includes(d.key)) throw new Error(`reconcile: ${k} is not an item`);
  }
  const questionBug = new Map<string, Bug | string>(); // question key → bug, or the reason it's not one
  const apply = (d: any): Bug | string => {
    if (d.decision === "same") {
      const b = bugs.get(d.bug);
      if (!b) throw new Error(`reconcile: ${d.source}#${d.key} → unknown bug ${d.bug}`);
      return b;
    }
    if (d.decision === "not-a-bug") return d.reason;
    if (d.decision === "same-as-question") {
      const q = questionBug.get(d.question);
      if (q === undefined) throw new Error(`reconcile: ${d.source}#${d.key} → unknown or undecided question ${d.question}`);
      return q;
    }
    if (d.decision !== "new") throw new Error(`reconcile: ${d.source}#${d.key}: decision ${d.decision}`);
    const n = d.new, id = `scotch-${n.slug}`;
    if (bugs.has(id) && !bugs.get(id)!.reconciled) throw new Error(`reconcile: ${id} already exists`);
    const b = bug(id, "scotch");
    if (b.reconciled) throw new Error(`reconcile: two items propose ${id}; decide them as one`);
    const lead = d.source.startsWith("pyscotch-static-analysis-");
    Object.assign(b, {
      reconciled: true, title: n.title, where: n.where, kind: n.kind, severity: n.severity,
      disclosure: "public", // in PyScotch's public repo
      first_seen: lead ? "7.0.11" : undefined,
      state: n.state, presence: n.presence, fixed_in: n.fixed_in, notes: n.notes,
    });
    for (const [v, p] of Object.entries(n.presence ?? {})) if (p === "partially-fixed") (b.residue ??= {})[v] = n.notes;
    return b;
  };
  // When PyScotch had each prose item.
  const proseDiscovery = async (d: any): Promise<Discovery> => {
    if (d.source.startsWith("pyscotch-static-analysis-")) return { by: "pyscotch-static-analysis", date: "2026-07-13", date_is: "stated" };
    if (d.source === "pyscotch-findings-md") return { by: "pyscotch", date: "2026-07-12", date_is: "stated" };
    if (d.source === "pyscotch-coloring") return { by: "pyscotch", date: "2025-12-05", date_is: "stated" };
    // QUESTIONS.md: the last commit that changed the entry's heading line.
    const line = d.key.startsWith("suggestion: ") ? `### ${d.key.slice(12)}` : d.key.startsWith("resolved: ") ? `**${d.key.slice(10)}**` : `## ${d.key}`;
    const dates = await git("log", "--follow", "--format=%ad", "--date=short", `-S${line}`, "--", "upstream/QUESTIONS_FOR_SCOTCH_TEAM.md");
    if (!dates) throw new Error(`no git date for ${d.key}`);
    return { by: "pyscotch", date: dates.split("\n").pop()!, date_is: "upper-bound" };
  };
  // A split (phase2.json) maps the item to a bundle bug linked to its parts.
  const splitOf = new Map<string, any>((phase2.splits as any[]).map((sp) => [`${sp.source}#${sp.key}`, sp]));
  const record = async (d: any, r: Bug | string): Promise<Bug | string> => {
    if (typeof r === "string") { aside(d.source, d.key, `not a bug: ${r}`); return r; }
    const sp = splitOf.get(`${d.source}#${d.key}`);
    if (sp) {
      const parent = bug(`scotch-${sp.slug}`, "scotch");
      Object.assign(parent, { title: sp.title, disclosure: "public", state: "split", link: [] });
      for (const part of sp.into) {
        let child: Bug;
        if (typeof part === "string") {
          child = bugs.get(part)!;
          if (!child) throw new Error(`split ${sp.slug}: unknown bug ${part}`);
        } else {
          child = bug(`scotch-${part.slug}`, "scotch");
          Object.assign(child, { title: part.title, where: part.where, kind: part.kind, state: part.state, disclosure: "public",
            first_seen: d.source.startsWith("pyscotch-static-analysis-") ? "7.0.11" : undefined });
        }
        parent.link.push({ to: child.id, rel: "split-into" });
      }
      splitOf.delete(`${d.source}#${d.key}`);
      r = parent;
    }
    map(d.source, d.key, r, await proseDiscovery(d));
    r.imported[d.source] = { key: d.key, document: src(d.source).path, reconciled: d.reason, ...(sp ? { split: true } : {}) };
    return r;
  };
  // Questions first: other items may point at them.
  for (const d of decisions.filter((d) => d.source === "pyscotch-questions")) questionBug.set(d.key, await record(d, apply(d)));
  for (const d of decisions.filter((d) => d.source !== "pyscotch-questions")) await record(d, apply(d));
  for (const b of bugs.values()) delete b.reconciled;
  if (splitOf.size) throw new Error(`splits of no reconciled item: ${[...splitOf.keys()].join(", ")}`);
}

// ---- phase 2: aliases, duplicates, links ----------------------------------
for (const [id, as] of Object.entries(phase2.aliases as Record<string, string[]>)) {
  if (!bugs.has(id)) throw new Error(`alias: unknown bug ${id}`);
  bugs.get(id)!.aliases = as;
}
for (const d of phase2.duplicates) {
  const b = bugs.get(d.bug), of = bugs.get(d.of);
  if (!b || !of) throw new Error(`duplicate: unknown bug ${!b ? d.bug : d.of}`);
  b.state_before_duplicate = b.state;
  b.state = "duplicate";
  (b.link ??= []).push({ to: of.id, rel: "duplicate-of", reason: d.reason });
}
for (const l of phase2.links) {
  const b = bugs.get(l.bug);
  if (!b || !bugs.has(l.to)) throw new Error(`link: unknown bug ${!b ? l.bug : l.to}`);
  (b.link ??= []).push({ to: l.to, rel: l.rel, reason: l.reason });
}

for (const e of phase2.set ?? []) {
  const b = bugs.get(e.bug);
  if (!b) throw new Error(`set: unknown bug ${e.bug}`);
  Object.assign(b, e.set);
}

// ---- write -----------------------------------------------------------------

// Bug files: normalised fields first, then the lists, then what was imported.
const FIELD_ORDER = ["uuid", "id", "project", "title", "where", "kind", "severity", "confidence", "reach", "disclosure",
  "first_seen", "state", "unclear", "state_before_duplicate", "aliases", "fixed_in", "fixed_by", "introduced_by", "versions_seen", "repro", "writeup"];
rmSync(join(DATA, "bugs"), { recursive: true, force: true });
for (const b of bugs.values()) {
  const o: Record<string, any> = {};
  for (const k of FIELD_ORDER) if (b[k] !== undefined && b[k] !== "") o[k] = b[k];
  for (const k of Object.keys(b)) if (!(k in o) && !["imported"].includes(k) && b[k] !== undefined) o[k] = b[k];
  o.imported = b.imported;
  const file = join(DATA, "bugs", b.project, `${b.id}.toml`);
  mkdirSync(dirname(file), { recursive: true });
  await Bun.write(file, toToml(o, "# Generated by src/migrate/phase1.ts; edit freely. [imported.*] is the source record, verbatim."));
}

// Import records: generated dispositions; hand-written ones (hand = true) win.
for (const s of sources) {
  const f = join(DATA, "sources", s.id, "items.toml");
  const hand = existsSync(f) ? ((await readToml(f)).item ?? []).filter((i: any) => i.hand) : [];
  const gen = dispositions.get(s.id) ?? new Map();
  for (const h of hand) gen.delete(h.key);
  const items = [...hand, ...[...gen].map(([key, d]) => ({ key, ...d }))];
  if (!items.length) continue;
  mkdirSync(dirname(f), { recursive: true });
  await Bun.write(f, toToml({ item: items }, `# Dispositions of ${s.id}'s items. Generated by src/migrate/phase1.ts;\n# hand-written records carry hand = true and are kept on re-runs.`));
}

console.log(`${bugs.size} bugs written`);
for (const [p, n] of Object.entries([...bugs.values()].reduce((m: any, b) => ((m[b.project] = (m[b.project] ?? 0) + 1), m), {}))) console.log(`  ${p}: ${n}`);
if (unresolved.length) console.log(`related ids defined nowhere (kept in [imported]):\n  ${[...new Set(unresolved)].join("\n  ")}`);
