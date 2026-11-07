#!/bin/sh
# Usage: run18.sh <dummysizes binary> ; run from COR-20/run (needs library.h copied as h and lib.h)
D=$1
rm -f o out2.h
$D lib.h out2.h < /dev/null; echo "two-char names: rc=$? out2.h lines=$(wc -l < out2.h)"
$D h o < /dev/null > stdout.txt; echo "one-char names: rc=$? o $( [ -f o ] && echo "created, $(wc -l < o) lines" || echo "NOT created") stdout lines=$(wc -l < stdout.txt)"
$D < /dev/null > s.txt; echo "no argument: rc=$?"
$D ../l2046.h l2046out.h; echo "2046-char line: rc=$?"
$D ../l2047.h l2047out.h 2>&1 | head -1; echo "2047-char line: rc=$?"
