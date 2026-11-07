7.0.18 re-run. imp0.c (new): SCOTCH_contextThreadImport1 (ctx, argv[1]) by the calling thread alone, then Import2 (ctx, 0), contextExit.
  gcc -O0 -g -fsanitize=address,undefined -I$B/include -o imp0 imp0.c -L$B/lib -lscotch -lscotcherr -lz -lm -lpthread
  pristine 7.0.18: ./spawn 0 rc=0 (fixed by e122a7c5); ./imp0 0 -> 'import1 (0) returned 0' then hang (rc=124).
  patched (0001): ./imp0 0 and ./imp0 -1 -> 'SCOTCH_contextThreadImport1: invalid number of threads', returned 1, rc=0.
