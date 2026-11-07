# G24-hdgraph on 7.0.18

DMO-01 fixed -> fixed ran high -> -
DMO-06 still-present -> still-present ran medium -> 0001
DMO-07 still-present -> fixed ran medium -> - (da4af29e = our 7.0.17 0001, dropped)
DMO-08 fixed -> still-present ran medium -> G18's rebased 0004 (bare 7.0.18 lacks G18's fix; verified on top)
DMO-16 partially-fixed -> still-present ran low -> 0002, 0003 (+ G18's 0003 for the fold part)
DMO-17 not-a-bug -> not-a-bug ran info -> 0006 (docs)
PS-DMO-4 fixed -> still-present ran medium -> G18's rebased 0002/0003 (verified on top)
PS-DMO-5 still-present -> still-present ran low -> 0001
PS2-G24-1 still-present -> still-present ran medium -> -
PS2-G24-2 still-present -> still-present ran low -> -
PS2-G24-3 still-present -> still-present ran low -> -
PS2-G24-4 still-present -> still-present partly-run medium -> - (G23/G21 files)
PS2-G24-5 still-present -> still-present ran medium -> 0007
(also in the series: 0004 array shrinking, PS2-G18-1; 0005 DMO-18 twins hgraph/hmesh/vmesh after 7a2e069c)

| upstream commit | what | verdict |
|---|---|---|
| da4af29e | test dorderNew() of the separator node | correct (identical to ours; ran: rc=1 on all ranks, 0 leaks) |
| 7a2e069c | hdgraph debug condition check '\|\|' | correct but incomplete: hgraph/hmesh/vmesh twins keep '&&' (our 0005) |
| 0e79c872 | message typo in hdgraphFold2 | correct |
| 075a77a6, 8609a5cb | hgraph mdeg type / empty else | incomplete (see G05: hdgraph and hmesh twins) |

Three most important facts
1. Only DMO-07 was fixed upstream (same diff as ours). The leaf-status/agreement defects (DMO-06, PS-DMO-5, PS2-G24-5) still hang
   or disagree on 7.0.18 with injected allocation failures; our series makes every rank return 1 with 0 leaked blocks.
2. DMO-08 and PS-DMO-4 were "fixed" in 7.0.17 only because our base had G18's commits; on bare 7.0.18 they SIGSEGV / hang.
   G18's rebased series fixes them on top of ours (fi18 runs). They are not duplicated here.
3. The 7.0.17 injection shim fishim2 deadlocked in this container (loader lock taken under its own mutex): fixed in the kit.

Could not do: PS2-G18-1 (0004) not re-injected (threaded folds make allocation indices non-deterministic; read + compiled +
checks); dgraphHaloSync2 hang of PS2-G24-4 not re-run.

User must decide: merge order with G05 (both edit hdgraph_order_st.c) and with G18 (DMO-08/PS-DMO-4 depend on it); whether to
fix PS2-G24-1/-3 (API-level agreement, dorderSave of a failed ordering).

WORK: /tmp/claude-0/-home-user-playground/925301e5-494b-5a33-b598-8eaa63dd5c1d/scratchpad/work18/G24-hdgraph
