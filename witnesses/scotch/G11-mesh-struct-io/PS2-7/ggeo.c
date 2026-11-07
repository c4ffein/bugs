/* PS2-G11-mesh-struct-io-7: load graph+geometry, save geometry, reload it. usage: ggeo graph.grf in.xyz out.xyz */
#include <stdio.h>
#include <stdlib.h>
#include "scotch.h"
int main (int argc, char * argv[])
{
  SCOTCH_Graph g; SCOTCH_Geom e; FILE * fg, * fx; int r;
  SCOTCH_graphInit (&g); SCOTCH_geomInit (&e);
  fg = fopen (argv[1], "r"); fx = fopen (argv[2], "r");
  r = SCOTCH_graphGeomLoadScot (&g, &e, fg, fx, NULL); fclose (fg); fclose (fx);
  printf ("load1=%d\n", r); if (r != 0) return (1);
  fx = fopen (argv[3], "w"); r = SCOTCH_graphGeomSaveScot (&g, &e, NULL, fx, NULL); fclose (fx);
  printf ("save=%d\n", r);
  SCOTCH_geomExit (&e); SCOTCH_graphExit (&g); SCOTCH_graphInit (&g); SCOTCH_geomInit (&e);
  fg = fopen (argv[1], "r"); fx = fopen (argv[3], "r");
  r = SCOTCH_graphGeomLoadScot (&g, &e, fg, fx, NULL); fclose (fg); fclose (fx);
  printf ("load2=%d\n", r);
  SCOTCH_geomExit (&e); SCOTCH_graphExit (&g);
  return (0);
}
