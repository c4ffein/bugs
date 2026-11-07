// A small TOML emitter for the one-off Phase 1 migration (PLAN.md: scripts
// don't write TOML, except to generate the imported bugs once). Every output
// is parsed back and compared with the input, so a bug here can't slip by.
import { deepEqual } from "node:assert/strict";

const bare = /^[A-Za-z0-9_-]+$/;
const key = (k: string) => (bare.test(k) ? k : JSON.stringify(k));

function str(s: string): string {
  // Multi-line text as a literal block when it can be, else a basic string.
  if (s.includes("\n") && !s.includes("'''") && !/[\x00-\x08\x0b-\x1f\x7f]/.test(s.replace(/\r\n/g, "\n")) && !s.endsWith("'") && !s.includes("\r"))
    return `'''\n${s}'''`;
  return JSON.stringify(s).replace(/\\u007f/g, "\\u007F");
}

const isTable = (v: any) => v !== null && typeof v === "object" && !Array.isArray(v);
const isTableArray = (v: any) => Array.isArray(v) && v.length > 0 && v.every(isTable);

function value(v: any): string {
  if (typeof v === "string") return str(v);
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return `[${v.map(value).join(", ")}]`;
  if (isTable(v)) return `{ ${Object.entries(v).filter(([, x]) => x !== null && x !== undefined).map(([k, x]) => `${key(k)} = ${value(x)}`).join(", ")} }`;
  throw new Error(`can't emit ${JSON.stringify(v)}`);
}

function table(obj: Record<string, any>, path: string[], out: string[]) {
  const entries = Object.entries(obj).filter(([, v]) => v !== null && v !== undefined);
  for (const [k, v] of entries) if (!isTable(v) && !isTableArray(v)) out.push(`${key(k)} = ${value(v)}`);
  for (const [k, v] of entries) {
    const p = [...path, key(k)];
    if (isTable(v)) { out.push("", `[${p.join(".")}]`); table(v, p, out); }
    else if (isTableArray(v)) for (const e of v) { out.push("", `[[${p.join(".")}]]`); table(e, p, out); }
  }
}

const dropNulls = (v: any): any =>
  Array.isArray(v) ? v.map(dropNulls) : isTable(v)
    ? Object.fromEntries(Object.entries(v).filter(([, x]) => x !== null && x !== undefined).map(([k, x]) => [k, dropNulls(x)]))
    : v;

export function toToml(obj: Record<string, any>, header = ""): string {
  const out: string[] = [];
  table(obj, [], out);
  const text = (header ? header + "\n" : "") + out.join("\n").replace(/^\n+/, "") + "\n";
  deepEqual(Bun.TOML.parse(text), dropNulls(obj)); // round trip
  return text;
}
