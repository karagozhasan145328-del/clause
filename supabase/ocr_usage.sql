-- Clause: per-user OCR usage (monthly page quota).
-- Run once in the Supabase dashboard → SQL Editor. Safe to re-run.
--
-- Users can read and add their own usage rows but can NOT update or delete them, so deleting a
-- saved analysis never refunds quota. Until this table exists the app falls back to counting the
-- user's saved OCR analyses (works, but deleting an analysis then frees quota).

create table if not exists public.ocr_usage (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pages       integer not null check (pages > 0 and pages <= 100),
  file_name   text,
  created_at  timestamptz not null default now()
);

create index if not exists ocr_usage_user_created_idx on public.ocr_usage (user_id, created_at desc);

alter table public.ocr_usage enable row level security;

drop policy if exists "ocr_usage_select_own" on public.ocr_usage;
drop policy if exists "ocr_usage_insert_own" on public.ocr_usage;

create policy "ocr_usage_select_own" on public.ocr_usage for select using (auth.uid() = user_id);
create policy "ocr_usage_insert_own" on public.ocr_usage for insert with check (auth.uid() = user_id);
-- intentionally no update / delete policies
