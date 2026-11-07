# bugs — one tracker for every bug we find

Plan, written 2026-11-06, revised the same day after review. **Phases 0
and 1 are done** (2026-11-06): 27 sources, 942 items, 464 bugs, and
`bun run conserve` passes with zero unaccounted items. See §5 for the status.

**Goal:** a single, private repository (`c4ffein/bugs`) that is **the single
source of truth** for every bug found by any of the projects (hegel-c's
property tests, PyScotch's audits and tests, reading code by hand), in
Scotch, Linux and libhegel, with **no bug lost** in the move and none lost
afterwards. After the move:

- new bugs are filed **here**, and only here;
- PyScotch keeps only its own Python binding bugs;
- hegel-c keeps only what makes hegel-c better: its reproducers (pins), its
  rediscovery corpus and its run log. They point at bugs here by uuid.

**Tooling:** Bun (TypeScript), no build step, no dependencies. The scripts
only **read and check**: `Bun.TOML.parse` reads TOML and `JSON.parse` reads
PyScotch's `findings.json` (both checked on 2026-11-06). No script writes
TOML. Bug files, import records and sweep triage are written by hand (in
practice by a model), and `lint` / `conserve` catch the mistakes. When a
script finds something missing, it prints what to add.

## 1. The rule that makes "no lost bugs" checkable

A bug can be lost in two ways: it never makes it into the tracker, or it gets
dropped or merged away inside it. Both are prevented by **conservation**:

1. **Every source is registered**, with a snapshot (repo, commit, path,
   sha256) and the number of items it contains, counted by its importer.
2. **Every item of every source gets exactly one disposition**: mapped to a
   bug (by uuid, new or existing), or `out-of-scope` with a reason (e.g. "a
   Python binding bug, stays in PyScotch", "a corpus target, stays in
   hegel-c"). Records that move here but aren't bugs (submissions) are
   `moved`, to a path that must exist. Two items describing the same bug map
   to the same bug; that's how duplicates are recorded, not by dropping one.
3. **`bun run conserve` fails** unless, for every source,
   `items == mapped + moved + out-of-scope`. It prints each unaccounted item.
4. **Bugs are never deleted.** A bug only changes state. A bug that turns
   out to duplicate another keeps its file, with state `duplicate` and a
   `duplicate-of` link, so its uuid still resolves from anywhere that cites
   it. Merging keeps every source reference (`source` is a list).
5. **Import is one-shot.** `bugs` is the source of truth, so there's no
   re-sync: each source is snapshotted once, at a commit, imported, and then
   frozen (it becomes a pointer in Phase 4). Nothing new is added to the old
   ledgers after their import.
6. **Bugs found after the move** are filed here directly and need no
   `source` entry; conservation only concerns imported sources.

Unstructured mentions (a bug in a TODO line, a commit message, a saved
session) can't be counted exactly, so they get a **sweep** instead: a search
that produces candidates, each triaged into a bug or "not a bug", with the
triage list kept in the repo (see §3.4).

## 2. Inventory: every place a bug lives today

Counts checked on 2026-11-06, then re-checked by the Phase 0 importers
(`data/sources/registry.toml`, `test/importers.test.ts`). The importers must reproduce them exactly
before anything else; a mismatch means the importer, not the source, is
wrong. Counts given as `~` or `≥` here are made exact in Phase 0 and frozen
in the registry.

### 2.1 hegel-c (`c4ffein/hegel-c`, `main` at 11b87e3 plus uncommitted work)

The uncommitted work wasn't committed: the hegel-c sources are snapshotted
from the working tree with `dirty = true`, and their sha256 pins what was
read.

| Source | Items | Becomes |
|---|---|---|
| `docs/findings.toml` `[[finding]]` | 28 | 14 linux, 14 scotch. reported 3, patch-ready 8, confirmed 7, withdrawn 5, fixed-upstream 3, suspected 2. All 28 become bugs, the 5 withdrawn ones too (state `withdrawn`) |
| `docs/findings.toml` `[[submission]]` | 5 | field `state`, not `status`: merged 2, changes-requested 1, draft 1, planned 1. Move here |
| `submissions/<id>/v<N>/` | 3 folders | patches exactly as sent; some are GPL kernel patches (keep their license). Move here |
| `docs/findings/<id>.md` | 5 | write-ups. Move here, next to their bug |
| `docs/corpus.toml` `[[target]]` | 22 | **stays in hegel-c.** 20 upstream-fixed bugs (rediscovery targets, keyed by `fixed_by`): `out-of-scope`. 2 mirror our own findings (keyed by `finding`, no `fixed_by`): mapped to those bugs |
| `docs/runs.toml` | 10 runs, 53 results | **stays in hegel-c**; its finding references are rewritten to uuids in Phase 4. Not a source: it names bugs, it doesn't hold any |
| `tests/irl/*/pins/*.conf` | 40 | **stay in hegel-c** (its scripts run them); referenced here as witnesses |
| `docs/upstream/*.md` | 2 | drafts for hegeldev/hegel: a collection-size request (`out-of-scope`, a feature request), and the libhegel float internal error (mapped) |
| `TODO.md` | 1 bug | the libhegel float internal error (`FloatChoice::simplest`, ~3% of runs, `HEGEL_SEED=40`), in no ledger. Becomes `libhegel-float-simplest-nonzero` |
| GitHub issues | 0 | enabled, unused |

### 2.2 PyScotch (`c4ffein/pyscotch`, `main`, the only branch)

Everything about Scotch moves here, `upstream/` wholesale. PyScotch keeps
its Python binding bugs.

| Source | Items | Becomes |
|---|---|---|
| `upstream/reports/7.0.17/findings.json` `findings` | 192 | ids like `COR-01`, `GRA-02`, `SEP-01`; many keep a third-party review's original ids. Check whether entries also carry the review's *wording* (see §6) |
| `upstream/reports/7.0.18/findings.json` `findings` | 192 (same ids) | statuses: still-present 109, fixed 44, partially-fixed 37, not-a-bug 2. The importer checks the two files have **the same id set**, not just the same count. The two files become one bug per id, with two `[presence]` columns; the 2 not-a-bug entries become bugs with state `not-a-bug` |
| `upstream/reports/7.0.17/findings.json` `new` | 158 | **missed by the first inventory.** PyScotch's own Scotch findings, by `local_id` (`PS-COR-1`, `PS2-G04-…`): still-present 148, not-a-bug 4, inconclusive 4, fixed 2 |
| `upstream/reports/7.0.18/findings.json` `new` | 189 | the 158 above plus 31 new ones: still-present 178, partially-fixed 4, not-a-bug 3, inconclusive 3, fixed 1. Folded with 7.0.17 the same way. `inconclusive` maps to state `suspected` |
| `upstream/QUESTIONS_FOR_SCOTCH_TEAM.md` | 26 entries (21 `##` entries, 1 under "Suggestions", 4 bullets under "Resolved upstream") | **a second tracker**: 7.0.11–7.0.16-era findings (strategy-parser crashes, determinism, `SCOTCH_graphOrderCheck` ignoring `permtab`…), some marked FIXED; **cites none of the `findings.json` ids**, so each needs mapping or a new bug |
| `docs/FINDINGS.md` | 13 | 5 Scotch rows (the same bugs as QUESTIONS.md entries: mapped), 6 PyScotch binding bugs and 2 process findings (`out-of-scope`, they stay in PyScotch) |
| `docs/COLORING_BUG_RESOLUTION.md` | 1 | a **Scotch** bug (`SCOTCH_graphColor`, fixed in 7.0.11, also a QUESTIONS.md "resolved" bullet): mapped |
| `upstream/scotch-static-analysis-history/` | snapshot `claude_2026-07-13`: 12 files, count pending | prose: the leads are listed by hand per file (Phase 1). Explicitly **unverified leads**: bugs with state `lead`, never `confirmed` |
| `upstream/repro/` | 30 group directories, 298 kits | reproducers; `findings.json` 7.0.18 cites 266 distinct `repro/` paths. Move to `witnesses/scotch/`; each referenced from its bug |
| `upstream/reports/*/` other files | 1,597 files (the two `findings.json` included) | patches, alternatives, series, group audits, `qa.json`. Move to `reports/scotch/<version>/` |
| `upstream/proposals/` | README only | patches proposed upstream, per the README. Moves |
| `tasks.md` | mentions | e.g. the `PARAMVAL:error` NULL-deref crash; sweep |
| External archive (`c4ffein/static-files`) | 1 handoff archive + 1 third-party review PDF | the 7.0.17 process; cited by sha256, not copied (third-party text) |
| GitHub issues / PRs | 3, closed | agent PRs, not bugs; record as checked |

### 2.3 `c4ffein/scotch` (Scotch mirror)

| Source | Items | Notes |
|---|---|---|
| branch `hegel` (at `ff403d445b`), `REPORTS/BUG_REPORT.md`, `REPORTS/REPORT.md` | 2 documents, count pending | not on `master`; hegel-c links `BUG_REPORT.md` at commit `ff403d445b`. Easy to lose: read every branch, not just the default one |
| branch `add-output-validity-checks` (at `c01ce8f`) | 1 commit, 23 files, also open as PR 1 | check whether it carries a bug or fix not tracked elsewhere |

### 2.4 Upstream trackers (reconciled, not imported)

Scotch's GitLab (issues and merge requests from c4ffein), the Linux mailing
lists (the `lore` Message-IDs already in hegel-c's ledger), hegeldev/hegel's
issues. These are where reports go; the tracker records links to them and
their state, and a periodic check flags a report whose upstream thread
changed state.

### 2.5 Known overlaps (to merge, keeping both sources)

From hegel-c's `PYSCOTCH_HANDOFF.md`: hegel-c's
`scotch-graphgeomloadchac-cleanup` is PyScotch's **GRA-08**, and
`scotch-kgraphmapfm-domnnbr` is **GRA-02**. Neighbors that are *not* the
same bug: hegel-c's `scotch-archsub-off-by-one` vs COR-03 / COR-04, and
`scotch-hgraphordercp-disconnected` vs GRA-25. In hegel-c, 2 corpus targets
mirror 2 findings. QUESTIONS.md vs `findings.json`: not yet mapped.

Found during Phase 1 (2026-11-06), for Phase 2:

- **`PS3-G02-4` and `PS3-G02-5` are cited but defined nowhere.** G02's
  7.0.18 `SUMMARY.md` lists them (the `SCOTCH_graphMapFixed` hang, patch
  0008; patch 0009), `PS3-G02-6` and `PS3-G12-2` cite them as related, but
  neither `findings.json` has them, and G02's patch folder has 8 patches,
  not 9. Most likely renumbered when the `kgraph_map_rb.c` fixes moved to
  G12: `PS3-G02-4` → `PS3-G12-1` (hash table sized for fixed domains only,
  infinite loop), `PS3-G02-5` → `PS3-G12-2` (hash table leak). To confirm.
- **`PS3-G02-6` and `PS3-G12-3` look like one bug filed twice**: both are the
  `kgraphMapRbVfloBuild` loop on out-of-range fixed parts, both cite G02's
  patch 0008.
- PyScotch cites some long ids in short form (`PS2-G20-2` for
  `PS2-G20-dgraph-io-dmesh-2`); the migration resolves these.
- **Likely duplicates inside PyScotch's data:** `scotch-sep-09` and
  `scotch-ps2-g10-4` (FM hash-table resize, the same defect);
  `scotch-ps-dmo-2` and `scotch-ps2-g04-strategy-parser-3` (the short
  default table in `hdgraph_order_st.c:81`).
- **Defects named inside a bundled item, with no bug of their own** (the
  item maps to its main defect): an `hmesh_order_gp` queue leak and a missing
  `edgenbr < 0` check in `mesh_io.c` (static analysis 09, "Smaller items");
  `SCOTCH_graphColor`'s return codes (01-11); a wrong `SCOTCH_stratBipart`
  name in an error message (01-13); a fixed-part value like -2 counted as
  fixed but kept free (07-5); the `stratSave` crash on a never-set strategy
  (bundled into `scotch-stratfree-undocumented`).
- **Judgement calls to review** (the reasons are in each bug's
  `[imported.<source>].reconciled`): static 08-2 mapped onto the *withdrawn*
  `scotch-ordercompute-check-o` (reproduced on 7.0.11, not on 7.0.17:
  probably fixed in between); static 10-F3 onto `scotch-dgr-01` (same
  function, different failing call); static 11-6 kept apart from
  `scotch-dmo-16` (same lines, hang vs leak); QUESTIONS.md's bgraphBipartGg
  entry onto `scotch-sep-13` (it bundles three bugs); the explicit-context
  determinism entry (new; may overlap `scotch-ps2-g06-4`, `-g08-2`,
  `-g12-3`); the "is this intended?" grammar entries (new, kind `api`).
- **Set aside as not bugs:** the Best-of-N suggestion, the PRNG modulo bias
  (static 03-4, "arguably by design").

## 3. Data model

### 3.1 Files

One TOML file per bug: `data/bugs/<project>/<id>.toml`. One file per bug
gives clean diffs, merge conflicts limited to one bug, and `git log` per bug.
TOML because hegel-c's ledger is TOML and Bun parses it natively.

```
bugs/
  PLAN.md
  package.json            bun scripts, no dependencies
  src/                    TypeScript: new, snapshot, conserve, lint, overlap, list, show, site (built); report (to do)
  test/                   bun test: the importers reproduce the §2 counts
  data/
    projects.toml         scotch, linux, libhegel
    bugs/<project>/<id>.toml
    writeups/<id>.md      long-form write-ups (hegel-c's docs/findings/)
    submissions/<id>.toml + submissions/<id>/v<N>/   (patches as sent)
    sources/              the source registry and the import records
      registry.toml       every source: repo, commit, path, sha256, item count
      <source>/items.toml one record per source item: its original id → disposition
      snapshots/          read-only copies of each imported source file (§5)
    sweeps/<date>.toml    triage of unstructured mentions
  witnesses/scotch/       kits moved from PyScotch; hegel-c pins are references
  reports/scotch/<version>/  PyScotch's per-version reports, moved as-is
```

### 3.2 Ids and uuids

Every bug has two names:

- **`uuid`**: a random UUID (v4), assigned when the bug is created and
  **never changed or reused**. It's the permanent name: PyScotch, hegel-c
  (pins, `runs.toml`, commit messages) and upstream reports cite bugs as
  `bugs:<uuid>`. Because bugs are never deleted (§1.4), every cited uuid
  keeps resolving, a duplicate included.
- **`id`**: a readable slug, `<project>-<slug>`, also the file name. It may
  be renamed; internal links and the terminal views use it. hegel-c's slugs
  are kept as they are. PyScotch's 192 entries get mechanical ids
  (`scotch-gra-02`); the title carries the meaning.

Uuids come from `bun run new <project> <slug>`, which prints a fresh uuid
and a bug skeleton to paste (a model can't make up a random uuid). `lint`
checks every uuid is well-formed and unique, and `list` / `show` accept
either name.

### 3.3 A bug

```toml
uuid      = "3f2a9c1e-…"                       # permanent, cited from other repos
id        = "scotch-kgraphmapfm-domnnbr"      # readable, <project>-<slug>
project   = "scotch"
title     = "FM arrays reallocated with a stale domain count, read past their end"
where     = "src/libscotch/kgraph_map_fm.c: kgraphMapFm()"
kind      = "oob"                              # hegel-c's list, extended as needed
confidence = "high"                            # that the bug is real
reach     = "live"
disclosure = "private"                         # private until reported upstream
state     = "reported"                         # where the bug is in its life (below)
aliases   = []                                 # other ids the sources used for it (renumberings)

# Whether the bug is in each upstream version: PyScotch's columns, generalised
[presence]
"7.0.17" = "present"
"7.0.18" = "present"

[[source]]                                     # every place it was seen; never removed
ref  = "hegel-c-findings#scotch-kgraphmapfm-domnnbr"   # <registered source>#<item key>
[[source]]
ref  = "pyscotch-7.0.18-review#GRA-02"

[[discovery]]                                  # who found it, when: one per source item that is a finding
by      = "hegel-c"
date    = "2026-10-25"
date_is = "stated"                             # or "upper-bound": git shows the record existed by then
ref     = "hegel-c-findings#scotch-kgraphmapfm-domnnbr"
[[discovery]]
by      = "Robert Perry (external review of 7.0.16)"
date    = "2026-10-07"
date_is = "stated"
ref     = "pyscotch-7.0.17-review#GRA-02"

[[witness]]                                    # something that is red while the bug is there
kind  = "hegel-c-pin"
repo  = "https://github.com/c4ffein/hegel-c"
ref   = "pending"                              # a tag once hegel-c has one
pin   = "tests/irl/scotch/pins/kgraphMapFmDomnnbr.conf"

[[fix_review]]                                 # PyScotch's upstream_fix_review, generalised
commit  = "…"
verdict = "correct"                            # correct | incomplete | wrong

[[link]]                                       # hegel-c's `related`, generalised
to  = "…"                                      # an id or a uuid
rel = "incomplete-fix-of"                      # | introduced-by | same-root-cause | masked-by | covered-by
                                               # | duplicate-of | split-into | related | distinct-from
reason = "…"                                   # why, for the links set by review
```

**Two separate fields.** `state` says where the bug is in its life;
`[presence]` says, per upstream version, whether it's there.

- `state`: `lead` (unverified) → `suspected` → `confirmed` → `patch-ready`
  → `reported` → `fixed-upstream`; or one of the closed states
  `not-a-bug`, `withdrawn`, `duplicate`, `split`; or **`unclear`**: a real
  behaviour that may be a bug, a misunderstanding on our side, or only
  worth a doc update. It needs an `unclear = "…"` line saying what's open.
- **`duplicate`**: the bug repeats another. It keeps its file, sources and
  discoveries, records `state_before_duplicate`, and has exactly one
  `duplicate-of` link to the bug it repeats.
- **`split`**: a source item that bundled several defects. The item maps to
  the split bug, which has a `split-into` link to each part (existing bugs
  or new ones). One defect at several sites is not a split.
- Links are stored one way; views show the reverse (`duplicated by`,
  `split from`). `distinct-from` records a reviewed candidate pair that is
  not a duplicate, so `lint --dups` stops listing it.
- `[presence]` values: `present`, `partially-fixed`, `fixed`. A
  `partially-fixed` column must come with a `[residue]` entry for that
  version (what remains; imported findings use that version's record title,
  which says it) and a witness red on that version.

**Status mapping at import.**

| Source status | `state` | `[presence]` |
|---|---|---|
| hegel-c finding `suspected` / `confirmed` / `patch-ready` / `reported` / `withdrawn` | same | none, unless the finding records versions |
| hegel-c finding `fixed-upstream` | `fixed-upstream` | `fixed` from the fixing version, if known |
| `findings.json` `still-present` (`findings` and `new` alike) | `reported` if the bug is in a report sent upstream, else `confirmed` (checked per bug at import) | `present` |
| `findings.json` `partially-fixed` | same rule as `still-present` | `partially-fixed` (with its residue) |
| `findings.json` `fixed` | `fixed-upstream` | `fixed` |
| `findings.json` `not-a-bug` | `not-a-bug` | none |
| `findings.json` `inconclusive` (`new` only) | `suspected` | none |
| QUESTIONS.md entry marked FIXED | `fixed-upstream` | `fixed` from the version named, if any |
| QUESTIONS.md entry, otherwise | `reported` (the file was sent to the Scotch team; check) | none |
| static-analysis history | `lead` | none |

`[presence]` is filled for Scotch only at first; Linux bugs get a kernel
release column only when a witness actually runs on one.

Submissions keep their own status (`planned`, `draft`, `sent`,
`changes-requested`, `merged`). `lint` checks the two agree: a bug with a
merged submission is `fixed-upstream`, and a `reported` bug has a sent
submission or an upstream link.

### 3.4 Sweeps

`bun run sweep` searches the source repos (all branches) for bug-shaped
mentions outside the structured sources: `TODO.md`, `tasks.md`, docs, commit
messages, saved sessions. It prints candidates, each with a stable key
(repo, path or commit, matched line), and the patterns it used live in the
repo, so the next sweep only shows what's new. The triage goes in
`data/sweeps/<date>.toml`: `bug = "<uuid>"`, or `not-a-bug` with a note.
`conserve` also fails on an untriaged candidate.

## 4. Commands (Bun)

| Command | What it does |
|---|---|
| `bun run new <project> <slug>` | print a fresh uuid and a bug skeleton |
| `bun run snapshot <checkout> [source…]` | copy each registered source of that repo into `data/sources/snapshots/`, print its sha256 and item count, and list every item that has no disposition yet |
| `bun run conserve` | the no-lost-bugs check (§1); also: every source reference resolves **against its snapshot** (so references survive Phase 4 removing the originals) |
| `bun run lint` | field and state rules (hegel-c's lint, ported), uuids well-formed and unique, links point at real bugs, `incomplete-fix-of` rules, state / presence / submission consistency, `partially-fixed` needs a residue and a witness, private bugs never in public output |
| `bun run lint --dups` | also lists candidate duplicates: same file and function, or same file and overlapping 7.0.18 line ranges, not yet linked |
| `bun run verify` | nothing lost: conserve, lint, every uuid in `data/uuids.txt` (append only) names a bug, and every bug of tag `migration-final` still exists, its `[imported]` records unchanged |
| `bun run overlap [-v]` | the review's bugs we had too: before it (by date), independently after it (hegel-c), or again while working through it |
| `bun run list [--project p] [--state s]… [--kind k] [--text t] [--open]` | terminal table, one line per bug (id, state, project, presence per version, title), sorted by project then id |
| `bun run show <id\|uuid\|alias> [--full]` | one bug in full, links in both directions, the submissions fixing it, its `[imported.*]` records (one line each; `--full` prints them) |
| `bun run site [--public] [--out dir]` | one static page, `site/index.html` by default (replaces hegel-c's findings page and PyScotch's Tracker), anchored by uuid; `--public` renders only `disclosure = "public"` bugs |
| `bun run report scotch <version>` | the per-version Scotch report (HTML, PDF, email draft), ported from PyScotch's `gen_upstream_report.py` |
| `bun test` | tests of the importers, against the counts in §2, and of the views |

**Views** (`list`, `show`, `site`; shared code in `src/views.ts`). They only
read. `--open` (and the site's "open only") leaves out `not-a-bug`,
`withdrawn`, `duplicate`, `split` and `fixed-upstream`; any other state,
`unclear` or one not known yet, counts as open. Fields the views don't know
are shown generically, so new ones need no code. Reverse links are computed
by scanning every bug: `duplicate-of` reads `duplicated by`, `split-into`
`split from`, `covered-by` `covers`, `incomplete-fix-of` `fixed incompletely
by`, `introduced-by` `introduces`, `masked-by` `masks`; `related`,
`same-root-cause` and `distinct-from` read the same both ways and show once.
The site's anchors are `#<uuid>`; `#<id>` and `#<alias>` redirect to it.
`site --public` also drops every link to a non-public bug, and fails rather
than write a page in which a non-public bug's id, uuid or alias still appears
(say, in a public bug's notes).

## 5. Migration, in order

**Phase 0: snapshots and counts. Done 2026-11-06.** 27 sources registered,
829 items counted, 14 prose sources with a count still pending (the 12
static-analysis files and the 2 `hegel`-branch reports, counted by hand in
Phase 1). Found on the way: the `new` lists in `findings.json` (347 items
the first inventory missed), 26 QUESTIONS.md entries rather than 23, and the
coloring bug being a Scotch bug.

Done as planned, except hegel-c's uncommitted work: snapshotted dirty
instead of committed. Clone
every source repo with all branches (§2), snapshot each structured source
into `data/sources/snapshots/` with its sha256, and write `registry.toml`.
Importers must reproduce the §2 counts; the approximate ones are made exact
here. Nothing is interpreted yet.

**Phase 1: import. Done 2026-11-06.** `src/migrate/phase1.ts` generates
everything from the snapshots (re-runs keep uuids): 408 bugs from the
structured sources, then 138 prose items decided one by one
(`src/migrate/reconcile.json`, each with its reason): 80 the same as an
existing bug, 56 new, 2 not bugs. Result: 464 bugs (449 scotch, 14 linux,
1 libhegel), 906 items mapped or moved, 36 set aside, 0 unaccounted.
Kits are in `witnesses/scotch/`, reports in `reports/scotch/`, the rest
of PyScotch's `upstream/` in `upstream/`. Not done yet: the first sweep
(step 8).
1. hegel-c: findings (the withdrawn ones too), submissions (with their
   folders, license headers intact), write-ups, the libhegel upstream draft
   and the TODO-only libhegel bug, which becomes
   `libhegel-float-simplest-nonzero`. Corpus targets are dispositioned
   (§2.1); corpus, runs and pins stay in hegel-c.
2. PyScotch `findings.json`, both versions folded into one bug per id with
   two `[presence]` columns; fix reviews, residues, witnesses (kits, moved
   to `witnesses/scotch/`).
3. PyScotch `QUESTIONS_FOR_SCOTCH_TEAM.md`: 23 entries, semi-manual (parse
   headings, then map each by hand to a `findings.json` bug, an existing
   bug, or a new one).
4. PyScotch `docs/FINDINGS.md` and `docs/COLORING_BUG_RESOLUTION.md`:
   dispositioned, mostly `out-of-scope` (they stay in PyScotch).
5. PyScotch static-analysis history: state `lead`.
6. The rest of PyScotch's `upstream/`: reports, proposals, moved as-is.
7. `c4ffein/scotch` branch `hegel` reports; check `add-output-validity-checks`.
8. The first sweep (§3.4).

**Phase 2: reconcile. Done 2026-11-06,** as `src/migrate/phase2.json`
(applied by the same generator; each decision with its reason):
- 3 aliases (`PS3-G02-4`, `PS3-G25-1` → `PS3-G12-1`; `PS3-G02-5` →
  `PS3-G12-2`: renumbered, not lost, per PyScotch's own notes);
- 12 duplicates: the 7 PyScotch itself calls "same defect as", and 5
  found by `lint --dups` and checked against patches and notes;
- 9 splits of bundled items, adding 7 bugs for defects that had none;
- 11 `covered-by` / `incomplete-fix-of` / `related` links, and 31
  `distinct-from` pairs (every remaining `--dups` candidate, reviewed);
- `found`/`found_by` replaced by dated `[[discovery]]` records.
Result: 480 bugs, `conserve` ok, `lint` 0 errors (56 warnings: the
`partially-fixed` columns still need their `residue` line, which is in
each record's imported notes). `bun run overlap`: of the review's 192
bugs, we had 59 before it (55 only as July static-analysis leads), and
hegel-c found 1 independently after it.

Checked 2026-11-06: `c4ffein/scotch`'s `add-output-validity-checks`
branch (`c01ce8f`, 2026-03-22, open as PR 1) is test-only: output-validity
checks added to 23 `src/check/` tests, no library change, not upstream, no
known failure marked. Nothing to import; whether the checks catch a bug
needs a build and a run (a possible later witness source). Not done from
Phase 1: the first sweep.

Then (same day): the residues of the 56 `partially-fixed` columns, the
state `unclear` for 6 bugs, and the fix of `scotch-ordercompute-check-o`
found (upstream `0ec06aff42e8`, 2026-04-15, first in 7.0.12: hegel-c had
withdrawn it because it was already fixed), as `set` in `phase2.json`.

**The generator is retired** (tag `migration-final`). The bug files are the
source of truth and are edited directly; `src/migrate/` stays as the record
of how they were made and refuses to run. `data/uuids.txt` lists every uuid
ever issued (`bun run new` prints the line to append), and `bun run verify`
checks that nothing was lost since.

**Phase 3: views and reports.** `site`, `list`, `show`: done 2026-11-06
(§4, "Views"). Still to do: port the Scotch
report generator so it reads the bug files. Until it's ported, no new Scotch
report is generated (the old ones are in `reports/scotch/`).

**Phase 4: switch over.** The old trackers become pointers: a README line in
each, and each ledger entry reduced to its `bugs:<uuid>`. hegel-c rewrites
its pins' and `runs.toml`'s finding references to uuids. PyScotch's
`upstream/` and its Scotch-bug entries are removed, each removal pointing at
the `bugs` commit that imported it. Removal comes only after `conserve`
passes against the snapshots.

**Phase 5: witnesses run.** The kits run from here. hegel-c's pins join once
hegel-c has its first tag (see hegel-c's `TODO.md`, "First tag", and
`PYSCOTCH_HANDOFF.md`, phase 2). On each new upstream release, every witness
runs and fills the new `[presence]` column; each change is flagged for
review.

## 6. Privacy and safety

- **The repo is private.** `site --public` publishes only
  `disclosure = "public"` bugs.
- **Never in a blind bug-hunt sandbox.** It names bugs. hegel-c's
  `setup-bughunt-sandbox.sh` must never copy it, and hunters never get its
  path. (Uuids alone reveal nothing, so hegel-c can cite them freely.)
- **Third-party material is cited, not copied** (PyScotch's rule): the
  external review keeps its ids and author, never its text. If
  `findings.json` entries carry the review's wording, the snapshot keeps
  only ids and our own text.
- **Licensing per file (REUSE):** our files MIT; GPL kernel patches and
  excerpts keep their upstream license and notices.

## 7. Open questions

1. Repo name: `bugs` (or `findings`).
2. hegel-c's own bugs (bugs in hegel-c itself, if any turn up): here, or in
   hegel-c? The plan assumes they stay in hegel-c, like PyScotch's.

Settled on 2026-11-06: ids are slugs plus a permanent uuid (§3.2);
PyScotch's `upstream/` moves wholesale; hegel-c's corpus, runs and pins
stay; `[presence]` is Scotch-only at first.
