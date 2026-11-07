#!/bin/bash
# probes.sh LIBDIR BIN : the DMO-09 probes (bal field vs recomputed balcalc)
L=$1; B=$2
for np in 2 3 4; do for s in 'q{strat=f}' 'q{strat=f}x{bal=0.001}z' 'm{asc=/(levl<0)?z;,low=q{strat=f}x{bal=0},seq=q{strat=f}x{bal=0},fold=d,dvert=100000,vert=100}' 'm{asc=/(levl<0)?z;,low=q{strat=f},seq=q{strat=f},fold=d}' 'q{strat=f}q{strat=/(bal<0)?z;}' 'q{strat=f}q{strat=/(bal>0)?z;}'; do
  echo "== np=$np $s"
  LD_LIBRARY_PATH=$L timeout 60 mpirun --oversubscribe -np $np -x LD_LIBRARY_PATH -x ASAN_OPTIONS $B 4elt.grf 0 "$s" 0 1 2>&1 | grep -E "rank|ERROR|runtime" | sort
done; done
