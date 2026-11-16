'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { brand } from '@/config/brand';
import { newId } from '@/core/ids';
import { migrate } from '@/core/schema';
import { AccountChip, AuthGate } from '@/components/AuthGate';
import { copyToAccount, findLocalApps, type LocalApp } from '@/core/importLocal';
import { needsLogin, storage } from '@/core/storage';
import { cloneWithNewIds } from '@/core/tree';
import type { ProjectSummary } from '@/core/types';
import { templates } from '@/templates';
import { downloadJson } from '@/utils/download';
import { useSystemInfo } from '@/utils/system';

export default function DashboardPage() {
  return (
    <AuthGate>
      <Dashboard />
    </AuthGate>
  );
}

const IMPORT_HIDE_KEY = 'app-builder:hide-local-import';

/** Offers to copy apps saved on this computer (before accounts) into the account. */
function LocalImport({ onDone }: { onDone: () => void }) {
  const [apps, setApps] = useState<LocalApp[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState('');
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (!needsLogin) return;
    try {
      if (localStorage.getItem(IMPORT_HIDE_KEY) === '1') return;
    } catch {}
    setHidden(false);
    findLocalApps().then(setApps);
  }, []);

  if (hidden || (!apps.length && !result)) return null;

  async function run() {
    setBusy(true);
    const { copied, failed } = await copyToAccount(apps, setProgress);
    setBusy(false);
    setApps([]);
    setResult(
      `Copied ${copied} ${copied === 1 ? 'app' : 'apps'} to your account.` +
        (failed.length ? ` Could not copy: ${failed.join(', ')}.` : ' The originals are still on this computer as a backup.'),
    );
    onDone();
  }

  return (
    <div className="importbox" role="region" aria-label="Apps on this computer">
      {result ? (
        <p className="okmsg" style={{ margin: 0 }}>{result}</p>
      ) : (
        <>
          <div>
            <b>
              {apps.length} {apps.length === 1 ? 'app is' : 'apps are'} saved on this computer but not in your account.
            </b>
            <p className="note" style={{ margin: '4px 0 0' }}>{apps.map((a) => a.name).join(', ')}</p>
          </div>
          <div className="row">
            <button className="btn primary" onClick={run} disabled={busy}>
              {busy ? `Copying ${progress}/${apps.length}…` : 'Copy them to my account'}
            </button>
            <button
              className="btn"
              disabled={busy}
              onClick={() => {
                setHidden(true);
                try {
                  localStorage.setItem(IMPORT_HIDE_KEY, '1');
                } catch {}
              }}
            >
              Not now
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Dashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [tpl, setTpl] = useState(templates[1].id);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const sys = useSystemInfo();

  const refresh = useCallback(async () => {
    try {
      setProjects(await storage.list());
      setError('');
    } catch (e) {
      setError(`Could not load projects: ${(e as Error).message}`);
      setProjects([]);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function create() {
    const t = templates.find((x) => x.id === tpl) ?? templates[0];
    const doc = t.build(name.trim() || 'My app');
    try {
      await storage.save(doc);
      router.push(`/editor/${doc.id}`);
    } catch (e) {
      setError(`Could not create the project: ${(e as Error).message}`);
    }
  }

  async function duplicate(id: string) {
    const doc = await storage.load(id);
    if (!doc) return;
    const now = new Date().toISOString();
    await storage.save({
      ...doc,
      id: newId('p'),
      name: `${doc.name} copy`,
      pages: doc.pages.map((p) => ({ ...p, nodes: p.nodes.map(cloneWithNewIds) })),
      createdAt: now,
      updatedAt: now,
    });
    refresh();
  }

  async function exportJson(id: string) {
    const doc = await storage.load(id);
    if (doc) downloadJson(doc, `${doc.name.replace(/[^\w-]+/g, '_') || 'project'}.json`);
  }

  async function remove(id: string) {
    await storage.remove(id);
    setConfirmDelete(null);
    refresh();
  }

  async function importFile(file: File) {
    try {
      const doc = migrate(JSON.parse(await file.text()));
      const existing = await storage.load(doc.id);
      if (existing) doc.id = newId('p'); // never overwrite a project silently
      await storage.save(doc);
      refresh();
    } catch (e) {
      setError(`That file could not be imported: ${(e as Error).message}`);
    }
  }

  return (
    <div className="dash">
      <div className="dash-head">
        <Link href="/" className="brand">
          <i />
          {brand.name}
        </Link>
        <div className="grow" />
        <span className="pill">Saved in {storage.label}</span>
        <Link className="btn" href="/help">Help</Link>
        <AccountChip />
        <button className="btn" onClick={() => fileRef.current?.click()}>
          Import project
        </button>
        <input
          ref={fileRef}
          id="import-file"
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importFile(f);
            e.target.value = '';
          }}
        />
      </div>

      <div>
        <h1>Your apps</h1>
        <p className="lede">{brand.tagline}</p>
      </div>

      {sys?.oneDrive && (
        <div className="alert" role="alert">
          <b>Move this folder out of OneDrive.</b> The builder is running from <code>{sys.cwd}</code>. OneDrive locks files while it syncs, which breaks
          downloads and builds. Copy the folder to <code>C:\projects\app-builder</code> and start it from there. <Link href="/help#install">How</Link>
        </div>
      )}

      <section className="howto" aria-label="How it works">
        <div><i>1</i><b>Design</b><span>Create an app, drag widgets onto the phone and link buttons to pages.</span></div>
        <div><i>2</i><b>Preview</b><span>Click Preview and tap through your app like a real phone.</span></div>
        <div><i>3</i><b>Export</b><span>Download a Flutter or React Native project, or save it straight to this computer.</span></div>
        <div><i>4</i><b>Run</b><span>Double-click run_windows.bat in the export. <Link href="/help#run-flutter">Step-by-step guide</Link></span></div>
      </section>

      <LocalImport onDone={refresh} />

      {error && <p className="error">{error}</p>}

      <section className="newbox" aria-label="New project">
        <label className="field">
          <span>New app name</span>
          <input id="new-name" type="text" value={name} placeholder="My app" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && create()} />
        </label>
        <button className="btn primary" onClick={create}>
          Create app
        </button>
        <div className="tpls" role="radiogroup" aria-label="Start from">
          {templates.map((t) => (
            <button key={t.id} role="radio" aria-checked={tpl === t.id} className={`tpl${tpl === t.id ? ' on' : ''}`} onClick={() => setTpl(t.id)}>
              <b>{t.name}</b>
              <span>{t.description}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="lbl">Projects</p>
        {projects === null ? (
          <p className="note">Loading…</p>
        ) : projects.length === 0 ? (
          <div className="empty">No apps yet. Pick a starting point above and click Create app.</div>
        ) : (
          <div className="projects">
            {projects.map((p) => (
              <article className="proj" key={p.id}>
                <h3>
                  <Link href={`/editor/${p.id}`}>{p.name}</Link>
                </h3>
                <div className="meta">
                  {p.pageCount} {p.pageCount === 1 ? 'page' : 'pages'} · edited {new Date(p.updatedAt).toLocaleString()}
                </div>
                <div className="row">
                  <Link className="btn small primary" href={`/editor/${p.id}`}>
                    Open
                  </Link>
                  <button className="btn small" onClick={() => duplicate(p.id)}>
                    Duplicate
                  </button>
                  <button className="btn small" onClick={() => exportJson(p.id)}>
                    Export file
                  </button>
                  {confirmDelete === p.id ? (
                    <>
                      <button className="btn small danger" onClick={() => remove(p.id)}>
                        Confirm delete
                      </button>
                      <button className="btn small" onClick={() => setConfirmDelete(null)}>
                        Keep
                      </button>
                    </>
                  ) : (
                    <button className="btn small danger" onClick={() => setConfirmDelete(p.id)}>
                      Delete
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
