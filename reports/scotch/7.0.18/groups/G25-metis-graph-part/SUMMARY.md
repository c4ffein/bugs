# G25-metis-graph-part on 7.0.18

CLI-02    still-present -> fixed            ran   high   -> - (test kept in 0003)
CLI-03    still-present -> partially-fixed  ran   high   -> 0003
CLI-06    still-present -> still-present    ran   high   -> 0004
CLI-07    still-present -> still-present    ran   medium -> 0003
CLI-08    still-present -> still-present    ran   high   -> 0002
CLI-19    still-present -> still-present    ran   medium -> 0005
PS2-G25-1 still-present -> still-present    ran   high   -> 0001
PS2-G25-2 still-present -> still-present    source-read info -> -
PS3-G25-1 new (regression from 22c9c42e)    ran   high   -> 0007

| upstream commit | subject | verdict |
|---|---|---|
| ac868d8504 | NULL ubvec in V5 PartGraph (Recursive, despite subject) (CLI-02) | correct |
| b72baf2017 | MeTiS ubvec ratios -> Scotch tolerance (CLI-03) | incomplete: no ubvec>1 check, test still passes 0.05 (-> -0.95), ParMETIS twin untouched, ncon>1 unstrided |
| 22c9c42e87 | kgraph_map_rb hash table capacity (G12 file in our list) | wrong in kgraphMapRbVfloMerge: hangs |
| 6f734966ab | kgraph_map_rb terminal domain error codes | not reviewed in depth (G12) |

Three most important facts
1. 22c9c42e (kgraph_map_rb.c, G12's file but in our list) sizes the merge hash table from the number of fixed domains
   only, yet inserts every mapped domain first: SCOTCH_graphMapFixed with 1 fixed vertex onto K32 never returns
   (repro/PS3-G25-1/fixmerge.c, gdb: kgraphMapRbVfloMerge kgraph_map_rb.c:430, dfixmax=1), 32/64-bit. 0007 restores
   `domnnbr + dfixmax`. Tell G12.
2. b72baf20's arithmetic is right (1.05 -> 0.05, 1.001 -> 0.001, NULL -> 0.01; ncon>1 uses ubvec[0] only), but values
   <= 1.0 are accepted silently: ubvec 1.0 -> tolerance 0, 0.05 -> -0.95, -0.5 -> -1.5 all return METIS_OK; the
   in-tree test_libmetis.c:176 still passes 0.05, so check_libmetis_v5 now runs with a negative tolerance.
3. CLI-06 (options -1 => endless loop), CLI-07, CLI-08 (INT_MIN + double free), CLI-19, PS2-G25-1 untouched in 7.0.18.

Series: 7 commits on v7.0.18 (0001-0006 = 7.0.17 series rebased, 0003 message rewritten for the remainder; 0007 new),
`git am` proven, 0 warnings 32/64, all kits pass on both trees, stylecheck/diff --check clean on our lines.


Could not do: 6f734966 only skimmed (G12's); no src/check test for PS3-G25-1 (test_scotch_graph_map's fixed-size
targets have <= 5 domains; adding a case belongs with G12).

User must decide: keep the shared _SCOTCH_METIS_V5_PartGraph() restructuring (needed by 0004/0005) vs minimal checks
on top of his two wrappers (option D); ubvec[0] == 1.0: 7.0.18 accepts it (zero tolerance), 0003 rejects it like
values < 1 (MeTiS documents ratios > 1).
CHECKS (32 and 64, all rc=0): check_libmetis_v3/_v5, check_libmetis_dual_v3/_v5/_f_v3/_f_v5, check_scotch_arch, check_scotch_graph_map, check_scotch_graph_part_ovl, check_prog_gmap, check_libparmetis_v3 (rerun with METISLIB=-lptscotchparmetis).
