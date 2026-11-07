#!/bin/bash
# usage: run.sh <install or build tree with bin/ and lib/ (ASan build recommended)>
# Runs the amk_grf part of the CLI-11 kit from this directory; output goes to a temporary directory.
T=$(cd "$1" && pwd); K=$(cd "$(dirname "$0")" && pwd); W=$(mktemp -d)
export LD_LIBRARY_PATH=$T/lib ASAN_OPTIONS=detect_leaks=0; B=$T/bin; cd "$K"
echo "## labelled graph, base 0 vs base 1 (same list of labels)"
$B/amk_grf -llab.lst lab_b0.grf $W/lp0.tgt; $B/amk_grf -llab.lst lab_b1.grf $W/lp1.tgt 2>&1 | grep -m2 "ERROR\|#0 "
diff $W/lp0.tgt $W/lp1.tgt | head -6
echo "## out-of-range list (3 90) on an unlabelled base-1 graph"
$B/amk_grf unl_b1.grf /dev/null -lbad.lst 2>&1 | grep -m2 "ERROR\|#0 "
echo "## valid lists, base 0 and base 1 (must differ only in the label column)"
$B/amk_grf unl_b0.grf $W/q0.tgt -lok_b0.lst; $B/amk_grf unl_b1.grf $W/q1.tgt -lok_b1.lst; diff $W/q0.tgt $W/q1.tgt | head -6
echo "outputs in $W"
