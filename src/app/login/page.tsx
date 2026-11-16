'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { brand } from '@/config/brand';
import { useAuth } from '@/core/auth';
import { needsLogin } from '@/core/storage';
import { friendlyError, supabase } from '@/core/supabase';

type Mode = 'signin' | 'signup' | 'link' | 'forgot';

const TITLES: Record<Mode, string> = {
  signin: 'Sign in',
  signup: 'Create your account',
  link: 'Sign in with an email link',
  forgot: 'Reset your password',
};

function safeNext(): string {
  const next = new URLSearchParams(window.location.search).get('next') ?? '/';
  // Only allow paths on this site.
  return next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

export default function LoginPage() {
  const { status } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    if (status === 'signedIn') window.location.replace(safeNext());
  }, [status]);

  if (!needsLogin) {
    return (
      <div className="auth">
        <div className="authcard">
          <h1>Accounts are not switched on</h1>
          <p className="note">
            This builder saves apps on this computer, so no sign-in is needed. To use accounts, add your Supabase keys to <code>.env</code> and restart. See <code>docs/SUPABASE_SETUP.md</code>.
          </p>
          <Link className="btn primary" href="/">Go to my apps</Link>
        </div>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email address.');
    if ((mode === 'signin' || mode === 'signup') && password.length < 8) return setError('Password must be at least 8 characters.');
    setBusy(true);
    const sb = supabase();
    const redirect = `${window.location.origin}/login?next=${encodeURIComponent(safeNext())}`;
    try {
      if (mode === 'signin') {
        const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      } else if (mode === 'signup') {
        const { data, error } = await sb.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: redirect, data: { full_name: name.trim() } },
        });
        if (error) throw error;
        if (!data.session) {
          setInfo(`We sent a confirmation link to ${email.trim()}. Open it on this computer to finish creating your account.`);
          setMode('signin');
        }
      } else if (mode === 'link') {
        const { error } = await sb.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: redirect } });
        if (error) throw error;
        setInfo(`We sent a sign-in link to ${email.trim()}. Open it on this computer.`);
      } else {
        const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setInfo(`If ${email.trim()} has an account, a password reset link is on its way.`);
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  const go = (m: Mode) => {
    setMode(m);
    setError('');
    setInfo('');
  };

  return (
    <div className="auth">
      <form className="authcard" onSubmit={submit} noValidate>
        <Link href="/" className="brand"><i />{brand.name}</Link>
        <h1>{TITLES[mode]}</h1>
        {mode === 'signup' && <p className="note">Free to start. Your apps are saved in your account and open from any computer.</p>}

        {mode === 'signup' && (
          <label className="field">
            <span>Your name</span>
            <input id="name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
        )}
        <label className="field">
          <span>Email</span>
          <input id="email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        {(mode === 'signin' || mode === 'signup') && (
          <label className="field">
            <span>Password</span>
            <input
              id="password"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            {mode === 'signup' && <small>At least 8 characters.</small>}
          </label>
        )}

        {error && <p className="error" role="alert">{error}</p>}
        {info && <p className="okmsg" role="status">{info}</p>}

        <button className="btn primary big" type="submit" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : mode === 'link' ? 'Email me a link' : 'Send reset link'}
        </button>

        <div className="authlinks">
          {mode !== 'signin' && <button type="button" onClick={() => go('signin')}>I have an account — sign in</button>}
          {mode !== 'signup' && <button type="button" onClick={() => go('signup')}>New here? Create an account</button>}
          {mode === 'signin' && <button type="button" onClick={() => go('link')}>Sign in without a password</button>}
          {mode === 'signin' && <button type="button" onClick={() => go('forgot')}>Forgot password?</button>}
        </div>
      </form>
    </div>
  );
}
