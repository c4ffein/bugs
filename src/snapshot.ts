// bun run snapshot <checkout-dir> [source-id...]
// Copy each registered source of the repo checked out at <checkout-dir> into
// data/sources/snapshots/, then print its sha256 and item count, and whether
// they match the registry. Never edits the registry: it prints what to fill in.
import { $ } from "bun";
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { itemsOf } from "./importers";
import { registry, repoSlug, sha256, snapshotPath } from "./lib";

const [dir, ...only] = process.argv.slice(2);
if (!dir) { console.error("usage: bun run snapshot <checkout-dir> [source-id...]"); process.exit(2); }
const checkout = resolve(dir);
const remote = (await $`git -C ${checkout} remote get-url origin`.text()).trim();
const head = (await $`git -C ${checkout} rev-parse HEAD`.text()).trim();

let bad = 0;
for (const s of await registry()) {
  if (repoSlug(s.repo) !== repoSlug(remote)) continue;
  if (only.length && !only.includes(s.id)) continue;
  // Committed sources are read from their commit (any branch); a dirty one
  // from the working tree, and the snapshot's sha256 pins what was read.
  let bytes: Uint8Array;
  if (s.dirty) {
    if (!head.startsWith(s.commit)) console.log(`${s.id}: HEAD is ${head}, registry says ${s.commit}`);
    const status = (await $`git -C ${checkout} status --porcelain -- ${s.path}`.text()).trim();
    console.log(`${s.id}: working tree ${status ? "has changes (" + status + ")" : "is clean: drop dirty"}`);
    bytes = new Uint8Array(await Bun.file(join(checkout, s.path)).arrayBuffer());
  } else {
    bytes = new Uint8Array(await $`git -C ${checkout} show ${s.commit}:${s.path}`.arrayBuffer());
  }
  const out = snapshotPath(s);
  mkdirSync(dirname(out), { recursive: true });
  await Bun.write(out, bytes);
  const hash = sha256(bytes);
  const n = s.items === "pending" ? "pending" : itemsOf(new TextDecoder().decode(bytes), s).length;
  const ok = s.sha256 === hash && s.items === n;
  if (!ok) bad++;
  console.log(`${ok ? "ok  " : "SET "} ${s.id}: sha256 = "${hash}"  items = ${n}${ok ? "" : `   (registry: ${s.sha256 ?? "-"} / ${s.items ?? "-"})`}`);
}
process.exit(bad ? 1 : 0);
