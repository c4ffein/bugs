/* SPDX-License-Identifier: MIT
** Copyright (c) 2026 c4ffein */
/*
** Witness of linux-xa-store-range-ulong-max: xa_store_range() with
** last == ULONG_MAX.
**
** Each range is stored in a child process with a 5 s alarm, then loaded
** back at both ends.  The child exits 0 when the store returned and both
** loads give the entry, 1 when a load misses, and dies of SIGALRM when the
** store never returns.  The program exits 1 if any range fails.
**
**   [ULONG_MAX - 1, ULONG_MAX]  the write-up's case: the tiling loop adds
**                               the last chunk's size, `first` wraps to 0,
**                               and 0 <= ULONG_MAX holds forever (hang)
**   [0, ULONG_MAX]              xas_set_range() sizes the one chunk
**                               16 << 60, so xas_size() wraps to 0 and
**                               `first` never moves (hang).  With the
**                               write-up's candidate fix (stop when `first`
**                               is 0) the store returns, but ULONG_MAX is
**                               not stored: the fix is incomplete.
**   [ULONG_MAX - 2, ULONG_MAX - 1]  control, below the end: passes
*/
#include <limits.h>
#include <signal.h>
#include <stdio.h>
#include <sys/wait.h>
#include <unistd.h>

#include <linux/xarray.h>

extern void rcu_register_thread (void);
extern void radix_tree_init (void);

static int store_and_load (unsigned long first, unsigned long last)
{
  DEFINE_XARRAY(xa);
  void *entry = xa_mk_value(2);

  xa_store_range(&xa, first, last, entry, GFP_KERNEL);
  return xa_load(&xa, first) == entry && xa_load(&xa, last) == entry ? 0 : 1;
}

static int check (unsigned long first, unsigned long last)
{
  pid_t pid = fork ();
  int   status;

  if (pid == 0) {
    alarm (5);
    _exit (store_and_load (first, last));
  }
  waitpid (pid, &status, 0);
  printf ("xa_store_range(%lu, %lu): ", first, last);
  if (WIFSIGNALED (status)) {
    printf ("BUG: did not return within 5 s\n");
    return 1;
  }
  if (WEXITSTATUS (status)) {
    printf ("BUG: returned, but a load at an end of the range misses\n");
    return 1;
  }
  printf ("ok\n");
  return 0;
}

int main (void)
{
  rcu_register_thread ();
  radix_tree_init ();
  setvbuf (stdout, NULL, _IONBF, 0);

  int bad = 0;
  bad += check (ULONG_MAX - 2, ULONG_MAX - 1);
  bad += check (ULONG_MAX - 1, ULONG_MAX);
  bad += check (0, ULONG_MAX);
  return bad ? 1 : 0;
}
