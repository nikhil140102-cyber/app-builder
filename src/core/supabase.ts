'use client';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase connection. Configured by two values in .env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY   (or the older NEXT_PUBLIC_SUPABASE_ANON_KEY)
 * Both are safe to ship to the browser: row level security in the database
 * makes sure each user only reaches their own rows.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
const key = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

export const supabaseConfigured = /^https:\/\/.+/.test(url) && key.length > 20;

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!supabaseConfigured) throw new Error('Supabase is not set up. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env and restart.');
  client ??= createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return client;
}

/** Turns Supabase/network errors into sentences a non-developer can act on. */
export function friendlyError(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? String(e);
  if (/failed to fetch|networkerror|load failed/i.test(msg)) return 'Cannot reach Supabase. Check your internet connection, and that the project is not paused in the Supabase dashboard.';
  if (/invalid login credentials/i.test(msg)) return 'Wrong email or password.';
  if (/email not confirmed/i.test(msg)) return 'Please confirm your email first. Open the link we sent you, then sign in.';
  if (/user already registered/i.test(msg)) return 'An account with this email already exists. Sign in instead, or reset your password.';
  if (/rate limit|too many/i.test(msg)) return 'Too many attempts. Wait a few minutes and try again.';
  if (/relation .*projects.* does not exist|could not find the table/i.test(msg)) return 'The "projects" table is missing in Supabase. Run supabase/schema.sql in the Supabase SQL Editor (see docs/SUPABASE_SETUP.md).';
  if (/row-level security|permission denied/i.test(msg)) return 'Supabase refused the request. Sign out and sign in again; if it continues, re-run supabase/schema.sql.';
  if (/password should be at least/i.test(msg)) return 'Password must be at least 6 characters.';
  if (/invalid api key|no api key/i.test(msg)) return 'The Supabase key in .env is wrong. Copy the Publishable key again from Project Settings → API Keys and restart.';
  return msg;
}
