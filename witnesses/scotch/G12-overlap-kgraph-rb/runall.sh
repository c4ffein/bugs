#!/bin/bash
# Run the G12 kits against one tree. usage: runall.sh pristine|patched|pristine64|patched64
INFRA=${INFRA:?set INFRA to the directory holding asan/ asan64/ (pristine builds with src/Makefile.inc, lib, include, bin) and v7.0.18/ (pristine source tree)}
R=$(dirname $(readlink -f $0)); W=$(dirname $R)
case $1 in pristine) B=$INFRA/asan;; patched) B=${PATCHED32:-$W/build};; pristine64) B=$INFRA/asan64;; patched64) B=${PATCHED64:-$W/build64};; *) exit 1;; esac
O=$R/bin-$1; mkdir -p $O
for f in SEP-01/partovl SEP-17/partovl SEP-17/lost API-22/po GRA-01/gra01 GRA-21/gra21 GRA-23/gra23 GRA-23/gra23b GRA-05/gra05 PS3-G12-1/fewfix; do
  gcc -O0 -g -fsanitize=address,undefined -fno-omit-frame-pointer -I$B/include -o $O/$(echo $f | tr / _) $R/$f.c -L$B/lib -lscotch -lscotcherr -lz -lm -lpthread || exit 1
done
export LD_LIBRARY_PATH=$B/lib UBSAN_OPTIONS=print_stacktrace=1 ASAN_OPTIONS=detect_leaks=0
run () { echo "--- $*"; timeout 60 "$@" 2>&1 | grep -v "^    #[2-9]" | cut -c1-200 | head -${N:-6}; echo "rc=${PIPESTATUS[0]}"; }
ST='r{sep=h{pass=10}}b{width=3,bnd=f{move=100,pass=-1,bal=0.05},org=f{move=100,pass=-1,bal=0.05}}'
run $O/GRA-01_gra01 64 1; run $O/GRA-01_gra01 64 0; run $O/GRA-01_gra01 32 0; run $O/GRA-01_gra01 300 0 1
for a in "1 64" "4 64" "1 8" "64 64" "1 1024 64"; do run $O/PS3-G12-1_fewfix $a; done
for a in "2 8" "2 3" "8 2" "4 4" "1 16"; do run $O/GRA-05_gra05 $a "$ST"; done
ASAN_OPTIONS=detect_leaks=1 N=12 run $O/GRA-21_gra21 100 c
ASAN_OPTIONS=detect_leaks=1 N=12 run $O/GRA-21_gra21 100 h
run $O/GRA-23_gra23 100; run $O/GRA-23_gra23b 100; run $O/GRA-23_gra23 3; run $O/GRA-23_gra23b 3
run $O/SEP-01_partovl 6 3 'r{sep=z}'; run $O/SEP-01_partovl 7 3 'r{sep=z}'
run $O/SEP-17_partovl 2 3 - 1; run $O/SEP-17_partovl 3 6 - 1; run $O/SEP-17_lost 4 4 -; run $O/SEP-17_lost 10 9 -
case $1 in *64) ASAN_OPTIONS=allocator_may_return_null=1:detect_leaks=0 run $O/API-22_po 68719476736;; esac
(cd $INFRA/v7.0.18/src/check; for s in -Mf "-Mb{width=3,bnd=f,org=f}" "-Md{pass=10}" -Mx; do run $B/bin/gpart 4 data/m16x16.grf /dev/null -vmt "$s"; done)
