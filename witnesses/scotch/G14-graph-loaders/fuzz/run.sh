#!/bin/sh
# 4 fuzz campaigns, identical mutants (N=1500, seed 1234).
# Set BUILD_PRISTINE, BUILD_PATCHED, BUILD_PRISTINE64, BUILD_PATCHED64 (prefixes with bin/ and lib/).
cd "$(dirname "$0")" || exit 1
for c in pristine32:BUILD_PRISTINE pristine64:BUILD_PRISTINE64 patched32:BUILD_PATCHED patched64:BUILD_PATCHED64; do
  n=${c%%:*}; v=${c##*:}; eval b=\$$v
  [ -n "$b" ] || { echo "skip $n ($v unset)" >&2; continue; }
  python3 -I mutfuzz.py "$b/bin" "$b/lib" seeds out-$n 1500 1234 > out-$n.txt 2>&1
done
