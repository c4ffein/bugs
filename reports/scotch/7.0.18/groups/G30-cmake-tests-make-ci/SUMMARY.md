# G30-cmake-tests-make-ci on 7.0.18

No 7.0.18 commit fixes a G30 item; 14 patches apply (am -3), 0015 added. Makefile ASan 32/64: 0 warnings, make
check (leaks on)/ptcheck/escheck rc=0; CMake patched32 172/172, patched-cm64 (64-bit, suffix _64, FULL) 170/170.

## Items (ID 7.0.17 -> 7.0.18, method, severity -> patch)
- BLD-03 still-present -> still-present source-read high -> 0009
- BLD-05 still-present -> still-present ran low -> 0007
- BLD-07 still-present -> still-present ran medium -> 0010
- BLD-08 still-present -> still-present ran medium -> 0008
- BLD-09 still-present -> still-present ran low -> 0005
- BLD-10 still-present -> still-present ran low -> 0006
- BLD-11 still-present -> still-present ran low -> 0002
- BLD-14 still-present -> still-present ran medium -> 0010
- BLD-21 still-present -> still-present partly-run low -> 0003,0004
- PS2-G30-1 still-present -> still-present ran medium -> 0001
- PS2-G30-2 still-present -> still-present ran low -> 0004
- PS2-G30-3 still-present -> still-present ran info -> -
- PS2-G30-4 still-present -> still-present ran low -> 0011
- PS2-G30-5 still-present -> still-present ran low -> 0013
- PS2-G30-6 still-present -> still-present ran low -> 0012
- PS2-G30-7 still-present -> still-present ran info -> 0014
- PS3-G30-1 (new) -> still-present ran info -> 0015

## Upstream commits reviewed
| commit | verdict | note |
|---|---|---|
| 635741dd (src/check, src/libscotch CMake) | unrelated to G30 items | scotchf.h now a scotch source, but still DEPENDS library.h (BLD-09 stays); BLD-12 side: see G29 |
| 0d878bdd three-level composite test | incomplete | test and CMake twin right; Makefile swaps bump_h3/bump_sdm2d map names (PS3-G30-1, 0015) |
| 97adde87 CMake test names | correct | test_scotch_graph_N -> test_scotch_graph_map_N, no duplicates; subject typo "updqte" only |

## Three most important facts
1. 7.0.18 did not change the $(?) library link rules: an incremental `make scotch` with a .shlib Make.inc still
   produces a 3-symbol libscotch.so (repro/PS2-G30-1/verify18.txt); 0001 fixes it (1355 kept).
2. The new CI job options (64-bit + suffix + full determinism) still break the pristine 7.0.18 CMake build
   (PS2-G30-4/6); with the series it builds and passes 170/170.
3. Test-list patches rebased cleanly next to 0d878bdd/97adde87; G29+G30 combine with git am -3.

## Rebase notes
- 0010 no longer runs ci/check_sources.sh (G29's script, hook moved to G29 0005); 0014's bogus duplicate
  "to :" header line removed; dates 02 nov 2026.
## Could not do
- BLD-03 needs GitLab + secret (source-read); no MinGW/Haiku/FreeBSD host (BLD-21, PS2-G30-2).
## User must decide
- BLD-03: rotate the token already archived in sonar artifacts; PS2-G30-3 left unpatched.
