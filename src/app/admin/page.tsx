'use client';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccountChip, AuthGate } from '@/components/AuthGate';
import { brand } from '@/config/brand';
import { useAccount } from '@/core/account';
import { useAuth } from '@/core/auth';
import { needsLogin } from '@/core/storage';
import { friendlyError, supabase } from '@/core/supabase';

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  blocked: boolean;
}

interface Row extends Profile {
  apps: number;
  lastEdit: string | null;
}

const DAY = 86400000;

export default function AdminRoute() {
  return (
    <AuthGate>
      <Admin />
    </AuthGate>
  );
}

function Admin() {
  const { user } = useAuth();
  const { loading, isAdmin } = useAccount();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError('');
    const sb = supabase();
    const [profiles, projects] = await Promise.all([
      sb.from('profiles').select('id, email, full_name, created_at, blocked').order('created_at', { ascending: false }),
      sb.from('projects').select('owner_id, updated_at'),
    ]);
    if (profiles.error) return setError(friendlyError(profiles.error));
    if (projects.error) return setError(friendlyError(projects.error));
    const stats = new Map<string, { apps: number; last: string | null }>();
    for (const p of projects.data ?? []) {
      const st = stats.get(p.owner_id) ?? { apps: 0, last: null };
      st.apps++;
      if (!st.last || p.updated_at > st.last) st.last = p.updated_at;
      stats.set(p.owner_id, st);
    }
    setRows(
      (profiles.data as Profile[]).map((p) => ({ ...p, apps: stats.get(p.id)?.apps ?? 0, lastEdit: stats.get(p.id)?.last ?? null })),
    );
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (rows ?? []).filter((r) => !term || `${r.email} ${r.full_name}`.toLowerCase().includes(term));
  }, [rows, q]);

  const totals = useMemo(() => {
    const list = rows ?? [];
    const now = Date.now();
    return {
      users: list.length,
      apps: list.reduce((n, r) => n + r.apps, 0),
      newWeek: list.filter((r) => now - new Date(r.created_at).getTime() < 7 * DAY).length,
      active: list.filter((r) => r.lastEdit && now - new Date(r.lastEdit).getTime() < 7 * DAY).length,
      blocked: list.filter((r) => r.blocked).length,
    };
  }, [rows]);

  async function setBlocked(r: Row, blocked: boolean) {
    setBusy(r.id);
    const { error } = await supabase().from('profiles').update({ blocked }).eq('id', r.id);
    setBusy(null);
    if (error) return setError(friendlyError(error));
    setRows((list) => (list ?? []).map((x) => (x.id === r.id ? { ...x, blocked } : x)));
  }

  const header = (
    <div className="dash-head">
      <Link href="/" className="brand"><i />{brand.name}</Link>
      <span className="pill">Admin</span>
      <div className="grow" />
      <Link className="btn" href="/">My apps</Link>
      <AccountChip />
    </div>
  );

  if (!needsLogin) {
    return (
      <div className="dash">
        {header}
        <p>The admin page needs accounts. Connect Supabase first (docs/SUPABASE_SETUP.md).</p>
      </div>
    );
  }
  if (loading) return <div className="dash">{header}<p className="note">Checking access…</p></div>;
  if (!isAdmin) {
    return (
      <div className="dash">
        {header}
        <h1>Admins only</h1>
        <p className="lede">
          To make yourself an admin, run this in Supabase → SQL Editor (after running the latest <code>supabase/schema.sql</code>):
        </p>
        <pre className="sqlbox">{`insert into public.admins (user_id)\nselect id from auth.users where email = '${user?.email ?? 'you@example.com'}'\non conflict do nothing;`}</pre>
        <p className="note">Then reload this page.</p>
      </div>
    );
  }

  return (
    <div className="dash admin">
      {header}
      <div>
        <h1>Platform admin</h1>
        <p className="lede">Everyone who has signed up, how many apps they have made, and when they last edited.</p>
      </div>

      <section className="stats" aria-label="Totals">
        <div><b>{totals.users}</b><span>users</span></div>
        <div><b>{totals.apps}</b><span>apps</span></div>
        <div><b>{totals.newWeek}</b><span>joined this week</span></div>
        <div><b>{totals.active}</b><span>active this week</span></div>
        <div><b>{totals.blocked}</b><span>paused</span></div>
      </section>

      {error && <p className="error">{error}</p>}

      <div className="dash-head">
        <input id="admin-search" className="search" style={{ maxWidth: 340 }} type="search" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="grow" />
        <button className="btn" onClick={load}>Refresh</button>
      </div>

      {rows === null ? (
        <p className="note">Loading users…</p>
      ) : (
        <div className="tablewrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Joined</th><th>Apps</th><th>Last edit</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id}>
                  <td>{r.full_name || '—'}</td>
                  <td style={{ overflowWrap: 'anywhere' }}>{r.email}</td>
                  <td className="num">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="num">{r.apps}</td>
                  <td className="num">{r.lastEdit ? new Date(r.lastEdit).toLocaleDateString() : '—'}</td>
                  <td><span className={`status ${r.blocked ? 'off' : 'on'}`}>{r.blocked ? 'Paused' : 'Active'}</span></td>
                  <td>
                    {r.id === user?.id ? (
                      <span className="note">You</span>
                    ) : (
                      <button className={`btn small${r.blocked ? '' : ' danger'}`} disabled={busy === r.id} onClick={() => setBlocked(r, !r.blocked)}>
                        {r.blocked ? 'Unpause' : 'Pause'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!shown.length && (
                <tr><td colSpan={7} className="note">No users match “{q}”.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
