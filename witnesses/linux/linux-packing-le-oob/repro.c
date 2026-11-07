/* SPDX-License-Identifier: MIT
** Copyright (c) 2026 c4ffein */
/*
** Witness of linux-packing-le-oob: pack() on a 1-byte buffer with
** QUIRK_LITTLE_ENDIAN writes far outside it.
**
** calculate_box_addr() computes offset_of_group = len - (this_group + 1) * 4,
** which underflows for len = 1; the little-endian branch does not cancel
** the wrap, so box_addr is ~2^64-3.  The arguments pass pack()'s own
** checks.  Built with ASan (Makefile), the write ends the program with
** heap-buffer-overflow in __pack; without ASan it is a SIGSEGV.  Either
** way a non-zero exit while the bug is there; exit 0 with hegel-c's fix
** (tests/irl/linux/pins/packing_roundtrip.patch).
*/
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

/* As in include/linux/packing.h at v7.1. */
#define QUIRK_LITTLE_ENDIAN (1u << 1)

extern int pack(void *pbuf, uint64_t uval, size_t startbit, size_t endbit,
                size_t pbuflen, uint8_t quirks);

int main (void)
{
  uint8_t *buf = calloc(1, 1);
  pack(buf, 0, /*startbit*/0, /*endbit*/0, /*pbuflen*/1, QUIRK_LITTLE_ENDIAN);
  /* -> AddressSanitizer: heap-buffer-overflow in __pack (calculate_box_addr
        returns ~2^64-3). Valid per pack()'s own arg checks. */
  printf ("pack(1-byte buffer, bit 0, QUIRK_LITTLE_ENDIAN) stayed in bounds\n");
  free (buf);
  return 0;
}
