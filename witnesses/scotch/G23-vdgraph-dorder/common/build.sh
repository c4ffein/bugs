#!/bin/bash
# build.sh TREEDIR NAME [ubsan] : builds dtest_NAME and dmaptest_NAME against TREEDIR
B=$1; N=$2; here=$(dirname $(readlink -f $0))
SAN="-fsanitize=address,undefined"; [ "$3" = ubsan ] && SAN="-fsanitize=undefined"
CF="$(grep '^CFLAGS' $B/src/Makefile.inc | cut -d= -f2- | sed 's/-fsanitize=[a-z,]*//')"
mpicc -g -O0 $SAN -I$B/include $here/dtest.c -o $here/dtest_$N -L$B/lib -lptscotch -lscotch -lptscotcherr -lz -lm -lrt -pthread -ldl || exit 1
mpicc $CF $SAN -DSCOTCH_PTSCOTCH -I$B/include -I$B/src/libscotch $here/dmaptest.c -o $here/dmaptest_$N -L$B/lib -lptscotch -lscotch -lptscotcherr -lz -lm -lrt -pthread -ldl || exit 1
echo built $N
