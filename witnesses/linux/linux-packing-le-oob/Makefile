# SPDX-License-Identifier: MIT
# Copyright (c) 2026 c4ffein
#   make LINUX=<kernel tree> run   non-zero exit while the bug is there
#
# Compiles the tree's lib/packing.c with compat.h (from hegel-c's
# tests/irl/linux/packing_roundtrip/) standing in for the generic kernel
# headers.  No radix-tree harness, no liburcu.

CFLAGS  ?= -O2 -g -fsanitize=address -fsanitize=undefined
LDFLAGS  = -fsanitize=address -fsanitize=undefined

repro: repro.c packing.o
	gcc $(CFLAGS) -o $@ repro.c packing.o $(LDFLAGS)

packing.o: compat.h FORCE
	@[ -n "$(LINUX)" ] || { echo "set LINUX=<kernel tree>" >&2; exit 2; }
	gcc $(CFLAGS) -I. -I$(LINUX)/include -include compat.h -c -o $@ $(LINUX)/lib/packing.c

run: repro
	./repro

clean:
	rm -f repro packing.o

FORCE:
.PHONY: run clean FORCE
