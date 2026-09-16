-- SiMIDS low-bandwidth optimization (2026-09-16)
-- IMPORTANT: this migration has already been applied to the production Supabase project.
-- Keep this file as schema/documentation; do not blindly rerun it on the same project.
--
-- Production changes:
-- 1) Supporting indexes for child history, reminders, dashboard and activities.
-- 2) simids_bootstrap(village, warning_days): lightweight login payload only.
-- 3) simids_children_page(...): paginated child list with immunization summary.
-- 4) simids_child_detail(child_id): one-child detail/history on demand.
-- 5) simids_risk_page(...): server-side paginated reminders/follow-up list.
-- 6) simids_report_summary(...): server-side report aggregates.
-- 7) simids_dashboard_summary(...): server-side KPIs/trend/validation queue.
-- 8) simids_activity_bundle(village): lazy education/assessment data.
--
-- The functions are SECURITY DEFINER but explicitly require auth.uid(), an active
-- simids_user_access row, and enforce assigned-village scope for kader/bidan.

create index if not exists simids_immunizations_child_date_idx
  on public.simids_immunizations (child_id, immunization_date desc, created_at desc);
create index if not exists simids_immunizations_validated_vaccine_date_idx
  on public.simids_immunizations (validated, vaccine_code, immunization_date, child_id);
create index if not exists simids_followups_child_date_idx
  on public.simids_followups (child_id, followup_date desc);
create index if not exists simids_education_village_date_idx
  on public.simids_education (village, activity_date desc);
create index if not exists simids_assessments_village_date_idx
  on public.simids_assessments (village, assessment_date desc);

-- Function definitions live in the production migration history under:
-- migration name: low_bandwidth_lazy_queries
-- Use Supabase migration history as the canonical executable definition.
