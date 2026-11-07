# G13-kgraph-fm-df-bd on Scotch 7.0.18
Series on v7.0.18: 7 commits. 0001-0005 rebased unchanged; 0006 (GRA-02) hand-rebased onto his style commits and
extended to re-read domntab (PS3-G13-1); 0007 shrunk to the call-site checks upstream 25322c9a left out.
Messages normalised from `name()' to `name()` quoting (his convention); subjects otherwise as in 7.0.17.
GRA-02 still-present -> still-present ran high -> 0006
GRA-12 still-present -> still-present ran medium -> 0005
GRA-16 partially-fixed -> partially-fixed partly-run low -> 0001
GRA-17 still-present -> partially-fixed ran low -> 0007
GRA-18 still-present -> still-present ran low -> 0004
GRA-19 still-present -> still-present ran low -> 0002 (cleanup)
GRA-20 still-present -> still-present ran low -> 0003
PS3-G13-1 new -> still-present ran medium -> 0006 (stale domntab after fallback, variable-sized targets)
PS3-G13-2 new -> still-present source-read low -> - (kgraphMapFm error paths leak work arrays)

| upstream commit | verdict |
|---|---|
| 25322c9a manage error return codes (GRA-17) | incomplete: callers at kgraph_map_fm.c:1122/1493/1630 ignore the new return; overflow at :1606 remains; adds a tab (:719) |
| 219040c8 manage bbalglbval/bbalval (G22) | correct (unrelated to GRA-16; agrees with G22) |
| 7719ce90, cf24a741 style fixes in kgraph_map_fm.c | unrelated (forced the hand rebase of 0006) |

Three most important facts
1. GRA-17 is only half fixed: with an injected realloc failure, pristine 7.0.18 prints 26 'cannot resize' errors,
   keeps refining, and ends in a heap-buffer-overflow READ at kgraph_map_fm.c:1606; the series returns the error.
2. GRA-02's fallback also invalidates the cached domntab when a variable-sized target needs more than
   min(1023, vertnbr)+1 domains: heap-use-after-free once the count is fixed; 0006 now re-reads both.
3. All kits reproduce on pristine 7.0.18 32/64-bit (GRA-02 overflow, GRA-12 hangs 3-4/8 runs, GRA-18 one-pass lag,
   GRA-20 2->8 parts) and pass on the series; check_scotch_graph_map, _map_copy, _part_ovl, check_prog_gmap,
   _gpart, _gpart_remap, and PT check_prog_dgpart, check_scotch_dgraph_check, _dgraph_band pass 32/64-bit; 0 warnings;
   stylecheck reports only upstream lines; git am on a fresh clone OK.

Could not do
- GRA-16's live PT path (bit 31 in bdgraphBipartEx/Bd) was not isolated under MPI; macro expansion run standalone.
- GRA-17 needed an in-source hook (ASan defeats LD_PRELOAD realloc failure); GRA-20's OOM leak path not injected.
- A public-API trigger for PS3-G13-1 was not constructed (internal harness only).
Observed, not ours: bgraph_bipart_ml.c:195 NULL+offset UBSan in dgpart -Cd on pristine too (G09's file).

User must decide
- Whether to fix PS3-G13-2 (kgraphMapFm leaks on every error path) with a fail: label refactor.
- kgraph_map_bd.c:121 still declares `int *` for unsigned flag macros (extra instance of GRA-16, left as is).
