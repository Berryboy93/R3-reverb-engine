# Contributing

## Snapshot tests

The Knob component has two tiers of canvas render tests in
`src/ui/components/__tests__/Knob.render.test.tsx`.

### Tier 1 — Broad draw-call snapshots

These capture every Canvas 2D API call in order. They exist to catch
**unintentional** geometry or colour changes before they ship.

A deliberate design change (moving a gradient stop, adjusting blur radius,
tweaking a geometry constant) will intentionally break these snapshots.
That's by design — the failure is a prompt to verify the change looks right
before accepting it.

**To update the snapshots after a deliberate change:**

```sh
npx jest --testPathPattern=Knob.render --updateSnapshot
```

Before running this command, confirm visually in the browser that:

1. The knob renders correctly at all three positions (min / mid / max).
2. The LED arc sweeps the expected angle range.
3. The chrome ring, indicator line, and centre gem look as intended.

> Updating snapshots without a visual check defeats the purpose of the test.

#### Making diffs readable

The named constants at the top of `src/ui/components/Knob.tsx`
(`BODY_R_RATIO`, `INDICATOR_OUTER_RATIO`, `GEM_R_RATIO`, `LED_BLUR_HOVER`,
etc.) are there specifically to make snapshot diffs self-documenting.
When you change a constant, the snapshot diff will name the constant rather
than showing an unexplained floating-point change. Add a named constant for
any new geometry value you introduce rather than inlining the literal.

### Tier 2 — Structural invariants

These assertions check that specific design elements are present — the neon
LED arc colour (`#b7ff00`), the chrome-white indicator line (`#f0f0f0`), and
the arc angle difference between min and max. They use **no snapshots** and
survive incidental geometry tweaks.

A failing invariant test means a core colour token has changed or the canvas
draw loop itself is broken. Always investigate before suppressing.
