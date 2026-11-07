// bun run verify: nothing was lost, now or since the migration.
// 1. conserve (every source item accounted for) and lint (no errors);
// 2. every uuid ever issued (data/uuids.txt) still names a bug, and every
//    bug's uuid is listed;
// 3. uuids.txt only grows: every line of the committed version is still here;
// 4. every bug of the last generated state (tag migration-final) still exists;
// 5. and its [imported.*] source records are unchanged since then.
import { $ } from "bun";
import { join } from "node:path";
import { DATA, ROOT, bugs } from "./lib";

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
const committed = await git("show", "HEAD:data/uuids.txt");
if (committed !== undefined) {
  const gone = [...parse(committed).keys()].filter((u) => !issued.has(u));
  if (gone.length) problems.push(`data/uuids.txt lost ${gone.length} committed lines (append only): ${gone.slice(0, 3).join(", ")}`);
  else ok("data/uuids.txt keeps every committed line");
}
const tagged = await git("grep", "-h", "^uuid = ", "migration-final", "--", "data/bugs");
if (tagged === undefined) problems.push("no tag migration-final to compare with");
else {
  const then = tagged.split("\n").filter(Boolean).map((l) => l.split('"')[1].split('"')[0]);
  const gone = then.filter((u) => !byUuid.has(u));
  if (gone.length) problems.push(`${gone.length} bugs of migration-final are gone: ${gone.slice(0, 3).join(", ")}`);
  else ok(`all ${then.length} bugs of migration-final still exist`);

  // 5. [imported.*] is the source record, verbatim: never edited by hand.
  const files = (await git("ls-tree", "-r", "--name-only", "migration-final", "--", "data/bugs"))!.split("\n").filter((f) => f.endsWith(".toml"));
  const batch = Bun.spawnSync(["git", "-C", ROOT, "cat-file", "--batch"], { stdin: Buffer.from(files.map((f) => `migration-final:${f}\n`).join("")) }).stdout; // bytes: git prints byte counts
  const changed: string[] = [];
  let pos = 0;
  for (const f of files) {
    const nl = batch.indexOf(10, pos);
    const size = Number(batch.subarray(pos, nl).toString().split(" ")[2]);
    const old = Bun.TOML.parse(batch.subarray(nl + 1, nl + 1 + size).toString()) as any;
    pos = nl + 1 + size + 1;
    const now = byUuid.get(old.uuid);
    if (now && !Bun.deepEquals(old.imported ?? {}, now.imported ?? {}, true)) changed.push(now.id);
  }
  if (changed.length) problems.push(`[imported] edited since migration-final (it is the source record, verbatim; restore it with git show migration-final:<file>): ${changed.join(", ")}`);
  else ok(`[imported] of all ${files.length} bugs unchanged since migration-final`);
}

for (const p of problems) console.log(`FAIL  ${p}`);
console.log(problems.length ? `verify: FAIL (${problems.length})` : "verify: ok, nothing lost");
process.exit(problems.length ? 1 : 0);
