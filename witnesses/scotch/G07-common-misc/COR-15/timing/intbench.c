/* COR-15 timing: CPU time of intLoad() over every integer of a graph file (best of N). */
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include "module.h"
#include "common.h"

int
main (int argc, char * argv[])
{
  int                 i, n = (argc > 2) ? atoi (argv[2]) : 5;
  double              best = 1e9;
  long                cnt  = 0;

  for (i = 0; i < n; i ++) {
    FILE *              stream = fopen (argv[1], "r");
    INT                 val;
    long long           sum = 0;
    clock_t             c0, c1;
    double              d;

    setvbuf (stream, NULL, _IOFBF, 1 << 20);
    c0  = clock ();
    for (cnt = 0; intLoad (stream, &val) == 1; cnt ++)
      sum += val;
    c1  = clock ();
    fclose (stream);
    d = (double) (c1 - c0) / CLOCKS_PER_SEC;
    if (d < best) best = d;
    if (i == 0) printf ("%ld integers, sum %lld\n", cnt, sum);
  }
  printf ("intLoad CPU best of %d: %.3f s\n", n, best);
  return (0);
}
