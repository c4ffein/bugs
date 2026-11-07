#!/bin/bash
# Run every G27 kit against TREE ($1); output dir $2. 7.0.18 adaptation of the 7.0.17 kits.
TREE=$1; OUT=$2; mkdir -p $OUT; R=$(cd $(dirname $0); pwd)
export LD_LIBRARY_PATH=$TREE/lib ASAN_OPTIONS=detect_leaks=0 UBSAN_OPTIONS=print_stacktrace=1; B=$TREE/bin
cd $OUT
echo "### CLI-11"; K=$R/CLI-11
$B/amk_grf -l$K/lab.lst $K/lab_b0.grf lp0.tgt 2>&1|head -3; $B/amk_grf -l$K/lab.lst $K/lab_b1.grf lp1.tgt 2>&1 | grep -m3 "ERROR\|AddressSanitizer\|#[0-2] "; diff lp0.tgt lp1.tgt | head -4
$B/amk_grf -l$K/m4x4_vertlist.txt $K/m4x4_b0_elv.grf p0.tgt; $B/amk_grf -l$K/m4x4_vertlist.txt $K/m4x4_b1_elv.grf p1.tgt 2>&1|head -3; diff p0.tgt p1.tgt | head -4
$B/amk_grf $K/unl_b1.grf /dev/null -l$K/bad.lst 2>&1 | grep -m3 "ERROR\|AddressSanitizer\|#[0-2] "; echo rc=${PIPESTATUS[0]}
$B/amk_grf $K/unl_b0.grf q0.tgt -l$K/ok_b0.lst; $B/amk_grf $K/unl_b1.grf q1.tgt -l$K/ok_b1.lst; diff q0.tgt q1.tgt | head -4
gcc -O0 -g -fsanitize=address,undefined -I$TREE/include $K/api_list.c -o api_list -L$TREE/lib -lscotch -lscotcherr -lz -lm -lrt -pthread
for m in b d i; do ./api_list $m 2>&1 | grep -m3 "ERROR\|AddressSanitizer\|: [0-9]\|^deco\|#[0-1] "; done
echo "### CLI-12"; K=$R/CLI-12
for o in i v t p; do for b in 0 1; do $B/gout $K/g$b.grf $K/g$b.xyz /dev/null o$b.$o -mn -O$o; done; \
  diff <(grep -v 'Title\|CreationDate\|Created by\|comment' o0.$o) <(grep -v 'Title\|CreationDate\|Created by\|comment' o1.$o) >/dev/null && echo "-O$o identical" || echo "-O$o differs"; done
echo "### CLI-13"; K=$R/CLI-13
$B/atst $K/c8.tgt | grep -i min; $B/atst $K/c1.tgt | grep -i min; $B/amk_m2 4 4 | $B/atst | grep -i min
echo "### CLI-14"; K=$R/CLI-14
$B/gcv -is -oZ $K/g44.grf /dev/null /dev/null; echo rc=$?;  $B/gcv -is -oc $K/g44.grf /dev/null /dev/null; echo rc=$?
$B/mcv -is -oZ $K/m33.msh /dev/null /dev/null; echo rc=$?;  $B/mcv -is -os $K/m33.msh /dev/null /dev/null; echo rc=$?
echo "### CLI-16"; K=$R/CLI-16
$B/gout $K/g1.grf /dev/null /dev/null o.tlp -mn -gn -Ot 2>&1 | grep -m2 "ERROR\|runtime error\|SEGV"; echo rc=${PIPESTATUS[0]}
$B/gout $K/g0.grf /dev/null /dev/null o.tlp -mn -gn -Ot 2>&1 | grep -m2 "ERROR\|runtime error\|SEGV"; echo rc=${PIPESTATUS[0]}
for o in i v p; do $B/gout $K/g1.grf /dev/null /dev/null o.x -mn -gn -O$o 2>&1 | grep -m2 "ERROR\|runtime error"; done
echo "### CLI-17"; K=$R/CLI-17
$B/gout $K/g0.grf $K/g0.xyz /dev/null o.iv -mn '-Oi{c' 2>&1 | grep -m2 "ERROR\|runtime error\|SEGV"; echo rc=${PIPESTATUS[0]}
echo "### CLI-18"
for d0 in 1 2 3 4; do for d1 in 1 2 3 4; do $B/gmk_m2 $d0 $d1 -e -t g.grf; hdr=$(sed -n 2p g.grf | cut -f2); \
  cnt=$(tail -n +4 g.grf | awk '{s+=$1} END{print s+0}'); $B/gtst g.grf >/dev/null 2>&1; r=$?; [ "$hdr" = "$cnt" ] && [ $r = 0 ] || echo "${d0}x${d1} header=$hdr written=$cnt gtst_rc=$r"; done; done; echo "CLI-18 sweep done"
echo "### PS2-G15-6"; K=$R/PS2-G15-6
$B/gotst $K/p.grf $K/bad.ord /dev/null; echo rc=$?
echo "### PS2-G27-2"; K=$R/PS2-G27-2
for o in i v; do ASAN_OPTIONS=detect_leaks=1 $B/gout $K/v1.grf $K/v1.xyz /dev/null /dev/null -mn -O$o 2>&1 | grep -m2 "LeakSanitizer\|#[1-2] "; echo "-O$o rc=${PIPESTATUS[0]}"; done
