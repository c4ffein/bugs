#!/bin/bash
# 7.0.18 re-verification: pristine (fi0) vs this series (fi), per-routine injection (FI_FUNC), MPI_THREAD_MULTIPLE drivers
W=${WORK:?set WORK to the work18/G24-hdgraph directory}; C=$W/repro/common; D=$W/scotch/src/check/data
cd $C
export OMPI_ALLOW_RUN_AS_ROOT=1 OMPI_ALLOW_RUN_AS_ROOT_CONFIRM=1
for f in "0 hdgraphOrderSi2 0" "0 dorderNew 1" "0 hdgraphInduceList 3" "0 hdgraphGather 0" "0 hdgraphGather 1" "1 hdgraphGather 1" "0 dorderNewSequ 0" "2 dorderNewSequ 0" "0 hdgraphFold2 0" "0 hdgraphFold2 2" "0 dgraphFoldComm 0" "0 vdgraphGatherAll 0" "0 stratParserParse 0" "0 contextThreadInit2 0"; do
  set -- $f
  for b in fi0 fi; do ./onef.sh $W/$b/lib $C/bin_$b/orderfi 3 $1 $2 $3 $D/m16x16.grf "" rc; done
done
echo "=== strategy q (sequential ordering on root)"
for f in "0 orderInit 0" "0 hdgraphGather 0"; do
  set -- $f
  for b in fi0 fi; do ./onef.sh $W/$b/lib $C/bin_$b/orderfi 3 $1 $2 $3 $D/m16x16.grf q rc; done
done
echo "=== mode all after agreed failure (PS2-G24-3)"
for b in fi0 fi; do ./onef.sh $W/$b/lib $C/bin_$b/orderfi 3 0 hdgraphOrderSi2 0 $D/m16x16.grf "" all; done
echo "=== mapping"
for f in "0 kgraphInit 0" "2 kgraphInit 0" "0 kdgraphMapRbAdd2 0" "0 dgraphInduce2 4"; do
  set -- $f
  for b in fi0 fi; do ./onef.sh $W/$b/lib $C/bin_$b/mapfi 3 $1 $2 $3 $D/m16x16.grf cmplt:5; done
done
echo "=== no injection (check mode, 3 runs each) and weighted 4elt_w (DMO-01)"
for b in fi0 fi; do for i in 1 2 3; do ./onef.sh $W/$b/lib $C/bin_$b/orderfi 3 0 none -1 $D/m16x16.grf "" check; done; ./onef.sh $W/$b/lib $C/bin_$b/orderfi 3 0 none -1 $C/4elt_w.grf "" check; ./onef.sh $W/$b/lib $C/bin_$b/orderfi 5 0 none -1 $C/4elt_w.grf "" check; done
echo DONE
