# G17-fortran-wrappers on 7.0.18

API-01    fixed -> fixed                    ran         high   -> -
API-05    fixed -> fixed                    partly-run  high   -> -
API-09    still-present -> fixed            ran         medium -> - (06f9d09b)
API-11    still-present -> fixed            ran         medium -> - (bca5f63b)
API-13    still-present -> fixed            ran         medium -> - (48efddda)
API-24    still-present -> still-present    ran         low    -> 0001, 0004 (+0003 doc)
BLD-20    still-present -> still-present    partly-run  low    -> 0002
PS-API-6  still-present -> still-present    ran         low    -> 0003
PS2-G17-1 still-present -> still-present    ran         low    -> G19's patch (not rebased here)
PS2-G17-2/3 still-present -> still-present  ran         low    -> 0003
PS2-G17-4/6 still-present -> still-present  ran         info   -> 0003;  PS2-G17-5 same, info -> -
PS2-G17-7 still-present -> still-present    ran         info   -> 0005 (rebased off G30's macro)
PS3-G17-1 new ran low: SCOTCH_graphMapViewRaw undeclared; MapViewRaw/RemapView/RemapViewRaw no Fortran twin -> 0006, 0007

| upstream commit | subject | verdict |
|---|---|---|
| 48efdddafb | proper integer type for ARCHSIZE (API-13) | correct (= ours) |
| bca5f63b1e | add ierr to DGRAPHMAPSTAT (API-11) | correct (= ours; ABI change, see below; leaves a TAB at :88) |
| 06f9d09be9 | proper wrapper name DGRAPHSTAT (API-09) | correct (= ours) |
| f32c0cff20 | add graphpartovlview wrapper | correct; incomplete as a sweep (3 view twins + 1 prototype missing) |

Three most important facts
1. Upstream took our three wrapper fixes verbatim in substance (0001-0003 dropped). bca5f63b changes the
   Fortran ABI of scotchfdgraphmapstat from 16 to 17 arguments: callers following the manual (which always
   listed ierr) are now correct; callers written against the old wrapper make it store through stack garbage.
   No Fortran caller in Scotch's tree; PyScotch uses the C API, so nothing of ours breaks.
2. f32c0cff is right: 4 mangled names exported, argument order = C order + ierr, matches s_l.tex; views.c shows
   byte-identical output via Fortran and C, 32/64. library_f.h/scotchf.h declare no routines (nothing to add).
3. Sweep of exported-vs-declared symbols (nm vs library.h/library_pt.h): SCOTCH_graphMapViewRaw is exported but
   not declared (implicit declaration for C users); SCOTCH_archLtleaf (G02 0001) and SCOTCH_dgraphGhstReplace
   (G19 area) likewise. 13 documented Fortran routines still missing (API-24).

Series: 7 commits on v7.0.18, `git am` proven; 0 warnings 32/64 (with G02 0001 in the build tree, needed by
0004); kits: missing_f links, seq_f/seq_c identical, par_f OK, dmv2 ierr=0, views identical; checks passed 32/64:
check_libmetis_dual_f_v3/_v5, check_libmetis_dual_v3/_v5, check_scotch_mesh_build_f, check_scotch_graph_map;
fortran_audit.py 129 -> 60 findings (rest: v3-vs-v5 METIS doc, NODOC, DOCC false positives).

Could not do: BLD-20 negative case (corrupted.f90) not re-run; no Fortran MPI harness in src/check.

User must decide: series order with G02 0001 (needed to build our 0004) or fold the declaration into 0004;
whether to send 0006/0007 (wrappers for undocumented C routines; vmlotab cannot be NULL from Fortran).
