#!/bin/sh
# Usage: sweep_plain.sh <plain-libdir> <tgt> [max] : runs common/archload_plain (non-sanitized build) with the n-th
# malloc() failing (alloc/failmalloc.so), for n = 1..max, with glibc checks on (MALLOC_CHECK_=3, MALLOC_PERTURB_);
# prints the n for which the process crashed (signal) and the number of runs in which the failure was injected.
L=$1; F=$2; M=${3:-60}; D=$(cd "$(dirname "$0")" && pwd)
bad=""; inj=0; n=1
while [ $n -le $M ]; do
  r=$(FAIL_AT=$n LD_LIBRARY_PATH=$L LD_PRELOAD=$D/failmalloc.so MALLOC_CHECK_=3 MALLOC_PERTURB_=165 $D/../common/archload_plain $F 2>&1)
  rc=$?
  echo "$r" | grep -q "failmalloc: failing" && inj=$((inj + 1))
  [ $rc -ge 128 ] && bad="$bad $n"
  n=$((n + 1))
done
echo "$(basename $F): injected=$inj crashes at malloc #:${bad:- none}"
