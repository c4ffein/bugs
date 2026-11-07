# G14-graph-loaders on Scotch 7.0.18
Series on v7.0.18: 9 commits. 0001-0004 (MM, isdigit, geometry dim, graphCheck labels) rebased unchanged; 0005
(graphLoad) hand-rebased onto 9c51d9df/45a4de85 and now also bounds labels; 0006 (Chaco) onto the style commit;
0007 = remainder of our HB patch on top of 0ef275a0; 0008, 0009 new (PS2-G14-1).
GRA-04 partially-fixed -> partially-fixed ran high -> 0005
GRA-07 still-present -> still-present ran medium -> 0001
GRA-08 still-present -> still-present ran medium -> 0006
GRA-09 still-present -> still-present ran medium -> 0003
GRA-10 partially-fixed -> partially-fixed ran medium -> 0005
GRA-11 still-present -> partially-fixed ran medium -> 0007 (+0009)
GRA-24 still-present -> still-present ran low -> 0002
PS-API-5 still-present -> still-present ran low -> 0004
PS2-G14-1 still-present -> still-present ran low -> 0005, 0007, 0008, 0009
PS2-G14-2 still-present -> partially-fixed ran low -> 0005

| upstream commit | verdict |
|---|---|
| 9c51d9df edge count overflow check (Z. Li) | incomplete: tests the sign after a signed overflow (UBSan graph_io.c:224); negative degrees still load |
| 0ef275a0 HB sanity check (GRA-11) | incomplete: accepts row n+1 (`> vertnnd`), column pointers unchecked, digit/format overflow left |
| 45a4de85 snprintf of proptab | correct (propval already bounded to [0,111] in graphLoad; dgraph twins done too) |
| ff9d5a54 intLoad (G07's review) | correct per G07; our `!= 1` tests unaffected |

Three most important facts
1. Fuzz, 1500 identical mutants per tree (.grf via gtst, Chaco, MM, HB via gcv): pristine-32 133 hits/9 buckets
   (heap overflows in Chaco/MM, HB and Chaco EOF spins, UB overflows), series-32 3/1 (edge-load-sum overflow, generic);
   pristine-64 53/6, series-64 34/3, all three ASan "out of memory" on 16-300 GB file-declared sizes.
2. 0ef275a0's off-by-one: an HB file with a row index of n+1 loads on 7.0.18 and yields a graph that fails graphCheck;
   a decreasing column pointer loads and passes graphCheck with arcs silently dropped.
3. All 7.0.17 kits still reproduce on pristine 7.0.18 except bad HB rows 0/99 (now rejected); the series passes all kits,
   26 check_* runs (gtst, gbase, gmk, gord, gout, gscat, gpart, graph_induce/dump/map/order, libmetis_v5, amk_grf)
   on 32/64-bit, 0 warnings, stylecheck only on upstream lines, git am on a fresh clone OK.

Could not do
- SCOTCH_graphGeomLoad* geometry files (.xyz) were exercised by the GRA-09 kit only, not fuzzed.
- HB/Chaco header values above LONG range and HB `(Gnum) atol` truncation on 32-bit Gnum are not handled (listed).
- Twins in dgraph_io_load.c (G20) and mesh_io*.c (G11 0007/0010) are other series.

User must decide
- PS-API-5: reject duplicate labels in graphCheck (ours) or harden consumers.
- 0009 rejects HB formats with fields wider than 80 characters (none valid); 0005 rejects labels equal to GNUMMAX.
- PS2-G11-mesh-struct-io-7 (graph_io_scot.c unlabeled base) is visible once 0003 is in; left unpatched (behaviour change).
