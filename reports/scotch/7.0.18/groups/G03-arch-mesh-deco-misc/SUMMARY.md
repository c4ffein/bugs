# G03-arch-mesh-deco-misc on 7.0.18

- COR-14 fixed -> fixed ran medium -> -
- COR-16 still-present -> partially-fixed ran high -> 0002
- COR-20 still-present -> partially-fixed ran low -> 0004 (+0003)
- COR-21 still-present -> partially-fixed ran medium -> 0001 (+0002)
- COR-28 still-present -> fixed ran info -> - (7.0.17 0004 dropped: 611f39c3 identical)
- PS-COR-1 still-present -> still-present ran medium -> 0002
- PS2-G03-1 still-present -> still-present ran low -> 0002
- PS2-G03-2 still-present -> still-present partly-run info -> - (trigger removed by a7692fbb)
- New: PS3-G03-1 (3df345a8 checks overflow / torus API unchecked) 0001; PS3-G03-2 (858ea2bc one-char names) 0003

| upstream commit | verdict | note |
|---|---|---|
| 3df345a8de mesh/torus size overflow | incomplete | meshXD 0 fixed (COR-07 half); '(a*b)<a' is UB and accepts 'mesh2D 100000 50000'; torus API accepts sizes <= 0 and torusXD 0 dims; meshX API c[0] unchecked; cmpltw sums untouched |
| a7692fbb30 deco loading more robust | incomplete | sign checks only; duplicate terminals, ancestor terminals (heap overflow), termdommax and weight overflow, type-1 tree all still open |
| 09cf49decc error return codes | correct | Build2 result propagated, fail labels |
| 858ea2bc20 dummysizes default names | wrong | NULL deref fixed, but '||' -> '&&' makes one-char file names standard streams; line test and debug block still broken |
| 611f39c389 fibo macro parameters | correct | identical to our 7.0.17 0004 |

Three most important facts:
1. Deco loading still reads/writes out of bounds in release builds (PS-COR-1 heap overflow at arch_deco.c:206, type-1 bad1.tgt at :512/:538); 0002 adds the missing checks on top of his restructured loader.
2. 3df345a8's overflow guard has the same UB/wrap flaw as 18911e4f (G02); 0001 replaces it and completes the torus/meshX API checks and cmpltw sums.
3. 858ea2bc introduced a small regression in dummysizes (one-character file names ignored); 0003 restores '||'.

Series: 4 commits on v7.0.18 ('git am' clean alone; 0 warnings 32/64; stylecheck hits only on pre-existing lines: arch_mesh.c:1051, arch_deco.c:192-197 from a7692fbb).
Checks (flock, 32 and 64-bit): check_scotch_arch, _arch_build, _arch_deco, check_arch_deco, check_fibo, check_prog_amk/amk_grf/acpl/atst/gmap all pass; deco fuzzer (300 mutations): pristine 24 signatures incl. 5 memory-safety, patched 0 memory-safety (residual signed overflows: arch_deco.c:205/211 distance averages, not covered; atst/kgraph_map_rb downstream).

Compatibility with G01 (G01 before G03): this series no longer touches arch_deco2_build.c (deco2 is not in G03's files; the 7.0.17 G03 series did not touch it either), so G01's 0005 (arch_deco2_build.c:653) and G03 share no file: G01 then G03 applies with plain 'git am' (verified). Full order G01 -> G02 -> G03 applies with 'git am -3' (verified, 18 commits): library_arch.c header date is shared with G02, and 0001's archCmpltwArchBuild2() hunk sits three lines below G02's 0007 memFree(vecwtab) fix. Combined tree (G01+G02+G03, 32-bit): 0 warnings, arch checks + check_prog_amk/atst/gmap pass (logs/combined).
Dropped from 7.0.17: 0001 cmpltw free (now G02's 0007, same diff), 0004 fibo (fixed upstream).

Could not do: no regression tests (no negative-test precedent in src/check); arch_deco.c:205/211 distance-average overflow left (needs a distance bound decision); PS2-G03-2 only read.

User must decide: whether type-1 size/weight -1 (accepted by a7692fbb) should be rejected (0002 rejects negative sizes via the tree check, keeps weights); whether SCOTCH_archTorus*() rejecting sizes < 1 is acceptable as a behaviour change (it matches the mesh builders).
