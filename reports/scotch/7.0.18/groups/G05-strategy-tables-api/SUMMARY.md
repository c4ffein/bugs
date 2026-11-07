# G05-strategy-tables-api on 7.0.18

GRA-06 still-present -> partially-fixed ran high -> 0002 (shrunk to hdgraph/hmesh twins)
GRA-13 still-present -> partially-fixed ran medium -> 0001 (shrunk to hdgraph/hmesh twins)
GRA-15 still-present -> still-present source-read low -> - (G13's GRA-02 commit)
API-07 still-present -> still-present ran high -> 0003
API-23 still-present -> still-present partly-run low -> 0005, 0006
CLI-01 still-present -> still-present ran high -> 0004
PS-DMO-2 still-present -> still-present ran low -> G04 0009
PS2-G05-strategy-tables-api-1 still-present -> still-present ran medium -> -
PS2-G12-2 still-present -> still-present ran medium -> 0007
PS2-G13-1 still-present -> still-present source-read medium -> 0007

| upstream commit | what | verdict |
|---|---|---|
| 8609a5cb | default ordering for empty `else`, hgraph only | incomplete: hdgraph (all ranks hang) and hmesh (SEGV in orderPeri) twins unfixed (ran) |
| 075a77a6 | mdeg STRATPARAMINT, hgraph only | incomplete: hdgraph/hmesh tables still STRATPARAMDOUBLE over a Gnum (ran: conditions evaluate false) |
| 7a2e069c | hdgraph debug condition check | correct (twins: G24 0006) |
| 25322c9a | kgraph_map_fm.c resize error codes | incomplete (G13's file): callers at kgraph_map_fm.c:1122/1493/1630 ignore the new return value; adds a TAB at :719 |
| 96a44b3d | dmapSave sanity check | unrelated to PS2-G05-1 (NULL parttab) |

Three most important facts
1. Both upstream strategy-table fixes are sequential-only: with 7.0.18, `dgord -o'/(vert>100000)?s;'` hangs all ranks and
   `mord -o'/(vnod>100000)?s;'` crashes; `mdeg` is still read as a double in the dgraph and mesh tables (ran, 32/64 bit).
2. Nothing else in the group changed upstream; API-07 stack overflow, CLI-01 (-m discarded), API-23 (SIGSEGV after Init
   failure, malloc injection on a plain build), PS2-G12-2 NULL part array: all reproduced on 7.0.18.
3. The series is now on bare v7.0.18: G13's GRA-02 and G04's 0009 are no longer copied here; 0003's test hunk no longer needs
   G04's test commit as context.

Could not do: GRA-15 fallback path not reached by any reproducer (read only); PS2-G13-1 needs an injected failure inside the
mapping under ASan (read only). Alternative diffs not re-cut (options unchanged).

User must decide: merge order with G24 (both touch hdgraph_order_st.c: G05 0002 adds the else-less default, G24 0002 makes the
STRATNODEEMPTY call return its status); whether 1e30-style ratios must be accepted by the 32-byte builders (API-07).

WORK: /tmp/claude-0/-home-user-playground/925301e5-494b-5a33-b598-8eaa63dd5c1d/scratchpad/work18/G05-strategy-tables-api
