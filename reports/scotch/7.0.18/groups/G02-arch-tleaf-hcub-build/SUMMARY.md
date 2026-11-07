# G02-arch-tleaf-hcub-build on 7.0.18

- COR-06 still-present -> partially-fixed ran medium -> 0005 (+0002)
- COR-07 still-present -> partially-fixed ran medium -> 0003 (+0002)
- COR-19 partially-fixed -> partially-fixed ran low -> 0006
- API-10 still-present -> partially-fixed ran medium -> 0003 0004 0005 0006
- CLI-24 still-present -> still-present ran low -> 0006
- PS-API-2 still-present -> still-present ran low -> 0001
- PS-API-3 still-present -> partially-fixed ran low -> 0006
- PS-API-4 still-present -> still-present partly-run medium (was info) -> 0004
- PS2-G02-arch-tleaf-hcub-build-1 still-present -> still-present ran medium -> 0007
- PS2-G02-arch-tleaf-hcub-build-2 still-present -> still-present source-read low -> -
- PS2-G02-arch-tleaf-hcub-build-3 still-present -> still-present source-read low -> -
- PS2-G02-arch-tleaf-hcub-build-4 still-present -> still-present source-read info -> -
- PS2-G02-arch-tleaf-hcub-build-5 not-a-bug -> not-a-bug source-read info -> -
- New: PS3-G02-1 (high) 0002, PS3-G02-2 0003, PS3-G02-3 0004, PS3-G02-4 (high, hang) 0008, PS3-G02-5 0009, PS3-G02-6 (hang, not patched)

| upstream commit | verdict | note |
|---|---|---|
| 18911e4f61 tleaf size overflow/checks | wrong | levlnbr<1 and ltleaf duplicates fixed; but new loader frees double free ('tleaf 2 4 1 x', clean in 7.0.17), overflow test is UB and accepts 'tleaf 2 100000 1 50000 1' (size 705032704), boundary loop reads sizetab[-1], API failures leave freed arrays for SCOTCH_archExit, API ltleaf lacks boundary/permnbr checks |
| 29c96822e0 hcub API bound | incomplete | upper bound only; SCOTCH_archHcub(-1)/(0) accepted; int shifts remain (64-bit hcub 31..62 garbage) |
| 22c9c42e87 hash table never full | wrong | Build side fine, but Merge table sized by fixed domains only -> infinite loop (SCOTCH_graphMapFixed onto cmplt 64 with 2 fixed vertices) |
| 6f734966ab terminal domain error codes | incomplete | new error return leaks the hash table; invalid parts still hang Build first |
| 3df345a8de mesh/torus overflow (library_arch.c) | incomplete | see G03 (same flawed idiom) |
| 48efdddafb ARCHSIZE int type | unrelated | Fortran; scotchfarchltleaf still missing |
| 16c3478a94 comment fix | unrelated | - |

Three most important facts:
1. Two regressions of high severity: 18911e4f double-frees on every malformed tleaf/ltleaf file, and 22c9c42e makes SCOTCH_graphMapFixed() loop forever when parts > ~4x fixed domains (gdb: kgraph_map_rb.c:428). Fixed by 0002 and 0008 (one line: size by domnnbr + dfixmax).
2. His overflow guard '(a * b) < a' (tleaf here, mesh/torus in G03) is undefined behaviour and lets wrapped sizes through; 0003 uses 'a > ANUMMAX / b'.
3. He chose inline checks over our 7.0.17 shared Build routines; the rebased series keeps his structure (0002-0005 are small fixes on his code) and drops archHcubArchBuild() from 0006.

Series: 9 commits on v7.0.18 ('git am' clean alone; 0 warnings 32/64; stylecheck: hits only on pre-existing lines of arch_deco2.c, dgraph_build_hcub.c, kgraph_band.c, amk_fft2.c). 0001 library.h; 0002-0005 tleaf/ltleaf; 0006 shifts (rebased 7.0.17 0003, kgraph_map_rb.c hunks dropped); 0007 cmpltw free (7.0.17 0004); 0008-0009 kgraph_map_rb.c.
Checks (flock, 32 and 64-bit): check_scotch_arch, _arch_build, _arch_deco, check_arch_deco, check_prog_amk/amk_grf/acpl/atst/gmk/gmap, check_scotch_graph_map(_copy), check_prog_gpart_remap all pass (only pre-existing UBSan pointer-offset notes in bgraph_bipart_ml.c:195 / kgraph_map_ml.c:239, other groups' files).

Cross-group: G01 -> G02 -> G03 apply with 'git am -3' (arch_sub.c header date shared with G01; library_arch.c with G03; arch_cmpltw.c 0007 sits next to G03's cmpltw sum check). G03's 7.0.17 copy of the cmpltw free fix (Refs PS2-G25-1) was dropped in favour of 0007 here; the G25 owner should not carry a third copy.

Could not do: no regression test added (an ltleaf case in test_scotch_arch.c would conflict with G01's ARCHNBR edits; a fixed-vertex case with few fixed vertices and many parts needs a new test_scotch_graph_map variant); PS-API-4 malloc-failure paths read only (no plain tree built for G02); PS3-G02-6 (invalid fixed parts hang) belongs to the mapping API group.

User must decide: whether kgraph_map_rb.c fixes (0008/0009) stay in G02 or move to the RB-mapping group (G12); whether SCOTCH_archHcub(0) should be rejected (0006 does, like 'hcub 0' in files).
