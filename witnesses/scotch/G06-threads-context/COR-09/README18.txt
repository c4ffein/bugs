7.0.18 re-run. Pristine B=$INFRA/asan; patched B=$WORK/build (and build64). TSan trees: $WORK/tsan (pristine), $WORK/tsanp (with 0002).
  FAIL_AT=n LD_PRELOAD="$(gcc -print-file-name=libasan.so):./shim.so" LD_LIBRARY_PATH=$B/lib timeout 15 ./spawn 4
  pristine: FAIL_AT=1 rc=0, no leak (fixed by 86559b85); FAIL_AT=2,3 hang (rc=124): slave in threadWaitBarrier1:331,
            master in pthread_cond_destroy <- threadContextExit3:193 (gdb).
  TSan: gcc -O1 -g -fsanitize=thread -I$T/include spawn.c -o spawn_tsan -L$T/lib -lscotch -lscotcherr -lz -lm -lpthread
        FAIL_AT=3 LD_PRELOAD="$(gcc -print-file-name=libtsan.so):./shim.so" LD_LIBRARY_PATH=$T/lib ./spawn_tsan 4
        pristine: 6 reports (tsan_tsan_3.txt); patched: 0 (tsan_tsanp_*.txt).
  patched: FAIL_AT=1,2,3 (4 threads) and 2,5,8 (8 threads): 'spawn returned 1', 'exit done', rc=0.
