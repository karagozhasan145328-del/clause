/** Env values can pick up a BOM or stray whitespace when pasted/piped; strip both. */
const clean = (v: string | undefined) => (v ?? "").replace(/^﻿/, "").trim();

/** Supabase is optional — with no keys the app stays in demo mode. */
export const SUPABASE_URL = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const SUPABASE_ANON_KEY = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
