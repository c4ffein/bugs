#!/bin/bash
# matrix.sh : G21 fault-injection matrix, pristine 7.0.18 (G18's pristinefi) vs this series (buildfi)
WR=/tmp/claude-0/-home-user-playground/925301e5-494b-5a33-b598-8eaa63dd5c1d/scratchpad/work18; W=$WR/G21-dgraph-band-coarsen
S=$W/repro/common/scan.sh; export OMPI_ALLOW_RUN_AS_ROOT=1 OMPI_ALLOW_RUN_AS_ROOT_CONFIRM=1 FI_TIMEOUT=${FI_TIMEOUT:-20}
for b in pristinefi buildfi; do L=$WR/G18-dgraph-fold-redist/pristinefi/lib; [ $b = buildfi ] && L=$W/buildfi/lib; X=$W/repro/common/bin_$b/g21fi
echo "######## $b"
echo "== API-15 coarsen ring fold user-array (no failure)"; $S $L $X 2 1 -1 -1 -- coarsen ring 0 8 1 2 0.8 1
echo "== API-15 coarsen path ratio not met (no failure)"; $S $L $X 2 1 -1 -1 -- coarsen path 0 8 1 2 0.51 1 1
echo "== PS2-G21-3 band path nth0"; $S $L $X 2 1 0 0 -- band path 0 8 2
echo "== API-20 grow ring"; $S $L $X 2 1 1 2 -- grow ring 0 8 2
echo "== PS2-G21-1 band path"; $S $L $X 2 1 3 4 -- band path 0 8 2
echo "== PS2-G21-1 grow ring"; $S $L $X 2 1 3 3 -- grow ring 0 8 2
echo "== DGR-07 band sparse base1 np4"; $S $L $X 4 1 3 4 -- band sparse 1 4 2
echo "== DGR-07 grow sparse base1 np4"; $S $L $X 4 1 3 3 -- grow sparse 1 4 3
echo "== API-17 band sparse np4"; $S $L $X 4 1 5 7 -- band sparse 0 4 2
echo "== DGR-09 bandint path base0"; $S $L $X 2 1 0 6 -- bandint path 0 8 2
echo "== DGR-09 bandint path base1"; $S $L $X 2 1 3 6 -- bandint path 1 8 2
echo "== PS-DGR-1 / DGR-13 coarsen ring"; $S $L $X 2 1 3 26 -- coarsen ring 0 8 0
echo "== PS2-G21-2 coarsen ring fold"; $S $L $X 2 1 13 13 -- coarsen ring 1 8 1
done
