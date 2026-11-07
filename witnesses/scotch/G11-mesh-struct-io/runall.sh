#!/bin/bash
# Run all G11 kits against pristine 7.0.18 (INFRA/asan) and the patched tree (WORK/build), 32-bit.
# Usage: ./runall.sh [pristine|patched] ; output goes to stdout
INFRA=${INFRA:?set INFRA to the directory holding asan/ asan64/ (pristine builds with src/Makefile.inc, lib, include, bin) and v7.0.18/ (pristine source tree)}
R=$(dirname $(readlink -f $0)); W=$(dirname $R)
case $1 in pristine) B=$INFRA/asan;; patched) B=${PATCHED32:-$W/build};; pristine64) B=$INFRA/asan64;; patched64) B=${PATCHED64:-$W/build64};; *) echo usage; exit 1;; esac
O=$R/bin-$1; mkdir -p $O
CF=$(sed -n 's/^CFLAGS[ \t]*= //p' $B/src/Makefile.inc)
export LD_LIBRARY_PATH=$B/lib UBSAN_OPTIONS=print_stacktrace=1 ASAN_OPTIONS=detect_leaks=1
pub () { gcc $(sed -n "s/^CFLAGS[ \t]*= //p" $B/src/Makefile.inc | grep -o "\-DINTSIZE64 -DIDXSIZE64") $1 -o $O/$2 -O0 -g -fsanitize=address,undefined -fno-omit-frame-pointer -I$B/include -L$B/lib -lscotch -lscotcherr -lz -lm -lpthread; }
int () { gcc $1 -o $O/$2 $CF -I$B/src/libscotch -I$B/include -L$B/lib -lscotch -lscotcherr -lz -lm -lpthread; }
pub $R/SEP-08/hbload.c hbload; pub $R/SEP-16/geoload.c geoload; pub $R/API-12/bound.c bound
pub $R/API-08/fhabo.c fhabo; pub $R/meshLoad/loadbase.c loadbase
int $R/SEP-23/base.c base; int $R/SEP-21/hmeshmesh.c hmeshmesh; int $R/hmeshExit/hexit.c hexit
D=${CHECKDATA:-$W/scotch/src/check/data}; run () { echo "--- $*"; (cd $R/$1; shift; timeout 20 "$@" 2>&1 | grep -v "^    #[1-9][0-9]" | head -8); }
run SEP-07 $B/bin/mcv w_ef.msh /tmp/g11w_ef.out -is -os; diff -q $R/SEP-07/w_ef.msh /tmp/g11w_ef.out && echo same_ef
run SEP-07 $B/bin/mcv w_nf.msh /tmp/g11w_nf.out -is -os; diff -q $R/SEP-07/w_nf.msh /tmp/g11w_nf.out && echo same_nf
for f in hb_ok hb_badvar hb_badptr2 hb_badptr; do run SEP-08 $O/hbload $f.mtx; done
run fuzz $B/bin/mcv before/crashes/c0355.rsa /dev/null -ib -os
run SEP-16 $O/geoload m16u.msh m16u.xyz
run SEP-21 $O/hmeshmesh
run SEP-23 $O/base
run API-06 $O/bound 2 $D/small2.msh
run API-06 $O/bound 3 $D/small2.msh
run API-08 $O/fhabo ../SEP-08/hb_ok.mtx
run API-12 $O/bound 0 $D/small2.msh
run API-12 $O/bound 1 $D/small2.msh
run PS-SEP-1 $B/bin/mtst m16_lbl.msh
run hmeshExit $O/hexit
run meshLoad $B/bin/gmk_msh bad_edge_hi.msh /dev/null
run meshLoad $B/bin/mord bad_edge_hi.msh /dev/null
run meshLoad $B/bin/mord bad_edge_neg.msh /dev/null
run meshLoad $B/bin/gmk_msh bad_edge_huge.msh /dev/null
run meshLoad $B/bin/gmk_msh bad_degr_neg.msh /dev/null
run meshLoad $O/loadbase $INFRA/v7.0.18/src/check/data/small2.msh 1
