-- Week 3 bet record. Additive. Apply by hand in the Supabase SQL editor.
-- The site does not run this file.
--
-- published_lines is append-only. UPDATE and DELETE are rejected by trigger,
-- including for the service role. A correction is a new version row.
-- Public reads are FINAL rows only (RLS and the view).
-- model_experiments is the admin sandbox log. It is also append-only.
-- Nothing in the sandbox writes published_lines, desk_edits, or locks.

create or replace function public.reject_row_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception '% is append-only', tg_table_name;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_admin'
  ) then
    create function public.is_admin()
    returns boolean
    language sql
    stable
    security definer
    set search_path = public
    as $fn$
      select exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
      );
    $fn$;
  end if;
end $$;

create table if not exists public.published_lines (
  id uuid primary key default gen_random_uuid(),
  season integer not null,
  week integer not null,
  game_id text not null,
  version text not null,
  status text not null,
  lock_quality text not null,
  payload jsonb not null,
  content_sha256 text not null,
  created_at timestamptz not null default now(),
  constraint published_lines_status_chk check (status in ('FINAL', 'PENDING')),
  constraint published_lines_version_uq unique (season, week, game_id, version)
);

create or replace function public.published_lines_stamp()
returns trigger
language plpgsql
as $$
begin
  new.created_at := now();
  if new.status is distinct from 'FINAL' and new.status is distinct from 'PENDING' then
    raise exception 'published_lines status must be FINAL or PENDING';
  end if;
  return new;
end;
$$;

drop trigger if exists published_lines_stamp on public.published_lines;
create trigger published_lines_stamp
  before insert on public.published_lines
  for each row execute function public.published_lines_stamp();

drop trigger if exists published_lines_no_mutation on public.published_lines;
create trigger published_lines_no_mutation
  before update or delete on public.published_lines
  for each row execute function public.reject_row_mutation();

alter table public.published_lines enable row level security;

drop policy if exists published_lines_select_final on public.published_lines;
create policy published_lines_select_final
  on public.published_lines
  for select
  to anon, authenticated
  using (status = 'FINAL');

revoke update, delete on table public.published_lines from public, anon, authenticated;
grant select on table public.published_lines to anon, authenticated;

create or replace view public.published_lines_public
with (security_invoker = true) as
select
  season,
  week,
  game_id,
  version,
  status,
  lock_quality,
  payload,
  content_sha256,
  created_at
from public.published_lines
where status = 'FINAL';

grant select on public.published_lines_public to anon, authenticated;

create table if not exists public.model_experiments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  changes jsonb not null,
  results jsonb not null,
  comparison jsonb not null
);

create or replace function public.model_experiments_stamp()
returns trigger
language plpgsql
as $$
begin
  new.created_at := now();
  new.created_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists model_experiments_stamp on public.model_experiments;
create trigger model_experiments_stamp
  before insert on public.model_experiments
  for each row execute function public.model_experiments_stamp();

drop trigger if exists model_experiments_no_mutation on public.model_experiments;
create trigger model_experiments_no_mutation
  before update or delete on public.model_experiments
  for each row execute function public.reject_row_mutation();

alter table public.model_experiments enable row level security;

drop policy if exists model_experiments_admin_select on public.model_experiments;
create policy model_experiments_admin_select
  on public.model_experiments
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists model_experiments_admin_insert on public.model_experiments;
create policy model_experiments_admin_insert
  on public.model_experiments
  for insert
  to authenticated
  with check (public.is_admin());

revoke update, delete on table public.model_experiments from public, anon, authenticated;
grant select, insert on table public.model_experiments to authenticated;
