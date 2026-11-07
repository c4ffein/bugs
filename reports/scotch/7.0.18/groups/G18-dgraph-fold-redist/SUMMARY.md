# G18-dgraph-fold-redist on 7.0.18 (11 items, 7 patches on v7.0.18)
- API-04 fixed -> fixed ran high -> -
- DGR-01 still-present -> still-present ran high -> 0003
- DGR-02 still-present -> partially-fixed ran high -> 0002,0004
- DGR-04 still-present -> still-present ran high -> 0001
- DGR-10 still-present -> still-present ran medium -> 0004
- DGR-14 fixed -> fixed partly-run low -> -
- DGR-22 still-present -> still-present partly-run low -> 0003,0007
- PS-DGR-4 still-present -> still-present ran medium -> 0003,0004,0006
- PS2-G18-1 still-present -> still-present ran medium -> -
- PS2-G18-2 still-present -> still-present source-read low -> 0005
- PS2-G18-3 still-present -> still-present ran low -> -

| upstream commit | verdict |
|---|---|
| 3a10af93 set baseval early (dgraphFold2) | incomplete: twin hdgraphFold2 still frees with base 0 (SIGSEGV, m16x16_b1, np=4) -> our 0002 mirrors it there |
| 0e79c872 typo fix (hdgraphFold2 debug message) | correct; superseded by our 0003, which renumbers the message |
| 7e17084b (7.0.17) dgraphFoldComm mere receiver | still in place (dgraph_fold_comm.c:325); skewed-fold sweep 64/64 OK pristine and patched (sweep does not reach the fixed branch) |
| da4af29e dorderNew check (hdgraph_order_nd.c) | unrelated to PS2-G18-3 (release agreement at l.301-307 unchanged) |

Facts:
1. Collective errors: on pristine 7.0.18 every single-rank allocation failure of dgraphFold2/hdgraphFold2 (receiver or
   sender), dgraphRedist (4 sites) still HANGS the other ranks, and dgraphGatherAll2 crashes or disagrees (rank 0 rc=1,
   rank 1 rc=0). With our series all these runs return 1 on EVERY rank (mpirun np 2-4, LD_PRELOAD shim on one rank).
   Upstream added no release-build agreement in these files.
2. Only 3a10af93 touched the group's code; 0001, 0003-0007 re-apply (0003: one conflict on 0e79c872's message);
   0002 is shrunk to the hdgraphFold2 twin, written exactly like his dgraphFold2 change.
3. DGR-04 (user permutation to SCOTCH_dgraphRedist corrupts the graph) is untouched upstream: memcpy-param-overlap /
   'arc data do not match' on pristine 7.0.18, fixed by 0001 (32/64-bit) with a regression test.

Checks: 0 warnings 32/64-bit; check_scotch_dgraph_{redist,order,check,induce,band,coarsen}, check_strat_par pass on
both trees; stylecheck/diff --check clean; git am on a fresh clone gives the same tree.

Could not: re-run the >INT_MAX MPI count boundary (DGR-22); trigger PS2-G18-2 (debug-internal-error path only);
build a sweep that reaches 7e17084b's branch (pre-fix code also passes it).
PS2-G18-1 (hdgraphInduceList unchecked realloc, G24's file) crashes pristine and patched alike: not ours to patch here.

User must decide: whether to send unconditional release-build MPI_Allreduce agreements (0003, 0004, 0006) or ask
the maintainer for his preferred idiom (piggyback on an existing collective, as he did in 484adec3; alt B for redist).
