/* Check that dgraphFold() keeps all vertices when the source distribution is skewed
** (exercises the sender-receiver logic of dgraphFoldComm(), cf. upstream 7e17084b).
** usage: mpirun -np P ./foldskew partval base seed
** Rank r owns cnt[r] vertices of a ring, cnt drawn from a skewed distribution (seed);
** receivers check the folded graph with dgraphCheck() and that the global vertex
** count and the vertex number set are preserved. Prints "foldskew OK" or "foldskew BAD".
*/
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "module.h"
#include "common.h"
#include "graph.h"
#include "dgraph.h"
#include "scotch.h"
#include "ptscotch.h"

int
main (int argc, char * argv[])
{
  int                 rank, np, partval, base, seed, r, o, bad = 0;
  Gnum                N, lo, nl, i, ne, sum;
  Gnum *              cnt;
  Gnum *              vert;
  Gnum *              edge;
  SCOTCH_Dgraph       sg;
  Dgraph              fg;

  { int thrdprov; MPI_Init_thread (&argc, &argv, MPI_THREAD_MULTIPLE, &thrdprov); }
  MPI_Comm_rank (MPI_COMM_WORLD, &rank);
  MPI_Comm_size (MPI_COMM_WORLD, &np);
  partval = atoi (argv[1]); base = atoi (argv[2]); seed = atoi (argv[3]);
  cnt = malloc (np * sizeof (Gnum));
  srand (seed);
  for (r = 0, N = 0; r < np; r ++) {               /* Skewed: one heavy process, others light or tiny */
    int x = rand () % 4;
    cnt[r] = (getenv ("FOLDSKEW_EXTREME") != NULL)
             ? ((x == 0) ? (300 + rand () % 300) : (1 + rand () % 2))
             : ((x == 0) ? (40 + rand () % 60) : ((x == 1) ? (1 + rand () % 3) : (5 + rand () % 10)));
    N += cnt[r];
  }
  for (r = 0, lo = 0; r < rank; r ++) lo += cnt[r];
  nl = cnt[rank];
  vert = malloc ((nl + 1) * sizeof (Gnum)); edge = malloc ((2 * nl + 2) * sizeof (Gnum));
  for (i = 0, ne = 0; i < nl; i ++) {
    Gnum g = lo + i;
    vert[i] = base + ne;
    edge[ne ++] = base + (g + N - 1) % N;
    edge[ne ++] = base + (g + 1) % N;
  }
  vert[nl] = base + ne;
  SCOTCH_dgraphInit (&sg, MPI_COMM_WORLD);
  if ((SCOTCH_dgraphBuild (&sg, base, nl, nl, vert, NULL, NULL, NULL, ne, ne, edge, NULL, NULL) != 0) ||
      (SCOTCH_dgraphCheck (&sg) != 0)) {
    fprintf (stderr, "rank %d: build failed\n", rank);
    return (2);
  }
  memset (&fg, 0, sizeof (fg));
  o = dgraphFold ((Dgraph *) &sg, partval, &fg, NULL, NULL, GNUM_MPI);
  if (o == 0) {
    int fldprocnbr = (np + 1) / 2;
    int isrecv = (partval == 0) ? (rank < fldprocnbr) : (rank >= fldprocnbr);
    if (isrecv) {
      Gnum v, vsum = 0, vglb;
      if (dgraphCheck (&fg) != 0) bad = 1;
      if (fg.vertglbnbr != N) bad = 1;
      for (v = fg.baseval; v < fg.vertlocnnd; v ++)  /* Sum of original vertex numbers must be preserved */
        vsum += (fg.vnumloctax != NULL) ? fg.vnumloctax[v] : 0;
      MPI_Allreduce (&vsum, &vglb, 1, GNUM_MPI, MPI_SUM, fg.proccomm);
      if ((fg.vnumloctax != NULL) && (vglb != N * base + (N * (N - 1)) / 2)) bad = 1;
      MPI_Allreduce (&fg.vertlocnbr, &sum, 1, GNUM_MPI, MPI_SUM, fg.proccomm);
      if (sum != N) bad = 1;
      dgraphExit (&fg);
    }
  }
  else
    bad = 1;
  MPI_Allreduce (MPI_IN_PLACE, &bad, 1, MPI_INT, MPI_MAX, MPI_COMM_WORLD);
  if (rank == 0)
    printf ("foldskew np=%d part=%d base=%d seed=%d N=%ld rc=%d %s\n", np, partval, base, seed, (long) N, o, bad ? "BAD" : "OK");
  SCOTCH_dgraphExit (&sg);
  free (vert); free (edge); free (cnt);
  MPI_Finalize ();
  return (bad);
}
