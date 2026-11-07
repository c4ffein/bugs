// The importers must reproduce the counts checked by hand (PLAN.md §2) on the
// frozen snapshots. A mismatch means the importer is wrong, not the source.
import { expect, test } from "bun:test";
import { itemsOf } from "../src/importers";
import { registry, snapshotPath } from "../src/lib";

const expected: Record<string, number> = {
  "hegel-c-findings": 28,
  "hegel-c-submissions": 5,
  "hegel-c-corpus": 22,
  "hegel-c-upstream-float": 1,
  "hegel-c-upstream-collection-size": 1,
  "hegel-c-todo": 1,
  "pyscotch-7.0.17-review": 192,
  "pyscotch-7.0.17-new": 158,
  "pyscotch-7.0.18-review": 192,
  "pyscotch-7.0.18-new": 189,
  "pyscotch-questions": 26, // 21 entries, 1 suggestion, 4 resolved-upstream bullets
  "pyscotch-findings-md": 13, // 5 Scotch rows, 6 PyScotch binding rows, 2 process bullets
  "pyscotch-coloring": 1,
  "pyscotch-static-analysis-01-library-interface-seq": 18,
  "pyscotch-static-analysis-02-library-interface-par": 13,
  "pyscotch-static-analysis-03-common-infra": 6,
  "pyscotch-static-analysis-04-graph-core": 3,
  "pyscotch-static-analysis-05-architectures": 5,
  "pyscotch-static-analysis-06-bipartitioning": 11,
  "pyscotch-static-analysis-07-kway-mapping": 6,
  "pyscotch-static-analysis-08-separators-ordering": 4,
  "pyscotch-static-analysis-09-meshes": 12,
  "pyscotch-static-analysis-10-distributed-core": 9,
  "pyscotch-static-analysis-11-distributed-algos": 9,
  "pyscotch-static-analysis-12-ecosystem-tests": 12,
  "scotch-hegel-bug-report": 1,
  "scotch-hegel-report": 4,
};

const sources = await registry();
const items = async (id: string) => {
  const s = sources.find((x) => x.id === id)!;
  return itemsOf(await Bun.file(snapshotPath(s)).text(), s);
};

for (const [id, n] of Object.entries(expected)) {
  test(`${id} has ${n} items`, async () => expect((await items(id)).length).toBe(n));
}

test("every registered source with a frozen count is covered here", () => {
  const frozen = sources.filter((s) => s.items !== "pending").map((s) => s.id).sort();
  expect(frozen).toEqual(Object.keys(expected).sort());
});

test("both findings.json versions hold the same ids", async () => {
  expect(new Set(await items("pyscotch-7.0.18-review"))).toEqual(new Set(await items("pyscotch-7.0.17-review")));
  // `new` grew: every 7.0.17 id is still there in 7.0.18
  const n18 = new Set(await items("pyscotch-7.0.18-new"));
  expect((await items("pyscotch-7.0.17-new")).filter((k) => !n18.has(k))).toEqual([]);
});

test("hegel-c statuses match the inventory", async () => {
  const s = sources.find((x) => x.id === "hegel-c-findings")!;
  const f = (Bun.TOML.parse(await Bun.file(snapshotPath(s)).text()) as any).finding;
  const tally = (k: string) => f.reduce((m: any, x: any) => ((m[x[k]] = (m[x[k]] ?? 0) + 1), m), {});
  expect(tally("project")).toEqual({ linux: 14, scotch: 14 });
  expect(tally("status")).toEqual({ reported: 3, "patch-ready": 8, confirmed: 7, withdrawn: 5, "fixed-upstream": 3, suspected: 2 });
});
