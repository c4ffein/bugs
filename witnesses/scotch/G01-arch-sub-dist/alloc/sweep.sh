#!/bin/sh
# Usage: sweep.sh <libdir> <tgt> [max] : fail the n-th malloc of an archload run for n = 1..max (ASan build, LSan on);
# prints the n values for which a sanitizer report appeared.
L=$1; F=$2; M=${3:-120}; D=$(dirname "$0")
bad=""; n=1
while [ $n -le $M ]; do
  r=$(FAIL_AT=$n LD_PRELOAD=$D/failmalloc.so LD_LIBRARY_PATH=$L ASAN_OPTIONS=detect_leaks=1:verify_asan_link_order=0:allocator_may_return_null=1 $D/../common/archload $F 2>&1)
  if echo "$r" | grep -q 'Sanitizer\|runtime error'; then bad="$bad $n"; fi
  n=$((n + 1))
done
echo "$(basename $F): sanitizer reports at malloc #:${bad:- none}"
