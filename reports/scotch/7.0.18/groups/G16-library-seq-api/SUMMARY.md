# G16-library-seq-api on 7.0.18

API-03    fixed -> fixed            ran          high -> -
API-14    still-present -> partially-fixed ran   low  -> 0001 (+test 0008)
API-16    still-present -> fixed    ran          low  -> - (test 0008)
API-18    still-present -> still-present ran     low  -> 0006, 0007
API-19    still-present -> fixed    ran          low  -> 0004 (doc only)
API-21    still-present -> fixed    partly-run   low  -> -
PS-API-1  still-present -> still-present ran     medium -> 0002 (+test 0008)
PS-API-7  not-a-bug -> not-a-bug    source-read  info -> -
PS2-G16-1 still-present -> still-present ran     low  -> 0003 (+test 0008)
PS2-G16-2 still-present -> still-present source-read info -> 0005
PS2-G16-3 still-present -> still-present ran     info -> 0007
PS3-G16-1 new (regression from 27f4193c)  ran    low  -> 0006
PS3-G16-2 new (doc from 38006ee5)  source-read   info -> 0009

| upstream commit | subject | verdict |
|---|---|---|
| 199fa86105 | do not read past array end (API-21) | correct |
| 5a711ca523 | weighted edge load sum like unweighted (API-19) | correct (edge convention; doc not updated) |
| 27f4193c38 | distributed mapping delta (API-18) | wrong: factor 2, unweighted now 2.0 instead of 1.0 |
| a09f32492d | components/distances/diameters (API-14) | incomplete: single-vertex component counts 1 |
| 9e015dfefb | mapping distance from proper domain (API-16) | correct, but PS-API-1 (unbased parotax) left |
| f26334284b | return after OOM in SCOTCH_graphPartOvlView | correct |
| 38006ee588 | document SCOTCH_graphPartOvlView | incomplete: `\label` instead of `\ref`, const missing |

Three most important facts
1. 27f4193c took the review's CommDelta formula verbatim, which we had flagged as off by two: dgmap -v now prints
   2.000000 for every unweighted graph (was right, 1.000000, in 7.0.17). Rebased 0006 = one token (`edgeglbnbr / 2`).
2. Edge-load sum convention is settled upstream (5a711ca5 = our option A, edges counted once). PyScotch assertions
   that change (weighted graphs, value halves): test_interop.py:65 14->7, :181 4->2, :246 4->2, :314 10->5,
   :357 8->4; test_graph.py:144 (1,3,12)->(1,3,6); hypothesis/test_graph_properties.py:356 2*sum->sum.
   gtst/dgtst "Edge load ... sum=" halves for weighted graphs (m4x4_b1_ev 118->59).
3. a09f3249 fixed the vertnnd bound and error path but `connval = distmax ++` gives every single-vertex part a
   PartDiam of 1 (gmap small1/m11x13 prints 1/1/1). Rebased 0001 starts distmax at -1.

Series: 9 commits, `git am` proven, 0 warnings 32/64; our 0006 (API-21) dropped, 0002/0004 shrunk, 0007 rewritten.
Checks passed 32/64: graph_map_view, graph_map, graph_part_ovl, gmap, gpart, gpart_remap/overlap, gtst, dgtst, dgpart.

Could not do: build the manual (no LaTeX: PS3-G16-2 by reading); API-21 split-allocation ASan proof not rebuilt
(bound now tested right after the increment); OOM path of graphMapView3 read only.

User must decide: PartDiam convention for disconnected parts (A, ours: components linked by one edge; B,
alt/API-14-b-chain-without-gap.diff: sum of diameters, smaller diff, isolated vertices invisible); whether to send
0007 (dgmap label change "Cmlosum" -> "CommLoad", breaks greps); update the 7 PyScotch edlosum assertions.
