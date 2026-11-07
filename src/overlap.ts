// bun run overlap [-v]: which bugs of Robert Perry's review (2026-10-07,
// of Scotch 7.0.16) we had also found, and whether before him.
// A bug's discoveries include those of its duplicates and of any bundle
// that splits into it.
import { bugs } from "./lib";

const REVIEW = "2026-10-07";
const isReview = (d: any) => d.by?.startsWith("Robert Perry");
// hegel-c hunts blind (property tests, fuzzing, its own reading): its
// discoveries are independent whatever their date. PyScotch's after the
// review were made while working through it.
const BLIND = ["hegel-c", "sashiko", "by-hand"];

const all = await bugs();
const byId = new Map(all.map((b) => [b.id, b]));
const extra = new Map<string, any[]>(); // bug id → discoveries reaching it through links
for (const b of all) for (const l of b.link ?? []) {
  if ((l.rel === "duplicate-of" && b.state === "duplicate") || (l.rel === "split-into" && b.state === "split"))
    extra.set(l.to, [...(extra.get(l.to) ?? []), ...(b.discovery ?? []).map((d: any) => ({ ...d, via: b.id }))]);
}
const verbose = process.argv.includes("-v");
const rows: { b: any; kind: string; ours: any[] }[] = [];
for (const b of all) {
  const ds = [...(b.discovery ?? []), ...(extra.get(b.id) ?? [])];
  if (!ds.some(isReview) || b.state === "duplicate") continue;
  const ours = ds.filter((d) => !isReview(d));
  const before = ours.filter((d) => d.date && d.date < REVIEW);
  const blind = ours.filter((d) => BLIND.includes(d.by));
  const kind = before.length ? "before" : blind.length ? "independent-after" : ours.length ? "after" : "review-only";
  rows.push({ b, kind, ours });
}
const order = ["before", "independent-after", "after", "review-only"];
const label: Record<string, string> = {
  before: "we had it before the review",
  "independent-after": "found independently after the review (hegel-c)",
  after: "PyScotch found it again while working through the review",
  "review-only": "only the review",
};
for (const k of order) {
  const g = rows.filter((r) => r.kind === k);
  console.log(`\n${label[k]}: ${g.length}`);
  if (k === "review-only" && !verbose) continue;
  if (k === "after" && !verbose) continue;
  for (const { b, ours } of g.sort((x, y) => x.b.id.localeCompare(y.b.id))) {
    const first = ours.filter((d) => d.date).sort((x, y) => x.date.localeCompare(y.date))[0];
    console.log(`  ${b.id.padEnd(40)} ${first ? `${first.date}${first.date_is === "upper-bound" ? " or earlier" : ""}, ${first.by}${first.via ? ` (via ${first.via})` : ""}` : ours.map((d) => d.by).join(", ")}`);
    if (verbose) for (const d of ours) console.log(`      ${d.date ?? "?"} ${d.by} ${d.ref}${d.via ? ` via ${d.via}` : ""}`);
  }
}
console.log(`\n${rows.length} review bugs (${verbose ? "" : "-v lists the last two groups and every discovery"})`);
