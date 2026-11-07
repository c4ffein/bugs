#!/bin/bash
# Run the G15 kits against one tree.  usage: runall.sh pristine|patched|pristine64|patched64
# Trees are ASan/UBSan builds of Scotch (bin/ lib/ include/ and src/Makefile.inc present), given by environment variables:
#   PRISTINE_TREE   PATCHED_TREE   PRISTINE_TREE64   PATCHED_TREE64     (optional: OUT = output directory)
R=$(dirname "$(readlink -f "$0")")
case $1 in
  pristine)   B=${PRISTINE_TREE:?set PRISTINE_TREE};;
  patched)    B=${PATCHED_TREE:?set PATCHED_TREE};;
  pristine64) B=${PRISTINE_TREE64:?set PRISTINE_TREE64};;
  patched64)  B=${PATCHED_TREE64:?set PATCHED_TREE64};;
  *) echo "usage: $0 pristine|patched|pristine64|patched64" >&2; exit 1;;
esac
O=${OUT:-$R/bin-$1}; mkdir -p "$O"; X=$B/bin; D=$R/data
CF="$(grep '^CFLAGS' $B/src/Makefile.inc | cut -d= -f2-)"
pub () { gcc -O0 -g -fsanitize=address,undefined -I$B/include $R/$1.c -o $O/$(basename $1) -L$B/lib $2 -lscotch -lscotcherr -lz -lm -lpthread $3; }
pub GRA-14/coarsen "" $O/inj.so 2>/dev/null; gcc -O0 -g -fPIC -shared $R/GRA-14/inj.c -o $O/inj.so -ldl; pub GRA-14/coarsen "" $O/inj.so
pub GRA-22/bl; pub GRA-25/leak; pub CLI-23/oio -lesmumps; pub PS-BLD-1/chk
gcc $CF -I$B/src/libscotch -I$B/include $R/GRA-27/dump.c -o $O/dump -L$B/lib -lscotch -lscotcherr -lz -lm -lpthread
export LD_LIBRARY_PATH=$B/lib UBSAN_OPTIONS=print_stacktrace=1 ASAN_OPTIONS=detect_leaks=0
run () { echo "--- ${*:2}"; (cd $1; shift; timeout ${TO:-30} "$@" 2>&1 | grep -v "^    #[2-9]" | sed 's#/tmp/[^ ]*/##g' | cut -c1-150 | head -${N:-3}; echo "rc=${PIPESTATUS[0]}"); }
for f in ok bad_count bad_range bad_neg bad_dup bad_short shuffled; do run $R/GRA-03 $X/gotst p4.grf $f.ord /dev/null; done
for n in 7 8; do ASAN_OPTIONS=verify_asan_link_order=0:detect_leaks=1 LD_PRELOAD=$O/inj.so SCOTCH_PTHREAD_NUMBER=1 run $R/GRA-14 $O/coarsen $D/bump.grf $n; done
for n in 11 18 19; do ASAN_OPTIONS=verify_asan_link_order=0:detect_leaks=1 LD_PRELOAD=$O/inj.so SCOTCH_PTHREAD_NUMBER=4 run $R/GRA-14 $O/coarsen $D/bump.grf $n; done
ASAN_OPTIONS=verify_asan_link_order=0:detect_leaks=1 LD_PRELOAD=$O/inj.so SCOTCH_PTHREAD_NUMBER=1 run $R/GRA-14 $O/coarsen $D/bump.grf 4 match
N=8 run $R/GRA-22 $O/bl 'b{cmin=1200,strat=g}' 1200 1
N=8 run $R/GRA-22 $O/bl 'b{cmin=1,strat=s}' 1 2
TO=10 N=3 run $R/GRA-22 $O/bl 'b{cmin=100,strat=n{sep=m{vert=50,low=h{pass=10},asc=f{move=100}},ole=s,ose=s}}' 100 0
TO=10 run $R/GRA-25 $X/mord dbl.msh /dev/null '-ob{cmin=2,strat=n{sep=h,ole=s,ose=s}}'
for a in "g dbl2.grf c{rat=0.9,cpr=o{strat=b{cmin=0,strat=s}},unc=s}" "m dbl.msh c{rat=0.9,cpr=n{sep=h,ole=b{cmin=0,strat=s},ose=s},unc=s}" "g dbl2.grf o{strat=b{cmin=0,strat=s}}"; do ASAN_OPTIONS=detect_leaks=1 SCOTCH_PTHREAD_NUMBER=1 run $R/GRA-25 $O/leak $a; done
(cd $O; ./dump > dumped.c 2>/dev/null; (printf '#include "module.h"\n#include "common.h"\n#include "graph.h"\n'; cat dumped.c) > dumped_full.c; echo "--- GRA-27 compile: $(gcc $CF -I$B/src/libscotch -fsyntax-only dumped_full.c 2>&1 | grep -c error) errors")
for m in 0 1 2 3 4 5; do run $R/CLI-23 $O/oio $m; done
run $R/PS-BLD-1 $O/chk $D/bump.grf
