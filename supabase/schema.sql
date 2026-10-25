-- Clause: persisted case analyses.
-- Run once in the Supabase dashboard → SQL Editor. Safe to re-run.

create table if not exists public.analyses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  file_name     text not null,
  file_size     integer not null,
  storage_path  text,                       -- path inside the private "case-files" bucket
  lang          text not null default 'tr' check (lang in ('tr', 'en')),
  overall_risk  text not null check (overall_risk in ('low', 'medium', 'high', 'critical')),
  summary       text not null default '',
  result        jsonb not null,             -- full model output (findings, contradictions, recommendations)
  created_at    timestamptz not null default now()
);

create index if not exists analyses_user_created_idx on public.analyses (user_id, created_at desc);

alter table public.analyses enable row level security;

drop policy if exists "analyses_select_own" on public.analyses;
drop policy if exists "analyses_insert_own" on public.analyses;
drop policy if exists "analyses_delete_own" on public.analyses;

create policy "analyses_select_own" on public.analyses for select using (auth.uid() = user_id);
create policy "analyses_insert_own" on public.analyses for insert with check (auth.uid() = user_id);
create policy "analyses_delete_own" on public.analyses for delete using (auth.uid() = user_id);

-- Private bucket for the original uploads; each user may only touch files under "<their uid>/".
insert into storage.buckets (id, name, public)
values ('case-files', 'case-files', false)
on conflict (id) do nothing;

drop policy if exists "case_files_select_own" on storage.objects;
drop policy if exists "case_files_insert_own" on storage.objects;
drop policy if exists "case_files_delete_own" on storage.objects;

create policy "case_files_select_own" on storage.objects for select to authenticated
  using (bucket_id = 'case-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "case_files_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'case-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "case_files_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'case-files' and (storage.foldername(name))[1] = auth.uid()::text);
