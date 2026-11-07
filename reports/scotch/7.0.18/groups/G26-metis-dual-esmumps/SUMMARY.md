# G26-metis-dual-esmumps on 7.0.18

CLI-05    still-present -> still-present    ran          medium -> 0001, 0002 (rebased to bare context)
CLI-09    still-present -> still-present    ran          medium -> 0005
CLI-10    still-present -> still-present    ran          high   -> 0006
CLI-15    still-present -> still-present    partly-run   medium -> 0003
CLI-22    still-present -> still-present    ran          low    -> 0006
BLD-17    still-present -> still-present    source-read  medium -> 0008
BLD-19    still-present -> still-present    ran          low    -> 0007
PS2-G26-1 still-present -> still-present    ran          medium -> 0004
PS2-G26-2 still-present -> still-present    source-read  low    -> -
PS3-G26-1 new (from 9c51d9df)               ran          low    -> 0009

| upstream commit | subject | verdict |
|---|---|---|
| 9c51d9df85 | edge count overflow check in graphLoad | incomplete: test after a signed overflow (UB, UBSan graph_io.c:224); negative degrees pass; meshLoad twin unchecked |
| 45a4de8591 | robustify string processing (snprintf) | correct (4 bytes exact for propval <= 111) |
| 5796220d   | Style fix in graph_io_chac.c | unrelated (spurious conflict with 0004 only) |
| 7a5d07b3   | CMake: link ptesmumps with ptscotch | correct, CMake only, does not touch BLD-17 (make) |

Three most important facts
1. Nothing in this group was fixed by 7.0.18; every kit still fails on pristine 7.0.18 (ASan for CLI-05/09,
   LD_PRELOAD fault injection on a non-sanitized 7.0.18 build for CLI-10/15/22, PS2-G26-1) and passes with the series.
2. Seen from the dual-graph/esMUMPS side, 9c51d9df/45a4de85 change nothing: the METIS dual routines build graphs in
   memory, esMUMPS tests load valid files. But 9c51d9df's `degrval < 0` is evaluated after `degrval += edgenum`
   (signed overflow, UB), and mesh_io.c:246 has the same unchecked addition (0009 fixes both, check before adding).
3. Our 7.0.17 0001/0002 depended on G25's _SCOTCH_METIS_optionGet() and G17's BLD-20 test checks; both were
   rebased onto bare v7.0.18 (inline option reads, OBJTYPE -1 = default; own element-range check in the Fortran test).

Series: 9 commits on v7.0.18, `git am` proven, 0 warnings 32/64 (ASan) and on the plain trees; stylecheck flags only
pre-existing lines. 

Could not do: BLD-17 race not re-sampled (shared machine); Mesh2Dual malloc/memFree mismatch and debug-path leak read
only; PS2-G26-2 not re-swept.

User must decide: merge order with G25 (if G25 0004 lands first, switch the two inline option reads in 0001/0002 to
_SCOTCH_METIS_optionGet()) and with G17 0002 (the Fortran dual test is touched by both; trivial 3-way merge).
CHECKS (32 and 64, all rc=0): check_libmetis_dual_v3/_v5/_f_v3/_f_v5, check_libesmumps (rerun with -lesmumps), check_prog_gtst, check_scotch_mesh_graph, check_prog_mord, check_prog_gpart, check_libparmetis_v3.
