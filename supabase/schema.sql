-- RunPlan — schema inicial (Supabase / Postgres)
-- Rode este script no SQL Editor do seu projeto Supabase.

create table if not exists profiles (
  strava_athlete_id text primary key,
  name text,
  avatar_url text,
  subscription_status text not null default 'free' check (subscription_status in ('free', 'premium')),
  created_at timestamptz not null default now()
);

create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  strava_athlete_id text not null references profiles(strava_athlete_id) on delete cascade,
  race_distance_km numeric not null,
  race_label text not null,
  race_date date,
  start_date date not null,
  level text not null check (level in ('iniciante', 'intermediario', 'avancado')),
  days_per_week int not null,
  duration_weeks int not null,
  include_strength boolean not null default true,
  current_weekly_km numeric not null default 0,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now()
);

-- Migração (2026-07-12): planos criados antes desta coluna existir não tinham como
-- guardar o km/semana inicial do atleta — por isso o "Redefinir semana" recalculava a
-- progressão a partir de 0km/semana (sempre), dando distâncias diferentes das originais.
-- Rode isto uma vez se a tabela `plans` já existir sem a coluna:
alter table plans add column if not exists current_weekly_km numeric not null default 0;

create table if not exists workouts (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references plans(id) on delete cascade,
  week_number int not null,
  date date not null,
  type text not null check (type in ('easy','tempo','interval','hills','long','race','strength','rest')),
  title text not null,
  distance_km numeric,
  duration_min_low int,
  duration_min_high int,
  pace_guidance text,
  ai_summary text,
  completed_at timestamptz,
  skipped boolean not null default false,
  linked_strava_activity_id text,
  created_at timestamptz not null default now()
);

-- Corridas/provas do atleta (calendário + retirada de kit).
-- Tabela compartilhada com o app Aura Run (mesma conta Supabase): usa athlete_id
-- numérico (ID do atleta no Strava), então o RunPlan reaproveita os dados já existentes.
create table if not exists races (
  id uuid primary key default gen_random_uuid(),
  athlete_id bigint not null,
  name text not null,
  date date not null,
  distance text,
  city text,
  goal_time text,
  notes text,
  kit_date date,
  status text not null default 'upcoming',
  created_at timestamptz not null default now()
);

create index if not exists workouts_plan_id_idx on workouts(plan_id);
create index if not exists workouts_date_idx on workouts(date);
create index if not exists plans_athlete_idx on plans(strava_athlete_id);
create index if not exists races_athlete_idx on races(athlete_id);

alter table profiles enable row level security;
alter table plans enable row level security;
alter table workouts enable row level security;

-- MVP: acesso via chave anon do servidor (rotas de API fazem a checagem do dono pelo cookie do Strava).
-- Ajuste estas policies para autenticação real do Supabase se for expor chamadas direto do client.
-- (CREATE POLICY não aceita IF NOT EXISTS no Postgres, por isso o DROP antes de cada CREATE.)
drop policy if exists "service access profiles" on profiles;
create policy "service access profiles" on profiles for all using (true) with check (true);

drop policy if exists "service access plans" on plans;
create policy "service access plans" on plans for all using (true) with check (true);

drop policy if exists "service access workouts" on workouts;
create policy "service access workouts" on workouts for all using (true) with check (true);

alter table races enable row level security;
drop policy if exists "service access races" on races;
create policy "service access races" on races for all using (true) with check (true);
