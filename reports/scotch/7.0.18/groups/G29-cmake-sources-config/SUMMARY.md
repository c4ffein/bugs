# G29-cmake-sources-config on 7.0.18

CMake 3.28.3, copies of v7.0.18 (cm/base32, base64) and of the series (cm/patched32, patched64): make -j3 and
ctest 172/172 on all four (one pre-existing -Wstringop-overflow warning in test_scotch_graph_induce.c, all four).

## Items (ID 7.0.17 -> 7.0.18, method, severity -> patch)
- BLD-01 still-present -> still-present ran high -> 0001,0002,0003,0004,0005
- BLD-02 still-present -> still-present ran medium -> 0006
- BLD-06 still-present -> still-present ran low -> 0010
- BLD-12 still-present -> still-present ran medium -> 0007
- BLD-13 still-present -> still-present partly-run low -> 0008
- BLD-24 still-present -> still-present ran low -> 0009
- BLD-25 still-present -> fixed ran info -> -
- PS-BLD-2 still-present -> still-present ran low -> 0010
- PS2-G29-1 still-present -> still-present ran low -> 0002
- PS2-G29-2 still-present -> still-present ran low -> 0003
- PS2-G29-3 still-present -> still-present ran low -> 0004
- PS2-G29-4 still-present -> still-present ran medium -> G30:0011
- PS3-G29-1 (new) -> still-present ran low -> 0007

## Upstream commits reviewed
| commit | verdict | note |
|---|---|---|
| 635741dd parallel build with older Bison | incomplete | parser rules now in scotch only (right); scotch.h ordered by dummysizes (right); metis.h/metisf.h/esmumps.h left with two owners each: generated twice under make -j (metisf.h is a regression) |
| 49149c10 typos in src/CMakeLists.txt | correct | BLD-25 fixed, verified by probe + IDXSIZE=48 configure |
| 7a5d07b3 link PT-ESMUMPS with PT-Scotch | correct | consistent with LIBPTSCOTCHERR; no-op with --as-needed (libptscotch dropped from NEEDED) |
| 0d878bdd / 97adde87 (src/check) | see G30 | |

## Three most important facts
1. 635741dd fixes the Bison race but violates CMake's one-owner rule for shared generated headers: race loop
   10 x make -j3 gives metis.h twice 10/10, metisf.h 4/10 (new, PS3-G29-1), esmumps.h 6/10. Rewritten 0007
   (metis_h + esmumps_h custom targets) -> once in 10/10.
2. BLD-25 is fixed upstream (our 0010 dropped); every other G29 item still reproduces on 7.0.18 and the
   rebased series fixes it (nm 0/6 -> 6/6 symbols, suffixed install consumer, Open MPI detection, exports).
3. The checker's CI hook moved from G30's 0010 into G29's 0005: G30 alone referenced a script it did not add.

## Rebase notes
- 0006 date conflict only; 0007 rewritten (new subject); 0010 dropped; dates 02 nov 2026; G29+G30 combine (am -3).

## Could not do
- No CMake 3.10-3.17 for BLD-13 (floor checked with 3.28 only); no FreeBSD host for BLD-24's macros.

## User must decide
- 0007 re-adds two custom targets that 635741dd deliberately removed; alternative (b) avoids them but
  orders two unrelated libraries. BLD-13 floor 3.18 drops older distributions (alt b: 3.14).
