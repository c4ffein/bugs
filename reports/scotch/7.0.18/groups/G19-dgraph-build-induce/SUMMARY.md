# G19-dgraph-build-induce on 7.0.18 (14 items, 7 patches on v7.0.18; 4 of our 11 dropped as fixed upstream)
- DGR-05 still-present -> fixed ran medium -> -
- DGR-06 still-present -> fixed ran medium -> -
- DGR-08 still-present -> still-present ran medium -> 0005
- DGR-11 still-present -> still-present ran medium -> 0006
- DGR-12 still-present -> still-present ran medium -> 0003,0002
- DGR-18 still-present -> fixed ran low -> -
- DGR-21 still-present -> fixed ran low -> -
- PS-DGR-3 still-present -> still-present ran low -> 0004
- PS2-G19-1 still-present -> still-present ran low -> 0001
- PS2-G19-2 still-present -> still-present ran medium -> 0002
- PS2-G19-3 still-present -> still-present source-read low -> 0005
- PS2-G19-4 still-present -> still-present source-read low -> -
- PS2-G19-5 still-present -> still-present source-read low -> -
- PS2-G19-6 still-present -> still-present source-read low -> -

| upstream commit | verdict |
|---|---|
| 79a50459 read proper array cells (dgraphBuild2) | correct, identical to our 0004 (dropped); ran: failing rank 3/4 no longer hangs |
| b08bc63e read proper error flag (dgraphInduce2) | correct, identical to our 0007 (dropped); ran |
| b626b1b8 base end of loop (dgraphMatchCheck) | correct, byte-identical to our 0001 (dropped); ran |
| 4a56ae3f prevent double free (dgraphBuildGrid3D) | correct, same as our 0002 (dropped); ran. Grid builder's own OOM still hangs (PS2-G19-1) |
| 484adec3 OOM if hash table cannot be resized (dgraph_build.c part) | correct: documents the -1 error-code trick in dgraphBuild2 (see G20) |
| 635741dd / 0d878bdd (src/check CMake/Makefile) | unrelated; our test additions rebase without conflict |

Facts:
1. Collective errors, pristine 7.0.18 vs ours (mpirun np 2-4, shim on one rank): dgraphBuild2 and dgraphInduce2
   sentinels now work upstream (all ranks rc=1). Still broken upstream and fixed by us: dgraphBuildGrid3D own OOM
   (HANG -> all rc=1, 0001), dgraphBuild3 label OOM/duplicate label (HANG -> all rc=1, 0002), dgraphGhst2 (SIGSEGV
   -> all rc=1, 0005). A dgraphHaloSync2 failure inside dgraphInduce2 hangs on both (G20's PS-DGR-2).
2. The remaining commits (0001-0007) apply unchanged on 7.0.18 (date-only conflicts); headers bumped to 02 nov 2026.
3. The new/extended tests fail on pristine 7.0.18 ('invalid built graph', 'wrong check result (case 1)') and pass
   on the patched 32/64-bit trees (check_scotch_dgraph_build, check_scotch_dgraph_check).

Checks: 0 warnings 32/64-bit; check_scotch_dgraph_{build,check,induce,coarsen,band,grow,order,redist},
check_strat_par pass on both; stylecheck/diff --check clean; git am on a fresh clone gives the same tree.

Could not: run PS2-G19-3..6 (leaks / other groups' files: source-read only).

User must decide: unconditional release-build agreements in dgraphBuild3 (0002) and the new MPI_Allreduce in
dgraphBuildGrid3D (0001, same pattern as dgraphBuildHcub), and the stricter dgraphCheck (0006) which now rejects
user graphs with edge loads <= 0, out-of-range ends or ends in numbering holes.
