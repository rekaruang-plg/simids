-- Production migration already applied on 2026-09-16.
-- Do not rerun blindly on the same project. This file documents the live schema change.

-- Remove the legacy overload that made PostgREST unable to choose simids_followup_page.
drop function if exists public.simids_followup_page(text,text,integer,integer,integer,text);

-- Region report RPC. Live production function enforces active SiMIDS access:
-- admin/puskesmas may report all children; bidan/kader stay restricted to assigned village.
-- Parameters:
--   p_province, p_district, p_subdistrict, p_village, p_search
--   p_page, p_page_size
-- Returns JSON with summary totals, region groups, cascaded filter values,
-- and a paginated child list. Normal UI uses 50 rows/page; export is opt-in.
--
-- Function name/signature:
-- public.simids_child_region_report(text,text,text,text,text,integer,integer) returns jsonb

-- The complete CREATE FUNCTION statement is represented by the production migration
-- `region_child_report_and_followup_overload_fix` in Supabase migration history.
