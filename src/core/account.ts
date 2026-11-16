'use client';
import { useEffect, useState } from 'react';
import { useAuth } from './auth';
import { needsLogin } from './storage';
import { supabase } from './supabase';

export interface AccountInfo {
  loading: boolean;
  isAdmin: boolean;
  blocked: boolean;
}

/**
 * Admin and blocked status for the signed-in user, from the "admins" and
 * "profiles" tables (supabase/schema.sql). Missing tables simply mean
 * "not admin, not blocked", so older databases keep working.
 */
export function useAccount(): AccountInfo {
  const { status, user } = useAuth();
  const [info, setInfo] = useState<AccountInfo>({ loading: needsLogin, isAdmin: false, blocked: false });

  useEffect(() => {
    if (!needsLogin || status !== 'signedIn' || !user) {
      if (status !== 'loading') setInfo({ loading: false, isAdmin: false, blocked: false });
      return;
    }
    let alive = true;
    const sb = supabase();
    Promise.all([
      sb.from('admins').select('user_id').eq('user_id', user.id).maybeSingle(),
      sb.from('profiles').select('blocked').eq('id', user.id).maybeSingle(),
    ]).then(([admin, profile]) => {
      if (!alive) return;
      setInfo({ loading: false, isAdmin: !admin.error && !!admin.data, blocked: !profile.error && profile.data?.blocked === true });
    });
    return () => {
      alive = false;
    };
  }, [status, user]);

  return info;
}
