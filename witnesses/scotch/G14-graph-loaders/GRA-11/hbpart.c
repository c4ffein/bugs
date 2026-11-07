/* Load a Harwell-Boeing graph, check it and partition it. usage: hbpart file.hb */
#include <stdio.h>
#include <stdlib.h>
#include "scotch.h"
int main (int argc, char * argv[])
{
  SCOTCH_Graph g; SCOTCH_Strat s; SCOTCH_Num p[64]; FILE * f; int r;
  SCOTCH_graphInit (&g); SCOTCH_stratInit (&s);
  f = fopen (argv[1], "r");
  r = SCOTCH_graphGeomLoadHabo (&g, NULL, f, NULL, NULL); fclose (f);
  printf ("load=%d\n", r); fflush (stdout); if (r != 0) return (1);
  printf ("check=%d\n", SCOTCH_graphCheck (&g)); fflush (stdout);
  r = SCOTCH_graphPart (&g, 2, &s, p); printf ("part=%d\n", r);
  SCOTCH_stratExit (&s); SCOTCH_graphExit (&g);
  return (0);
}
