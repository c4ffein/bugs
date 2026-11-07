#!/bin/sh
# usage: run_strings.sh <libdir> ; runs the G04 reproducer strings through st
L=$1; ST=$(dirname $0)/common/st
while IFS='|' read -r id mode s; do
  [ -z "$id" ] && continue
  out=$(LD_LIBRARY_PATH=$L ASAN_OPTIONS=detect_leaks=1 $ST "$s" $mode 2>&1)
  san=$(printf '%s\n' "$out" | grep -m1 -E "AddressSanitizer|runtime error|LeakSanitizer" | sed 's/^.*\(AddressSanitizer\|runtime error\|LeakSanitizer\)/\1/' | cut -c1-90)
  ret=$(printf '%s\n' "$out" | grep -m1 "^ret=")
  err=$(printf '%s\n' "$out" | grep -m1 "ERROR\|WARNING" | cut -c1-140)
  printf '%-10s %-40s %s | %s | %s\n' "$id" "$s" "$ret" "$san" "$err"
done <<'LIST'
COR-01|m|r{sep=m{asc=b{:width=3}}}
COR-01|m|r{sep=m{asc=(b{width=3}|
COR-01|m|r{sep=m{asc=b{bnd=f,org=f},low=h{:}}}
COR-01|m|r{sep=(m{asc=b}m{:})}
COR-12|m|   r  {   sep   =  m  { asc  = b{x} } }
COR-22|m|r{sep=m{vert=}}
COR-22|m|r{sep=m{vert=()}}
COR-22|o|n{sep=m{vert=/(vert>1)?f;g}}
COR-23|m|(m{vert=100}|m{vert=)
COR-23|m|/(vert>1 & 
COR-23|m|/(vert>(1+
COR-23|m|r{sep=m{asc=b{bnd=f,org=f},low=h}}:
COR-26|m|/(vert>99999999999999999999)?r;
COR-26|m|r{sep=m{vert=1e30}}
COR-26|m|r{sep=m{vert=99999999999999999999}}
COR-26|m|r{sep=m{vert=2147483648}}
COR-26|m|r{sep=m{vert=2147483647}}
PS2-1|m|m{asc=b{bnd=f,org=f},asc=b{bnd=f,org=f}}
PS2-1|m|b{bnd=f,bnd=f}
PS2-2|m|r{ sep=m{asc=b{x}}}
PS2-3|m|r{sep=m{asc=b,low=b}}
PS2-5|m|/(vert>0.1234567)?r;
EMPTY|m|f{move=}
EMPTY|m|r{sep=f{move=,pass=3}}
EMPTY|m|r{sep=m{vert=,low=h}}
EMPTY|m|b{width=}
EMPTY|m|f{bal=}
LIST
