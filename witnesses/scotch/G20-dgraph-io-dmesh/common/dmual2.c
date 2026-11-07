/* DGR-20 (7.0.18 round), multi-process variant of dmual: each of the P processes
** owns ne elements, all of them sharing global node 0, so that every element has
** P*ne-1 dual neighbours. On every process this forces both the resizing of the
** edge hash table (dmeshDgraphDualHashEdgeResize) and the extension of the dual
** edge array ("out of memory (6)" site). fishim.so (FI_RANK, FI_NTH) fails one
** allocation of one process; every process prints the return value of
** SCOTCH_dmeshDgraphDual.  usage: mpirun -np P dmual2 [ne]
*/
#define _GNU_SOURCE
#include <dlfcn.h>
#include <stdio.h>
#include <stdlib.h>
#include <mpi.h>
#include "ptscotch.h"
int main (int argc, char * argv[]) {
  int ne = (argc > 1) ? atoi (argv[1]) : 100, i, rc, rank;
  volatile long * armed;
  SCOTCH_Num * vel, * eel;
  SCOTCH_Dmesh m; SCOTCH_Dgraph g;
  { int thrdprov; MPI_Init_thread (&argc, &argv, MPI_THREAD_MULTIPLE, &thrdprov); }
  MPI_Comm_rank (MPI_COMM_WORLD, &rank);
  armed = (volatile long *) dlsym (RTLD_DEFAULT, "fi_armed");
  vel = malloc ((ne + 1) * sizeof (*vel)); eel = malloc (ne * sizeof (*eel));
  for (i = 0; i <= ne; i ++) vel[i] = i;
  for (i = 0; i < ne; i ++) eel[i] = 0;
  SCOTCH_dmeshInit (&m, MPI_COMM_WORLD);
  rc = SCOTCH_dmeshBuildAdm (&m, 0, ne, vel, ne, eel, 1);
  SCOTCH_dgraphInit (&g, MPI_COMM_WORLD);
  if (armed != NULL) *armed = 1;
  rc = SCOTCH_dmeshDgraphDual (&m, &g, 1);
  if (armed != NULL) *armed = 0;
  fprintf (stderr, "r%d DgraphDual rc=%d\n", rank, rc);
  if (rc == 0)
    fprintf (stderr, "r%d check rc=%d\n", rank, SCOTCH_dgraphCheck (&g));
  SCOTCH_dgraphExit (&g); SCOTCH_dmeshExit (&m);
  free (vel); free (eel);
  MPI_Finalize (); return 0;
}
