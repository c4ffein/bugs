/* PS3-G13-2 / follow-up: kgraphMapFm() work-array leaks on allocation-failure paths.
** Needs a libscotch whose kgraphMapFmEdgeResize() fails its Nth call (env G13FAIL=N) and starts with a tiny
** extended edge array (see README). Runs FM on a W x W grid split in two halves (non-empty frontier) onto cmplt(2). */
#include "internal.h"
int
main (int argc, char * argv[])
{
  int w = (argc > 1) ? atoi (argv[1]) : 16;
  Graph g; Arch a; Kgraph kg; static Context ctx; ArchDom root, d0, d1; Gnum i, n = (Gnum) w * w;
  mkgrid (&g, w, w, NULL);
  SCOTCH_archInit ((SCOTCH_Arch *) &a); SCOTCH_archCmplt ((SCOTCH_Arch *) &a, 2);
  contextInit (&ctx); contextOptionsInit (&ctx); contextCommit (&ctx);
  if (kgraphInit (&kg, &g, &a, NULL, 0, NULL, 1, 0, NULL) != 0) return (8);
  kg.contptr = &ctx;
  if (mapAlloc (&kg.m) != 0) return (7);
  archDomFrst (&a, &root); archDomBipart (&a, &root, &d0, &d1);
  kg.m.domnnbr = 2; kg.m.domntab[0] = d0; kg.m.domntab[1] = d1;
  for (i = 0; i < n; i ++) kg.m.parttax[i] = ((i % w) < (w / 2)) ? 0 : 1;
  kgraphFron (&kg); kgraphCost (&kg);
  KgraphMapFmParam p = { 200, ~0, 0.05 };
  int r = kgraphMapFm (&kg, &p);
  printf ("ret=%d\n", r);
  kgraphExit (&kg); graphExit (&g); archExit (&a); contextExit (&ctx); /* So that LeakSanitizer sees only what kgraphMapFm leaks */
  return (0);
}
