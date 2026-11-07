# G21-dgraph-band-coarsen on 7.0.18 (12 items, 10 patches on v7.0.18; our 0010 dropped, 0003 shrunk)
- API-15 still-present -> fixed ran medium -> -
- API-17 still-present -> still-present ran low -> 0005,0010
- API-20 still-present -> still-present ran low -> 0004
- DGR-07 still-present -> still-present ran medium -> 0001,0002
- DGR-09 still-present -> still-present ran medium -> 0005,0010
- DGR-13 still-present -> still-present ran high -> 0007,0008
- DGR-17 still-present -> partially-fixed ran low -> 0003
- PS-DGR-1 still-present -> still-present ran medium -> 0006
- PS-DGR-5 still-present -> still-present source-read low -> 0004
- PS2-G21-1 still-present -> still-present ran medium -> 0002
- PS2-G21-2 still-present -> still-present ran medium -> 0009
- PS2-G21-3 still-present -> still-present ran low -> -

| upstream commit | verdict |
|---|---|
| 50bf0173 proper array cells for debug computations (dgraphBand2Coll/Grow2Coll bound) | correct, same bound as our 0003; ran (debug build of 7.0.17 vs 7.0.18 grow code: false 'internal error (1)' gone). Misnamed Ptop message (l.558) left -> our 0003 shrunk to it |
| 0536da09 avoid memcpy with NULL source (SCOTCH_dgraphCoarsen) | correct; ran (no UBSan report, no crash on 'ratio not met'). Our 0010 dropped (only added a redundant outer test) |

Facts:
1. Collective errors, pristine 7.0.18 vs ours (mpirun np 2/4, shim on one rank): band/grow (Coll and Ptop),
   dgraphBand, SCOTCH_dgraphBand, dgraphCoarsen init/matching/build: pristine HANGS (release agreements compiled
   out, dgraphMatchSyncColl allocation) or crashes (NULL store, freeing the caller's array, uninitialised frees);
   with our series every injected failure returns 1 (band/grow) or 2 (coarsen) on ALL ranks, except two classes
   that hang on both trees: dgraphHaloSync2 failures (G20 PS-DGR-2) and a thread-context allocation failure inside
   CONTEXTINIT() of SCOTCH_dgraphGrow (new observation, context layer, G06).
2. Upstream's two commits touch only the debug bound and the NULL memcpy; 0001, 0002, 0004-0009 and the style fix
   apply unchanged (date-only conflicts).
3. PS2-G21-2 is real on 7.0.18: a failed shrink of the coarse edge-load array gives coarsen rc=0 with
   'dgraphCheck: inconsistent global graph data'; 0009 keeps the arrays.

Checks: 0 warnings 32/64-bit; check_scotch_dgraph_{band,coarsen,grow,order}, check_strat_par, check_prog_dgord,
check_prog_dgpart pass on both trees (dgpart prints 3 UBSan 'NULL - baseval' reports at bgraph_bipart_ml.c:195,
identical on pristine INFRA/asan, G09's file); stylecheck/diff --check clean; git am on a fresh clone OK.

Could not: run a SCOTCH_DEBUG_LIBRARY2 build for the remaining debug size check of API-15 (judged not a defect).

User must decide: the unconditional release-build agreements of 0002 (band/grow) and 0008 (coarse arrays,
reverses the maintainer's explicit '#ifdef SCOTCH_DEBUG_DGRAPH1' choice), as in G18/G19.
