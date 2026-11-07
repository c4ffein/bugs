# G28-tools-docs-tests on 7.0.18

Upstream touched one item (BLD-23, cf82942a, gscat usage); every other G28 file is identical to 7.0.17.

## Items (ID 7.0.17 -> 7.0.18, method, severity -> patch)
- CLI-20 still-present -> still-present ran low -> 0001,0002
- CLI-21 still-present -> still-present partly-run low -> 0003,0004
- BLD-04 still-present -> still-present ran medium -> 0006
- BLD-15 still-present -> still-present ran medium -> G11:0009
- BLD-16 still-present -> still-present ran medium -> 0008
- BLD-18 still-present -> still-present ran low -> 0005
- BLD-22 still-present -> still-present ran low -> 0007
- BLD-23 still-present -> fixed ran low -> -
- PS2-G28-1 still-present -> still-present ran info -> 0002
- PS2-G28-2 still-present -> still-present ran info -> -
- PS2-G28-3 still-present -> still-present ran info -> 0007
- PS2-G28-4 still-present -> still-present ran info -> -
- PS3-G28-1 (new) -> still-present ran low -> 0009

## Upstream commits reviewed
| commit | verdict | note |
|---|---|---|
| cf82942a Fix gscat usage message | correct | BLD-23 fixed; text matches gscat.c:218; man twin already had -inbr; synopsis nparts gap is new PS3-G28-1 |
| 0d878bdd three-level composite test (src/check/Makefile) | unrelated to G28 items | our 0005 (CHECKSCOTCH) applies unchanged; its swapped map names are reported in G30 |

## Three most important facts
1. BLD-23 is fixed upstream (as well as ours); our 0001 shrinks to the gmap half (CLI-20), new subject.
2. All other G28 defects still reproduce on 7.0.18 32/64 and the rebased series fixes them; 0 warnings, the seq and
   PT check targets pass under flock; 9 patches `git am` cleanly on v7.0.18.
3. New PS3-G28-1: dgscat(1) and p_p.tex give gscat no <nparts> parameter, so a command line written from them
   fails; patch 0009 documents it.

## Rebase notes
- 0008 (BLD-16) depended on G12's 7.0.17 zero-load fixed-vertex test block; rebased onto bare 7.0.18 context.
- The 7.0.17 G28 folder carried a copy of G11's 0009 (BLD-15 fix); dropped here, BLD-15 points to G11's patch.
- Header dates bumped to 02 nov 2026, also in three files 7.0.17 forgot (dgmap.c, test_scotch_graph_order.c,
  test_scotch_graph_map.c); man .TH dates 02 November 2026.

## Could not do
- No txt2man here (running a downloaded copy was refused): the .1 pages keep the 7.0.17 txt2man output and the
  0009 .1 hunk is hand-written to match it. Regenerate with `make -C man/man1` before sending.
- CLI-21 hang needs a launcher that does not kill the job on a non-zero exit (not available).

## User must decide
- CLI-21 0004 (MPI_Abort in libptscotcherrexit) is a behaviour change; PS2-G28-2 / PS2-G28-4 left unpatched.
