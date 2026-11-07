#!/bin/bash
# Run the G28 kits against build tree $1 (lib/bin) with check sources from tree $2 (src/check/*.c), output dir $3.
# 7.0.18 adaptation of the 7.0.17 kits: same commands, paths parameterised.
B=$1; SRC=$2; OUT=$3; R=$(cd $(dirname $0); pwd); mkdir -p $OUT; cd $OUT
export LD_LIBRARY_PATH=$B/lib ASAN_OPTIONS=detect_leaks=0 OMPI_ALLOW_RUN_AS_ROOT=1 OMPI_ALLOW_RUN_AS_ROOT_CONFIRM=1
D=$SRC/src/check/data; M=$R/mutate.sh
echo "### CLI-20"; $B/bin/gpart -h | grep -- '-b<val>'; echo "cmplt 3" | $B/bin/gmap $D/bump.grf - /dev/null -cZ 2>&1 | head -1
echo "### PS2-G28-1"; echo "cmplt 3" | $B/bin/gmap $D/bump.grf - /dev/null -q 2>&1 | head -1
timeout 60 mpirun --oversubscribe -np 1 $B/bin/dgmap $D/bump.grf /dev/null /dev/null -q 2>&1 | grep -m1 ERROR
echo "### BLD-23"; $B/bin/gscat -h | grep -- '-i'; $B/bin/gscat 3 $D/m4x4.grf out-%r.grf -i 2>&1 | head -1; echo rc=${PIPESTATUS[0]}; $B/bin/gscat 3 $D/m4x4.grf out-%r.grf -i2; echo rc=$?
echo "### PS3-G28-1 (gscat as in the man page synopsis)"; $B/bin/gscat $D/m4x4.grf out.grf 2>&1 | head -1
echo "### CLI-21"; for t in dgmap dgord dgscat dggath dgtst; do for o in -h -V; do timeout 60 mpirun --oversubscribe -np 2 $B/bin/$t $o >/dev/null 2>err.txt; echo "$t $o rc=$? $(grep -m1 -o 'without calling "finalize"' err.txt)"; done; done
cp $R/CLI-21/hang/part-*.grf .; timeout 30 mpirun --oversubscribe -np 3 $B/bin/dgtst 'part-%r.grf' 2>&1 | grep -m2 "ERROR\|MPI_ABORT\|exited with non-zero"; echo rc=${PIPESTATUS[0]}
echo "### BLD-04"; cd $SRC/src/check
$M $B $SRC/src/check/test_scotch_graph_order.c '^  checkOrder \(baseval, vertnbr, permtab, peritab\); /\* Double check' 'permtab[5] = permtab[6];' data/bump.grf
$M $B $SRC/src/check/test_scotch_graph_order.c '^  checkOrder \(baseval, vertnbr, permtab, peritab\); /\* Double check' 'permtab[5] = baseval - 7;' data/bump.grf | grep -v "^    #"
echo "### BLD-15"; L='{ SCOTCH_Num * edgetab; SCOTCH_graphData (&grafdat, NULL, NULL, NULL, NULL, NULL, NULL, NULL, &edgetab, NULL); edgetab[0] = 999999; }'
$M $B $SRC/src/check/test_scotch_mesh_graph.c '^ *if \(SCOTCH_graphCheck \(&grafdat\) != 0\)' "$L" data/ship001.msh
echo "### BLD-16"; A='^ +checkMap \((vertnbr|&archtab)'
MUTATE_LINES=2 $M $B $SRC/src/check/test_scotch_graph_map.c "$A" 'memset (parttab, ~0, vertnbr * sizeof (SCOTCH_Num));' data/m16x16.grf
MUTATE_LINES=2 $M $B $SRC/src/check/test_scotch_graph_map.c "$A" 'if ((archnum < 2) && ((typenum == 1) || (typenum >= 5))) parttab[COORD (0, 0)] = 1;' data/m16x16.grf
MUTATE_LINES=2 $M $B $SRC/src/check/test_scotch_graph_map.c "$A" 'if (archnum == 3) parttab[5] = 0;' data/m16x16.grf
MUTATE_LINES=2 $M $B $SRC/src/check/test_scotch_graph_map.c "$A" 'if (archnum == 0) parttab[5] = 5;' data/m16x16.grf
echo "### BLD-18 (CHECKSCOTCH list entries for atst/mcv; read with awk, no make in the source tree)"
awk '/^CHECKSCOTCH[ \t]*=/{f=1} f{print} f&&!/\\$/{f=0}' $SRC/src/check/Makefile | grep -c 'check_prog_atst\|check_prog_mcv'
