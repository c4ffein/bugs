# G23-vdgraph-dorder on Scotch 7.0.18
DMO-02 still-present -> partially-fixed ran high -> 0003 (tree writer still overflows; non-root basing)
DMO-04 still-present -> still-present ran medium -> 0002 (+ G22 0003 twin)
DMO-05 still-present -> still-present ran medium -> 0001
DMO-12 still-present -> fixed ran low -> 0007 (messages only)
DMO-13 still-present -> fixed ran low -> - (our 0006 dropped)
DMO-14 still-present -> fixed partly-run low -> - (b260ba75 = our 0007 verbatim, same patch-id)
DMO-15 still-present -> partially-fixed ran medium -> 0004 (+0006 producer)
PS-DMO-1 not-a-bug -> not-a-bug ran info -> -
PS2-G23-1 still-present -> still-present ran low -> 0005
PS2-G23-2 still-present -> still-present ran medium -> 0006
PS2-G23-3 still-present -> still-present ran info -> 0007
PS2-G23-4 still-present -> still-present source-read low -> -
PS2-G23-5 inconclusive -> inconclusive ran medium -> - (masked by a dgraphGhst2 SIGSEGV, G19)
PS2-G23-6 still-present -> still-present ran medium -> - (G20 halo design)
extra: PS3-G23-1 (59c9a31c bases an uninitialized pointer on non-root), PS3-G23-2 (2d1b7e39 messages/date)
| upstream commit | subject | verdict |
|---|---|---|
| 2d1b7e39 | local load tests in vdgraphCheck | correct tests, wrong messages (incomplete) |
| aace01bf | save/restore local separation loads | correct (= our 0003 store part) |
| 2ae72b81, 6034c290 | absolute imbalance in vdgraph sq/ml | correct (= our 0002) |
| addcd163 | dorderSaveBlock2 leak + checked outputs | correct; putc x4 and final flush unchecked |
| 5b43f6d2 | remove bogus vdgraph Sq debug check | correct, but bdgraph twin keeps it (PS3-G22-1) |
| cc440aca | Vdgraph debug flag names | incomplete (:450-452 still BDGRAPH2) |
| 59c9a31c | base dorderSave label array | incomplete + new UB on non-root, 3-space indent |
| 96a44b3d | dmapSave count test | incomplete (range only; NULL part arrays) |
| b260ba75 | dorderCblkDist returns -1 | correct (ours verbatim) |
| 635741dd, 0d878bdd | check build / new test (CMake/Makefile context) | unrelated |
Three most important facts
1. DMO-02 is only half fixed: dorderSaveTree2 (dgord -T) still writes past its label array (ASan
   heap-buffer-overflow, glibc 'munmap_chunk(): invalid pointer' on pristine 7.0.18), and 59c9a31c offsets the
   never-initialized vlbltax of non-root processes (UBSan dorder_io.c:144). 0003 fixes both.
2. addcd163 'almost all outputs': still unchecked are the putc separators (dorder_io_block.c:106,110,117,121)
   and the final buffered write (no fflush/ferror: a small ordering to /dev/full returns 0); non-root
   processes return 0 because dorderSaveTree2 agrees only in debug builds.
3. Absolute-imbalance: dgord -Cd outputs bit-identical before/after on 13 cases (np 2-4); upstream's new
   vdgraphCheck test does catch the old store (DEBUG_ALL proof), under the message 'vgraphCheck: ... sizes'.
Series (7 commits): 32/64-bit ASan + DEBUG_ALL builds 0 warnings; -O2 -Wall -Wextra clean; ptcheck 32/64 rc=0
(only UBSan hit: bgraph_bipart_ml.c:195, G09); DEBUG_ALL dgraph subset in checks/; DMO-02/04/05/12/13/15 runs
clean; stylecheck/diff --check clean on added lines; git am on fresh clone OK. 0011 dropped (5b43f6d2).
Could not do: DMO-14 error path (MPI fault); the tie case of the ABS commits; re-observe PS2-G23-5 (pristine
crashes in dgraphGhst2 first); the new dgord check line is a smoke test (passes on pristine without sanitizers).
User must decide: DMO-15 empty-or-complete test (alt/DMO-15-B) vs his range test; whether 0006 (G24's
kdgraph_map_rb_part.c) goes with this group; whether to also check putc/fflush in the ordering writers.
