/* SPDX-License-Identifier: MIT
** Copyright (c) 2026 c4ffein */
/*
** Witness of linux-ida-find-first-range: ida_find_first_range() does not
** look past the first present bitmap block.
**
** IDs 0 (block 0, bit 0) and 1024 (block 1, bit 0); the lowest ID in
** [1, 2999] is 1024.  The search stops at block 0, which is present but
** has no bit >= 1, and returns -ENOENT.  Exit 1 while the bug is there.
** hegel-c's pin ida_find_first_range finds the same case by itself (a
** property test, shrunk to IDs {0, 1024}, range (1, 1024)).
*/
#include <stdio.h>

#include <linux/idr.h>

extern void rcu_register_thread (void);
extern void radix_tree_init (void);

static int lowest_in_1_2999 (void)
{
  DEFINE_IDA(ida);
  ida_alloc_range(&ida, 0, 0, GFP_KERNEL);        /* id 0    -> block 0, bit 0   */
  ida_alloc_range(&ida, 1024, 1024, GFP_KERNEL);  /* id 1024 -> block 1, bit 0   */
  int r = ida_find_first_range(&ida, 1, 2999);    /* returns -ENOENT             */
  /* correct answer is 1024 */
  ida_destroy(&ida);
  return r;
}

int main (void)
{
  rcu_register_thread ();
  radix_tree_init ();

  int r = lowest_in_1_2999 ();
  printf ("ida_find_first_range(ida = {0, 1024}, 1, 2999) = %d (want 1024)\n", r);
  if (r != 1024) {
    printf ("BUG: the search stopped at block 0\n");
    return 1;
  }
  return 0;
}
