#!/bin/sh
# Usage: SCOTCH_SRC=<built Scotch tree> sh run.sh
: "${SCOTCH_SRC:?set SCOTCH_SRC to a Scotch tree with bin/gmap and bin/dgmap built}"
for g in m4x4_b1.grf m4x4_b1_ev.grf bump_b1.grf; do
  echo "== $g"
  printf 'gmap : '; "$SCOTCH_SRC/bin/gmap" "$SCOTCH_SRC/src/check/data/$g" "$SCOTCH_SRC/tgt/k4.tgt" /dev/null -vm 2>&1 | grep CommDelta
  printf 'dgmap: '; mpirun --oversubscribe -np 1 "$SCOTCH_SRC/bin/dgmap" "$SCOTCH_SRC/src/check/data/$g" "$SCOTCH_SRC/tgt/k4.tgt" /dev/null -vm 2>&1 | grep CommDelta
done
