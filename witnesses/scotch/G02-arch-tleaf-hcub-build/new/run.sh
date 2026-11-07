#!/bin/sh
# Set DATADIR to <scotch source tree>/src/check/data (needs bump.grf) before running.
# Usage: run.sh <tree> <suffix>   e.g. run.sh $INFRA/asan asan ; run.sh $WORK/build p   (harnesses common/archload_<suffix>,
#        common/archbuild_<suffix>, new/mapfixed built against <tree>; see README18)
B=$1; S=$2; D=$(dirname "$0"); C=$D/../common; G=${DATADIR:?set DATADIR}
export LD_LIBRARY_PATH=$B/lib UBSAN_OPTIONS=print_stacktrace=0 ASAN_OPTIONS=detect_leaks=1
for t in 'tleaf 2 4 1 x' 'tleaf 2 65536 1 65536 1' 'tleaf 2 100000 1 50000 1' 'ltleaf 2 4 1 2 1 8 0 1 2 3 4 5 6 x' \
         'ltleaf 1 4 1 4 0 0 1 2' 'ltleaf 1 4 1 3 2 1 0' 'ltleaf 2 4 1 2 1 3 0 1 2' 'tleaf 0' 'tleaf -1 2 1' 'hcub 30' 'hcub 31' \
         'ltleaf 3 32 10 2 5 4 1 8 0 2 4 6 1 3 5 7'; do
  r=$($C/archload_$S "$t" 2>&1)
  echo "[$t] $(echo "$r" | grep -E 'ret=|size=' | tr '\n' ' ')| $(echo "$r" | grep -m1 'runtime error\|Sanitizer:\|ERROR: [a-zA-Z]*:' | sed 's|^.*/||; s|^[^ ]*: ||')"
done
for m in 0 1 2 "3 -1" "3 0" "3 70" 4 5 6 7 8; do
  r=$($C/archbuild_$S $m 2>&1)
  echo "[archbuild $m] $(echo "$r" | grep -E 'r=|exit ok' | tr '\n' ' ')| $(echo "$r" | grep -m1 'runtime error\|Sanitizer:' | sed 's|^.*/||')"
done
for a in "64 2" "200 2" "8 2"; do r=$(timeout 60 $D/mapfixed $G/bump.grf $a 2>&1); echo "[mapfixed bump cmplt $a] rc=$? $(echo "$r" | grep ret=)"; done
r=$(timeout 60 $D/mapfixed $G/bump.grf 4 6 "" raw 2>&1); echo "[mapfixed bump cmplt 4, fixed parts 0..5] $(echo "$r" | grep -m1 'invalid part array') leak-264B-hashtab=$(echo "$r" | grep -c 'Direct leak of 264')"
r=$(timeout 30 $D/mapfixed $G/bump.grf 4 40 "" raw 2>&1); echo "[mapfixed bump cmplt 4, fixed parts 0..39] rc=$? (124 = hang, PS3-G02-6, not patched)"
