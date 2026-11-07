# G09-bgraph-df-ga-fm on 7.0.18 (library files byte-identical to 7.0.17; 9 commits apply unchanged, dates bumped)
- GRA-26 still-present -> still-present ran info -> 0004
- SEP-04 still-present -> still-present ran high -> 0002
- SEP-05 fixed -> fixed ran high -> -
- SEP-09 still-present -> still-present ran medium -> 0001
- SEP-10 still-present -> still-present ran medium -> 0005
- SEP-12 still-present -> still-present ran medium -> 0006 + 0007
- SEP-14 still-present -> still-present ran medium -> 0009
- PS-SEP-5 still-present -> still-present partly-run low -> 0005
- PS2-G09-1 still-present -> still-present ran medium -> 0003
- PS2-G09-2 still-present -> still-present ran medium -> 0008
- PS2-G09-3 still-present -> still-present ran medium -> 0007
- PS2-G09-4 still-present -> still-present source-read medium -> - (alt for G13, still applies)
- PS2-G09-5 still-present -> still-present partly-run medium -> 0009

| commit | subject | verdict |
|---|---|---|
| 635741dd | parallel build with older Bison (CMakeLists.txt) | unrelated |
| 0d878bdd | test for three-level composite architecture (Makefile, CMakeLists.txt) | unrelated (our test lines merge cleanly) |

Three most important facts
1. Every kit reproduces on pristine 7.0.18 and passes patched (32/64-bit); SEP-09 realloc index moved 16 -> 8-10.
2. TSan: GA 36/33 reports pristine, 0 with the series (with G08 too); SEP-05 hash unchanged.
3. Series applies unchanged; combined order G06, G08, G09, G15 0006, G10 applies cleanly.
Checks: check_scotch_graph_map, check_prog_gpart, check_prog_gmap, check_scotch_context x 1/4 threads x det 0/1 x 32/64-bit: 32/32 rc=0; 0 warnings both widths; stylecheck clean.
Not done: NaN-injection cases of SEP-14/PS2-G09-5 not rebuilt (byte-identical code).
User decides: nothing new.
