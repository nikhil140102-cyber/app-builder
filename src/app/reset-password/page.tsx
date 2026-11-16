'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { brand } from '@/config/brand';
import { needsLogin } from '@/core/storage';
import { friendlyError, supabase } from '@/core/supabase';

/** Opened from the password-reset email. Supabase signs the user in from the link first. */
export default function ResetPasswordPage() {
  const [ready, setReady] = useState<'checking' | 'ok' | 'expired'>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!needsLogin) return setReady('expired');
    const sb = supabase();
    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setReady('ok');
    });
    const t = setTimeout(() => {
      sb.auth.getSession().then(({ data }) => setReady(data.session ? 'ok' : 'expired'));
    }, 1200);
    return () => {
      clearTimeout(t);
      sub.subscription.unsubscribe();
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('The two passwords do not match.');
    setBusy(true);
    const { error } = await supabase().auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(friendlyError(error));
    window.location.replace('/');
  }

  return (
    <div className="auth">
      <form className="authcard" onSubmit={submit} noValidate>
        <Link href="/" className="brand"><i />{brand.name}</Link>
        <h1>Choose a new password</h1>
        {ready === 'checking' && <p className="note">Checking your reset link…</p>}
        {ready === 'expired' && (
          <>
            <p className="error">This reset link has expired or was already used.</p>
            <Link className="btn" href="/login">Request a new link</Link>
          </>
        )}
        {ready === 'ok' && (
          <>
            <label className="field">
              <span>New password</span>
              <input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <small>At least 8 characters.</small>
            </label>
            <label className="field">
              <span>Type it again</span>
              <input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </label>
            {error && <p className="error" role="alert">{error}</p>}
            <button className="btn primary big" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save new password'}</button>
          </>
        )}
      </form>
    </div>
  );
}
