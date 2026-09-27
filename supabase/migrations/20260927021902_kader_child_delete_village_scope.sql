-- Kader may delete children only within their assigned village.
-- Child foreign keys cascade to immunizations, IDL and follow-ups; the UI confirms this.
alter policy simids_children_delete on public.simids_children
using (
  simids_private.simids_role() in ('admin','puskesmas')
  or (simids_private.simids_role() = 'kader'
      and simids_private.simids_can_access_village(village))
);
