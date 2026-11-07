/* Call SCOTCH_archSub() on "cmplt 4" with the terminal list given on
** the command line, then ALWAYS call SCOTCH_archExit() on the
** sub-architecture, as a caller that initialized it may do after a
** failure. Expected: no sanitizer report, no leak, whatever the list. */
#include <stdio.h>
#include <stdlib.h>
#include "scotch.h"

int
main (
int                 argc,
char *              argv[])
{
  SCOTCH_Arch         orgarchdat;
  SCOTCH_Arch         subarchdat;
  SCOTCH_Num          vnumtab[64];
  SCOTCH_Num          vnumnbr;
  int                 o;

  SCOTCH_errorProg (argv[0]);
  for (vnumnbr = 0; (vnumnbr < 64) && (vnumnbr + 1 < argc); vnumnbr ++)
    vnumtab[vnumnbr] = (SCOTCH_Num) atol (argv[vnumnbr + 1]);
  SCOTCH_archInit (&orgarchdat);
  SCOTCH_archCmplt (&orgarchdat, 4);
  SCOTCH_archInit (&subarchdat);
  o = SCOTCH_archSub (&subarchdat, &orgarchdat, vnumnbr, vnumtab);
  printf ("archSub ret=%d\n", o);
  if (o == 0)
    printf ("size=%ld\n", (long) SCOTCH_archSize (&subarchdat));
  SCOTCH_archExit (&subarchdat);
  SCOTCH_archExit (&orgarchdat);
  return (o);
}
