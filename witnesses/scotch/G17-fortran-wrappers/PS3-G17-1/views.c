/* Compare Fortran view wrappers with their C routines (same graph, same mappings).
** Usage: ./views_<tree>; prints "<name>: identical" or "<name>: DIFFER". Built with -DNEWWRAP to
** also test the GRAPHMAPVIEWRAW/GRAPHREMAPVIEW/GRAPHREMAPVIEWRAW wrappers added by our patch. */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include "scotch.h"
extern void scotchfgraphpartovlview_ (SCOTCH_Graph *, SCOTCH_Num *, SCOTCH_Num *, int *, int *);
#ifdef NEWWRAP
extern int SCOTCH_graphMapViewRaw (const SCOTCH_Graph * const, const SCOTCH_Mapping * const, FILE * const);
extern void scotchfgraphmapviewraw_ (SCOTCH_Graph *, SCOTCH_Mapping *, int *, int *);
extern void scotchfgraphremapview_ (SCOTCH_Graph *, SCOTCH_Mapping *, SCOTCH_Mapping *, double *, SCOTCH_Num *, int *, int *);
extern void scotchfgraphremapviewraw_ (SCOTCH_Graph *, SCOTCH_Mapping *, SCOTCH_Mapping *, double *, SCOTCH_Num *, int *, int *);
#endif
static char a[8192], b[8192];
static void slurp (FILE * f, char * t) { size_t n; rewind (f); n = fread (t, 1, 8191, f); t[n] = 0; }
static void cmp (const char * name, FILE * fc, FILE * ff, int ierr)
{ slurp (fc, a); slurp (ff, b); printf ("%s: ierr=%d %s (%zu bytes)\n", name, ierr, (strcmp (a, b) == 0 && a[0]) ? "identical" : "DIFFER", strlen (a)); }
int main (void)
{
  SCOTCH_Graph g; SCOTCH_Arch r; SCOTCH_Mapping m, o;
  SCOTCH_Num v[9], e[14], p[8], q[8], w[8], n = 0, i, pn = 2, pt[8] = { 0, 0, 0, -1, 1, 1, 1, 1 };
  double emr = 2.0; int ierr, fd; FILE * fc, * ff;
  for (i = 0; i < 8; i ++) { v[i] = n; if (i > 0) e[n ++] = i - 1; if (i < 7) e[n ++] = i + 1; p[i] = (i < 4) ? 0 : 7; q[i] = (i < 4) ? 7 : 0; w[i] = i + 1; }
  v[8] = n;
  SCOTCH_graphInit (&g); SCOTCH_graphBuild (&g, 0, 8, v, NULL, NULL, NULL, n, e, NULL);
  SCOTCH_archInit (&r); SCOTCH_archMesh2 (&r, 8, 1);
  SCOTCH_graphMapInit (&g, &m, &r, p); SCOTCH_graphMapInit (&g, &o, &r, q);
  fc = tmpfile (); ff = tmpfile (); fd = fileno (ff);
  SCOTCH_graphPartOvlView (&g, 2, pt, fc); fflush (fc); ierr = -77; scotchfgraphpartovlview_ (&g, &pn, pt, &fd, &ierr); cmp ("graphpartovlview", fc, ff, ierr);
#ifdef NEWWRAP
  ftruncate (fileno (fc), 0); ftruncate (fd, 0); rewind (fc); lseek (fd, 0, SEEK_SET);
  SCOTCH_graphMapViewRaw (&g, &m, fc); fflush (fc); ierr = -77; scotchfgraphmapviewraw_ (&g, &m, &fd, &ierr); cmp ("graphmapviewraw", fc, ff, ierr);
  ftruncate (fileno (fc), 0); ftruncate (fd, 0); rewind (fc); lseek (fd, 0, SEEK_SET);
  SCOTCH_graphRemapView (&g, &m, &o, emr, w, fc); fflush (fc); ierr = -77; scotchfgraphremapview_ (&g, &m, &o, &emr, w, &fd, &ierr); cmp ("graphremapview", fc, ff, ierr);
  ftruncate (fileno (fc), 0); ftruncate (fd, 0); rewind (fc); lseek (fd, 0, SEEK_SET);
  SCOTCH_graphRemapViewRaw (&g, &m, &o, emr, w, fc); fflush (fc); ierr = -77; scotchfgraphremapviewraw_ (&g, &m, &o, &emr, w, &fd, &ierr); cmp ("graphremapviewraw", fc, ff, ierr);
#endif
  return (0);
}
