'use client';
import { useEffect, useRef, useState } from 'react';
import { QrCode } from '@/components/QrCode';
import { slug } from '@/codegen/helpers';
import {
  enablePages,
  ensureRepo,
  getRepo,
  getToken,
  latestRelease,
  latestRun,
  pushFiles,
  rerunBuild,
  setToken,
  verifyToken,
  type BuildRun,
  type GitHubUser,
} from '@/core/github';
import { useEditor } from '@/core/store';
import type { AppDoc, GeneratedFile } from '@/core/types';

type Step = 'idle' | 'upload' | 'build' | 'done' | 'failed';

const TOKEN_URL = 'https://github.com/settings/tokens/new?scopes=repo,workflow&description=App%20Builder%20cloud%20builds';

/**
 * Pushes the Flutter export to GitHub; GitHub Actions builds an Android APK
 * (published as a Release) and the website (GitHub Pages).
 */
export function CloudBuild({ doc, files }: { doc: AppDoc; files: GeneratedFile[] }) {
  const [token, setTok] = useState('');
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [warning, setWarning] = useState('');
  const [draft, setDraft] = useState('');
  const [repo, setRepo] = useState(doc.github.repo);
  const [isPrivate, setIsPrivate] = useState(false);
  const [step, setStep] = useState<Step>('idle');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [run, setRun] = useState<BuildRun | null>(null);
  const [release, setRelease] = useState<{ html_url: string; apk?: string; tag: string } | null>(null);
  const [webUrl, setWebUrl] = useState(doc.github.webUrl);
  const [repoUrl, setRepoUrl] = useState('');
  const poll = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = getToken();
    setTok(t);
    if (t) verifyToken(t).then(
      (r) => {
        setUser(r.user);
        setWarning(r.warning);
        setRepo((cur) => cur || `${r.user.login}/${slug(doc.name)}`);
      },
      () => setUser(null),
    );
    return () => {
      if (poll.current) clearTimeout(poll.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When reopening, show the last build of a repo that was used before.
  useEffect(() => {
    if (user && doc.github.repo && step === 'idle') watch(doc.github.repo, '', true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function connect() {
    setError('');
    try {
      const r = await verifyToken(draft);
      setToken(draft);
      setTok(draft.trim());
      setUser(r.user);
      setWarning(r.warning);
      setRepo((cur) => cur || `${r.user.login}/${slug(doc.name)}`);
      setDraft('');
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function disconnect() {
    setToken('');
    setTok('');
    setUser(null);
  }

  function saveGitHub(patch: Partial<AppDoc['github']>) {
    useEditor.getState().update((d) => {
      d.github = { ...d.github, ...patch };
    });
  }

  function watch(fullName: string, sha: string, quiet = false) {
    if (poll.current) clearTimeout(poll.current);
    const started = Date.now();
    const tick = async () => {
      try {
        const r = await latestRun(fullName);
        if (r && (!sha || r.head_sha === sha)) {
          setRun(r);
          if (r.status === 'completed') {
            if (r.conclusion === 'success') {
              setRelease(await latestRelease(fullName));
              setStep('done');
            } else {
              setStep(quiet ? 'idle' : 'failed');
            }
            return;
          }
          setStep('build');
        } else if (quiet) {
          return;
        }
      } catch (e) {
        if (!quiet) setError((e as Error).message);
        return;
      }
      if (Date.now() - started < 40 * 60 * 1000) poll.current = setTimeout(tick, 10000);
    };
    tick();
  }

  async function build() {
    setError('');
    setNote('');
    setRelease(null);
    setRun(null);
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) return setError('Repository must look like owner/name, for example nikhil/desi-store.');
    setStep('upload');
    try {
      const r = await ensureRepo(repo, isPrivate, `${doc.name} — built with App Builder`);
      setRepoUrl(r.html_url);
      const pushed = await pushFiles(r, files, `Update ${doc.name} from App Builder`);
      const pages = await enablePages(r);
      if (pages.note) setNote(pages.note);
      setWebUrl(pages.url);
      saveGitHub({ repo: r.full_name, webUrl: pages.url });
      setStep('build');
      if (pushed.changed === 0) {
        await rerunBuild(r.full_name).catch(() => undefined);
        watch(r.full_name, '');
      } else {
        watch(r.full_name, pushed.sha);
      }
    } catch (e) {
      setError((e as Error).message);
      setStep('failed');
    }
  }

  useEffect(() => {
    if (doc.github.repo && !repoUrl && user) getRepo(doc.github.repo).then((r) => setRepoUrl(r.html_url), () => undefined);
  }, [doc.github.repo, repoUrl, user]);

  if (!token || !user) {
    return (
      <div className="steps cloud">
        <p style={{ marginTop: 0 }}>
          Build an installable Android app and a website <b>without installing Flutter</b>. Your app is uploaded to your GitHub account and GitHub builds it for free (about 2,000 build minutes a month on the free plan).
        </p>
        <ol>
          <li>
            Create a GitHub token: <a href={TOKEN_URL} target="_blank" rel="noreferrer">open GitHub token page</a>. Keep the ticked scopes <b>repo</b> and <b>workflow</b>, choose an expiry, click <b>Generate token</b> and copy it.
          </li>
          <li>
            Paste it here:
            <div className="formrow" style={{ marginTop: 6 }}>
              <input id="gh-token" type="password" placeholder="ghp_…" value={draft} onChange={(e) => setDraft(e.target.value)} autoComplete="off" />
              <button className="btn primary" onClick={connect} disabled={draft.trim().length < 20}>Connect GitHub</button>
            </div>
          </li>
        </ol>
        <p className="note">The token stays in this browser only and is sent only to GitHub. Disconnect any time.</p>
        {error && <p className="error" role="alert">{error}</p>}
      </div>
    );
  }

  const steps: { key: Step; label: string; detail?: React.ReactNode }[] = [
    { key: 'upload', label: 'Upload the app to GitHub', detail: repoUrl && <a href={repoUrl} target="_blank" rel="noreferrer">{repo}</a> },
    {
      key: 'build',
      label: 'Build on GitHub (about 6–10 minutes)',
      detail: run && (
        <a href={run.html_url} target="_blank" rel="noreferrer">
          {run.status === 'completed' ? `Finished: ${run.conclusion}` : run.status === 'queued' ? 'Waiting to start…' : 'Building…'} · view log
        </a>
      ),
    },
    { key: 'done', label: 'Downloads ready' },
  ];
  const order: Step[] = ['upload', 'build', 'done'];
  const stateOf = (k: Step) => {
    if (step === 'failed') return order.indexOf(k) < order.indexOf(run ? 'build' : 'upload') ? 'done' : order.indexOf(k) === order.indexOf(run ? 'build' : 'upload') ? 'fail' : '';
    const cur = order.indexOf(step);
    const i = order.indexOf(k);
    if (step === 'done' || i < cur) return 'done';
    return i === cur ? 'run' : '';
  };

  return (
    <div className="steps cloud">
      <div className="dash-head" style={{ gap: 8 }}>
        <span>
          Connected to GitHub as <b>@{user.login}</b>
        </span>
        <div className="grow" />
        <button className="btn small" onClick={disconnect}>Disconnect</button>
      </div>
      {warning && <p className="error" style={{ marginTop: 0 }}>{warning}</p>}

      <div className="formrow" style={{ gridTemplateColumns: 'minmax(0, 1fr) 190px', marginBottom: 6 }}>
        <label className="field">
          <span>Repository (owner/name)</span>
          <input id="gh-repo" type="text" value={repo} onChange={(e) => setRepo(e.target.value.trim())} />
        </label>
        <label className="field">
          <span>If it is new, make it</span>
          <select id="gh-vis" value={isPrivate ? 'private' : 'public'} onChange={(e) => setIsPrivate(e.target.value === 'private')}>
            <option value="public">Public (free website)</option>
            <option value="private">Private (APK only on free plan)</option>
          </select>
        </label>
      </div>
      <p className="note" style={{ marginTop: 0 }}>
        Each build uploads the latest design. Files you edited on GitHub (like pubspec.yaml) are kept.
        {doc.backend.provider === 'firebase' && ' Firebase apps: upload lib/firebase_options.dart to the repository once (run run_windows.bat on your computer to create it).'}
      </p>
      <button className="btn primary big" onClick={build} disabled={step === 'upload' || step === 'build'}>
        {step === 'upload' ? 'Uploading…' : step === 'build' ? 'Building…' : 'Build in the cloud'}
      </button>

      {step !== 'idle' && (
        <ul className="steps-list" style={{ marginTop: 16 }}>
          {steps.map((s, i) => (
            <li key={s.key} className={stateOf(s.key)}>
              <span className="dot">{stateOf(s.key) === 'done' ? '✓' : stateOf(s.key) === 'fail' ? '!' : i + 1}</span>
              <span>
                {s.label}
                {s.detail && <> — {s.detail}</>}
              </span>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="error" role="alert">{error}</p>}
      {step === 'failed' && run && (
        <p className="error">The build failed. Open the build log link above: the Summary page shows the error in a box under “The build failed”. Copy that box and send it for help. Common causes are in docs/CLOUD_BUILDS.md.</p>
      )}
      {note && <p className="note">{note}</p>}

      {step === 'done' && (
        <div className="sharegrid" style={{ marginTop: 16 }}>
          {(release?.apk || webUrl) && <QrCode value={release?.apk && !isPrivate ? release.apk : webUrl || release?.html_url || ''} size={150} label="QR code to open the build on a phone" />}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <b>Your app is built</b>
            {release?.apk && (
              <a className="btn primary" href={release.apk} target="_blank" rel="noreferrer">Download Android app (APK)</a>
            )}
            {release && <a href={release.html_url} target="_blank" rel="noreferrer">All builds ({release.tag})</a>}
            {webUrl ? (
              <a href={webUrl} target="_blank" rel="noreferrer">Open the website: {webUrl}</a>
            ) : (
              <span className="note">No website for this repository (needs a public repository on the free plan).</span>
            )}
            <span className="note">On an Android phone, open the APK link and allow “Install unknown apps” when asked.</span>
          </div>
        </div>
      )}
    </div>
  );
}
