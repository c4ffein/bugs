#!/bin/sh
# Usage: run.sh <libdir>   7.0.18-specific cases (pristine: $INFRA/asan/lib ; patched: $WORK/build/lib)
#  sub_range/sub_dup : double free of termtab in archSubArchBuild fail1 path (ecaf094), PS3-G01-1 / COR-04
#  sub_subshort, sub_tleafbad1, dist_subshort, dist_distbad : inner Arch never archInit()ed (COR-04 / COR-05)
#  dist_nonum, dist_bad : archDistArchFree on a NULL sub-architecture (d4b6f997) (COR-05)
#  dist_var : flags of sub-architecture not inherited (var=0 instead of 1) (COR-05)
#  subapi2 : SCOTCH_archSub() failure followed by SCOTCH_archExit()
export LD_LIBRARY_PATH=$1 UBSAN_OPTIONS=print_stacktrace=1 ASAN_OPTIONS=detect_leaks=1
D=$(dirname "$0"); C=$D/../common; T=$D/../tgt
for f in $T/sub_range $T/sub_dup $T/sub_zero $D/sub_subshort $D/sub_tleafbad1 $D/sub_inbad $D/dist_subshort $D/dist_distbad $D/sub_distbad $D/dist_nonum $T/dist_bad $T/dist_zero $D/dist_var $D/sub_dist; do
  r=$($C/archtrip $f.tgt /dev/null 2>&1)
  echo "$(basename $f): $(echo "$r" | grep -E 'load ret=|var=' | head -2 | tr '\n' ' ') sanitizer-hits=$(echo "$r" | grep -c 'Sanitizer\|runtime error') first: $(echo "$r" | grep -m1 'ERROR: [A-Z]\|runtime error' | sed 's/.*ERROR: //')"
done
for a in "0 0" "0 99" "3" "0 1"; do r=$($C/subapi2 $a 2>&1); echo "subapi2 $a: $(echo "$r" | grep ret=) sanitizer-hits=$(echo "$r" | grep -c 'Sanitizer\|runtime error')"; done
