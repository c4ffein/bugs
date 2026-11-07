# G11-mesh-struct-io on Scotch 7.0.18
No upstream 7.0.18 commit touches a G11 library file (only src/check/Makefile/CMakeLists.txt context, and s_l.tex
line numbers). All 11 patches apply unchanged; rebased onto v7.0.18 with `to :` dates bumped to 02 nov 2026.
SEP-07 fixed -> fixed ran high -> -
SEP-08 still-present -> still-present ran medium -> 0007
SEP-16 still-present -> still-present ran medium -> 0008, 0011
SEP-21 partially-fixed -> partially-fixed ran low -> 0004
SEP-23 still-present -> still-present ran low -> 0002, 0003
API-06 partially-fixed -> partially-fixed ran medium -> 0005
API-08 still-present -> still-present ran medium -> 0006
API-12 partially-fixed -> partially-fixed partly-run medium -> 0005
PS-SEP-1 still-present -> still-present ran medium -> 0001
PS2-G11-mesh-struct-io-1 still-present -> still-present ran medium -> - (library_mesh_order.c is G05's; alt diff applies)
PS2-G11-mesh-struct-io-2 still-present -> still-present ran low -> 0004
PS2-G11-mesh-struct-io-3 still-present -> still-present ran medium -> 0009
PS2-G11-mesh-struct-io-4 still-present -> still-present ran low -> 0003
PS2-G11-mesh-struct-io-5 still-present -> still-present ran medium -> 0011
PS2-G11-mesh-struct-io-6 still-present -> still-present ran medium -> 0007
PS2-G11-mesh-struct-io-7 still-present -> still-present ran low -> - (graph_io_scot.c is G14's)
PS2-G11-mesh-struct-io-8 still-present -> still-present ran high -> 0010
PS2-G11-mesh-struct-io-9 still-present -> still-present source-read info -> -
PS2-G11-mesh-struct-io-10 still-present -> still-present source-read info -> -

| upstream commit | verdict |
|---|---|
| (none touches G11 library files) | - |
| 635741dd, 0d878bdd (check Makefile/CMake context only) | unrelated |

Three most important facts
1. Every G11 defect is still in 7.0.18 and every kit reproduces identically on pristine 32- and 64-bit ASan builds
   (bad free in meshFree, HB heap overflow/SEGV, meshBase global overflow, hmeshExit bad free, meshLoad OOB in ordering).
2. The 11-patch series applies unchanged; 0 warnings on both trees; check_mesh_base, check_scotch_mesh_geom,
   check_scotch_mesh_graph, check_prog_gmk_msh, check_prog_mcv, check_prog_mord, check_scotch_graph_order pass 32/64-bit;
   stylecheck reports only 3 pre-existing upstream lines; git am on a fresh clone OK.
3. 7.0.18 hardened the graph loaders only (9c51d9df edge-count overflow, 0ef275a0 HB sanity check): the mesh twins
   (meshLoad, meshGeomLoadHabo) got nothing, so patches 0007 and 0010 stay fully needed.

Could not do
- SCOTCH_dmeshDgraphDual (API-12 part) was only read, not run under MPI.
- PS2-7 is masked on bare 7.0.18 by GRA-09; shown on top of G14 series (G14 patch 0006).

User must decide
- PS2-1 (G05's file), PS2-7 (G14's file), PS2-9 (honour the Fortran rank string or document it), PS2-10 (drop the
  prototype or the whole mesh_io.h): unchanged from 7.0.17, alt diffs still apply to v7.0.18.
