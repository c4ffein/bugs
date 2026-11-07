# G22-bdgraph on Scotch 7.0.18
DMO-03 still-present -> partially-fixed ran low -> 0001 (NULL part array no longer based)
DMO-09 still-present -> fixed ran medium -> - (219040c8; our 0004 dropped)
DMO-10 fixed -> fixed ran low -> -
DMO-11 still-present -> fixed partly-run low -> - (identical to our 0005, dropped)
DMO-18 partially-fixed -> partially-fixed ran info -> 0004 (default case unconditional; release -O2 warning)
DMO-19 still-present -> still-present ran info -> 0005, 0006
PS-DMO-3 fixed(combined) -> still-present ran low -> - (G13's common.h commit not taken upstream)
PS2-G22-1 still-present -> still-present ran medium -> 0002
PS2-G22-2 still-present -> still-present ran low -> 0005
PS2-G22-3 still-present -> still-present partly-run low -> 0006
PS2-G22-4 still-present -> still-present ran info -> G23 0007
PS2-G22-5 inconclusive -> still-present ran low -> - (CLI file)
PS2-G22-6 still-present -> still-present source-read info -> - (3rd site found)
extra: PS3-G22-1 (Sq twins now disagree on partial failure), PS3-G22-2 (bgraphBipartSt uses SCOTCH_DEBUG_VGRAPH2)

| upstream commit | subject | verdict |
|---|---|---|
| 219040c8 | manage bbalglbval/bbalval | correct (better than our 0004) |
| 64883044, d12fafc0 | absolute imbalance in sq/ml reductions | correct (= ours) |
| aa24a7cb | debug flag name in bdgraphBipartMlCoarsen | incomplete (case still debug-only: -O2 warning) |
| 23caa258 | error return cells and clean-up in bdgraphBipartSq | incomplete (NULL basing left; twin divergence) |

Three most important facts
1. 23caa258 made bdgraphBipartSq's error handling collective (no more hang/SIGSEGV in the scan), but keeps a
   fatal 'internal error' on partial failure while 5b43f6d2 removed the same check from vdgraphSeparateSq: the
   Sq twins now disagree (PS3-G22-1; alt/DMO-03-A-partial-failure-check-debug-only.diff).
2. bdgraphGatherAll still aborts the job on a one-process OOM in release builds (PS2-G22-1, 0002); pristine
   7.0.18 also segfaults/hangs in dgraphGatherAll2 (G18) and dgraphHaloSync2 (G20) under the same scan.
3. Absolute-imbalance commits: dgord -Cd outputs identical before/after on 13 cases; dgpart identical at np=2;
   dgpart -Cd is not deterministic at np>=3 (even the same binary), so no output change could be attributed.
   Sequential twins all compare ABS except bgraphBipartGg's thread selection (bgraph_bipart_gg.c:376, G08).

Series (6 commits on v7.0.18): 32/64-bit ASan and DEBUG_ALL builds 0 warnings; -O2 -Wall 32/64 clean; ptcheck
32/64 rc=0 (only UBSan hit: bgraph_bipart_ml.c:195, G09's); DEBUG_ALL dgraph subset (checks/dbgsubset_*.log);
bipartfi probes (DMO-03/04/09/19) clean; stylecheck and git diff --check clean on added lines; git am on a
fresh clone gives the same tree. Rebase: 0002/0003 needed only header dates; 0005 got the missing ex.c date.
Could not do
- Provoke the opposite-sign imbalance tie (DMO-11) or isolate PS2-G22-3 on pristine (crashes earlier at ml.c:150).
- PS-DMO-3 not patched here (G13 owns common.h).
User must decide
- DMO-03: keep his strict partial-failure error, or the tolerant twin-consistent alt (debug-only check).
- DMO-19: merge 0006 (MPI exchange for a feature not yet enabled) now, or hold it; 0005 is independent.
- 0004: he chose rename-only; resend the unconditional default case (fixes a release -O2 warning) or drop it.
