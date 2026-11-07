# G12-overlap-kgraph-rb on Scotch 7.0.18
Series on v7.0.18: 8 commits (was 9). Dropped 0001 (= f2633428). 0003 replaced by a fix of 22c9c42e's regression;
0005 shrunk to the hash-table leak; 0006 hand-rebased onto the new Merge signature; 0007 rebased onto bare context.
GRA-01 still-present -> fixed ran high -> 0002 (fixes the regression its upstream fix introduced, + test)
GRA-05 still-present -> still-present ran high -> 0001
GRA-21 still-present -> still-present ran low -> 0003
GRA-23 still-present -> partially-fixed ran medium -> 0004
SEP-01 still-present -> still-present ran high -> 0006
SEP-17 still-present -> still-present ran low -> 0007
API-22 still-present -> fixed ran low -> - (dropped, upstream identical)
PS2-G12-1 still-present -> still-present ran medium -> 0005
PS2-G12-3 still-present -> still-present ran medium -> 0008
PS2-G12-4 still-present -> partially-fixed source-read info -> -
PS3-G12-1 new -> still-present ran high -> 0002 (hang introduced by 22c9c42e; = PS3-G25-1 = PS3-G02-4; keep ours, drop G25 0007 and G02 0008)
PS3-G12-2 new -> still-present ran low -> 0004 (leak on 6f734966 error path; = PS3-G02-5, ours more complete than G02 0009)

| upstream commit | verdict |
|---|---|
| 22c9c42e hash table never full (GRA-01) | wrong: Merge table sized from dfixmax only, hangs with 1 fixed vertex and >= 9 parts |
| 6f734966 terminal domain error codes (GRA-23) | incomplete: Merge error return leaks hashtab; VfloSplit still debug-only |
| f2633428 return after OOM in SCOTCH_graphPartOvlView (API-22) | correct (identical to ours) |
| 9e015dfe mapping distance from proper domain | correct (G16 file; archDomTerm there still unchecked) |
| a09f3249 components/distances/diameters | incomplete (G16 API-14: one-vertex component counts 1) |
| 635741dd, 0d878bdd (check build context) | unrelated |

Three most important facts
1. 22c9c42e introduces a hang in every fixed-vertex mapping/partitioning with few fixed vertices and many parts
   (kgraph_map_rb.c:428, 32/64-bit, default strategy; e.g. 1 fixed vertex, 64 parts). The shipped tests miss it;
   our 0002 adds mappptr->domnnbr to the bound and a test that hangs on pristine 7.0.18.
2. GRA-01's zero-load trigger and API-22 are fixed; GRA-23's two lead instances are fixed but the Merge error path leaks
   (LeakSanitizer on the GRA-23 kit input); 0004 fixes it.
3. All other kits (GRA-05 SEGV, GRA-21 leak, SEP-01 NULL deref, SEP-17 lost vertices, PS2-G12-1, PS2-G12-3
   non-determinism) reproduce unchanged on 7.0.18 and pass on the series; check_scotch_graph_map, _part_ovl, _map_copy,
   check_prog_gpart, _gmap, _gpart_remap pass 32/64-bit; 0 warnings; git am on a fresh clone OK.

Could not do
- GRA-21's allocation-failure path was not re-run (no plain, non-ASan build this round); invalid-input path was.
- Did not patch library_graph_map_view.c (G16) nor kgraph_band.c's int shift (PS2-G12-4, unreachable).

User must decide
- Report PS3-G12-1 upstream urgently (7.0.18 regression affecting SCOTCH_graphPartFixed/MapFixed users).
- Message wording: upstream uses "invalid part array"; our remaining patch keeps his wording.
