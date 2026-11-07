#!/bin/sh
# usage: cc.sh <build-tree> <out> <sources...>  -- compiles a harness against an ASan build tree
# env: SCOTCH_PATCHLEVEL (default 18) selects the version macros of the tree under test
B=$1; shift; out=$1; shift
CF="$(grep '^CFLAGS' $B/src/Makefile.inc | cut -d= -f2-)"
exec gcc $CF -DSCOTCH_VERSION_NUM=7 -DSCOTCH_RELEASE_NUM=0 -DSCOTCH_PATCHLEVEL_NUM=${SCOTCH_PATCHLEVEL:-18} \
  -I$B/src/libscotch -I$B/include -I$(dirname $0) "$@" -o $out -L$B/lib -lscotch -lscotcherr -lz -lm -lpthread
