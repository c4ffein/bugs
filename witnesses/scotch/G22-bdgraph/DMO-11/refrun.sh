#!/bin/bash
# refrun.sh TREE OUTDIR : dgord / dgpart reference outputs (md5 of the ordering / mapping and the tool's metrics)
# Graphs: check data bump.grf, bump_b100000.grf, m16x16.grf, small1-%r.grf (np=4 only), 4elt.grf (G22 kit)
T=$1; O=$2; mkdir -p $O
D=/tmp/claude-0/-home-user-playground/925301e5-494b-5a33-b598-8eaa63dd5c1d/scratchpad/infra18/v7.0.18/src/check/data
K=/tmp/claude-0/-home-user-playground/925301e5-494b-5a33-b598-8eaa63dd5c1d/scratchpad/work18/G22-bdgraph/repro/common
export OMPI_ALLOW_RUN_AS_ROOT=1 OMPI_ALLOW_RUN_AS_ROOT_CONFIRM=1 ASAN_OPTIONS=detect_leaks=0 LD_LIBRARY_PATH=$T/lib
for np in 2 3 4; do
  for g in $D/bump.grf $D/bump_b100000.grf $D/m16x16.grf $K/4elt.grf $( [ $np = 4 ] && echo "$D/small1-%r.grf" ); do
    n=$(basename "$g" .grf | tr -d '%'); 
    timeout 120 mpirun --oversubscribe -np $np -x LD_LIBRARY_PATH -x ASAN_OPTIONS $T/bin/dgord "$g" $O/$n.np$np.ord -Cd > $O/$n.np$np.ord.log 2>&1; r1=$?
    g1=$( [ "$n" = "small1-r" ] && echo "" || $T/bin/gotst "$g" $O/$n.np$np.ord 2>&1 | grep -E "NNZ|OPC" | tr '\n' ' ')
    timeout 120 mpirun --oversubscribe -np $np -x LD_LIBRARY_PATH -x ASAN_OPTIONS $T/bin/dgpart 9 "$g" $O/$n.np$np.map -vm -Cd > $O/$n.np$np.map.log 2>&1; r2=$?
    m=$(grep -E "Target|CommCutSz" $O/$n.np$np.map.log | tr '\t' ' ' | tr '\n' ' ')
    echo "$n np=$np dgord rc=$r1 md5=$(md5sum < $O/$n.np$np.ord | cut -c1-8) $g1| dgpart rc=$r2 md5=$(md5sum < $O/$n.np$np.map | cut -c1-8) $m"
  done
done
