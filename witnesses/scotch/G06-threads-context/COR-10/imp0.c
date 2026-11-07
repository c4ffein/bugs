/* Import a thread pool of THRDNBR threads (argv[1]) made of the calling thread only, then destroy it */
#include <stdio.h>
#include <stdlib.h>
#include <scotch.h>

int
main (
int                 argc,
char *              argv[])
{
  SCOTCH_Context *    contptr;
  int                 thrdnbr;
  int                 o;

  thrdnbr = (argc > 1) ? atoi (argv[1]) : 0;
  contptr = SCOTCH_contextAlloc ();
  SCOTCH_contextInit (contptr);
  o = SCOTCH_contextThreadImport1 (contptr, thrdnbr);
  printf ("import1 (%d) returned %d\n", thrdnbr, o);
  fflush (stdout);
  if (o == 0) {
    o = SCOTCH_contextThreadImport2 (contptr, 0);
    printf ("import2 returned %d\n", o);
    fflush (stdout);
  }
  SCOTCH_contextExit (contptr);
  free (contptr);
  printf ("exit done\n");
  return (0);
}
