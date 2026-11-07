# SPDX-License-Identifier: MIT
# Copyright (c) 2026 c4ffein
#
# Shared by the Linux kits that link the kernel's own userspace harness
# (tools/testing/radix-tree): lib/xarray.c, lib/idr.c and friends compiled
# for userspace.  Include it after nothing; set LINUX on the command line
# (a kernel tree: a hegel-c pin worktree or a plain checkout).  Needs
# liburcu (URCU_PFX).
#
#   make LINUX=<tree> harness   build the harness objects in the tree once,
#                               as hegel-c's tests/irl/linux/project.conf
#                               does (its radix-tree step)

ifeq ($(strip $(LINUX)),)
  ifneq ($(filter-out clean,$(or $(MAKECMDGOALS),all)),)
    $(error set LINUX=<kernel tree>)
  endif
endif
URCU_PFX ?= $(HOME)/.local/urcu_extract/usr
URCU_INC  = $(URCU_PFX)/include/x86_64-linux-gnu
URCU_LIB  = $(URCU_PFX)/lib/x86_64-linux-gnu
HARNESS   = $(LINUX)/tools/testing/radix-tree

INCLUDES = -I$(LINUX)/tools/testing/shared -I$(HARNESS) -I$(LINUX)/tools/include \
           -I$(LINUX)/tools/arch/x86/include -I$(LINUX)/lib -I$(URCU_INC)
CFLAGS  ?= -O2 -g -D_LGPL_SOURCE -fsanitize=address -fsanitize=undefined
LDFLAGS  = -L$(URCU_LIB) -Wl,-rpath,$(URCU_LIB) -fsanitize=address -fsanitize=undefined
HARNESS_OBJS = $(HARNESS)/xarray.o $(HARNESS)/xarray-shared.o $(HARNESS)/radix-tree.o \
               $(HARNESS)/idr.o $(HARNESS)/linux.o $(HARNESS)/slab.o \
               $(HARNESS)/libharness-support.a
LIBS = $(HARNESS_OBJS) -lurcu -lpthread -lm -ldl

# The harness Makefile's own object lists, read the way project.conf does.
define PRINT_LISTS
print-objs: ; @echo $$(CORE_OFILES)
print-libs: ; @echo $$(LIBS)
endef
export PRINT_LISTS

harness:
	cd $(HARNESS) && \
	objs=$$(echo "$$PRINT_LISTS" | make -s -f Makefile -f - print-objs) && \
	libs=$$(echo "$$PRINT_LISTS" | make -s -f Makefile -f - print-libs) && \
	C_INCLUDE_PATH="$(URCU_PFX)/include:$(URCU_INC)" make -j$$(nproc) $$objs && \
	rm -f libharness-support.a && ar rcs libharness-support.a $$libs

.PHONY: harness
