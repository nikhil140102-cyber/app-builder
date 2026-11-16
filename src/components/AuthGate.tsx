'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from '@/core/account';
import { displayName, signOut, useAuth } from '@/core/auth';
import { needsLogin } from '@/core/storage';

/** Shows children only to signed-in users; sends everyone else to /login. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();

  useEffect(() => {
    if (status === 'signedOut') {
      const next = window.location.pathname + window.location.search;
      window.location.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [status]);

  const account = useAccount();

  if (status === 'signedIn' && account.blocked) {
    return (
      <div className="auth">
        <div className="authcard">
          <h1>Your account is paused</h1>
          <p className="note">An administrator has paused this account, so your apps can’t be opened right now. Contact support if you think this is a mistake.</p>
          <button className="btn" onClick={signOut}>Sign out</button>
        </div>
      </div>
    );
  }
  if (status === 'signedIn') return <>{children}</>;
  return (
    <div className="dash">
      <p className="note">{status === 'loading' ? 'Checking your account…' : 'Taking you to sign in…'}</p>
    </div>
  );
}

/** Small "signed in as … / Sign out" control for headers. Hidden in local mode. */
export function AccountChip() {
  const { user } = useAuth();
  const { isAdmin } = useAccount();
  if (!needsLogin || !user) return null;
  return (
    <span className="account">
      {isAdmin && <Link className="btn small" href="/admin">Admin</Link>}
      <span className="who" title={user.email ?? ''}>{displayName(user)}</span>
      <button className="btn small" onClick={signOut}>Sign out</button>
    </span>
  );
}
