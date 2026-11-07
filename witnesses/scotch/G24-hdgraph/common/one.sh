#!/bin/bash
# env WORK needed unless a graph is given as arg 7. one.sh LIBDIR BIN NP FAILRANK NTH MODE [graph] [strategy] : one injected run with fishim2 (live-block accounting); compact summary
here=$(cd $(dirname $0) && pwd); LIB=$1; BIN=$2; NP=$3; FR=$4; NTH=$5; MODE=$6; G=${7:-${WORK:?set WORK (dir holding scotch/src/check/data) or pass a graph as arg 7}/scotch/src/check/data/m16x16.grf}; STRAT=${8:-}
export LD_LIBRARY_PATH=$LIB UBSAN_OPTIONS=print_stacktrace=1
t0=$SECONDS
out=$(timeout -k 5 20 mpirun --oversubscribe -np $NP -x LD_PRELOAD=$here/fishim2.so -x FI_RANK=$FR -x FI_NTH=$NTH -x UBSAN_OPTIONS -x LD_LIBRARY_PATH $BIN $G "$STRAT" $MODE 2>&1); rc=$?
s=$(echo "$out" | grep -E "fishim: rank [0-9]+: (failing|live)|ERROR|rc=|runtime error|signal" | grep -v "backtrace" | sed -E 's/==[0-9]+==//' | sort | uniq -c | sed -E 's/^ +//' | cut -c1-110 | tr '\n' ';')
{ [ $rc -eq 124 ] || { [ $rc -eq 137 ] && [ $((SECONDS - t0)) -ge 20 ]; }; } && s="HANG; $s"
echo "[$(basename $(dirname $LIB)) np=$NP r=$FR nth=$NTH $MODE strat=$STRAT] exit=$rc :: $s"
