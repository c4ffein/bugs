#!/bin/bash
# run.sh TREE : (env: SCRATCH = work directory, default a fresh mktemp -d) DMO-02 / PS2-G23-1 probes with the shipped dgord (lbl.grf = 12-vertex path, base 1, labels 101..112)
T=$1; C=$(dirname $(readlink -f $0))/../common; S=${SCRATCH:-$(mktemp -d)}/dmo02; mkdir -p $S    # SCRATCH: optional work directory
export OMPI_ALLOW_RUN_AS_ROOT=1 OMPI_ALLOW_RUN_AS_ROOT_CONFIRM=1 ASAN_OPTIONS=detect_leaks=0 LD_LIBRARY_PATH=$T/lib
f () { grep -E "ERROR|runtime error|Sanitizer:|SUMMARY|signal|Segmentation|Fatal|Abort|invalid pointer|malloc" | sed -E 's/==[0-9]+==//' | cut -c1-150 | sort | uniq -c; }
for np in 1 3; do
  echo "== np=$np dgord lbl.grf ord -T tree"; rm -f $S/*
  timeout 60 mpirun --oversubscribe -np $np -x LD_LIBRARY_PATH -x ASAN_OPTIONS $T/bin/dgord $C/lbl.grf $S/ord.out -T$S/tre.out 2>&1 | f; echo "   rc=${PIPESTATUS[0]}"
  echo "   ord: $(tr '\n' ' ' < $S/ord.out)"; echo "   tre: $(tr '\n' ' ' < $S/tre.out)"
  echo "== np=$np dgord lbl14.grf (glibc-aligned size)"; timeout 60 mpirun --oversubscribe -np $np -x LD_LIBRARY_PATH -x ASAN_OPTIONS $T/bin/dgord $C/lbl14.grf $S/o14.out 2>&1 | f; echo "   rc=${PIPESTATUS[0]}"
  echo "== np=$np dgord lbl14.grf -T only"; timeout 60 mpirun --oversubscribe -np $np -x LD_LIBRARY_PATH -x ASAN_OPTIONS $T/bin/dgord $C/lbl14.grf /dev/null -T$S/t14.out 2>&1 | f; echo "   rc=${PIPESTATUS[0]}"
done
