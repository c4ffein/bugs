#!/bin/bash
# Run the G13 kits against one tree. usage: runall.sh pristine|patched|pristine64|patched64 [hangruns]
# INFRA: directory holding the pristine ASan build trees asan/ and asan64/ (src/Makefile.inc + lib/); patched trees default to $W/build, $W/build64
INFRA=${INFRA:?set INFRA to a directory holding the asan and asan64 build trees of pristine Scotch}
R=$(dirname $(readlink -f $0)); W=$(dirname $R)
case $1 in pristine) B=$INFRA/asan;; patched) B=$W/build;; pristine64) B=$INFRA/asan64;; patched64) B=$W/build64;; *) exit 1;; esac
O=$R/bin-$1; mkdir -p $O; NR=${2:-8}
for f in GRA-02/gra02pub GRA-02/gra02int GRA-12/gra12 GRA-18/gra18 GRA-19/gra19 GRA-20/gra20; do
  sh $R/common/cc.sh $B $O/$(basename $f) $R/$f.c || exit 1
done
export LD_LIBRARY_PATH=$B/lib UBSAN_OPTIONS=print_stacktrace=1 ASAN_OPTIONS=detect_leaks=0
run () { echo "--- $(basename $1) ${*:2}"; timeout ${TO:-60} "$@" 2>&1 | grep -v "^    #[2-9]" | cut -c1-180 | head -${N:-5}; echo "rc=${PIPESTATUS[0]}"; }
run $O/gra02pub 4 'rf{bal=0.00001}'
for a in "16 4 1" "16 16 2" "24 64 2"; do run $O/gra02int $a; done
for t in 2 3 4; do h=0; s=0; for i in $(seq $NR); do timeout 12 $O/gra12 $t > $O/g12.out 2>&1; rc=$?; [ $rc = 124 ] && h=$((h+1)); grep -q "Sanitizer" $O/g12.out && s=$((s+1)); done; echo "gra12 thr=$t runs=$NR hangs=$h sanitizer=$s"; done
for p in 1 21 22 23 24 25; do echo -n "gra18 pass=$p: "; $O/gra18 $p 2>&1 | tail -1; done
run $O/gra19
run $O/gra20
gcc -O0 -g -fsanitize=undefined -fno-sanitize-recover=all $R/GRA-16/flagub.c -o $O/flagub_pristine; gcc -O0 -g -fsanitize=undefined -fno-sanitize-recover=all -DFIXED $R/GRA-16/flagub.c -o $O/flagub_fixed
run $O/flagub_pristine; run $O/flagub_fixed
