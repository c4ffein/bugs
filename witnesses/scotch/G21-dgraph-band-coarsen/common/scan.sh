#!/bin/bash
# scan.sh LIBDIR BIN NP FAILRANK NTH_FROM NTH_TO -- args...   (one line per nth; HANG = FI_TIMEOUT (default 60) s timeout)
LIB=$1; BIN=$2; NP=$3; FR=$4; FROM=$5; TO=$6; shift 6; [ "$1" = "--" ] && shift
here=$(cd $(dirname $0); pwd)
export LD_LIBRARY_PATH=$LIB UBSAN_OPTIONS=print_stacktrace=1
export ASAN_OPTIONS=detect_leaks=0:verify_asan_link_order=0:abort_on_error=0
for n in $(seq $FROM $TO); do
  t0=$SECONDS
  out=$(timeout -k 5 ${FI_TIMEOUT:-60} mpirun --oversubscribe -np $NP -x LD_PRELOAD=$here/fishim.so -x FI_RANK=$FR -x FI_NTH=$n -x ASAN_OPTIONS -x UBSAN_OPTIONS -x LD_LIBRARY_PATH $BIN "$@" 2>&1); rc=$?
  s=$(echo "$out" | grep -E "fishim:|ERROR|rc=|runtime error|SUMMARY|exit done|signal" | grep -v "failing allocation" | sed -E 's/==[0-9]+==//' | cut -c1-140 | sort | uniq -c | sed -E 's/^ +//' | tr '\n' ';')
  # timeout exits 124 on TERM, but 137 (KILL) when -k had to kill it after the timeout: both are hangs
  { [ $rc -eq 124 ] || { [ $rc -eq 137 ] && [ $((SECONDS - t0)) -ge ${FI_TIMEOUT:-60} ]; }; } && s="HANG; $s"
  echo "nth=$n exit=$rc :: $s"
done
