#!/bin/sh
# Usage: run18.sh <tree> ; all 7.0.18 G03 cases against <tree> (bin/atst, bin/gmap, lib); new/torusapi_<basename tree> must exist
B=$1; D=$(cd "$(dirname "$0")" && pwd)
export LD_LIBRARY_PATH=$B/lib ASAN_OPTIONS=detect_leaks=1 UBSAN_OPTIONS=print_stacktrace=0
s() { r=$(timeout 120 "$@" 2>&1); echo "[$(echo $* | sed "s|$B/bin/||; s|$D/||g")] rc=$? | $(echo "$r" | grep -m2 'runtime error\|Sanitizer:\|ERROR: [a-zA-Z0-9]*:\|Terminals\|^ret=' | sed 's|^.*/||; s|^[^ ]*: ||' | tr '\n' ' ')"; }
G=$D/COR-07/m4x4.grf
for t in COR-07/meshx0 COR-07/torusx0; do s $B/bin/gmap $G $D/$t.tgt /dev/null; done
for t in COR-21/m2 COR-21/m3 COR-21/mx COR-21/t2 COR-21/tx COR-21/cw COR-21/cws COR-21/d0big COR-21/d1big new/m2b new/m3b new/mxb new/t2b new/cwb \
         PS-COR-1/anc COR-16/bad1 COR-16/dup0 COR-16/num0 COR-16/wbig COR-16/wneg COR-16/w0 COR-16/zero0 COR-16/ok0 COR-16/ok1; do s $B/bin/atst $D/$t.tgt; done
s $B/bin/gmap $G $D/COR-16/bad1.tgt /dev/null
for a in "t2 0 5" "t3 2 0 3" "tx 0 4" "tx 2 0 4" "mx 2 0 4" "m2 100000 50000" "t2 100000 50000" "tx 2 4 4"; do s $D/new/torusapi_$(basename $B) $a; done
