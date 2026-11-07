// The repository's own checks: no lost items, no lint errors.
import { expect, test } from "bun:test";

const run = (script: string) => Bun.spawnSync(["bun", `src/${script}.ts`], { cwd: `${import.meta.dir}/..` });

test("conserve passes", () => {
  const r = run("conserve");
  expect(r.stdout.toString()).toContain("conserve: ok");
});

test("lint finds no errors", () => {
  const r = run("lint");
  expect(r.stdout.toString()).toMatch(/lint: \d+ bugs, 0 errors/);
});

test("verify: nothing lost since the migration", () => {
  const r = run("verify");
  expect(r.stdout.toString()).toContain("verify: ok");
});
