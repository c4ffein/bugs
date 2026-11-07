# G06-threads-context on 7.0.18
- COR-09 still-present -> partially-fixed ran medium -> 0002 (master joins start-up barrier; 86559b85 still hangs for >=1 launched slave)
- COR-10 still-present -> partially-fixed ran medium -> 0001 (Import1 rejects < 1; spawn-0 test)
- COR-11 still-present -> fixed ran medium -> 0004 (test only)
- COR-24 still-present -> fixed ran low -> 0003 (fixes the -1 regression of 52dcf602, PS3-G06-1)
- API-02 partially-fixed -> partially-fixed ran medium -> 0005
- PS2-G08-2 still-present -> still-present ran medium -> G15 0006 / G12 0009 (7.0.17, still apply)
- PS2-G06-1 still-present -> still-present ran medium -> - (alt PS2-G06-1-a, design decision)
- PS2-G06-2 still-present -> still-present ran low -> 0005
- PS2-G06-3 still-present -> still-present source-read info -> -
- PS2-G06-4 still-present -> still-present ran low -> - (alt PS2-G06-1-a)
- extra PS3-G06-1 (new, low): coretab -1 now binds to CPU 0, outside the mask -> 0003
- extra PS3-G06-2 (new, medium): abort path destroys cond/mutex under waiting slaves, then frees their context (TSan) -> 0002

| commit | subject | verdict |
|---|---|---|
| 86559b85 | abort cleanly when cannot start thread system | wrong: master not in start-up barrier; hang (glibc) / UAF (TSan) for FAIL_AT>=2 |
| e122a7c5 | manage thread number of 0 | incomplete: = our 0001's common_thread.c hunk; Import1(0) still hangs |
| 6eb0aca3 | set affinity mask when importing threads | correct (= our 0003 code; no test) |
| 52dcf602 | core assignment always uses affinity | incomplete: -1 'not bound' now pinned to CPU 0 |
| 8027e3d8, 38006ee5 | style fix; doc of graphPartOvlView | unrelated |

Three most important facts
1. 86559b85 does not fix the COR-09 hang: thrdnbr = thrdnum counts the master, which never enters the start-up barrier, so the
   slaves never leave threadWaitBarrier1; Exit3 counts their barrier arrivals as terminations and destroys cond/mutex under them
   (glibc: hang in pthread_cond_destroy; TSan FAIL_AT=3: 6 reports incl. use after free of the ThreadContext). Fix: 3 lines (0002).
2. 52dcf602 regressed the documented coretab -1 (unbound) to "bound to CPU 0", even outside the process mask (taskset 2-3 -> 0).
3. Upstream took the code of our COR-10/COR-11 fixes but neither regression test nor the Import1 check; all re-sent.

Checks: 48/48 (4 targets x 1/2/4 threads x det 0/1 x 32/64-bit), 0 warnings both widths, TSan 0 reports, stylecheck clean
(one hit: comment starting with the identifier graftab[1], copied from existing lines), git am proven alone and combined.
Not done: PS2-G06-3 not run (caller contract violation); alt C for COR-24 not built; no src/check test for COR-09/COR-24
(needs fault injection / restricted mask).
User decides: PS2-G06-1 semantics (reseed per context vs once per process) before any commit; whether to keep the now-dead
re-check in threadWaitBarrier1 (left as is, harmless).
