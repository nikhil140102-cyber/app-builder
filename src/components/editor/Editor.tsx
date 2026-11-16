'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { AccountChip } from '@/components/AuthGate';
import { brand } from '@/config/brand';
import { copySelected, cutSelected, deleteSelected, duplicateSelected, moveSelected, paste } from '@/core/actions';
import { storage } from '@/core/storage';
import { useEditor } from '@/core/store';
import { Canvas } from './Canvas';
import { ContextMenu } from './ContextMenu';
import { ExportDialog } from './ExportDialog';
import { ShareDialog } from './ShareDialog';
import { publishPreview } from '@/core/previews';
import { Inspector } from './Inspector';
import { LeftPanel } from './LeftPanel';

type SaveState = 'saved' | 'saving' | 'error';

function useAutosave(): SaveState {
  const doc = useEditor((s) => s.doc);
  const [state, setState] = useState<SaveState>('saved');
  const first = useRef(true);
  useEffect(() => {
    if (!doc) return;
    if (first.current) {
      first.current = false;
      return;
    }
    setState('saving');
    const t = setTimeout(() => {
      storage.save(doc).then(
        () => {
          setState('saved');
          // Keep the live preview link in step with the design.
          if (doc.share?.enabled) publishPreview(doc).catch(() => undefined);
        },
        () => setState('error'),
      );
    }, 500);
    return () => clearTimeout(t);
  }, [doc]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (state !== 'saved') e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [state]);
  return state;
}

export function Editor() {
  const doc = useEditor((s) => s.doc);
  const mode = useEditor((s) => s.mode);
  const canUndo = useEditor((s) => s.past.length > 0);
  const canRedo = useEditor((s) => s.future.length > 0);
  const [exporting, setExporting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const save = useAutosave();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      const typing = !!el && (/INPUT|TEXTAREA|SELECT/.test(el.tagName) || el.isContentEditable);
      const st = useEditor.getState();
      if (e.key === 'Escape' && !exporting && !sharing) {
        if (st.mode === 'preview') st.setMode('edit');
        else st.select(null);
        return;
      }
      if (typing) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) st.redo();
        else st.undo();
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        st.redo();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && st.selectedId && st.mode === 'edit') {
        e.preventDefault();
        deleteSelected();
      } else if (st.mode !== 'edit') {
        return;
      } else if (mod && e.key.toLowerCase() === 'c' && st.selectedId) {
        e.preventDefault();
        copySelected();
      } else if (mod && e.key.toLowerCase() === 'x' && st.selectedId) {
        e.preventDefault();
        cutSelected();
      } else if (mod && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        paste();
      } else if (mod && e.key.toLowerCase() === 'd' && st.selectedId) {
        e.preventDefault();
        duplicateSelected();
      } else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && st.selectedId) {
        e.preventDefault();
        moveSelected(e.key === 'ArrowUp' ? -1 : 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [exporting, sharing]);

  if (!doc) return null;
  const saveText = save === 'saving' ? 'Saving…' : save === 'error' ? (storage.label === 'your account' ? 'Not saved — check your internet or sign in again' : 'Not saved — check the server') : `Saved in ${storage.label}`;

  return (
    <div className="ed">
      <header className="top">
        <Link href="/" className="brand" title="All projects">
          <i />
          {brand.name}
        </Link>
        <span className="pill">{doc.name}</span>
        <div className="grow" />
        <span className={`save${save === 'error' ? ' error' : ''}`} aria-live="polite">{saveText}</span>
        <button className="btn" disabled={!canUndo} onClick={() => useEditor.getState().undo()} title="Undo (Ctrl+Z)">↶ Undo</button>
        <button className="btn" disabled={!canRedo} onClick={() => useEditor.getState().redo()} title="Redo (Ctrl+Shift+Z)">↷ Redo</button>
        <button className={`btn${mode === 'preview' ? ' on' : ''}`} onClick={() => useEditor.getState().setMode(mode === 'preview' ? 'edit' : 'preview')}>
          {mode === 'preview' ? '■ Stop preview' : '▶ Preview'}
        </button>
        <button className="btn" onClick={() => setSharing(true)} title="Open this app on your phone with a QR code">📱 On phone</button>
        <Link className="btn" href="/help" target="_blank" title="How to use the builder and run your app">Help</Link>
        <button className="btn primary" onClick={() => setExporting(true)}>Export app</button>
        <AccountChip />
      </header>
      <div className="main">
        <LeftPanel />
        <Canvas />
        <Inspector />
      </div>
      {exporting && <ExportDialog doc={doc} onClose={() => setExporting(false)} />}
      {sharing && <ShareDialog onClose={() => setSharing(false)} />}
      <ContextMenu />
    </div>
  );
}
