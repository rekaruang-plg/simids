# SiMIDS login performance

The production Supabase project already has the `simids_child_accessible` optimization applied.

Observed with the authenticated admin test account on 2026-09-16:

- Old late OFFSET page on `simids_immunizations`: about 9.99 s before the RLS optimization.
- After the RLS optimization, the same late OFFSET page: about 0.82 s.
- First 1,000-row authenticated page after the RLS optimization: about 0.036 s database execution.
- Village-scoped RLS test for `TANJUNGLAGO`: 166 visible children and 2,241 visible immunizations, matching the village data.

Frontend loading also uses keyset pagination and fetches only columns required by the UI.
