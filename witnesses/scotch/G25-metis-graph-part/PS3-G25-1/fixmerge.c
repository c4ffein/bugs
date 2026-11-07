/* PS3-G25-1: SCOTCH_graphMapFixed with one fixed vertex onto a 32-part complete graph.
** Since 22c9c42e, kgraphMapRbVfloMerge() sizes its hash table from the number of fixed
** domains only (8 slots here), but first inserts all the domains of the computed mapping. */
#include <stdio.h>
#include <stdlib.h>
#include "scotch.h"
#define N 64
int main (int argc, char ** argv)
{
  SCOTCH_Graph g; SCOTCH_Arch a; SCOTCH_Strat s;
  SCOTCH_Num v[N + 1], e[2 * N], p[N], n = 0, i, k = (argc > 1) ? atoi (argv[1]) : 32, used[64] = { 0 }, cnt = 0;
  for (i = 0; i < N; i ++) {                      /* Ring of N vertices */
    v[i] = n; e[n ++] = (i + N - 1) % N; e[n ++] = (i + 1) % N; p[i] = -1;
  }
  v[N] = n;
  p[0] = 0;                                       /* One fixed vertex */
  SCOTCH_graphInit (&g); SCOTCH_graphBuild (&g, 0, N, v, NULL, NULL, NULL, n, e, NULL);
  SCOTCH_archInit (&a); SCOTCH_archCmplt (&a, k); SCOTCH_stratInit (&s);
  printf ("calling SCOTCH_graphMapFixed onto K%ld\n", (long) k); fflush (stdout);
  i = SCOTCH_graphMapFixed (&g, &a, &s, p);
  for (n = 0; n < N; n ++) if (! used[p[n]]) { used[p[n]] = 1; cnt ++; }
  printf ("returned %ld, %ld distinct parts, p[0]=%ld\n", (long) i, (long) cnt, (long) p[0]);
  SCOTCH_stratExit (&s); SCOTCH_archExit (&a); SCOTCH_graphExit (&g);
  return (0);
}
