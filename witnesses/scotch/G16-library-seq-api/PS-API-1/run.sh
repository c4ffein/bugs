#!/bin/sh
: "${SCOTCH_BUILD:?set SCOTCH_BUILD to a Scotch tree whose libscotch is built with -fsanitize=address,undefined}"
D=$(dirname "$0"); B=$SCOTCH_BUILD
INT=""; grep -q INTSIZE64 "$B/src/Makefile.inc" && INT="-DINTSIZE64 -DIDXSIZE64"
gcc -O0 -g -fsanitize=address,undefined $INT -I"$B/include" "$D/remap.c" -o "${TMPDIR:-/tmp}/remap.$$" -L"$B/lib" -lscotch -lscotcherr -lz -lm -lpthread || exit 1
export ASAN_OPTIONS=detect_leaks=0
for b in 0 1; do "${TMPDIR:-/tmp}/remap.$$" $b 2>&1 | head -12; done
rm -f "${TMPDIR:-/tmp}/remap.$$"
