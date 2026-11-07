/* Map a graph onto "cmplt <n>" with <k> fixed vertices (vertex i fixed to part i, i < k), then report.
** Usage: mapfixed <graph.grf> <n> <k> [strat [raw]]  (raw: vertex i fixed to part i, possibly >= n)
** Exercises kgraphMapRbVfloBuild()/kgraphMapRbVfloMerge() (22c9c42e). */
#include <stdio.h>
#include <stdlib.h>
#include "scotch.h"

int
main (
int                 argc,
char *              argv[])
{
  SCOTCH_Graph        grafdat;
  SCOTCH_Arch         archdat;
  SCOTCH_Strat        stradat;
  SCOTCH_Num          vertnbr;
  SCOTCH_Num *        parttab;
  SCOTCH_Num          vertnum;
  SCOTCH_Num          partnbr;
  SCOTCH_Num          fixdnbr;
  FILE *              fileptr;
  int                 o;

  SCOTCH_errorProg (argv[0]);
  partnbr = atol (argv[2]);
  fixdnbr = atol (argv[3]);
  SCOTCH_graphInit (&grafdat);
  if ((fileptr = fopen (argv[1], "r")) == NULL)
    return (2);
  if (SCOTCH_graphLoad (&grafdat, fileptr, -1, 0) != 0)
    return (2);
  fclose (fileptr);
  SCOTCH_graphSize (&grafdat, &vertnbr, NULL);
  parttab = malloc (vertnbr * sizeof (SCOTCH_Num));
  for (vertnum = 0; vertnum < vertnbr; vertnum ++)
    parttab[vertnum] = (vertnum < fixdnbr) ? ((argc > 5) ? vertnum : (vertnum % partnbr)) : -1; /* "raw": out-of-range parts */
  SCOTCH_archInit (&archdat);
  SCOTCH_archCmplt (&archdat, partnbr);
  SCOTCH_stratInit (&stradat);
  if ((argc > 4) && (argv[4][0] != '\0'))
    SCOTCH_stratGraphMap (&stradat, argv[4]);
  o = SCOTCH_graphMapFixed (&grafdat, &archdat, &stradat, parttab);
  printf ("mapfixed ret=%d\n", o);
  if (o == 0) {
    SCOTCH_Num          partmax;
    for (vertnum = 0, partmax = 0; vertnum < vertnbr; vertnum ++)
      if (parttab[vertnum] > partmax)
        partmax = parttab[vertnum];
    printf ("max part=%ld fixed0=%ld\n", (long) partmax, (long) parttab[0]);
  }
  free (parttab);
  SCOTCH_stratExit (&stradat);
  SCOTCH_archExit (&archdat);
  SCOTCH_graphExit (&grafdat);
  return (o);
}
