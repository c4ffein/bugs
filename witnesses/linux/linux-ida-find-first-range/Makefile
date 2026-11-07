# SPDX-License-Identifier: MIT
# Copyright (c) 2026 c4ffein
#   make LINUX=<kernel tree> harness   once per tree
#   make LINUX=<kernel tree> run       exit 1 while the bug is there
include ../radix-tree.mk

repro: repro.c
	gcc $(CFLAGS) $(INCLUDES) -o $@ $< $(LIBS) $(LDFLAGS)

run: repro
	./repro

clean:
	rm -f repro

.PHONY: run clean
