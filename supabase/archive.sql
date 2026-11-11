-- Clause: personal precedent archive (Sprint 1) — documents, chunks, precedent metadata, hybrid search.
-- Run once in the Supabase dashboard → SQL Editor. Safe to re-run.
-- Independent of schema.sql: the existing `analyses` flow is untouched.
--
-- Embedding dimension is 1024 (Voyage voyage-3 family, bge-m3, or OpenAI text-embedding-3-* requested
-- with dimensions=1024). Anthropic has no embeddings endpoint, so the provider is chosen in app code.
-- Changing the dimension later means re-embedding everything, so decide before ingesting real data.

create extension if not exists vector;

-- ───────────────────────────── documents ─────────────────────────────
create table if not exists public.documents (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  matter_id     uuid,                                   -- Sprint 2: FK to the Büro "matters" table
  kind          text not null default 'precedent' check (kind in ('precedent', 'case_doc')),
  title         text not null,
  file_name     text not null,
  file_size     integer not null check (file_size >= 0),
  storage_path  text,                                   -- path inside the private "case-files" bucket
  content_hash  text,                                   -- sha-256 of the extracted text, used to skip duplicates
  status        text not null default 'pending' check (status in ('pending', 'processing', 'ready', 'failed')),
  error         text,
  page_count    integer,
  char_count    integer,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists documents_user_created_idx on public.documents (user_id, created_at desc);
create index if not exists documents_matter_idx on public.documents (matter_id) where matter_id is not null;
create unique index if not exists documents_user_hash_uq on public.documents (user_id, content_hash) where content_hash is not null;

-- ───────────────────────────── precedents ─────────────────────────────
-- One row per precedent document. Court-agnostic: legal_area is free text (İş, Ceza, Hukuk, Gayrimenkul, …)
-- so new areas need no migration. Extracted by regex first, LLM second (extraction_source records which).
create table if not exists public.precedents (
  document_id        uuid primary key references public.documents(id) on delete cascade,
  user_id            uuid not null default auth.uid() references auth.users(id) on delete cascade,
  legal_area         text,
  court              text,                              -- e.g. "Yargıtay", "Danıştay", "Anayasa Mahkemesi", "BAM"
  chamber            text,                              -- daire, e.g. "9. Hukuk Dairesi"
  esas_no            text,                              -- e.g. "2023/1234"
  karar_no           text,                              -- e.g. "2024/567"
  decision_date      date,
  subject            text,
  statutes           text[] not null default '{}',      -- cited provisions, e.g. {"TBK 49", "KTK 85"}
  outcome            text,
  extraction_source  text not null default 'none' check (extraction_source in ('none', 'regex', 'llm', 'manual')),
  created_at         timestamptz not null default now()
);

create index if not exists precedents_user_area_idx on public.precedents (user_id, legal_area);
create index if not exists precedents_user_date_idx on public.precedents (user_id, decision_date desc);
create index if not exists precedents_user_chamber_idx on public.precedents (user_id, chamber);
create index if not exists precedents_statutes_idx on public.precedents using gin (statutes);

-- ───────────────────────────── document_chunks ─────────────────────────────
create table if not exists public.document_chunks (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,  -- denormalized: cheap RLS + search filter
  ord         integer not null,                         -- position inside the document
  heading     text,                                     -- section label (gerekçe, hüküm, …)
  content     text not null,
  token_count integer,
  embedding   vector(1024),                             -- nullable: chunks are searchable by FTS before embedding finishes
  fts         tsvector generated always as (
                to_tsvector('turkish', coalesce(heading, '') || ' ' || content)
              ) stored,
  unique (document_id, ord)
);

create index if not exists chunks_user_idx on public.document_chunks (user_id);
create index if not exists chunks_fts_idx on public.document_chunks using gin (fts);
create index if not exists chunks_embedding_idx on public.document_chunks using hnsw (embedding vector_cosine_ops);

-- ───────────────────────────── RLS ─────────────────────────────
alter table public.documents       enable row level security;
alter table public.precedents      enable row level security;
alter table public.document_chunks enable row level security;

drop policy if exists "documents_select_own" on public.documents;
drop policy if exists "documents_insert_own" on public.documents;
drop policy if exists "documents_update_own" on public.documents;
drop policy if exists "documents_delete_own" on public.documents;
create policy "documents_select_own" on public.documents for select using (auth.uid() = user_id);
create policy "documents_insert_own" on public.documents for insert with check (auth.uid() = user_id);
create policy "documents_update_own" on public.documents for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "documents_delete_own" on public.documents for delete using (auth.uid() = user_id);

-- Child rows must also point at a document the user owns, not just carry their own user_id.
drop policy if exists "precedents_select_own" on public.precedents;
drop policy if exists "precedents_insert_own" on public.precedents;
drop policy if exists "precedents_update_own" on public.precedents;
drop policy if exists "precedents_delete_own" on public.precedents;
create policy "precedents_select_own" on public.precedents for select using (auth.uid() = user_id);
create policy "precedents_insert_own" on public.precedents for insert
  with check (auth.uid() = user_id and exists (select 1 from public.documents d where d.id = document_id and d.user_id = auth.uid()));
create policy "precedents_update_own" on public.precedents for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "precedents_delete_own" on public.precedents for delete using (auth.uid() = user_id);

drop policy if exists "chunks_select_own" on public.document_chunks;
drop policy if exists "chunks_insert_own" on public.document_chunks;
drop policy if exists "chunks_update_own" on public.document_chunks;
drop policy if exists "chunks_delete_own" on public.document_chunks;
create policy "chunks_select_own" on public.document_chunks for select using (auth.uid() = user_id);
create policy "chunks_insert_own" on public.document_chunks for insert
  with check (auth.uid() = user_id and exists (select 1 from public.documents d where d.id = document_id and d.user_id = auth.uid()));
create policy "chunks_update_own" on public.document_chunks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "chunks_delete_own" on public.document_chunks for delete using (auth.uid() = user_id);

-- keep documents.updated_at fresh
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists documents_touch_updated_at on public.documents;
create trigger documents_touch_updated_at before update on public.documents
  for each row execute function public.touch_updated_at();

-- ───────────────────────────── hybrid_search ─────────────────────────────
-- Reciprocal Rank Fusion of vector (cosine) and Turkish full-text rankings.
--   • SECURITY INVOKER: runs as the caller, so RLS applies. auth.uid() is also filtered explicitly.
--   • query_embedding may be null → pure full-text search (also the fallback if the embedder is down).
--   • query_text may be empty   → pure vector search.
--   • Every filter is optional (null = ignore).
-- Returns the fused top `match_count` chunks plus the precedent "künye" so the UI can render a card
-- and the answer step can cite "Yargıtay 9. HD, E. 2023/1234 K. 2024/567".
create or replace function public.hybrid_search(
  query_text       text,
  query_embedding  vector(1024) default null,
  match_count      integer      default 8,
  p_legal_area     text         default null,
  p_court          text         default null,
  p_chamber        text         default null,
  p_year_from      integer      default null,
  p_year_to        integer      default null,
  p_statute        text         default null,
  p_matter_id      uuid         default null,
  p_document_ids   uuid[]       default null,
  p_candidates     integer      default 40,
  p_rrf_k          integer      default 60
)
returns table (
  chunk_id       uuid,
  document_id    uuid,
  ord            integer,
  heading        text,
  content        text,
  title          text,
  legal_area     text,
  court          text,
  chamber        text,
  esas_no        text,
  karar_no       text,
  decision_date  date,
  score          double precision,
  vector_rank    integer,
  text_rank      integer
)
language sql
stable
security invoker
set search_path = public
set hnsw.ef_search = 100
as $$
  with
  q as (
    select case
             when coalesce(trim(query_text), '') = '' then null
             else websearch_to_tsquery('turkish', query_text)
           end as tsq
  ),
  vec as (
    select c.id,
           row_number() over (order by c.embedding <=> query_embedding) as rnk
    from public.document_chunks c
    join public.documents d on d.id = c.document_id and d.status = 'ready'
    left join public.precedents p on p.document_id = d.id
    where query_embedding is not null
      and c.embedding is not null
      and c.user_id = auth.uid()
      and (p_legal_area   is null or p.legal_area = p_legal_area)
      and (p_court        is null or p.court = p_court)
      and (p_chamber      is null or p.chamber = p_chamber)
      and (p_year_from    is null or p.decision_date >= make_date(p_year_from, 1, 1))
      and (p_year_to      is null or p.decision_date <= make_date(p_year_to, 12, 31))
      and (p_statute      is null or p_statute = any (p.statutes))
      and (p_matter_id    is null or d.matter_id = p_matter_id)
      and (p_document_ids is null or d.id = any (p_document_ids))
    order by c.embedding <=> query_embedding
    limit greatest(p_candidates, match_count)
  ),
  txt as (
    select c.id,
           row_number() over (order by ts_rank_cd(c.fts, q.tsq) desc) as rnk
    from public.document_chunks c
    cross join q
    join public.documents d on d.id = c.document_id and d.status = 'ready'
    left join public.precedents p on p.document_id = d.id
    where q.tsq is not null
      and c.fts @@ q.tsq
      and c.user_id = auth.uid()
      and (p_legal_area   is null or p.legal_area = p_legal_area)
      and (p_court        is null or p.court = p_court)
      and (p_chamber      is null or p.chamber = p_chamber)
      and (p_year_from    is null or p.decision_date >= make_date(p_year_from, 1, 1))
      and (p_year_to      is null or p.decision_date <= make_date(p_year_to, 12, 31))
      and (p_statute      is null or p_statute = any (p.statutes))
      and (p_matter_id    is null or d.matter_id = p_matter_id)
      and (p_document_ids is null or d.id = any (p_document_ids))
    order by ts_rank_cd(c.fts, q.tsq) desc
    limit greatest(p_candidates, match_count)
  ),
  fused as (
    select coalesce(v.id, t.id) as id,
           coalesce(1.0 / (p_rrf_k + v.rnk), 0) + coalesce(1.0 / (p_rrf_k + t.rnk), 0) as score,
           v.rnk::integer as vector_rank,
           t.rnk::integer as text_rank
    from vec v
    full outer join txt t on t.id = v.id
  )
  select c.id, c.document_id, c.ord, c.heading, c.content,
         d.title, p.legal_area, p.court, p.chamber, p.esas_no, p.karar_no, p.decision_date,
         f.score::double precision, f.vector_rank, f.text_rank
  from fused f
  join public.document_chunks c on c.id = f.id
  join public.documents d on d.id = c.document_id
  left join public.precedents p on p.document_id = d.id
  order by f.score desc, c.id
  limit match_count;
$$;

grant execute on function public.hybrid_search(text, vector, integer, text, text, text, integer, integer, text, uuid, uuid[], integer, integer) to authenticated;
