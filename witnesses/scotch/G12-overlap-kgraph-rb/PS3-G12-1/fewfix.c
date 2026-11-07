/* PS3-G12-1: SCOTCH_graphMapFixed with few fixed vertices and many parts.
** 7.0.18 sizes the merge hash table of kgraphMapRbVfloMerge() from the number
** of fixed domains only, while it first inserts all domains of the mapping.
** usage: fewfix fixnbr partnbr [gridside] */
#include "../common/mk.h"

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
  SCOTCH_Num *        parttab = malloc (n * sizeof (SCOTCH_Num));
  SCOTCH_Num          i, d;
  int                 r;

  for (i = 0; i < n; i ++)
    parttab[i] = -1;
  for (i = 0; i < nf; i ++)
    parttab[i * (n / nf)] = i % np;
  mkgrid (&g, side, side, NULL);
  SCOTCH_archInit  (&a);
  SCOTCH_archCmplt (&a, np);
  SCOTCH_stratInit (&s);
  r = SCOTCH_graphMapFixed (&g, &a, &s, parttab);
  for (i = 0, d = 0; i < n; i ++)
    if ((parttab[i] < 0) || (parttab[i] >= np))
      d ++;
  printf ("ret=%d badparts=%ld check=%d\n", r, (long) d, SCOTCH_graphCheck (&g));
  return ((r != 0) ? 1 : 0);
}
