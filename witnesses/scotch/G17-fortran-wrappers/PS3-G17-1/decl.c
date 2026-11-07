#include <stdio.h>
#include "scotch.h"
int f (SCOTCH_Graph * g, SCOTCH_Mapping * m) { return (SCOTCH_graphMapViewRaw (g, m, stdout)); }
