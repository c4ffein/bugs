# G20-dgraph-io-dmesh on 7.0.18 (9 items, 5 patches on v7.0.18; 3 of our 7 dropped, 2 shrunk/replaced)
- DGR-03 still-present -> partially-fixed ran high -> 0001,0002
- DGR-15 still-present -> fixed ran low -> -
- DGR-16 not-a-bug -> not-a-bug ran info -> -
- DGR-19 still-present -> still-present ran low -> 0003
- DGR-20 still-present -> partially-fixed ran low -> 0005
- CLI-04 still-present -> still-present partly-run medium -> 0004
- PS-DGR-2 still-present -> still-present ran medium -> -
- PS2-G20-dgraph-io-dmesh-1 still-present -> still-present ran high -> 0001
- PS2-G20-dgraph-io-dmesh-2 still-present -> still-present ran medium -> -

| upstream commit | verdict |
|---|---|
| 42e2df84 set proper error flag (dgraphLoadCent) | correct, same as half of our 0001; header errors now reach all ranks (ran) |
| 45a4de85 robustify string processing (snprintf) | correct hardening; twins mesh_io.c:133, gscat.c:181 keep sprintf (range-checked, not bugs) |
| 372a93ab memory leak at allocation and freeing (dmeshLoadAdm) | correct, superset of our 0004 (dropped); LeakSanitizer clean |
| e1cfdb64 free based array in all cases (dmeshLoadAdm) | correct, simpler than our 0007 (dropped: re-applying it would base twice) |
| 484adec3 OOM if hash table cannot be resized (dmeshDgraphDual) | incomplete: collective for the hash resize (ran np=3: all rc=1), but the edge array extension failure ('out of memory (6)') in the same loop still returns alone -> peers HANG in dgraphBuild2 (ran np=3) -> new 0005 uses his trick |
| 635741dd parallel build with older Bison (CMake) | unrelated; our adm2dgr link fix rebased on its context |

Facts:
1. Collective errors: 484adec3 is upstream's only collective error fix here and it is correct (piggybacks on
   dgraphBuild2's Allgather, no extra communication); our new 0005 extends it to the sibling site (pristine: HANG,
   ours: rc=1 on all 3 ranks). Halo failures (PS-DGR-2, PS2-G20-2) still HANG on both trees (not patched).
2. Distributed loaders: negative counts still hang (np=2) or load silently (negative edge count, rc=0), and bad arc
   ends still load (rc=0) on pristine 7.0.18; fixed by 0001 (shrunk to the count checks) and 0002 (unchanged).
3. DGR-19 (pending Isends + stray abort message, second load hangs) is untouched upstream; 0003 fixes it (ran).

Checks: 0 warnings 32/64-bit; check_libparmetis_{dual,v3}, check_scotch_dgraph_{check,redist}, check_strat_par,
check_prog_dgtst, check_prog_dgscat-dggath pass on both trees; stylecheck/diff --check clean; git am OK. (64-bit
libparmetis_v3 prints 4 UBSan 'NULL - baseval' reports at bgraph_bipart_ml.c:195 with bump_b1.grf: identical on
pristine INFRA/asan64, G09's file, not ours.)

Could not: build with CMake (CLI-04 link line read only); run PS2-G19-4 (loader leak) from here.

User must decide: PS-DGR-2 / PS2-G20-2 (halo-exchange allocation failures hang every caller: redist, induce,
coarsen, save): unconditional Allreduce in dgraphHaloSync2 (alt A, hot path) vs pre-allocated scratch (alt B).
