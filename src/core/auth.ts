'use client';
import type { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { needsLogin } from './storage';
import { supabase } from './supabase';

export type AuthStatus = 'loading' | 'signedIn' | 'signedOut';

/**
 * Current user. When the builder saves locally (no Supabase keys), everyone
 * counts as signed in and `user` is null.
 */
export function useAuth(): { status: AuthStatus; user: User | null } {
  const [state, setState] = useState<{ status: AuthStatus; user: User | null }>(
    needsLogin ? { status: 'loading', user: null } : { status: 'signedIn', user: null },
  );

  useEffect(() => {
    if (!needsLogin) return;
    const sb = supabase();
    let alive = true;
    sb.auth.getSession().then(({ data }) => {
      if (alive) setState({ status: data.session ? 'signedIn' : 'signedOut', user: data.session?.user ?? null });
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      setState({ status: session ? 'signedIn' : 'signedOut', user: session?.user ?? null });
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export async function signOut() {
  if (needsLogin) await supabase().auth.signOut();
  window.location.href = '/login';
}

/** Name to show for the signed-in user. */
export function displayName(user: User | null): string {
  if (!user) return '';
  const meta = user.user_metadata as { full_name?: string } | undefined;
  return meta?.full_name?.trim() || user.email || 'Account';
}
