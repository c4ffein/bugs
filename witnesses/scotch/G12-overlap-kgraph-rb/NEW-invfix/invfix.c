/* NEW:invfix - SCOTCH_graphMapFixed with many distinct out-of-range fixed terminal numbers.
** Pristine 7.0.18 loops forever in kgraphMapRbVfloBuild() once more distinct invalid
** terminals than hash slots are seen (cmplt(4): 32 slots); a clean error is expected.
** usage: invfix nbfixed nbparts [side]   (fixed vertex i gets terminal 100+i) */
#include <stdio.h>
#include <stdlib.h>
#include "scotch.h"

int
main (int argc, char * argv[])
{
  SCOTCH_Graph        g;
  SCOTCH_Arch         a;
  SCOTCH_Strat        s;
  SCOTCH_Num          nf   = atol (argv[1]);
  SCOTCH_Num          np   = atol (argv[2]);
  int                 side = (argc > 3) ? atoi (argv[3]) : 32;
  SCOTCH_Num          n    = (SCOTCH_Num) side * side;
  SCOTCH_Num *        verttab = malloc ((n + 1) * sizeof (SCOTCH_Num));
  SCOTCH_Num *        edgetab = malloc (4 * n * sizeof (SCOTCH_Num));
  SCOTCH_Num *        parttab = malloc (n * sizeof (SCOTCH_Num));
  SCOTCH_Num          i, e = 0;
  int                 r;

  for (i = 0; i < n; i ++) {
    int x = i % side, y = i / side;
    verttab[i] = e;
    if (x > 0)        edgetab[e ++] = i - 1;
    if (x < side - 1) edgetab[e ++] = i + 1;
    if (y > 0)        edgetab[e ++] = i - side;
    if (y < side - 1) edgetab[e ++] = i + side;
    parttab[i] = -1;
  }
  verttab[n] = e;
  for (i = 0; i < nf; i ++)
    parttab[i * (n / nf)] = 100 + i;
  SCOTCH_graphInit (&g);
  SCOTCH_graphBuild (&g, 0, n, verttab, NULL, NULL, NULL, e, edgetab, NULL);
  SCOTCH_archInit  (&a);
  SCOTCH_archCmplt (&a, np);
  SCOTCH_stratInit (&s);
  r = SCOTCH_graphMapFixed (&g, &a, &s, parttab);
  printf ("ret=%d\n", r);
  return (r == 1 ? 0 : 1);                        /* Expected outcome: clean error 1 */
}
