/* PS2-G17-1: SCOTCH_dgraphBuildGrid3D with incrval = 0 (parameter checks are debug-only). */
#include <stdio.h>
#include <stdint.h>
#include <mpi.h>
#include "ptscotch.h"
int main (int argc, char ** argv)
{
  SCOTCH_Dgraph g; int p, o;
  MPI_Init_thread (&argc, &argv, MPI_THREAD_MULTIPLE, &p);
  SCOTCH_dgraphInit (&g, MPI_COMM_WORLD);
  o = SCOTCH_dgraphBuildGrid3D (&g, 0, 2, 2, 2, 0, 0);
  printf ("SCOTCH_dgraphBuildGrid3D (incrval = 0) returned %d\n", o);
  SCOTCH_dgraphExit (&g); MPI_Finalize (); return (0);
}
