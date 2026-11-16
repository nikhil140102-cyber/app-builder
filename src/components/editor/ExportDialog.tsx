'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { checkProject } from '@/codegen/checks';
import { flutterPackageName, generateFlutter } from '@/codegen/flutter';
import { generateReactNative, rnFolderName } from '@/codegen/reactNative';
import { cleanOrg } from '@/codegen/helpers';
import { useEditor } from '@/core/store';
import type { AppDoc } from '@/core/types';
import { downloadJson, downloadZip } from '@/utils/download';
import { useSystemInfo } from '@/utils/system';
import { CloudBuild } from './CloudBuild';

type Target = 'flutter' | 'rn';
type Tab = 'steps' | 'checks' | 'cloud' | 'code';

function CopyLine({ text }: { text: string }) {
  const [label, setLabel] = useState('Copy');
  return (
    <div className="cmd">
      <code>{text}</code>
      <button
        className="btn small"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setLabel('Copied');
          } catch {
            setLabel('Select it');
          }
          setTimeout(() => setLabel('Copy'), 1400);
        }}
      >
        {label}
      </button>
    </div>
  );
}

export function ExportDialog({ doc, onClose }: { doc: AppDoc; onClose: () => void }) {
  const [target, setTarget] = useState<Target>('flutter');
  const [tab, setTab] = useState<Tab>('steps');
  const files = useMemo(() => (target === 'flutter' ? generateFlutter(doc) : generateReactNative(doc)), [doc, target]);
  const checks = useMemo(() => checkProject(doc), [doc]);
  const sys = useSystemInfo();
  const folder = target === 'flutter' ? flutterPackageName(doc) : rnFolderName(doc);
  const zipName = `${folder}-${target === 'flutter' ? 'flutter' : 'react-native'}.zip`;
  const [path, setPath] = useState(files[0]?.path);
  const [busy, setBusy] = useState<'' | 'zip' | 'save'>('');
  const [error, setError] = useState('');
  const [savedTo, setSavedTo] = useState('');
  const current = files.find((f) => f.path === path) ?? files[0];
  const errors = checks.filter((c) => c.level === 'error').length;
  const warnings = checks.filter((c) => c.level === 'warning').length;

  useEffect(() => {
    setPath(files.find((f) => f.path.endsWith('main.dart') || f.path === 'App.js')?.path ?? files[0]?.path);
    setSavedTo('');
  }, [files]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function zip() {
    setBusy('zip');
    setError('');
    try {
      await downloadZip(files, folder, zipName);
    } catch (e) {
      setError(`The ZIP could not be created: ${(e as Error).message}. Reload the page and try again.`);
    } finally {
      setBusy('');
    }
  }

  async function saveToFolder() {
    setBusy('save');
    setError('');
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ target: target === 'flutter' ? 'flutter' : 'react-native', folder, files }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Server returned ${res.status}`);
      setSavedTo(data.dir);
      setTab('steps');
    } catch (e) {
      setError(`Could not save to the folder: ${(e as Error).message}`);
    } finally {
      setBusy('');
    }
  }

  const appDir = savedTo || `C:\\projects\\apps\\${folder}`;
  const isWin = !sys || sys.platform === 'win32';

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Export app">
        <header>
          <h2>Export app</h2>
          <div className="seg" role="tablist" aria-label="Platform">
            <button className={`btn${target === 'flutter' ? ' on' : ''}`} onClick={() => setTarget('flutter')}>Flutter</button>
            <button className={`btn${target === 'rn' ? ' on' : ''}`} onClick={() => setTarget('rn')}>React Native (Expo)</button>
          </div>
          <div className="grow" />
          {sys?.canSaveToFolder && (
            <button className="btn" onClick={saveToFolder} disabled={!!busy} title={`Writes the project into ${sys.exportDir}`}>
              {busy === 'save' ? 'Saving…' : 'Save to my computer'}
            </button>
          )}
          <button className="btn primary" onClick={zip} disabled={!!busy}>{busy === 'zip' ? 'Preparing…' : 'Download ZIP'}</button>
          <button className="btn" onClick={onClose} aria-label="Close">Close</button>
        </header>

        <nav className="tabs" aria-label="Export sections">
          <button className={tab === 'steps' ? 'cur' : ''} onClick={() => setTab('steps')}>How to run</button>
          <button className={tab === 'checks' ? 'cur' : ''} onClick={() => setTab('checks')}>
            Checks {errors + warnings > 0 ? <span className={`count${errors ? ' bad' : ''}`}>{errors + warnings}</span> : <span className="count ok">✓</span>}
          </button>
          <button className={tab === 'cloud' ? 'cur' : ''} onClick={() => setTab('cloud')}>☁ Cloud build &amp; publish</button>
          <button className={tab === 'code' ? 'cur' : ''} onClick={() => setTab('code')}>Code ({files.length} files)</button>
        </nav>

        {error && <p className="error banner" role="alert">{error}</p>}

        {tab === 'steps' && (
          <div className="steps">
            {savedTo && (
              <div className="saved" role="status">
                <b>Saved.</b> Your project is in:
                <CopyLine text={savedTo} />
                Open that folder in Android Studio or VS Code, or follow the steps below. Saving again updates the pages and keeps your platform folders.
              </div>
            )}
            {target === 'flutter' ? (
              <ol>
                <li>
                  <b>Get the project.</b>{' '}
                  {savedTo ? 'Done — it is saved on this computer.' : <>Click <b>Download ZIP</b> and unzip <code>{zipName}</code> to a folder outside OneDrive, for example <code>C:\projects\apps</code>.</>}
                </li>
                <li>
                  <b>Start your phone emulator.</b> Android Studio → Device Manager → ▶. Wait for the home screen. (Or skip this and choose Chrome.)
                </li>
                <li>
                  <b>Run it.</b> {isWin ? <>Double-click <code>run_windows.bat</code> in the project folder.</> : <>In Terminal, run <code>./run_mac_linux.sh</code> inside the project folder.</>} It sets up the project, runs the automatic checks and starts the app.
                </li>
                <li>
                  <b>Or use commands</b> in PowerShell:
                  <CopyLine text={`cd ${appDir}`} />
                  <CopyLine text={`flutter create --org ${cleanOrg(doc.org ?? '')} --project-name ${folder} --platforms android,ios,web .`} />
                  <CopyLine text="flutter pub get" />
                  <CopyLine text="flutter test" />
                  <CopyLine text="flutter run" />
                </li>
                <li>
                  <b>Or use Android Studio:</b> File → Open → the project folder → <i>Pub get</i> → pick the emulator → ▶ Run.
                </li>
              </ol>
            ) : (
              <ol>
                <li>
                  <b>Get the project.</b>{' '}
                  {savedTo ? 'Done — it is saved on this computer.' : <>Click <b>Download ZIP</b> and unzip <code>{zipName}</code> outside OneDrive.</>}
                </li>
                <li><b>Install Expo Go</b> on your phone from the Play Store or App Store.</li>
                <li>
                  <b>Run it.</b> {isWin ? <>Double-click <code>run_windows.bat</code>.</> : <>Run <code>./run_mac_linux.sh</code>.</>} Then scan the QR code with Expo Go.
                </li>
                <li>
                  <b>Or use commands:</b>
                  <CopyLine text={`cd ${savedTo || `C:\\projects\\apps\\${folder}`}`} />
                  <CopyLine text="npm run setup" />
                  <CopyLine text="npx expo start" />
                </li>
              </ol>
            )}
            <p className="note">
              Every export includes <code>HOW_TO_RUN.md</code> with installation steps and fixes for common problems. More help: <Link href="/help" target="_blank">Help &amp; setup guide</Link>.
            </p>
            {sys?.oneDrive && (
              <p className="error">This builder is running inside a OneDrive folder. Move it to a local folder such as C:\projects to avoid build and download errors.</p>
            )}
          </div>
        )}

        {tab === 'checks' && (
          <div className="steps">
            {checks.length === 0 ? (
              <p>Everything looks good. No problems found.</p>
            ) : (
              <ul className="checks">
                {checks.map((c, i) => (
                  <li key={i} className={c.level}>
                    <span className="lvl">{c.level === 'error' ? 'Problem' : c.level === 'warning' ? 'Check' : 'Tip'}</span>
                    <span>{c.message}</span>
                    {c.pageId && (
                      <button
                        className="btn small"
                        onClick={() => {
                          useEditor.getState().setPage(c.pageId!);
                          onClose();
                        }}
                      >
                        Go to page
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <p className="note">You can still export with warnings. Problems marked “Problem” should be fixed first.</p>
          </div>
        )}

        {tab === 'cloud' &&
          (target === 'flutter' ? (
            <CloudBuild doc={doc} files={files} />
          ) : (
            <div className="steps">
              <p>Cloud builds are available for the Flutter export. Switch to <b>Flutter</b> at the top to build an Android app and a website on GitHub.</p>
            </div>
          ))}

        {tab === 'code' && (
          <div className="body">
            <nav className="files" aria-label="Generated files">
              {files.map((f) => (
                <button key={f.path} className={f.path === current?.path ? 'cur' : ''} onClick={() => setPath(f.path)}>
                  {f.path}
                </button>
              ))}
            </nav>
            <div className="codewrap">
              <CopyLine text={current?.path ?? ''} />
              <pre tabIndex={0}>{current?.content}</pre>
            </div>
          </div>
        )}

        <footer className="sheet-foot">
          <button className="btn small" onClick={() => downloadJson(doc, `${folder}.json`)}>Download project file (.json)</button>
          <span className="note">Keep this as a backup. Import it on the dashboard to open the design again.</span>
        </footer>
      </div>
    </div>
  );
}
