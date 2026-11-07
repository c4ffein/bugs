/* COR-15 twin: SCOTCH_graphTabLoad() reads its counts and labels with fscanf ("%d"/"%ld"),
** not intLoad(): out-of-range numbers wrap (glibc) instead of being rejected.
** usage: tabload graph.grf mapping_file */
#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <scotch.h>

int
main (int argc, char * argv[])
{
  SCOTCH_Graph        grafdat;
  SCOTCH_Num          vertnbr;
  SCOTCH_Num *        parttab;
  FILE *              stream;
  int                 o;

  SCOTCH_graphInit (&grafdat);
  stream = fopen (argv[1], "r");
  if (SCOTCH_graphLoad (&grafdat, stream, -1, 0) != 0) return (1);
  fclose (stream);
  SCOTCH_graphSize (&grafdat, &vertnbr, NULL);
  parttab = malloc (vertnbr * sizeof (SCOTCH_Num));
  stream = fopen (argv[2], "r");
  o = SCOTCH_graphTabLoad (&grafdat, parttab, stream);
  fclose (stream);
  printf ("SCOTCH_graphTabLoad ret=%d parttab[0]=%ld parttab[1]=%ld\n", o, (long) parttab[0], (long) parttab[1]);
  free (parttab);
  SCOTCH_graphExit (&grafdat);
  return (0);
}
