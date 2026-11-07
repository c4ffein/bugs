# G15-order-io-seq-misc on Scotch 7.0.18
No 7.0.18 commit touches a G15 source file (only 38006ee5, a s_l.tex section). All 9 patches apply unchanged;
rebased onto v7.0.18 with `to :` dates bumped to 02 nov 2026.
GRA-03 still-present -> still-present ran high -> 0001
GRA-14 still-present -> still-present ran medium -> 0008
GRA-22 still-present -> still-present ran medium -> 0007
GRA-25 still-present -> still-present ran low -> 0003, 0004
GRA-27 still-present -> still-present ran info -> 0005
CLI-23 still-present -> still-present ran low -> 0002
PS-BLD-1 still-present -> still-present ran low -> 0009
PS2-G15-1 still-present -> still-present ran medium -> 0004
PS2-G15-2 still-present -> still-present ran medium -> 0007
PS2-G15-3 still-present -> still-present ran low -> 0007
PS2-G15-4 still-present -> still-present source-read info -> -
PS2-G15-5 still-present -> still-present ran info -> -
PS2-G15-6 still-present -> still-present source-read low -> -
PS2-G15-7 still-present -> still-present source-read info -> -
PS2-G15-8 inconclusive -> inconclusive partly-run low -> -
(also: 0006 = PS2-G08-2, owned by G06: gord at 4 threads 5/5 runs differ on pristine, 0/5 on the series)

| upstream commit | verdict |
|---|---|
| 38006ee5 Document SCOTCH_graphPartOvlView (s_l.tex) | unrelated to G15 items (G16 reviews it; only moves PS2-G15-7 line numbers) |
| ff9d5a54 intLoad (G07) | correct per G07; removes the intLoad overflow buckets of our 7.0.17 .ord fuzz |

Three most important facts
1. Every kit reproduces on pristine 7.0.18 32/64-bit (orderLoad heap overflows, graphCoarsen use-after-free and false
   success under injected OOM, block ordering non-termination in graph and mesh, esMUMPS orderLoad/orderSave overflows,
   graphDump output that does not compile, SCOTCH_graphOrderCheck accepting a bad permtab) and passes on the series.
2. check_scotch_graph_order, _graph_coarsen, _graph_dump, check_prog_gord, _gord_block, _gotst, _mord, check_libesmumps
   pass 32/64-bit; 0 warnings (libscotch and esmumps); stylecheck clean on our lines; git am on a fresh clone OK.
3. Nothing in 7.0.18 overlaps this series; it can be sent as is.

Could not do
- PS2-G15-4 (unchecked shrinking realloc) not re-injected; PS2-G15-8 mechanism still not established.

User must decide
- PS2-G15-5 (fix the manual or accept unsorted .ord lines), PS2-G15-7 (implement or drop the documented Fortran
  ordering I/O routines), PS2-G15-6 (gotst, tools owner): unchanged from 7.0.17.
