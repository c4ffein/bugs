7.0.18 re-run. TSan: tsan18_pristine_d1_*.txt (pristine, 15/13/16 reports), tsan18_patched_d{0,1}_*.txt (series).
Determinism (20 fresh runs per cell, 12 for the PyScotch patch): det18/summary.txt. Trees: pristine $INFRA/asan,
patched $WORK/build, PyScotch's scotch-7.0.18-bgraph-bipart-gg-determinism.patch on pristine: $WORK/build_pys.
  SCOTCH_DETERMINISTIC=1 SCOTCH_PTHREAD_NUMBER=<t> gpart 4 m16x16_b100000_v.grf run.map [-M'r{sep=h{pass=20}}']
