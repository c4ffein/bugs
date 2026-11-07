#!/bin/sh
# Set DATADIR to <scotch source tree>/src/check/data (needs m4x4.grf) before running.
# Usage: run.sh <libdir>   (pristine: $INFRA/asan/lib ; patched: $WORK/build/lib)
export LD_LIBRARY_PATH=$1 UBSAN_OPTIONS=print_stacktrace=1 ASAN_OPTIONS=detect_leaks=1
D=$(dirname "$0"); C=$D/../common; T=$D/../tgt
for f in sub_one sub_one_hcub sub_one0; do r=$($C/archtrip $T/$f.tgt $D/out_$f.tgt 2>&1); echo "$f: $(echo "$r" | grep -E 'ret=' | tr '\n' ' ') sanitizer-hits=$(echo "$r" | grep -c 'Sanitizer\|runtime error')"; done
for v in 5 0; do r=$($D/build2one ${DATADIR:?set DATADIR}/m4x4.grf $v 2>&1); echo "SCOTCH_archBuild2 m4x4 vertex $v: ret=$(echo "$r" | sed -n 's/^build2 ret=//p') sanitizer-hits=$(echo "$r" | grep -c 'Sanitizer\|runtime error')"; done
