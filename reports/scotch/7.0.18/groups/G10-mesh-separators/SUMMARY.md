# G10-mesh-separators on 7.0.18 (library files byte-identical to 7.0.17; 8 commits apply unchanged, dates bumped)
- SEP-02 still-present -> still-present ran high -> 0002
- SEP-03 still-present -> still-present ran high -> 0004
- SEP-15 still-present -> still-present ran medium -> 0005
- SEP-18 partially-fixed -> partially-fixed source-read low -> 0007
- SEP-22 still-present -> still-present partly-run low -> 0005 + 0006
- PS-SEP-2 still-present -> still-present source-read medium -> 0008
- PS-SEP-4 still-present -> still-present ran medium -> 0003
- PS2-G10-1 still-present -> still-present ran high -> 0001
- PS2-G10-2 still-present -> still-present source-read medium -> - (alt)
- PS2-G10-3 inconclusive -> inconclusive source-read low -> - (alt)
- PS2-G10-4 still-present -> still-present ran medium -> G09 0001
- PS2-G10-5 still-present -> still-present source-read medium -> 0008
- PS2-G10-6 still-present -> still-present source-read low -> -
- PS2-G10-7 still-present -> still-present source-read low -> 0004
- PS2-G10-8 still-present -> still-present source-read info -> -

| commit | subject | verdict |
|---|---|---|
| 635741dd | parallel build with older Bison (CMakeLists.txt) | unrelated |
| 0d878bdd | test for three-level composite architecture (Makefile, CMakeLists.txt) | unrelated (our test lines merge cleanly) |

Three most important facts
1. SEP-02 (SEGV mesh_induce_sepa.c:230), SEP-03 (stack overflow), PS-SEP-4 (internal error (2)), PS2-G10-1 (64-bit shift)
   and SEP-15 (invalid free / leak, full 617-allocation scan, indices moved) reproduce on pristine 7.0.18; all pass patched.
2. G10 applies last in the combined series (after G06, G08, G09, G15 0006) and alone on v7.0.18.
3. New test file test_scotch_mesh_order.c: header 'from' date set to 02 nov 2026 as well.
Checks: check_scotch_mesh_order, check_prog_mord, check_prog_gord, check_prog_gotst, check_prog_gpart_overlap, check_scotch_graph_order x 1/4 threads x 32/64-bit: 24/24 rc=0; 0 warnings both widths.
Not done: debug-object kits (SEP-18, PS-SEP-2, PS2-G10-5, SEP-22 graph part) not rebuilt: byte-identical code.
User decides: nothing new.
