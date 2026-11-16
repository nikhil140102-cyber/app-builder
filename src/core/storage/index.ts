import { supabaseConfigured } from '../supabase';
import { browserStorage } from './browser';
import { serverStorage } from './server';
import { supabaseStorage } from './supabase';
import type { StorageAdapter } from './types';

/**
 * Where projects are saved:
 *   NEXT_PUBLIC_STORAGE=browser          → this browser only
 *   Supabase keys present in .env        → the signed-in user's account (needs login)
 *   otherwise                            → JSON files in data/projects on this computer
 * NEXT_PUBLIC_STORAGE=local forces the files mode even when Supabase keys exist.
 */
const mode = process.env.NEXT_PUBLIC_STORAGE;

export type StorageMode = 'browser' | 'supabase' | 'server';

export const storageMode: StorageMode =
  mode === 'browser' ? 'browser' : mode !== 'local' && supabaseConfigured ? 'supabase' : 'server';

export const storage: StorageAdapter =
  storageMode === 'browser' ? browserStorage : storageMode === 'supabase' ? supabaseStorage : serverStorage;

/** True when users must sign in before they see their apps. */
export const needsLogin = storageMode === 'supabase';

export type { StorageAdapter } from './types';
