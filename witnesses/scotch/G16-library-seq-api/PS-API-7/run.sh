#!/bin/sh
: "${SCOTCH_BUILD:?set SCOTCH_BUILD to a Scotch tree with include/ and lib/ (ptscotch) built}"
D=$(dirname "$0")
B=$SCOTCH_BUILD
INT=""; grep -q INTSIZE64 "$B/src/Makefile.inc" && INT="-DINTSIZE64 -DIDXSIZE64"
mpicc $INT -I"$B/include" "$D/edgeless.c" -o "${TMPDIR:-/tmp}/edgeless.$$" -L"$B/lib" -lptscotch -lscotch -lptscotcherr -lz -lm -lpthread || exit 1
for n in 1 2; do echo "np=$n"; mpirun --oversubscribe -np $n "${TMPDIR:-/tmp}/edgeless.$$"; done
rm -f "${TMPDIR:-/tmp}/edgeless.$$"
