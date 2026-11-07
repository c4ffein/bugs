7.0.18 re-run; the container now has 4 CPUs, so the mask is 'taskset -c 2-3'.
  LD_LIBRARY_PATH=$B/lib taskset -c 2-3 ./core <c0> <c1> <c2> <c3>   (thread masks printed after spawn, master first)
  pristine 7.0.18: {2 3 2 3} -> 2 3 2 3 ; {0 1 0 1} -> 2 3 2 3 (fixed) ; {-1 -1 -1 -1} -> 0 0 0 0 ; {-1 3 -1 2} -> 0 3 0 2 (PS3-G06-1)
  patched (0003): {-1 -1 -1 -1} -> 2-3 x4 ; {-1 3 -1 2} -> 2-3 3 2-3 2 ; {-5 1 -2 0} -> 2-3 3 2-3 2
