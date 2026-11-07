import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Source } from "./importers";

export const ROOT = join(import.meta.dir, "..");
export const DATA = join(ROOT, "data");
export const SNAPSHOTS = join(DATA, "sources/snapshots");

export const readToml = async (p: string): Promise<any> => Bun.TOML.parse(await Bun.file(p).text());

export async function registry(): Promise<Source[]> {
  const r = await readToml(join(DATA, "sources/registry.toml"));
  const ids = new Set<string>();
  for (const s of r.source ?? []) {
    if (ids.has(s.id)) throw new Error(`registry: duplicate source id ${s.id}`);
    ids.add(s.id);
  }
  return r.source ?? [];
}

// Snapshots are stored by repo and path, so two sources reading the same file
// share one copy.
export const repoSlug = (repo: string) => repo.replace(/^(https?:\/\/[^/]+\/|[^@]+@[^:]+:)/, "").replace(/\.git$/, "");
export const snapshotPath = (s: Source) => join(SNAPSHOTS, repoSlug(s.repo), s.path);

export const sha256 = (bytes: Uint8Array) => new Bun.CryptoHasher("sha256").update(bytes).digest("hex");

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function walk(dir: string, ext: string): string[] {
  let out: string[] = [];
  let names: string[];
  try { names = readdirSync(dir); } catch { return out; }
  for (const n of names.sort()) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out = out.concat(walk(p, ext));
    else if (n.endsWith(ext)) out.push(p);
  }
  return out;
}

export type Bug = { uuid: string; id: string; project: string; file: string; [k: string]: any };

export async function bugs(): Promise<Bug[]> {
  const out: Bug[] = [];
  for (const f of walk(join(DATA, "bugs"), ".toml")) out.push({ ...(await readToml(f)), file: f });
  return out;
}
