-- SiMIDS - rancangan basis data produksi (PostgreSQL / Supabase)
-- Jalankan di project database produksi setelah menyesuaikan autentikasi dan RLS.

create extension if not exists pgcrypto;

create table if not exists villages (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  puskesmas text not null default 'Puskesmas Tanjung Lago',
  target_male integer not null default 0,
  target_female integer not null default 0,
  pusdatin_birth_male integer not null default 0,
  pusdatin_birth_female integer not null default 0,
  pusdatin_surviving_male integer not null default 0,
  pusdatin_surviving_female integer not null default 0,
  local_birth_male integer not null default 0,
  local_birth_female integer not null default 0,
  local_surviving_male integer not null default 0,
  local_surviving_female integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists posyandu (
  id uuid primary key default gen_random_uuid(),
  village_id uuid not null references villages(id) on delete cascade,
  name text not null,
  hamlet text,
  unique(village_id, name)
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null check (role in ('kader','bidan','puskesmas','admin')),
  village_id uuid references villages(id),
  posyandu_id uuid references posyandu(id),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists children (
  id uuid primary key default gen_random_uuid(),
  local_id text,
  nik text,
  full_name text not null,
  birth_date date not null,
  sex char(1) not null check (sex in ('L','P')),
  village_id uuid not null references villages(id),
  posyandu_id uuid references posyandu(id),
  hamlet text not null,
  parent_name text not null,
  parent_phone text,
  address text,
  province text not null default 'SUMATERA SELATAN',
  district text not null default 'KAB. BANYUASIN',
  subdistrict text not null default 'TANJUNG LAGO',
  puskesmas text not null default 'TANJUNG LAGO',
  idl_date date,
  idl_input_date date,
  idl_pkm text,
  idl_status text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_children_village on children(village_id);
create index if not exists idx_children_hamlet on children(village_id, hamlet);

create table if not exists immunization_types (
  id text primary key,
  label text not null,
  excel_report boolean not null default true,
  program_indicator boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0
);

create table if not exists immunizations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  immunization_type_id text not null references immunization_types(id),
  service_date date not null,
  input_date date not null default current_date,
  service_place text,
  next_due_date date,
  provider_name text,
  batch_no text,
  notes text,
  validated boolean not null default false,
  validated_by uuid references profiles(id),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique(child_id, immunization_type_id, service_date)
);
create index if not exists idx_immunizations_service_date on immunizations(service_date);
create index if not exists idx_immunizations_next_due on immunizations(next_due_date);

create table if not exists assessments (
  id uuid primary key default gen_random_uuid(),
  participant_name text not null,
  participant_type text not null check (participant_type in ('ibu','kader')),
  village_id uuid references villages(id),
  assessment_date date not null,
  pre_score numeric(5,2) not null check (pre_score between 0 and 100),
  post_score numeric(5,2) not null check (post_score between 0 and 100),
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists reminder_logs (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  due_date date,
  channel text not null default 'whatsapp',
  message text,
  sent_at timestamptz,
  status text not null default 'queued',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id bigserial primary key,
  user_id uuid references profiles(id),
  entity text not null,
  entity_id text,
  action text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);

-- Contoh seed jenis imunisasi; MR2 adalah indikator program tambahan.
insert into immunization_types(id,label,excel_report,program_indicator,sort_order) values
('HB0_24','HB0 (<24 Jam)',true,false,10),('HB0_1_7','HB0 (1-7 Hari)',true,false,20),
('BCG','BCG',true,false,30),('OPV1','OPV-1',true,false,40),('DPT_HB_HIB1','DPT/HB-Hib-1',true,false,50),
('HEXA1','DPT/HB-Hib-IPV (Heksavalen)-1',true,false,60),('OPV2','OPV-2',true,false,70),
('PCV1','Pneumokokus-1',true,false,80),('ROTA1','Rotavirus-1',true,false,90),
('DPT_HB_HIB2','DPT/HB-Hib-2',true,false,100),('HEXA2','DPT/HB-Hib-IPV (Heksavalen)-2',true,false,110),
('OPV3','OPV-3',true,false,120),('PCV2','Pneumokokus-2',true,false,130),('DPT_HB_HIB3','DPT/HB-Hib-3',true,false,140),
('HEXA3','DPT/HB-Hib-IPV (Heksavalen)-3',true,false,150),('OPV4','OPV-4',true,false,160),
('IPV1','IPV-1',true,false,170),('ROTA2','Rotavirus-2',true,false,180),('ROTA3','Rotavirus-3',true,false,190),
('MR1','Campak-Rubella (MR)-1',true,true,200),('IPV2','IPV-2',true,false,210),('IPV3','IPV-3 (Khusus DIY)',true,false,220),('IBL','Imunisasi Bayi Lengkap',true,false,230),
('MR2','Campak-Rubella (MR)-2',false,true,240)
on conflict (id) do update set label=excluded.label, excel_report=excluded.excel_report, program_indicator=excluded.program_indicator, sort_order=excluded.sort_order;

-- RLS perlu diaktifkan dan disesuaikan sebelum go-live.
alter table profiles enable row level security;
alter table children enable row level security;
alter table immunizations enable row level security;
alter table assessments enable row level security;
alter table reminder_logs enable row level security;

-- Contoh prinsip policy (JANGAN gunakan sebagai satu-satunya policy produksi):
-- Kader: hanya data desa/posyandu yang ditugaskan.
-- Bidan: seluruh data desa.
-- Puskesmas/Admin: seluruh wilayah kerja.

-- Tindak lanjut/sweeping dan pencatatan kegiatan edukasi
create table if not exists followups (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  outcome text not null check (outcome in ('contacted','scheduled','visited','immunized','refused','unreachable')),
  followup_date date not null,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_followups_child on followups(child_id, followup_date desc);

create table if not exists education_sessions (
  id uuid primary key default gen_random_uuid(),
  session_date date not null,
  session_type text not null check (session_type in ('ibu','kader_risk','kader_digital','peer')),
  village_id uuid references villages(id),
  hamlet text,
  participants integer not null default 0,
  topic text,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table followups enable row level security;
alter table education_sessions enable row level security;
