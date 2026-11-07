# G27-seq-tools on 7.0.18

No upstream 7.0.18 change touches any G27 item: every C file of the group is byte-identical to 7.0.17, except
graph_induce.c (33443cd1, `return     (1);` -> `return (1);` only). All 11 patches apply unchanged (`git am -3`).

## Items (ID 7.0.17 -> 7.0.18, method, severity -> patch)
- CLI-11 still-present -> still-present ran high -> 0001,0002
- CLI-12 still-present -> still-present ran medium -> 0003
- CLI-13 still-present -> still-present ran low -> 0006,0011
- CLI-14 still-present -> still-present ran low -> 0007
- CLI-16 still-present -> still-present ran low -> 0004
- CLI-17 still-present -> still-present ran low -> 0005
- CLI-18 still-present -> still-present ran low -> 0008
- PS2-G27-1 still-present -> still-present ran medium -> 0010
- PS2-G27-2 still-present -> still-present ran low -> 0009
- PS2-G27-3 still-present -> still-present ran high -> 0001
- PS2-G27-4 still-present -> still-present ran info -> -
- PS2-G27-5 still-present -> still-present source-read info -> -
- PS2-G27-6 still-present -> still-present source-read info -> -
- PS2-G27-7 still-present -> still-present ran low -> -
- PS2-G27-8 not-a-bug -> not-a-bug ran info -> -
(PS2-G27-5: not covered by G28 0007 either, unpatched; PS2-G27-7: G10/G11 file)

## Upstream commits reviewed
| commit | verdict | note |
|---|---|---|
| 33443cd1 Style fix (graph_induce.c) | unrelated | style only; our 0001 now writes `return (1);` like it |
| 0d878bdd three-level composite test | unrelated to G27 items | our test lines rebase cleanly next to it (its Makefile map-name swap is reported in G30) |
| 635741dd / 97adde87 (src/check/CMakeLists.txt) | unrelated | context only |

## Three most important facts
1. Every G27 defect reproduces on pristine 7.0.18 (32 and 64-bit), with the same sanitizer reports as on 7.0.17.
2. The 11 rebased patches fix all of them on 7.0.18; 0 warnings on both trees; G27 check targets pass under flock.
3. Only change to the series: the two new `return     (1);` lines (0001, 0010) now read `return (1);`, his 7.0.18 habit
   (33443cd1); header dates bumped to 02 nov 2026.

## Could not do
- CLI-17 fuzzer not re-run (parser byte-identical). CMake twin of the new tests checked by G29/G30 builds, not here.

## User must decide
- PS2-G27-4 (Tulip ids based) and PS2-G27-8 remain design questions; no patch.
