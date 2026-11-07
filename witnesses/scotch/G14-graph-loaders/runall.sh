#!/bin/bash
# Run the G14 kits against one tree. usage: runall.sh pristine|patched|pristine64|patched64
# Set BUILD_PRISTINE, BUILD_PATCHED, BUILD_PRISTINE64, BUILD_PATCHED64 to the install prefixes
# (containing bin/ lib/ include/) of ASan+UBSan builds; only the one you use is required.
R=$(dirname $(readlink -f $0)); case $1 in pristine) B=${BUILD_PRISTINE:?};; patched) B=${BUILD_PATCHED:?};; pristine64) B=${BUILD_PRISTINE64:?};; patched64) B=${BUILD_PATCHED64:?};; *) echo "usage: $0 pristine|patched|pristine64|patched64" >&2; exit 1;; esac
O=$R/bin-$1; mkdir -p $O; X=$B/bin
for f in GRA-09/gra09 PS-API-5/tl; do gcc -O0 -g -fsanitize=address,undefined -I$B/include $R/$f.c -o $O/$(basename $f) -L$B/lib -lscotch -lscotcherr -lz -lm -lpthread || exit 1; done
export LD_LIBRARY_PATH=$B/lib UBSAN_OPTIONS=print_stacktrace=1 ASAN_OPTIONS=detect_leaks=0
run () { echo "--- ${*:2}"; (cd $1; shift; timeout 30 "$@" 2>&1 | grep -v "^    #[2-9]" | sed 's#/tmp/[^ ]*/##' | cut -c1-150 | head -${N:-4}; echo "rc=${PIPESTATUS[0]}"); }
run $R/GRA-04 $X/gtst neglbl.grf
run $R/GRA-07 $X/gcv -im0 t0b.mtx /dev/null; run $R/GRA-07 $X/gcv -im2 t2c.mtx $O/t2c.grf; run $R/GRA-07 $X/gtst $O/t2c.grf
run $R/GRA-08 $X/gcv -ic over.chac /dev/null
run $R/GRA-09 $O/gra09
run $R/GRA-10 $X/gpart 2 badend.grf /dev/null; run $R/GRA-10 $X/gtst conv.grf
for f in ok bad99 bad0 badn1 badcol baddec; do run $R/GRA-11 $X/gcv -ib $f.hb $O/$f.grf; done
run $R/GRA-11 $X/gtst $O/badn1.grf
run $R/GRA-24 $X/gcv -ib pre.hb $O/pre.grf; run $R/GRA-24 $X/gcv -ib ok.hb $O/okk.grf; cmp $O/pre.grf $O/okk.grf && echo same-pre-ok
run $R/PS-API-5 $O/tl 0; run $R/PS-API-5 $O/tl 1
