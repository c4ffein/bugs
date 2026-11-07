<!-- SPDX-License-Identifier: MIT AND GPL-2.0-or-later
     Copyright (c) 2026 c4ffein
     SPDX-FileCopyrightText: The Linux kernel authors (lib/xarray.c excerpt)
     The quoted kernel code is GPL-2.0+, as in its upstream file (not
     GPL-2.0-only, as this header said until 2026-11-07). -->

# `xa_store_range(_, ULONG_MAX, _)` loops forever on unsigned wrap

Surfaced in passing by a blind hunter subagent during the 2026-07-12
rediscovery re-run, while it hunted another (injected) bug; checked by an
informed judge subagent and re-verified by hand against the in-tree source.
**Re-checked 2026-10-22: still present**, byte-identical in v7.3 and
linux-next. Not reported upstream. Status and history: `docs/findings.toml`.

linux-next did fix a different bug nearby, `xas_find()` jumping backwards inside a
multi-index entry (f0f80e85841d); not this one.

- **File:** `lib/xarray.c`, `xa_store_range()`
- **Class:** non-terminating loop (hang / DoS) on a boundary input
- **Confidence bug is real:** high (empirically confirmed hang). **Reachability: unusual input.**

## Mechanism

The range-tiling inner loop advances `first` by the size of each stored chunk and
continues while `first <= last`:

```c
do {
    xas_set_range(&xas, first, last);
    xas_store(&xas, entry);
    if (xas_error(&xas))
        goto unlock;
    first += xas_size(&xas);
} while (first <= last);
```

The only bound checks are `if (last < first) return -EINVAL;` at the top. When
`last == ULONG_MAX`, the final chunk makes `first += xas_size` overflow
`ULONG_MAX + 1 → 0`, and `0 <= ULONG_MAX` is always true → the loop never
terminates.

## Repro

Built and run: `witnesses/linux/linux-xa-store-range-ulong-max/` (its README has
the expected output). hegel-c's pin `xa_store_range` finds it by itself.

```c
DEFINE_XARRAY(xa);
xa_store_range(&xa, ULONG_MAX - 1, ULONG_MAX, xa_mk_value(2), GFP_KERNEL); /* hangs */
/* last == ULONG_MAX-1 and below terminate normally */
```

Empirically confirmed: the judge reverted to the plain `while (first <= last)` and
the call timed out (non-terminating); the hunter's guard terminates it.

## Suggested fix

**Incomplete (2026-11-07):** with this fix, `xa_store_range (0, ULONG_MAX)`
returns with `ULONG_MAX` unstored. That range also hangs on v7.1, by a second
path: `xas_set_range()` sizes its one chunk `16 << 60`, so `xas_size()` wraps
to 0 and `first` never moves. Found by hegel-c's property test; the kit shows
both cases (`candidate-fix.patch` is this fix). Tracked as its own bug,
`linux-xa-store-range-full-range-size-wrap`.

Stop when `first` wraps to zero:

```c
} while (first && first <= last);
```

No-op on every non-wrapping range (a terminating chunk yields `first = last + 1`,
non-zero, `> last`), so behavior-preserving.

## Assessment

Real robustness bug. Severity hinges on whether any caller passes
`last == ULONG_MAX` (or a `last` an attacker controls up to it). Most callers use
bounded ranges, so likely not reachable in practice today — but an infinite loop
(rather than an `-EINVAL`) is a poor failure mode, and the fix is trivial and
safe. Reasonable as a hardening patch; check for a `ULONG_MAX`-passing caller to
justify it.
