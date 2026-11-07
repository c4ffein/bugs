# G07-common-misc on 7.0.18

COR-08 still-present -> still-present ran medium -> 0002, 0003
COR-15 partially-fixed -> fixed ran medium -> 0001 (test only; fix dropped), twin 0006
COR-17 partially-fixed -> still-present ran medium -> 0004
COR-18 fixed -> fixed ran low -> -
PS-COR-2 still-present -> still-present ran medium -> 0004
PS-SEP-6 still-present -> still-present ran low -> 0005
PS2-G07-1 still-present -> still-present ran low -> 0003
PS2-G07-2 still-present -> still-present source-read info -> -
PS2-G07-3 still-present -> still-present source-read info -> -
NEW PS3-G07-1 (extra.json) SCOTCH_graphTabLoad fscanf wraps out-of-range numbers, ran, low -> 0006

| upstream commit | what | verdict |
|---|---|---|
| ff9d5a54 | intLoad: unsigned accumulation, unconditional overflow check | correct (32/64 bit, fuzz 0/900000 each, no cost) |
| 635741dd | CMake: drop *_h custom targets (older Bison) | unrelated to this group; our CMake test rule builds and passes with ctest |
| 0d878bdd | new check target in check Makefile/CMake | unrelated; our check_common_integer rule rebased cleanly |

Three most important facts
1. ff9d5a54 is right: exact bound ((INTVALMAX+9)/10 then > INTVALMAX), no false rejects, 0 returned on overflow exactly like a
   syntax error, which all 161 callers already treat as failure ('!= 1', sums, '1 - intLoad'). 4294967298 is rejected on 32-bit
   and loaded exactly on 64-bit; INT64 overflow rejected. Only change: -INTVALMAX-1 is now rejected (accepted by luck before).
   Cost: intLoad CPU on a 72 MB graph 0.357-0.358 s (7.0.18) vs 0.359-0.365 s (7.0.17), -O3: none.
2. Twins not routed through intLoad still wrap: SCOTCH_graphTabLoad (fscanf; patched, 0006), Chaco header (sscanf %ld: header
   '4294967298 1' loads a 2-vertex graph), HB/MatrixMarket atol, gout fscanf (listed, owners G14/G27).
3. comm.c and the (de)compression code are unchanged: the fork-mode deadlock (rc=124), duplicate stdout, buffer leak, and the
   one-rank-exits-before-collective hangs (64-bit, 3 ranks, injected malloc failures) all reproduce on 7.0.18; series fixes them.

Could not do: bz2/lzma paths (no headers in the container). PS2-G07-2/-3 read only. INFRA's v7.0.18/src/check/data/m4x4.grf
was overwritten by another process at 08:46; runs use copies from `git show v7.0.18:...`.

User must decide: keep our intLoad test as its own commit; whether to also convert the Chaco/HB/MatrixMarket loaders (G14).

WORK: /tmp/claude-0/-home-user-playground/925301e5-494b-5a33-b598-8eaa63dd5c1d/scratchpad/work18/G07-common-misc
