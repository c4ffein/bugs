#!/bin/sh
# usage: run.sh <scotch source tree> [workdir]
# Configures and builds the given Scotch tree with the Ninja and the Unix Makefiles generators
# (library only, no tests, no PT-Scotch) and prints one result line per generator.
# Needs cmake, ninja and make in PATH. Does not modify the source tree.
SRC=${1:?usage: run.sh <scotch source tree> [workdir]}
WORK=${2:-$(mktemp -d)}
SRC=$(cd "$SRC" && pwd)
mkdir -p "$WORK" || exit 2
for gen in "Ninja" "Unix Makefiles"; do
  tag=$(echo "$gen" | tr -d ' ')
  b="$WORK/build-$tag"
  rm -rf "$b"
  if cmake -S "$SRC" -B "$b" -G "$gen" -DENABLE_TESTS=OFF -DBUILD_PTSCOTCH=OFF -DBUILD_LIBESMUMPS=OFF \
       > "$WORK/$tag.configure.log" 2>&1 &&
     cmake --build "$b" -j4 > "$WORK/$tag.build.log" 2>&1; then
    echo "RESULT $gen: build OK"
  else
    echo "RESULT $gen: FAILED (see $WORK/$tag.*.log)"
    grep -m3 -i "dependency cycle\|ninja: error\|CMake Error" "$WORK/$tag.configure.log" "$WORK/$tag.build.log" | sed 's/^/    /'
  fi
done
