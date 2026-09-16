-- Documentation only: production migration `add_education_material_library` was already applied.
-- Do not rerun blindly on the same Supabase project.

create table if not exists public.simids_education_materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'Lainnya',
  description text,
  file_name text not null,
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint not null default 0,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  active boolean not null default true
);

-- Private Storage bucket: `simids-education-materials`
-- Read: every active SiMIDS account.
-- Upload/delete: admin and puskesmas only.
-- Maximum file size: 50 MB.
