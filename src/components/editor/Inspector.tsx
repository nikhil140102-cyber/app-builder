'use client';
import { useState } from 'react';
import {
  addApi,
  deletePage,
  removeApi,
  updateApi,
  updateBackend,
  deleteSelected,
  duplicatePage,
  duplicateSelected,
  movePage,
  moveNavItem,
  moveSelected,
  setNavEnabled,
  setProp,
  setStartPage,
  toggleNavPage,
  updateApp,
  updateNavItem,
  updatePage,
} from '@/core/actions';
import { LAYOUT_FIELDS } from '@/core/layoutFields';
import { getWidget } from '@/core/registry';
import { currentPage, useEditor } from '@/core/store';
import { findNode } from '@/core/tree';
import type { FieldDef, FieldGroup } from '@/core/types';
import { ORG_PATTERN } from '@/codegen/helpers';
import { FieldControl } from './FieldControl';
import { toRows } from '@/widgets/data';

const GROUP_ORDER: FieldGroup[] = ['Content', 'Search & filter', 'Style', 'Action', 'Layout'];

/** Collapsible inspector section; remembers open/closed per section name. */
function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const key = `app-builder:section:${title}`;
  const [open, setOpen] = useState(() => {
    try {
      const v = localStorage.getItem(key);
      return v === null ? defaultOpen : v === '1';
    } catch {
      return defaultOpen;
    }
  });
  return (
    <details
      className="sect"
      open={open}
      onToggle={(e) => {
        const now = (e.currentTarget as HTMLDetailsElement).open;
        setOpen(now);
        try {
          localStorage.setItem(key, now ? '1' : '0');
        } catch {}
      }}
    >
      <summary>{title}</summary>
      <div className="props">{children}</div>
    </details>
  );
}

function PageSettings() {
  const page = useEditor(currentPage);
  const doc = useEditor((s) => s.doc);
  const [confirm, setConfirm] = useState(false);
  if (!page || !doc) return null;
  const index = doc.pages.findIndex((p) => p.id === page.id);
  return (
    <div className="props">
      <p className="lbl">Page</p>
      <h2 className="selname">{page.name}{index === 0 && <span className="tag">Start page</span>}</h2>
      <Section title="Content">
        <FieldControl id="pg-name" field={{ key: 'name', label: 'Page name', kind: 'text' }} value={page.name} onChange={(v) => updatePage({ name: String(v) }, 'name')} />
        <FieldControl id="pg-appbar" field={{ key: 'showAppBar', label: 'Show top bar', kind: 'boolean' }} value={page.showAppBar} onChange={(v) => updatePage({ showAppBar: v === true })} />
        {page.showAppBar && (
          <FieldControl id="pg-title" field={{ key: 'title', label: 'Top bar title', kind: 'text' }} value={page.title} onChange={(v) => updatePage({ title: String(v) }, 'title')} />
        )}
        <FieldControl
          id="pg-login"
          field={{ key: 'requiresLogin', label: 'Members only (users must sign in)', kind: 'boolean', help: 'Signed-out users see the login page chosen under App → Backend.' }}
          value={page.requiresLogin}
          onChange={(v) => updatePage({ requiresLogin: v === true })}
        />
      </Section>
      <Section title="Style">
        <FieldControl id="pg-bg" field={{ key: 'background', label: 'Background', kind: 'color' }} value={page.background} onChange={(v) => updatePage({ background: String(v) }, 'bg')} />
      </Section>
      <Section title="Page order">
        <div className="actions">
          <button className="btn" onClick={() => movePage(-1)} disabled={index <= 0}>↑ Move up</button>
          <button className="btn" onClick={() => movePage(1)} disabled={index >= doc.pages.length - 1}>↓ Move down</button>
          {index > 0 && <button className="btn" onClick={setStartPage}>Make start page</button>}
        </div>
        <div className="actions">
          <button className="btn" onClick={duplicatePage}>Duplicate page</button>
          {doc.pages.length > 1 &&
            (confirm ? (
              <>
                <button className="btn danger" onClick={() => { deletePage(); setConfirm(false); }}>Confirm delete</button>
                <button className="btn" onClick={() => setConfirm(false)}>Keep</button>
              </>
            ) : (
              <button className="btn danger" onClick={() => setConfirm(true)}>Delete page</button>
            ))}
        </div>
      </Section>
      <p className="note">Select a widget on the phone to edit it. Right-click a widget for more options.</p>
    </div>
  );
}

function WidgetSettings({ id }: { id: string }) {
  const page = useEditor(currentPage);
  const hit = page ? findNode(page.nodes, id) : null;
  if (!hit) return null;
  const def = getWidget(hit.node.type);
  if (!def) return <p className="note">This widget type is not installed.</p>;
  const props = hit.node.props;
  const all: FieldDef[] = [...def.fields, ...LAYOUT_FIELDS];
  const visible = all.filter((f) => !f.showIf || f.showIf(props));
  return (
    <div className="props">
      <p className="lbl">Selected</p>
      <h2 className="selname">{def.label}</h2>
      {GROUP_ORDER.map((g) => {
        const fields = visible.filter((f) => (f.group ?? 'Content') === g);
        if (!fields.length) return null;
        return (
          <Section key={g} title={g} defaultOpen={g !== 'Layout'}>
            {fields.map((f) => (
              <FieldControl key={f.key} id={`p-${f.key}`} field={f} value={props[f.key]} onChange={(v) => setProp(id, f.key, v)} />
            ))}
          </Section>
        );
      })}
      <div className="actions">
        <button className="btn" aria-label="Move up" title="Move up (Alt+↑)" onClick={() => moveSelected(-1)}>↑</button>
        <button className="btn" aria-label="Move down" title="Move down (Alt+↓)" onClick={() => moveSelected(1)}>↓</button>
        <button className="btn" onClick={duplicateSelected} title="Ctrl+D">Duplicate</button>
        <button className="btn danger" onClick={deleteSelected} title="Delete key">Delete</button>
      </div>
    </div>
  );
}

function NavSettings() {
  const doc = useEditor((s) => s.doc);
  if (!doc) return null;
  const nav = doc.nav;
  return (
    <Section title="Bottom navigation" defaultOpen={nav.enabled}>
      <label className="check">
        <input id="nav-on" type="checkbox" checked={nav.enabled} onChange={(e) => setNavEnabled(e.target.checked)} />
        Show a bottom navigation bar
      </label>
      {nav.enabled && (
        <>
          <p className="hint">Tick the pages that appear as tabs. 3–5 tabs work best.</p>
          {doc.pages.map((p) => {
            const it = nav.items.find((x) => x.pageId === p.id);
            const i = nav.items.findIndex((x) => x.pageId === p.id);
            return (
              <div key={p.id} className={`navrow${it ? ' on' : ''}`}>
                <label className="check">
                  <input id={`nav-${p.id}`} type="checkbox" checked={!!it} onChange={(e) => toggleNavPage(p.id, e.target.checked)} />
                  {p.name}
                </label>
                {it && (
                  <div className="navedit">
                    <FieldControl id={`navlabel-${p.id}`} field={{ key: 'label', label: 'Tab label', kind: 'text' }} value={it.label} onChange={(v) => updateNavItem(p.id, { label: String(v) })} />
                    <FieldControl id={`navicon-${p.id}`} field={{ key: 'icon', label: 'Tab icon', kind: 'icon' }} value={it.icon} onChange={(v) => updateNavItem(p.id, { icon: String(v) })} />
                    <div className="actions">
                      <button className="btn small" disabled={i <= 0} onClick={() => moveNavItem(p.id, -1)}>← Earlier</button>
                      <button className="btn small" disabled={i >= nav.items.length - 1} onClick={() => moveNavItem(p.id, 1)}>Later →</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </Section>
  );
}

function BackendSettings() {
  const doc = useEditor((s) => s.doc);
  if (!doc) return null;
  const b = doc.backend;
  return (
    <Section title="Backend (sign-in & database)" defaultOpen={b.provider !== 'none'}>
      <FieldControl
        id="be-provider"
        field={{ key: 'provider', label: 'Backend for this app', kind: 'select', options: ['none', 'supabase', 'firebase'], optionLabels: ['None', 'Supabase', 'Firebase'] }}
        value={b.provider}
        onChange={(v) => updateBackend({ provider: v as typeof b.provider })}
      />
      {b.provider === 'supabase' && (
        <>
          <p className="hint">Use the Supabase project for <b>this app</b> (it can be a new project). Supabase → Project Settings → API Keys.</p>
          <FieldControl id="be-url" field={{ key: 'supabaseUrl', label: 'Project URL', kind: 'text', help: 'https://xxxx.supabase.co' }} value={b.supabaseUrl} onChange={(v) => updateBackend({ supabaseUrl: String(v).trim() }, 'url')} />
          <FieldControl id="be-key" field={{ key: 'supabaseKey', label: 'Publishable key', kind: 'text', help: 'Starts with sb_publishable_ (or the anon public key). Never the secret key.' }} value={b.supabaseKey} onChange={(v) => updateBackend({ supabaseKey: String(v).trim() }, 'key')} />
          {/secret|service_role/i.test(b.supabaseKey) && <p className="error" style={{ margin: 0 }}>This looks like a secret key. Use the publishable key instead.</p>}
        </>
      )}
      {b.provider === 'firebase' && (
        <>
          <p className="hint">Firebase console → Project settings → General → Project ID. The export connects to it with “flutterfire configure”.</p>
          <FieldControl id="be-fb" field={{ key: 'firebaseProjectId', label: 'Firebase project ID', kind: 'text', help: 'For example my-app-1a2b3' }} value={b.firebaseProjectId} onChange={(v) => updateBackend({ firebaseProjectId: String(v).trim() }, 'fb')} />
        </>
      )}
      {b.provider !== 'none' && (
        <label className="field">
          <span>Login page</span>
          <select id="be-login" value={b.loginPageId} onChange={(e) => updateBackend({ loginPageId: e.target.value })}>
            <option value="">Choose the page with the Sign in button</option>
            {doc.pages
              .filter((p) => !p.requiresLogin)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
          <small>Shown to signed-out users who open a members-only page.</small>
        </label>
      )}
    </Section>
  );
}

function ApiTester({ url, listPath }: { url: string; listPath: string }) {
  const [state, setState] = useState<{ busy: boolean; text: string; ok: boolean } | null>(null);
  async function test() {
    setState({ busy: true, text: 'Testing…', ok: true });
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`The API answered ${res.status}.`);
      const json = await res.json();
      const rows = toRows(json, listPath);
      if (!rows.length) {
        const arrays = json && typeof json === 'object' && !Array.isArray(json) ? Object.keys(json).filter((k) => Array.isArray((json as Record<string, unknown>)[k])) : [];
        setState({ busy: false, ok: false, text: arrays.length ? `No list found at "${listPath || '(top level)'}". Try list path: ${arrays.join(' or ')}` : `No list found at "${listPath || '(top level)'}".` });
        return;
      }
      const fields = Object.keys(rows[0]).slice(0, 12).map((k) => `{{${k}}}`);
      setState({ busy: false, ok: true, text: `Works: ${rows.length} rows. Fields you can use: ${fields.join(' ')}` });
    } catch (e) {
      const msg = (e as Error).message;
      setState({
        busy: false,
        ok: false,
        text: /failed to fetch|networkerror|load failed/i.test(msg)
          ? 'The browser could not read this API (it may block websites from calling it). It can still work in the phone app.'
          : msg,
      });
    }
  }
  return (
    <>
      <button className="btn small" onClick={test} disabled={state?.busy || !/^https?:\/\/.+/.test(url)}>Test this API</button>
      {state && <p className={state.ok ? 'okmsg' : 'error'} style={{ margin: 0, fontSize: 12.5, overflowWrap: 'anywhere' }}>{state.text}</p>}
    </>
  );
}

function ApiSettings() {
  const apis = useEditor((s) => s.doc?.apis ?? []);
  return (
    <Section title="APIs" defaultOpen={apis.length > 0}>
      <p className="hint">Web addresses that return JSON. Use them in a Data list, or send a form to them.</p>
      {apis.map((a) => (
        <div key={a.id} className="navrow on">
          <FieldControl id={`api-name-${a.id}`} field={{ key: 'name', label: 'Name', kind: 'text' }} value={a.name} onChange={(v) => updateApi(a.id, { name: String(v) })} />
          <FieldControl id={`api-url-${a.id}`} field={{ key: 'url', label: 'URL', kind: 'text' }} value={a.url} onChange={(v) => updateApi(a.id, { url: String(v).trim() })} />
          <FieldControl
            id={`api-path-${a.id}`}
            field={{ key: 'listPath', label: 'List path (optional)', kind: 'text', help: 'Where the list is in the reply, e.g. data.items. Leave empty if the reply is a list.' }}
            value={a.listPath}
            onChange={(v) => updateApi(a.id, { listPath: String(v).trim() })}
          />
          <div className="actions">
            <ApiTester url={a.url} listPath={a.listPath} />
            <button className="btn small danger" onClick={() => removeApi(a.id)}>Remove</button>
          </div>
        </div>
      ))}
      <button className="btn" onClick={addApi}>+ Add API</button>
    </Section>
  );
}

function AppSettings() {
  const doc = useEditor((s) => s.doc);
  if (!doc) return null;
  return (
    <section className="props">
      <p className="lbl">App</p>
      <Section title="App details" defaultOpen={false}>
        <FieldControl id="app-name" field={{ key: 'name', label: 'App name', kind: 'text' }} value={doc.name} onChange={(v) => updateApp({ name: String(v) })} />
        <FieldControl id="app-primary" field={{ key: 'primary', label: 'Brand colour (theme seed)', kind: 'color' }} value={doc.theme.primary} onChange={(v) => updateApp({ primary: String(v) })} />
        <FieldControl
          id="app-org"
          field={{ key: 'org', label: 'App ID prefix', kind: 'text', help: 'Your reversed domain, e.g. com.yourcompany. Used for the Play Store / App Store id. Set it before the first export.' }}
          value={doc.org}
          onChange={(v) => updateApp({ org: String(v).trim().toLowerCase() })}
        />
        {doc.org && !ORG_PATTERN.test(doc.org) && <p className="error" style={{ margin: 0, fontSize: 12 }}>Use lowercase words separated by dots, like com.yourcompany.</p>}
      </Section>
      <NavSettings />
      <BackendSettings />
      <ApiSettings />
    </section>
  );
}

export function Inspector() {
  const selectedId = useEditor((s) => s.selectedId);
  const mode = useEditor((s) => s.mode);
  return (
    <aside className="side right">
      {mode === 'preview' ? (
        <p className="note">Preview mode: tap buttons and tabs on the phone to try your app. Press Esc or Stop preview to keep editing.</p>
      ) : selectedId ? (
        <WidgetSettings id={selectedId} />
      ) : (
        <PageSettings />
      )}
      {mode === 'edit' && <AppSettings />}
    </aside>
  );
}
