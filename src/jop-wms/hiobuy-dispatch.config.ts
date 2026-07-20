// Feature flag for the Hiobuy per-order dispatch flow (see CLAUDE.md, "Dispatch Queue (Hiobuy)").
// Flip to `true` to switch dispatchApprovedOrders to the Hiobuy pipeline; `false` keeps the
// legacy Gulltrans shop-batched flow running exactly as before. Hardcoded (not an env var) so
// the toggle is an explicit, reviewed code change rather than an operational/deploy-time setting.
export const HIOBUY_DISPATCH_ENABLED = true;
