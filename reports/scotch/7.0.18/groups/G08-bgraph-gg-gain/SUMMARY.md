# G08-bgraph-gg-gain on 7.0.18 (no upstream change to bgraph_bipart_gg.[ch], gain.[ch])
- SEP-06 fixed -> fixed partly-run high -> -
- SEP-11 still-present -> still-present partly-run medium -> 0001
- SEP-13 still-present -> still-present ran high -> 0002 + 0003 (blocks PyScotch's release)
- SEP-19 fixed -> fixed source-read low -> -
- SEP-20 fixed -> fixed ran low -> -
- PS-SEP-3 still-present -> still-present ran low -> 0004
- PS2-G08-1 still-present -> still-present ran high -> 0003

| commit | subject | verdict |
|---|---|---|
| (none) | no 7.0.17..7.0.18 commit touches the group's files | - |

Three most important facts
1. SEP-13 confirmed on pristine 7.0.18 by TSan (gpart, 4 threads, det=1): intRandSpawn common_integer.c:288 (worker,
   bgraph_bipart_gg.c:177) races with intRandVal3 :435 (thread 0, :196), every run (15/13/16 reports, mostly PS-SEP-3).
   Fresh runs, det=1: default thr=2 4 distinct / 20, thr=4 2 distinct; 'h' thr=4 3 distinct / 20.
2. Our 4-commit series applies unchanged; det=1: one partition per cell (thr=1 1d497d7d, thr=2,4 e180dfcf; h: 44898414 /
   82e36d44), same fingerprints as 7.0.17; TSan det=1 0 reports, det=0 only graph_match_scan.c (by design). 72/72 checks.
3. PyScotch's shipped 7.0.18 patch (identical to its 7.0.17 one) gives exactly the same partitions in deterministic mode;
   it leaves PS-SEP-3 (gainLinkDummy race, harmless writes) and SEP-11 unfixed.
Not done: SEP-11 40-seed comparison and SEP-19 debug fault injection not re-run (byte-identical code).
User decides: nothing new; the 1-thread vs >=2-thread residual is PS2-G08-2 (G15 0006 / G12 0009).
