#!/bin/bash
# run.sh LIBDIR NAME BINDIR : (env: SCRATCH = work directory, default a fresh mktemp -d) DMO-15, PS2-G23-2, PS2-G23-1 probes (np=3)
L=$1; N=$2; BD=$3; S=${SCRATCH:-$(mktemp -d)}; mkdir -p $S; cd $(dirname $(readlink -f $0))/../common
export OMPI_ALLOW_RUN_AS_ROOT=1 OMPI_ALLOW_RUN_AS_ROOT_CONFIRM=1 ASAN_OPTIONS=detect_leaks=0 LD_LIBRARY_PATH=$L
f () { grep -E "rank|ERROR|runtime error|Sanitizer:|SUMMARY|signal|Segmentation" | sed -E 's/==[0-9]+==//' | cut -c1-170 | sort | uniq -c; }
for m in c x n; do echo "== dmaptest $m"; rm -f $S/dm.out
  timeout 60 mpirun --oversubscribe -np 3 -x LD_LIBRARY_PATH -x ASAN_OPTIONS ./dmaptest_$N 4elt.grf $m 2>&1 | f; echo "   rc=${PIPESTATUS[0]}"; done
echo "== dgpart -m r{sep=q{strat=f}}"; timeout 60 mpirun --oversubscribe -np 3 -x LD_LIBRARY_PATH -x ASAN_OPTIONS $BD/dgpart 4 4elt.grf $S/dgp.map -m'r{sep=q{strat=f}}' 2>&1 | f; echo "   rc=${PIPESTATUS[0]} lines=$(wc -l < $S/dgp.map) parts=$(tail -n +2 $S/dgp.map | cut -f2 | sort -u | tr '\n' ' ')"
echo "== dtest map r{sep=q{strat=f}}"; timeout 60 mpirun --oversubscribe -np 3 -x LD_LIBRARY_PATH -x ASAN_OPTIONS ./dtest_$N 4elt.grf -1 map 'r{sep=q{strat=f}}' 4 n - 2>&1 | f
echo "== dgpart 2 lbl.grf (base 1, labels)"; timeout 60 mpirun --oversubscribe -np 3 -x LD_LIBRARY_PATH -x ASAN_OPTIONS $BD/dgpart 2 lbl.grf $S/lbl.map 2>&1 | f; echo "   rc=${PIPESTATUS[0]}"; tr '\n' ' ' < $S/lbl.map; echo
