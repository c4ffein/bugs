// bun run site [--public] [--out dir]: one self-contained HTML page listing
// every bug (default site/index.html). Each bug is anchored by its uuid
// (#<uuid>, the name other repos cite); #<id> and #<alias> redirect to it.
// --public renders only disclosure = "public" bugs, drops every link to the
// others, and refuses to write a page that still names one.
import { mkdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { type Bug, ROOT } from "./lib";
import {
  Tracker, byStateOrder, discoveriesOf, discoveryDate, fields, flat, isOpen, load, presenceOf, sortBugs,
  residueOf, versionsOf, witnessText,
} from "./views";

const esc = (s: any) => String(s ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const PRESENCE: Record<string, string> = { present: "●", "partially-fixed": "◐", fixed: "○" };
const PRESENCE_RANK: Record<string, number> = { present: 0, "partially-fixed": 1, fixed: 2 };

// "7.0.11" … "7.0.18" → headers "11" … "18" under a "7.0." label.
function shortVersions(vs: string[]) {
  let prefix = "";
  if (vs.length > 1) {
    const parts = vs.map((v) => v.split("."));
    let n = 0;
    while (parts.every((p) => p.length > n + 1 && p[n] === parts[0][n])) n++;
    prefix = n ? `${parts[0].slice(0, n).join(".")}.` : "";
  }
  return { prefix, short: vs.map((v) => v.slice(prefix.length)) };
}

function detail(t: Tracker, b: Bug): string {
  const li = (items: string[]) => (items.length ? `<ul>${items.map((x) => `<li>${x}</li>`).join("")}</ul>` : "");
  const sec = (name: string, items: string[]) => (items.length ? `<h3>${name}</h3>${li(items)}` : "");
  const bugRef = (x: Bug) => `<a href="#${esc(x.uuid)}">${esc(x.id)}</a> <span class="st">${esc(x.state)}</span> ${esc(x.title)}`;

  const rows = fields(b).filter(([k]) => k !== "title" && k !== "id")
    .map(([k, v]) => `<dt>${esc(k)}</dt><dd>${k === "uuid" ? `<a href="#${esc(v)}">${esc(v)}</a>` : esc(flat(v))}</dd>`);
  rows.push(`<dt>file</dt><dd>${esc(relative(ROOT, b.file ?? ""))}</dd>`);
  const presence = presenceOf(b).map(([v, p]) =>
    `${esc(v)}: ${esc(p)}${p === "partially-fixed" && residueOf(b, v) ? ` (residue: ${esc(residueOf(b, v))})` : ""}`);
  const discoveries = discoveriesOf(b).map((d: any) =>
    `${esc(discoveryDate(d))}, ${esc(d.by ?? "?")}${d.ref ? ` <span class="muted">${esc(d.ref)}</span>` : ""}`);
  const sources = (b.source ?? []).map((s: any) => esc(s.ref ?? flat(s)));
  const witnesses = (b.witness ?? []).map((w: any) => `${esc(w.kind ?? "?")}: ${esc(witnessText(w))}`);
  // Only links to bugs on this page: in --public, the others are not named.
  const links = t.links(b).filter((l) => l.bug).map((l) =>
    `${esc(l.label)} ${bugRef(l.bug!)}${l.reason ? `<br><span class="muted">why: ${esc(l.reason)}</span>` : ""}`);
  const subs = (t.fixedBy.get(b.id) ?? []).map((s) => `${esc(s.id)} <span class="st">${esc(s.state)}</span> ${esc(s.title)}`);
  return `<p class="dtitle">${esc(b.title)}</p><dl>${rows.join("")}</dl>` +
    sec("presence", presence) + sec("discoveries", discoveries) + sec("sources", sources) +
    sec("witnesses", witnesses) + sec("links", links) + sec("submissions", subs);
}

export function renderSite(all: Tracker, opts: { public?: boolean; commit?: string } = {}): string {
  const shown = sortBugs(opts.public ? all.bugs.filter((b) => b.disclosure === "public") : all.bugs);
  // Links and submissions resolve only among the bugs shown.
  const t = new Tracker(shown, all.submissions);
  const versions = versionsOf(shown, "scotch");
  const { prefix, short } = shortVersions(versions);
  const states = [...new Set(shown.map((b) => b.state))].sort(byStateOrder);
  const count = (s: string) => shown.filter((b) => b.state === s).length;
  const projects = [...new Set(shown.map((b) => b.project))].sort();
  const kinds = [...new Set(shown.map((b) => b.kind).filter(Boolean))].sort();
  const options = (xs: string[]) => xs.map((x) => `<option>${esc(x)}</option>`).join("");
  const ncols = 4 + versions.length + 1;

  const rows = shown.map((b) => {
    const text = [b.id, b.uuid, b.title, b.where, b.kind, b.state, ...(b.aliases ?? [])].join(" ").toLowerCase();
    const pres = versions.map((v) => {
      const p = b.presence?.[v];
      return `<td class="pv" data-k="${p === undefined ? 9 : PRESENCE_RANK[p] ?? 8}"${p ? ` title="${esc(`${v}: ${p}`)}"` : ""}>${esc(p === undefined ? "" : PRESENCE[p] ?? "?")}</td>`;
    }).join("");
    return `<tr class="bug${isOpen(b) ? "" : " closed"}" id="${esc(b.uuid)}" data-project="${esc(b.project)}" data-state="${esc(b.state)}" data-kind="${esc(b.kind ?? "")}" data-open="${isOpen(b) ? 1 : 0}" data-text="${esc(text)}">` +
      `<td class="id"><a href="#${esc(b.uuid)}">${esc(b.id)}</a></td><td>${esc(b.project)}</td>` +
      `<td data-k="${String(states.indexOf(b.state)).padStart(3, "0")}">${esc(b.state)}</td><td>${esc(b.kind ?? "")}</td>` +
      `${pres}<td class="title" title="${esc(b.title)}">${esc(b.title)}</td></tr>\n` +
      `<tr class="detail" hidden><td colspan="${ncols}">${detail(t, b)}</td></tr>\n`;
  }).join("");

  // id and alias → uuid, for #<id> anchors.
  const names: Record<string, string> = {};
  for (const b of shown) for (const n of [...(b.aliases ?? []), b.id]) names[n.toLowerCase()] = b.uuid;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>bugs${opts.public ? "" : " (private)"}</title>
<script>${THEME_JS}</script>
<style>${CSS}</style>
</head>
<body>
<nav><span class="brand">bugs</span><button id="theme-toggle" onclick="cycleTheme()" title="theme"></button></nav>
<h1>Bugs in Scotch, Linux and libhegel</h1>
<p class="counts">${shown.length} bugs${opts.public ? " (public)" : ""}: ${states.map((s) => `<button class="sc" data-state="${esc(s)}">${count(s)} ${esc(s)}</button>`).join(" · ")}</p>
<div class="controls">
<input id="q" type="search" placeholder="search id, uuid, title, where…">
<select id="f-project"><option value="">all projects</option>${options(projects)}</select>
<select id="f-state"><option value="">all states</option>${options(states)}</select>
<select id="f-kind"><option value="">all kinds</option>${options(kinds)}</select>
<label><input id="f-open" type="checkbox"> open only</label>
<span id="shown" class="muted"></span>
</div>
<p class="legend muted">Presence per Scotch ${esc(prefix)}x version: ● present, ◐ partially fixed, ○ fixed, blank not recorded. Click a row for its detail; anchors are <code>#&lt;uuid&gt;</code> (<code>#&lt;id&gt;</code> works too).</p>
<div class="wrap"><table id="bugs">
<thead><tr><th data-col="0">id</th><th data-col="1">project</th><th data-col="2">state</th><th data-col="3">kind</th>${short.map((s, i) => `<th class="pv" data-col="${4 + i}" title="Scotch ${esc(versions[i])}">${esc(s)}</th>`).join("")}<th data-col="${4 + versions.length}">title</th></tr></thead>
<tbody>
${rows}</tbody>
</table></div>
<p class="muted foot">Generated from <code>bugs</code>${opts.commit ? ` at ${esc(opts.commit)}` : ""}.</p>
<script>const NAMES = ${JSON.stringify(names).replace(/</g, "\\u003c")};
${PAGE_JS}</script>
</body>
</html>
`;
  if (opts.public) {
    // Fail closed: no hidden bug may be named anywhere on a public page.
    // Ids and uuids are words of [\w-]: compare whole words (so scotch-api-1
    // isn't found in scotch-api-19); any other name, as a substring.
    const lower = html.toLowerCase(), words = new Set(lower.match(/[\w-]+/g));
    const named = (n: string) => (/^[\w-]+$/.test(n) ? words.has(n.toLowerCase()) : lower.includes(n.toLowerCase()));
    const hidden = all.bugs.filter((b) => b.disclosure !== "public");
    const leaks = hidden.filter((b) => [b.uuid, b.id, ...(b.aliases ?? [])].some((n) => n && named(n)));
    if (leaks.length) throw new Error(`public page would name non-public bugs: ${leaks.map((b) => b.id).join(", ")}`);
  }
  return html;
}

// The writings site's theme: same palettes, cookie and toggle; no field effects.
const THEME_JS = `
(function () {
  var NAME = 'preferred-theme';
  function pref() { var m = document.cookie.match(/(^| )preferred-theme=([^;]+)/); return m ? m[2] : 'default'; }
  function browser() { return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
  function effective() { var p = pref(); return p === 'default' ? browser() : p; }
  function apply() {
    document.documentElement.setAttribute('data-theme', effective());
    var b = document.getElementById('theme-toggle');
    if (b) b.textContent = effective() === 'dark' ? '\\u23FE' : '\\u2600\\uFE0E';
  }
  window.cycleTheme = function () {
    var domain = location.hostname.endsWith('.cafeine.dev') ? ';domain=.cafeine.dev' : '';
    document.cookie = NAME + '=' + (effective() === 'light' ? 'dark' : 'light') + domain + ';path=/;max-age=31536000;SameSite=Lax';
    apply();
  };
  apply();
  document.addEventListener('DOMContentLoaded', apply);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { if (pref() === 'default') apply(); });
})();`;

const LIGHT = `--bg: #ffffff; --text: #333; --text-muted: #666; --link: #111; --border: #ddd; --code-bg: #f5f5f5; --tag-bg: #eee; --chrome: #111111;`;
const DARK = `color-scheme: dark; --bg: #000000; --text: #ededed; --text-muted: #808080; --link: #ffffff; --border: #4a4a4a; --code-bg: #141414; --tag-bg: #202020; --chrome: #eeeeee;`;
const CSS = `
:root, :root[data-theme="light"] { ${LIGHT} }
@media (prefers-color-scheme: dark) { :root:not([data-theme]) { ${DARK} } }
:root[data-theme="dark"] { ${DARK} }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6;
  max-width: 1400px; margin: 24px auto; padding: 0 20px; background: var(--bg); color: var(--text); }
h1, h3 { color: var(--chrome); font-weight: 400; }
h1 { border-bottom: 2px solid var(--chrome); padding-bottom: 10px; font-size: 1.6rem; margin: 0 0 0.6rem; }
h3 { font-size: 0.95rem; margin: 0.8rem 0 0.2rem; }
a { color: var(--link); text-decoration: underline; }
code { background: var(--code-bg); padding: 0.1rem 0.3rem; border-radius: 3px; }
.muted { color: var(--text-muted); }
nav { display: flex; align-items: center; margin-bottom: 1rem; }
nav .brand { color: var(--chrome); font-size: 1.2rem; }
#theme-toggle { margin-left: auto; background: none; color: var(--chrome); border: none; padding: 0; cursor: pointer;
  font-size: 1.2rem; width: 1.5em; height: 1.5em; line-height: 1.5em; text-align: center; }
.counts { margin: 0.4rem 0; color: var(--chrome); }
.counts button { font: inherit; color: inherit; background: none; border: none; padding: 0; cursor: pointer; text-decoration: underline dotted; }
.controls { display: flex; flex-wrap: wrap; gap: 0.5rem 0.8rem; align-items: center; margin: 0.6rem 0; }
.controls input, .controls select { font: inherit; font-size: 0.9rem; color: var(--text); background: var(--bg);
  border: 1px solid var(--border); border-radius: 3px; padding: 0.15rem 0.4rem; }
#q { flex: 1 1 16rem; }
.legend { font-size: 0.8rem; margin: 0.2rem 0 0.6rem; }
@media (max-width: 800px) { .wrap { overflow-x: auto; } }
table { border-collapse: collapse; width: 100%; font-size: 0.82rem; line-height: 1.35; }
th { position: sticky; top: 0; background: var(--bg); color: var(--chrome); font-weight: 400; text-align: left;
  border-bottom: 2px solid var(--chrome); padding: 0.2rem 0.4rem; cursor: pointer; white-space: nowrap; user-select: none; }
th[aria-sort="ascending"]::after { content: " \\25B4"; }
th[aria-sort="descending"]::after { content: " \\25BE"; }
td { padding: 0.12rem 0.4rem; border-bottom: 1px solid var(--border); white-space: nowrap; vertical-align: top; }
tr.bug { cursor: pointer; }
tr.bug:hover td, tr.bug.open td { background: var(--code-bg); }
tr.closed td { color: var(--text-muted); }
td.id { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.78rem; }
td.id a { text-decoration: none; }
.pv { text-align: center; padding: 0.12rem 0.15rem; }
td.title { width: 100%; max-width: 0; overflow: hidden; text-overflow: ellipsis; }
tr.detail > td { white-space: normal; border-left: 2px solid var(--chrome); padding: 0.4rem 1rem 0.8rem; line-height: 1.5; }
.dtitle { margin: 0.2rem 0 0.4rem; font-size: 0.95rem; color: var(--text); }
dl { display: grid; grid-template-columns: max-content 1fr; gap: 0 1rem; margin: 0; }
dt { color: var(--text-muted); }
dd { margin: 0; overflow-wrap: anywhere; }
.st { color: var(--text-muted); }
.st::before { content: "["; } .st::after { content: "]"; }
ul { list-style: none; padding-left: 1.2rem; margin: 0.2rem 0; }
li { position: relative; margin: 0.1rem 0; overflow-wrap: anywhere; }
ul li::before { content: ""; position: absolute; left: -0.85em; top: 0.6em; width: 0.38em; height: 0.38em;
  border-radius: 50%; background: var(--chrome); }
.foot { font-size: 0.8rem; margin-top: 1rem; }
`;

const PAGE_JS = `
const tbody = document.querySelector('#bugs tbody');
const q = document.getElementById('q'), fp = document.getElementById('f-project'), fs = document.getElementById('f-state'),
  fk = document.getElementById('f-kind'), fo = document.getElementById('f-open');
const bugRows = () => [...tbody.querySelectorAll('tr.bug')];

function apply() {
  const terms = q.value.toLowerCase().split(/\\s+/).filter(Boolean);
  let n = 0;
  for (const tr of bugRows()) {
    const d = tr.dataset;
    const ok = (!fp.value || d.project === fp.value) && (!fs.value || d.state === fs.value) &&
      (!fk.value || d.kind === fk.value) && (!fo.checked || d.open === '1') && terms.every((t) => d.text.includes(t));
    tr.hidden = !ok;
    tr.nextElementSibling.hidden = !ok || !tr.classList.contains('open');
    if (ok) n++;
  }
  document.getElementById('shown').textContent = n + ' shown';
}

// The view lives in the URL's query string (?q=…&project=…&state=…&kind=…
// &open=1&sort=…&dir=desc), the open bug in its #fragment: any view can be
// linked. Typing rewrites the URL in place, so it doesn't fill the history.
function writeParams() {
  const p = new URLSearchParams();
  if (q.value.trim()) p.set('q', q.value.trim());
  if (fp.value) p.set('project', fp.value);
  if (fs.value) p.set('state', fs.value);
  if (fk.value) p.set('kind', fk.value);
  if (fo.checked) p.set('open', '1');
  if (sortCol >= 0) { p.set('sort', ths()[sortCol].textContent.trim()); if (sortDir < 0) p.set('dir', 'desc'); }
  const qs = p.toString();
  history.replaceState(history.state, '', (qs ? '?' + qs : location.pathname) + location.hash);
}
function readParams() {
  const p = new URLSearchParams(location.search);
  const pick = (sel, v) => { sel.value = [...sel.options].some((o) => o.value === v) ? v : ''; };
  q.value = p.get('q') ?? '';
  pick(fp, p.get('project') ?? ''); pick(fs, p.get('state') ?? ''); pick(fk, p.get('kind') ?? '');
  fo.checked = p.get('open') === '1';
  const c = ths().findIndex((th) => th.textContent.trim() === p.get('sort'));
  if (c >= 0) sortBy(c, p.get('dir') === 'desc' ? -1 : 1);
  apply();
}
const update = () => { apply(); writeParams(); };
for (const el of [q, fp, fs, fk, fo]) el.addEventListener('input', update);
for (const b of document.querySelectorAll('.counts button')) b.addEventListener('click', () => { fs.value = b.dataset.state; update(); });

function setOpen(tr, open) {
  tr.classList.toggle('open', open);
  tr.nextElementSibling.hidden = !open || tr.hidden;
}

// Show a bug by uuid, id or alias: clear the filters if they hide it, open it.
function reveal(name) {
  if (!name) return;
  let tr = document.getElementById(name);
  if (!tr || !tr.classList.contains('bug')) {
    const uuid = NAMES[name.toLowerCase()];
    if (!uuid) return;
    history.replaceState(null, '', '#' + uuid);
    tr = document.getElementById(uuid);
  }
  if (tr.hidden) { q.value = fp.value = fs.value = fk.value = ''; fo.checked = false; update(); }
  setOpen(tr, true);
  tr.scrollIntoView({ block: 'start' });
}
const hashName = () => decodeURIComponent(location.hash.slice(1));
window.addEventListener('hashchange', () => reveal(hashName()));
window.addEventListener('popstate', () => { readParams(); reveal(hashName()); });

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  const tr = e.target.closest('tr.bug');
  if (a && !tr) { e.preventDefault(); const h = a.getAttribute('href').slice(1); history.pushState(null, '', '#' + h); reveal(h); return; }
  if (!tr || String(getSelection())) return;
  if (a) e.preventDefault();
  const open = !tr.classList.contains('open');
  setOpen(tr, open);
  if (open) history.replaceState(null, '', '#' + tr.id);
});

// Sort by a column; a second click reverses. Detail rows move with their bug.
var sortCol = -1, sortDir = 1;
const ths = () => [...document.querySelectorAll('#bugs th')];
function sortBy(c, dir) {
  sortCol = c; sortDir = dir;
  for (const h of ths()) h.removeAttribute('aria-sort');
  ths()[c].setAttribute('aria-sort', dir > 0 ? 'ascending' : 'descending');
  const key = (tr) => { const td = tr.children[c]; return td.dataset.k ?? td.textContent; };
  const rows = bugRows().sort((a, b) => dir * key(a).localeCompare(key(b), undefined, { numeric: true }));
  for (const tr of rows) { const d = tr.nextElementSibling; tbody.append(tr, d); }
}
for (const th of ths()) th.addEventListener('click', () => {
  const c = +th.dataset.col;
  sortBy(c, c === sortCol ? -sortDir : 1);
  writeParams();
});

readParams();
reveal(hashName());
`;

if (import.meta.main) {
  const args = process.argv.slice(2);
  let pub = false, dir = join(ROOT, "site");
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--public") pub = true;
    else if (args[i] === "--out" && args[i + 1]) dir = resolve(args[++i]);
    else {
      console.error("usage: bun run site [--public] [--out dir]");
      process.exit(2);
    }
  }
  const commit = Bun.spawnSync(["git", "rev-parse", "--short", "HEAD"], { cwd: ROOT }).stdout.toString().trim();
  const t = await load();
  const html = renderSite(t, { public: pub, commit });
  mkdirSync(dir, { recursive: true });
  await Bun.write(join(dir, "index.html"), html);
  const n = pub ? t.bugs.filter((b) => b.disclosure === "public").length : t.bugs.length;
  const out = join(dir, "index.html"), rel = relative(process.cwd(), out);
  console.log(`site: ${n} bugs${pub ? " (public)" : ""} → ${rel.startsWith("..") ? out : rel} (${Math.round(html.length / 1024)} KiB)`);
}
