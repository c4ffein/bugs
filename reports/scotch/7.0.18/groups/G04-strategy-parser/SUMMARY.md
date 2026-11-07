# G04-strategy-parser on 7.0.18

COR-01 still-present -> still-present ran high -> 0002 (+0010 test)
COR-12 fixed -> fixed ran medium -> -
COR-13 still-present -> partially-fixed ran medium -> 0005 (rewritten on top of 088a1279) (+0010)
COR-22 still-present -> still-present ran medium -> 0001 (+0010)
COR-23 still-present -> still-present ran low -> 0003, 0004 (+0010)
COR-25 fixed -> fixed ran low -> - (column base: 0008)
COR-26 still-present -> partially-fixed ran low -> 0006 (shrunk to the -1 divisor), 0007 (+0010)
PS2-G04-strategy-parser-1 still-present -> still-present ran low -> 0004
PS2-G04-strategy-parser-2 still-present -> still-present ran info -> 0008
PS2-G04-strategy-parser-3 still-present -> still-present ran high -> 0009
PS2-G04-strategy-parser-4 still-present -> fixed ran info -> - (4d47bfde)
PS2-G04-strategy-parser-5 still-present -> still-present ran info -> -

| upstream commit | what | verdict |
|---|---|---|
| 088a1279 | swap rows of stratTestSave parenthesis table | incomplete: equal-priority right operands (a-(b-c) -> a-b-c) and enum order != grammar priority ('+'='-', '%'>'*'); rt.c 675/2000 round-trip mismatches remain |
| c778efa6 | propagate output errors in stratTestSave | correct |
| 13e4dee6 | modulus by zero -> error (int and double) | incomplete: INTVALMIN % -1 still SIGFPE (ran 32/64 bit); literals unchecked |
| 7a2e069c | hdgraph debug test '&&' -> '\|\|' | correct; twins hgraph/hmesh/vmesh in G24 0006 |
| 4d47bfde | regenerate last_resort parser files | correct (bison output byte-identical) |
| 635741dd | CMake parser rules (older bison) | no effect on our grammar commits: CMake + bison 3.8.2 builds them, 0 warnings |

Three most important facts
1. The grammar (parser_yy.y) is untouched in 7.0.18: COR-01 NULL deref, COR-22 (incl. empty scalar `f{move=}`), COR-23 leaks all still
   present. Mutation fuzzer on 7.0.18: pristine 2086/2400 sanitizer hits, our series 0/2400 (seeds 1 and 2).
2. 088a1279 fixes only the reported example; our 0005 now keeps his table and adds a grammar priority table and '<=' for right
   operands (0/5000 mismatches); the test string changed to one that still fails on 7.0.18.
3. 13e4dee6 leaves `INTVALMIN % -1` trapping; 0006 is reduced to that guard.

Could not do: nothing blocking. Alternative diffs of unchanged options (COR-01 B/C, COR-22 B, COR-23 B, COR-26 B/C) were not re-cut.
INFRA's v7.0.18/src/check/data/m4x4.grf was overwritten by another process at 08:46 (deco file); G04 runs predate it.

User must decide: COR-13 style (his minimal-parentheses table, our 0005, vs always-parenthesize alt A); whether to print doubles
with '%.17g' (PS2-5); last_resort files will need his release-time regeneration after the grammar commits.

WORK: /tmp/claude-0/-home-user-playground/925301e5-494b-5a33-b598-8eaa63dd5c1d/scratchpad/work18/G04-strategy-parser
