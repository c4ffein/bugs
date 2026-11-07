# G01-arch-sub-dist on 7.0.18

- COR-02 fixed -> fixed ran high -> -
- COR-03 still-present -> partially-fixed ran medium -> 0002 (+0001)
- COR-04 still-present -> partially-fixed ran high -> 0001
- COR-05 still-present -> partially-fixed ran high -> 0003
- COR-27 still-present -> fixed ran low -> 0004 (test only)
- PS-COR-3 still-present -> partially-fixed partly-run low -> 0001
- PS2-G01-arch-sub-dist-1 still-present -> still-present ran high -> 0005
- PS2-G01-arch-sub-dist-2 still-present -> still-present source-read info -> -
- PS3-G01-1 (new) ecaf094 double free of termtab -> 0001

| upstream commit | verdict | note |
|---|---|---|
| ecaf094ef7 sub loading/building | wrong | unconditional checks OK, but fail1 frees the already-published termtab: double free on any out-of-range/duplicate terminal (file and SCOTCH_archSub+archExit); inner Arch never archInit()ed; tree chain leak; vnumnbr 0 |
| cdee46d98b cmplt matching passes | correct | identical to our 0004 code (covers cmpltw/cmpltws); no test |
| d4b6f9976c complete arch_dist.c | incomplete | well-formed dist works (answers COR-05 design question: own the inner Arch); archDistArchFree() NULL deref on every malformed dist, inner not archInit()ed, flags not inherited, crloval 0 accepted, Build keeps ARCHFREE |
| 0d878bdd gmap test sub/dist/mesh2D | correct | passes on patched trees |

Three most important facts:
1. ecaf094 turned the 7.0.17 release-build heap overflow into a double free: 'sub 2 0 99 cmplt 4' / 'sub 2 0 0 cmplt 4' -> ASan double free (arch_sub.c:451 then 202). Fixed by publishing Build's fields only on success (0001).
2. Neither meta-loader archInit()s its inner Arch, and archDistArchFree() has no NULL check: nested/malformed sub and dist files, and malloc failure (plain-build sweep: sub_sub #5-9, dist_sub #3-10, dist_subsub #3-20, sub_tleaf/sub_cmpltw #5, dist_ok #3), free garbage or NULL. 0001/0003 make every case clean.
3. He adopted our ownership protocol (body owns inner Arch, hook frees) and answered COR-05 with "own" (our option A); our patches shrank to the defects he left (0001-0003), a test (0004) and the untaken single-terminal fix (0005).

Series (5 commits on v7.0.18, all 'git am' clean on a fresh clone; 0 warnings 32/64; stylecheck clean on our lines, arch_deco2_build.c:204,523 pre-existing):
0001 clean up sub loading/building errors; 0002 reject empty sub-architectures; 0003 complete dist loading/freeing;
0004 test: odd cmplt in test_scotch_arch (ARCHNBR 24->26; fails with a half fix); 0005 single-terminal sub-architectures (ARCHNBR ->27; fails on pristine 7.0.18).
Checks passed (32 and 64-bit, flock): check_scotch_arch, _arch_build, _arch_deco, check_arch_deco, check_prog_acpl/amk/atst/gmap (+amk_grf/gpart 32-bit).

Cross-group compatibility (G01 before G03): G03's series touches no G01 file (it no longer has a deco2 change), so G01 then G03 applies with plain 'git am'. 0005 is the only G01 change to arch_deco2_build.c (one token, line 653).
Verified: G01 -> G02 -> G03 (18 commits) apply in that order with 'git am -3' on a fresh v7.0.18 clone; G02 shares
arch_sub.c (header date + line 529) with G01, so G01+G02 needs '-3' (identical date bump), not plain 'am'.
Combined G01+G02+G03 32-bit ASan tree: 0 warnings; check_scotch_arch/_build/_deco, check_arch_deco, check_prog_amk/atst/gmap pass; all G01 kits clean (v_subtleaf too).

Could not do: no negative test in src/check (no precedent); PS-COR-3's tree-chain leak only reachable through a broken matcher (read only); v_subtleaf ('sub 2 0 1 tleaf 2 4 1 x') double frees inside the tleaf loader on G01 alone; clean once G02's 0002 is applied (18911e4f regression, G02 PS3-G02-1; verified on the combined tree).

User must decide: whether 'dist' with crloval 0 should stay loadable (0003 rejects it, as kgraphInit() does in debug mode); whether SCOTCH_archSub()'s contract is "failed Arch is empty" (0001 implements it).
