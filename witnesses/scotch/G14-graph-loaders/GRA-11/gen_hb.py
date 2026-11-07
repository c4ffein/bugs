#!/usr/bin/env python3
"""Deterministic generator of the Harwell-Boeing inputs of the GRA-11 and GRA-24 kits.
usage: python3 -I gen_hb.py OUTDIR   (writes ok/pre/bad99/bad0/badn1/badcol/baddec.hb)
All files describe a 4x4 pattern-symmetric matrix (columns {1,2},{2,3},{3,4},{4}) in
format PSA, base 1; the bad* variants break one field:
  bad99  row index 99          bad0   blank row field (decodes to 0)
  badn1  row index n+1 = 5     badcol column pointer 99 (> nnz+1)
  baddec decreasing column pointers (1 5 3 7 8)
  pre    same as ok but format (1X,10I3): skip-prefix format (GRA-24)"""
import os, sys
COL = [1, 3, 5, 7, 8]
ROW = [1, 2, 2, 3, 3, 4, 4]
def mk(path, col, row, fmt="(10I3)", pre=0):
    def line(v):
        return " " * pre + "".join(("%3d" % x) if x is not None else "   " for x in v)
    l1 = "title".ljust(72) + "KEY00001"
    l2 = "%14d%14d%14d%14d%14d" % (3, 1, 1, 0, 0)
    l3 = "PSA".ljust(14) + "%14d%14d%14d%14d" % (4, 4, len(row), 0)
    l4 = fmt.ljust(16) + fmt.ljust(16)
    with open(path, "w") as f:
        f.write("\n".join([l1, l2, l3, l4, line(col), line(row)]) + "\n")
def main(out):
    os.makedirs(out, exist_ok=True)
    j = lambda n: os.path.join(out, n)
    mk(j("ok.hb"), COL, ROW)
    mk(j("pre.hb"), COL, ROW, "(1X,10I3)", 1)
    mk(j("bad99.hb"), COL, ROW[:-1] + [99])
    mk(j("bad0.hb"), COL, ROW[:-1] + [None])
    mk(j("badn1.hb"), COL, ROW[:-1] + [5])
    mk(j("badcol.hb"), [1, 3, 99, 7, 8], ROW)
    mk(j("baddec.hb"), [1, 5, 3, 7, 8], ROW)
if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else ".")
