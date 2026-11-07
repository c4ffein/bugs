// The views: list's filters, show's reverse links, site's anchors and --public.
import { expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { filterBugs, parseFilters, table } from "../src/list";
import { showText } from "../src/show";
import { renderSite } from "../src/site";
import { CLOSED, Tracker, load } from "../src/views";

const ROOT = join(import.meta.dir, "..");
const t = await load();
const list = (args: string[]) => filterBugs(t.bugs, parseFilters(args));

// A small made-up tracker: one bug of each kind of link, a private bug, and
// the fields the data model is about to gain.
let n = 0;
const bug = (id: string, more: any = {}): any => ({
  uuid: `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`,
  id, project: "scotch", title: `title of ${id}`, state: "confirmed", disclosure: "public", file: `${ROOT}/x/${id}.toml`, ...more,
});
function fixture() {
  const a = bug("scotch-a", { presence: { "7.0.18": "partially-fixed" }, residue: "one site left", state: "unclear",
    unclear: "maybe only a doc gap", mystery: "a field no view knows" });
  const b = bug("scotch-b", { state: "duplicate", link: [{ to: "scotch-a", rel: "duplicate-of", reason: "same thing" }] });
  const c = bug("scotch-c", { link: [{ to: "scotch-a", rel: "covered-by" }, { to: a.uuid, rel: "incomplete-fix-of" }, { to: "scotch-a", rel: "related" }] });
  const d = bug("scotch-d", { state: "split", link: [{ to: "scotch-a", rel: "split-into" }, { to: "scotch-c", rel: "split-into" }] });
  const p = bug("scotch-private", { disclosure: "private", title: "a secret", link: [{ to: "scotch-a", rel: "same-root-cause" }] });
  a.link = [{ to: "scotch-c", rel: "related" }, { to: "scotch-private", rel: "masked-by" }];
  const subs = [{ id: "scotch-fix-report", title: "the fix", state: "sent", fixes: ["scotch-a", "scotch-private"] }];
  return { a, b, c, d, p, t: new Tracker([a, b, c, d, p], subs) };
}

test("list: --project, repeated --state, --kind, --text, --open", () => {
  expect(list(["--project", "linux"]).every((b) => b.project === "linux")).toBe(true);
  expect(list(["--project", "linux"]).length).toBe(t.bugs.filter((b) => b.project === "linux").length);
  const two = list(["--state", "duplicate", "--state", "split"]);
  expect(two.length).toBe(t.bugs.filter((b) => ["duplicate", "split"].includes(b.state)).length);
  expect(new Set(two.map((b) => b.state))).toEqual(new Set(["duplicate", "split"]));
  expect(list(["--state", "duplicate,split"]).length).toBe(two.length);
  expect(list(["--kind", "oob"]).every((b) => b.kind === "oob")).toBe(true);
  expect(list(["--text", "DOMNNBR"]).map((b) => b.id)).toContain("scotch-kgraphmapfm-domnnbr");
  expect(list(["--text", "kgraph_map_fm.c"]).length).toBeGreaterThan(1); // matches `where`
  const open = list(["--open"]);
  expect(open.some((b) => CLOSED.includes(b.state))).toBe(false);
  expect(open.length).toBe(t.bugs.filter((b) => !CLOSED.includes(b.state)).length);
  expect(() => parseFilters(["--bogus"])).toThrow();
});

test("list: sorted by project then id, unknown states count as open", () => {
  const all = list([]);
  const keys = all.map((b) => `${b.project}\u0000${b.id}`);
  expect(keys).toEqual([...keys].sort((x, y) => x.localeCompare(y)));
  const f = fixture();
  expect(filterBugs(f.t.bugs, parseFilters(["--open"])).map((b) => b.id)).toEqual(["scotch-a", "scotch-c", "scotch-private"]);
  const lines = table(f.t.bugs, 40);
  expect(lines.every((l) => l.length <= 40)).toBe(true);
  expect(lines.find((l) => l.startsWith("scotch-a "))).toContain("~");
});

test("show: reverse links from real data", () => {
  const g02 = showText(t, t.resolve("scotch-ps3-g02-6")!);
  expect(g02).toMatch(/duplicated by\s+scotch-ps3-g12-3/);
  expect(showText(t, t.resolve("scotch-sep-23")!)).toMatch(/split from\s+scotch-sa09-12-bundle/);
  expect(t.resolve("PS3-G02-4")?.id).toBe("scotch-ps3-g12-1"); // alias
  expect(t.resolve("db3640cf-3a04-42bd-aa89-38b196107b4a")?.id).toBe("scotch-kgraphmapfm-domnnbr");
  const fm = showText(t, t.resolve("scotch-kgraphmapfm-domnnbr")!);
  expect(fm).toContain("scotch-props-2026-10-report [planned]");
  expect(fm).toContain("hegel-c-findings: id=scotch-kgraphmapfm-domnnbr");
  expect(fm).not.toContain("how = ");
  expect(showText(t, t.resolve("scotch-kgraphmapfm-domnnbr")!, true)).toContain('[imported.hegel-c-findings]\nid = "scotch-kgraphmapfm-domnnbr"');
});

test("show: every reverse label, symmetric links once, new fields shown", () => {
  const { a, t: ft } = fixture();
  const s = showText(ft, a);
  expect(s).toMatch(/duplicated by\s+scotch-b/);
  expect(s).toMatch(/why: same thing/);
  expect(s).toMatch(/covers\s+scotch-c/);
  expect(s).toMatch(/fixed incompletely by\s+scotch-c/); // linked by uuid
  expect(s).toMatch(/split from\s+scotch-d/);
  expect(s).toMatch(/masked by\s+scotch-private/);
  expect(s).toMatch(/same root cause as\s+scotch-private/);
  expect(s.match(/related to\s+scotch-c/g)?.length).toBe(1); // stored on both sides, shown once
  expect(s).toContain("scotch-a  [unclear]");
  expect(s).toMatch(/7\.0\.18\s+partially-fixed\s+\(residue: one site left\)/);
  expect(s).toMatch(/unclear\s+maybe only a doc gap/);
  expect(s).toMatch(/mystery\s+a field no view knows/);
  expect(s).toContain("scotch-fix-report [sent]");
});

test("site --public drops non-public bugs and every reference to them", () => {
  const f = fixture();
  const all = renderSite(f.t);
  expect(all).toContain(`id="${f.p.uuid}"`);
  const pub = renderSite(f.t, { public: true });
  for (const b of [f.a, f.b, f.c, f.d]) expect(pub).toContain(`id="${b.uuid}"`);
  expect(pub).not.toContain(f.p.uuid);
  expect(pub).not.toContain("scotch-private");
  expect(pub).not.toContain("a secret");
  expect(pub).toContain("scotch-fix-report"); // the submission stays, without its private bug
  expect(pub).toContain(`<a href="#${f.a.uuid}">scotch-a</a>`); // in-page links to public bugs
  // A public bug whose text names a private one: refused, not published.
  f.c.notes = "see scotch-private";
  expect(() => renderSite(new Tracker([f.a, f.c, f.p]), { public: true })).toThrow(/scotch-private/);
});

test("site: every public bug has its uuid anchor, and #id redirects", () => {
  const dir = mkdtempSync(join(tmpdir(), "bugs-site-"));
  try {
    const r = Bun.spawnSync(["bun", "src/site.ts", "--public", "--out", dir], { cwd: ROOT });
    expect(r.exitCode).toBe(0);
    const html = readFileSync(join(dir, "index.html"), "utf8");
    const pub = t.bugs.filter((b) => b.disclosure === "public");
    for (const b of pub) expect(html).toContain(`<tr class="bug${["not-a-bug", "withdrawn", "duplicate", "split", "fixed-upstream"].includes(b.state) ? " closed" : ""}" id="${b.uuid}"`);
    expect(html.match(/<tr class="bug/g)?.length).toBe(pub.length);
    expect(html).toContain(`"scotch-kgraphmapfm-domnnbr":"db3640cf-3a04-42bd-aa89-38b196107b4a"`);
    expect(html).not.toMatch(/<(script|link)[^>]+(src|href)=/); // self-contained
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
