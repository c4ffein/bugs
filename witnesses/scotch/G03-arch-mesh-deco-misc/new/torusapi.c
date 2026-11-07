/* Call the mesh/torus builders with the parameters given as arguments, print the
** return value and, on success, the architecture size, then exit the architecture.
** Usage: torusapi <t2|t3|tx|mx|m2> <n> ...  (tx/mx: first number is the dimension count) */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "scotch.h"

int
main (
int                 argc,
char *              argv[])
{
  SCOTCH_Arch         archdat;
  SCOTCH_Num          valtab[8];
  int                 valnbr;
  int                 o;

  SCOTCH_errorProg (argv[0]);
  for (valnbr = 0; (valnbr < 8) && (valnbr + 2 < argc); valnbr ++)
    valtab[valnbr] = (SCOTCH_Num) atol (argv[valnbr + 2]);
  SCOTCH_archInit (&archdat);
  if (strcmp (argv[1], "t2") == 0)
    o = SCOTCH_archTorus2 (&archdat, valtab[0], valtab[1]);
  else if (strcmp (argv[1], "t3") == 0)
    o = SCOTCH_archTorus3 (&archdat, valtab[0], valtab[1], valtab[2]);
  else if (strcmp (argv[1], "m2") == 0)
    o = SCOTCH_archMesh2 (&archdat, valtab[0], valtab[1]);
  else if (strcmp (argv[1], "tx") == 0)
    o = SCOTCH_archTorusX (&archdat, valtab[0], valtab + 1);
  else
    o = SCOTCH_archMeshX (&archdat, valtab[0], valtab + 1);
  printf ("ret=%d", o);
  if (o == 0)
    printf (" size=%ld", (long) SCOTCH_archSize (&archdat));
  printf ("\n");
  SCOTCH_archExit (&archdat);
  return (0);
}
