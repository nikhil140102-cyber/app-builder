'use client';
import { migrate } from './schema';
import { storageMode } from './storage';
import { friendlyError, supabase } from './supabase';
import type { AppDoc } from './types';

/**
 * Live preview links (/p/<token>). Anyone with the link can view the app in
 * Preview mode; only the owner can update it.
 *   files mode    → data/previews/<token>.json through /api/previews
 *   Supabase mode → "previews" table, read through the get_preview() function
 */
export const previewsAvailable = storageMode !== 'browser';

export function newShareToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join('');
}

export async function publishPreview(doc: AppDoc): Promise<void> {
  const token = doc.share.token;
  if (!token) return;
  if (storageMode === 'supabase') {
    const sb = supabase();
    const { data } = await sb.auth.getSession();
    const owner = data.session?.user.id;
    if (!owner) throw new Error('Sign in again to update the preview.');
    const { error } = await sb.from('previews').upsert({ token, owner_id: owner, doc, updated_at: doc.updatedAt }, { onConflict: 'token' });
    if (error) throw new Error(friendlyError(error));
    return;
  }
  const res = await fetch(`/api/previews/${encodeURIComponent(token)}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(doc),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Server answered ${res.status}`);
}

export async function removePreview(token: string): Promise<void> {
  if (!token) return;
  if (storageMode === 'supabase') {
    await supabase().from('previews').delete().eq('token', token);
    return;
  }
  await fetch(`/api/previews/${encodeURIComponent(token)}`, { method: 'DELETE' });
}

export async function readPreview(token: string): Promise<AppDoc | null> {
  if (storageMode === 'supabase') {
    const { data, error } = await supabase().rpc('get_preview', { p_token: token });
    if (error) throw new Error(friendlyError(error));
    return data ? migrate(data) : null;
  }
  const res = await fetch(`/api/previews/${encodeURIComponent(token)}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Server answered ${res.status}`);
  return migrate(await res.json());
}

export function previewUrl(origin: string, token: string) {
  return `${origin.replace(/\/$/, '')}/p/${token}`;
}
