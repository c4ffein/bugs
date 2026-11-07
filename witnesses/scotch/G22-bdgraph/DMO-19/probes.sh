#!/bin/bash
# probes.sh LIBDIR BIN : DMO-19 / PS2-G22-2 / PS2-G22-3 probes (external gains attached by the driver, veex=1)
L=$1; B=$2
run () { echo "== $1"; shift; LD_LIBRARY_PATH=$L timeout 60 mpirun --oversubscribe "$@" 2>&1 | grep -E "rank|ERROR|runtime|AddressSanitizer|SUMMARY" | sed -E 's/==[0-9]+==//' | cut -c1-200 | sort | uniq -c; }
export ASAN_OPTIONS=detect_leaks=0
for np in 1 3; do run "gather np=$np" -np $np -x LD_LIBRARY_PATH -x ASAN_OPTIONS $B 4elt.grf 0 gather 1 0; done
run "q veex np=3" -np 3 -x LD_LIBRARY_PATH -x ASAN_OPTIONS $B 4elt.grf 0 'q{strat=f}' 1 1
run "q+x veex np=3" -np 3 -x LD_LIBRARY_PATH -x ASAN_OPTIONS $B 4elt.grf 0 'q{strat=f{bal=0.2}}x{bal=0}' 1 1
for F in n f d; do for np in 1 2 3 4; do
  run "ml fold=$F np=$np" -np $np -x LD_LIBRARY_PATH -x ASAN_OPTIONS $B 4elt.grf 0 "m{asc=x{bal=0},low=q{strat=f},seq=q{strat=f},fold=$F,dvert=100000,vert=100}" 1 1
done; done
