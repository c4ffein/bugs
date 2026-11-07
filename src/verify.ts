// bun run verify [--pin]: nothing was lost, now or since the last sound version.
// 1. conserve (every source item accounted for) and lint (no errors);
// 2. every uuid ever issued (data/uuids.txt) still names a bug, and every
//    bug's uuid is listed;
// 3. against the commit named in data/verified-at.txt (the last version that
//    passed verify, an ancestor of HEAD): uuids.txt only grew, every bug it
//    had still exists, and their [imported.*] source records are unchanged.
//    Every pin passed against the one before it, so this holds back to the
//    migration (commit 25ab604, v0 bugs, the first pin).
// --pin: when everything is ok and the tree is clean, write HEAD into
// data/verified-at.txt; commit that to move the baseline forward.
import { $ } from "bun";
import { join } from "node:path";
import { DATA, ROOT, bugs } from "./lib";

const PIN_HEADER = "# The last commit that passed bun run verify. verify checks the tree against it;\n# bun run verify --pin moves it to HEAD (then commit this file).\n";
const problems: string[] = [];
const ok = (m: string) => console.log(`ok    ${m}`);

for (const script of ["conserve", "lint"]) {
  const r = Bun.spawnSync(["bun", `src/${script}.ts`], { cwd: ROOT });
  const last = r.stdout.toString().trim().split("\n").pop()!;
  if (r.exitCode === 0) ok(last); else problems.push(`${script} fails: ${last} (run bun run ${script})`);
}

const parse = (text: string) => new Map(text.split("\n").filter((l) => l && !l.startsWith("#")).map((l) => l.split(" ", 2) as [string, string]));
const issued = parse(await Bun.file(join(DATA, "uuids.txt")).text());
const all = await bugs();
const byUuid = new Map(all.map((b) => [b.uuid, b]));
for (const [u, id] of issued) if (!byUuid.has(u)) problems.push(`uuid ${u} (issued as ${id}) names no bug: was it deleted?`);
for (const b of all) if (!issued.has(b.uuid)) problems.push(`${b.id}: uuid not in data/uuids.txt; append the line: ${b.uuid} ${b.id}`);
if (!problems.some((p) => p.includes("uuid"))) ok(`${issued.size} issued uuids, every one names a bug`);

const git = async (...a: string[]) => { const r = await $`git -C ${ROOT} ${a}`.nothrow().quiet(); return r.exitCode === 0 ? r.stdout.toString() : undefined; };
const PIN = join(DATA, "verified-at.txt");
const pin = (await Bun.file(PIN).text()).split("\n").find((l) => /^[0-9a-f]{40}$/.test(l.trim()))?.trim();
const short = pin?.slice(0, 12);
if (!pin) problems.push("data/verified-at.txt names no commit (a 40-hex line)");
else if (await git("rev-parse", "--verify", "-q", `${pin}^{commit}`) === undefined) problems.push(`pin ${short} is not in this repo (no git, or a shallow clone?)`);
else if (await git("merge-base", "--is-ancestor", pin, "HEAD") === undefined) problems.push(`pin ${short} is not an ancestor of HEAD`);
else {
  const then = parse((await git("show", `${pin}:data/uuids.txt`)) ?? "");
  const lost = [...then.keys()].filter((u) => !issued.has(u));
  if (lost.length) problems.push(`data/uuids.txt lost ${lost.length} lines since ${short} (append only): ${lost.slice(0, 3).join(", ")}`);
  else ok(`data/uuids.txt keeps all ${then.size} lines of ${short}`);

  // The bugs at the pin, read in one git call (sizes are byte counts, so slice bytes).
  const files = (await git("ls-tree", "-r", "--name-only", pin, "--", "data/bugs"))!.split("\n").filter((f) => f.endsWith(".toml"));
  const batch = Bun.spawnSync(["git", "-C", ROOT, "cat-file", "--batch"], { stdin: Buffer.from(files.map((f) => `${pin}:${f}\n`).join("")) }).stdout;
  const gone: string[] = [], changed: string[] = [];
  let pos = 0;
  for (const f of files) {
    const nl = batch.indexOf(10, pos);
    const size = Number(batch.subarray(pos, nl).toString().split(" ")[2]);
    const old = Bun.TOML.parse(batch.subarray(nl + 1, nl + 1 + size).toString()) as any;
    pos = nl + 1 + size + 1;
    const now = byUuid.get(old.uuid);
    if (!now) gone.push(`${old.id} (${old.uuid})`);
    else if (!Bun.deepEquals(old.imported ?? {}, now.imported ?? {}, true)) changed.push(now.id);
  }
  if (gone.length) problems.push(`${gone.length} bugs of ${short} are gone: ${gone.slice(0, 3).join(", ")}`);
  else ok(`all ${files.length} bugs of ${short} still exist`);
  if (changed.length) problems.push(`[imported] edited since ${short} (the source record, verbatim; restore it with git show ${short}:<file>): ${changed.join(", ")}`);
  else ok(`[imported] unchanged since ${short}`);
}

for (const p of problems) console.log(`FAIL  ${p}`);
console.log(problems.length ? `verify: FAIL (${problems.length})` : "verify: ok, nothing lost");
if (problems.length) process.exit(1);

if (process.argv.includes("--pin")) {
  const head = (await git("rev-parse", "HEAD"))?.trim();
  if ((await git("status", "--porcelain"))?.trim()) { console.log("--pin: the tree has changes; commit them first, so the pin names what was verified"); process.exit(1); }
  if (head === pin) { console.log(`--pin: already pinned at ${short}`); process.exit(0); }
  await Bun.write(PIN, PIN_HEADER + head + "\n");
  console.log(`--pin: data/verified-at.txt now names ${head!.slice(0, 12)}; commit it`);
}
