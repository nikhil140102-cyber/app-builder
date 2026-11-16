'use client';
import { useEffect, useState } from 'react';
import { addPage, addWidget } from '@/core/actions';
import { useDnd } from '@/core/dnd';
import { widgetsByCategory } from '@/core/registry';
import { currentPage, useEditor } from '@/core/store';
import { nodeSummary } from '@/core/tree';
import type { WidgetNode } from '@/core/types';
import { slug } from '@/codegen/helpers';

const TIPS_KEY = 'app-builder:tips-dismissed';

function Tips() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      setShow(localStorage.getItem(TIPS_KEY) !== '1');
    } catch {
      setShow(true);
    }
  }, []);
  if (!show) return null;
  return (
    <section className="tips" aria-label="Getting started tips">
      <b>Quick start</b>
      <ol>
        <li>Drag a widget onto the phone.</li>
        <li>Click it to change text, colours and spacing on the right.</li>
        <li>Select a button → <i>When tapped</i> → <i>Go to a page</i>.</li>
        <li>Right-click a widget to copy, wrap or delete it.</li>
        <li>Press <b>Preview</b> to try the app, then <b>Export app</b>.</li>
      </ol>
      <button
        className="btn small"
        onClick={() => {
          setShow(false);
          try {
            localStorage.setItem(TIPS_KEY, '1');
          } catch {}
        }}
      >
        Got it
      </button>
    </section>
  );
}

function Palette() {
  const mode = useEditor((s) => s.mode);
  const [q, setQ] = useState('');
  const groups = widgetsByCategory()
    .map(([cat, list]) => [cat, list.filter((w) => !q || w.label.toLowerCase().includes(q.toLowerCase()) || cat.toLowerCase().includes(q.toLowerCase()))] as const)
    .filter(([, list]) => list.length);
  return (
    <section>
      <p className="lbl">Widgets</p>
      <input id="widget-search" className="search" type="search" placeholder="Search widgets" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search widgets" />
      {!groups.length && <p className="note">No widget matches “{q}”.</p>}
      {groups.map(([cat, list]) => (
        <div key={cat}>
          <p className="palcat">{cat}</p>
          <div className="palette">
            {list.map((w) => (
              <button
                key={w.type}
                className="pal"
                draggable
                disabled={mode !== 'edit'}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', w.type);
                  e.dataTransfer.effectAllowed = 'copy';
                  useDnd.getState().start({ kind: 'new', type: w.type });
                }}
                onDragEnd={() => useDnd.getState().end()}
                onClick={() => addWidget(w.type)}
              >
                <svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: w.icon }} />
                <span>{w.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function Pages() {
  const doc = useEditor((s) => s.doc);
  const pageId = useEditor((s) => currentPage(s)?.id);
  if (!doc) return null;
  return (
    <section>
      <p className="lbl">Pages</p>
      <div className="pages">
        {doc.pages.map((p, i) => (
          <button key={p.id} className={`pg${p.id === pageId ? ' cur' : ''}`} onClick={() => useEditor.getState().setPage(p.id)}>
            <span>{p.name}</span>
            <small>
              {doc.nav.enabled && doc.nav.items.some((it) => it.pageId === p.id) ? 'tab · ' : ''}
              {i === 0 ? 'start' : '/' + slug(p.name)}
            </small>
          </button>
        ))}
      </div>
      <button className="btn" style={{ marginTop: 8, width: '100%' }} onClick={addPage}>
        + Add page
      </button>
    </section>
  );
}

function Layers() {
  const page = useEditor(currentPage);
  const selectedId = useEditor((s) => s.selectedId);
  if (!page) return null;
  const rows: React.ReactNode[] = [];
  const walk = (nodes: WidgetNode[], depth: number) =>
    nodes.forEach((n) => {
      rows.push(
        <button key={n.id} className={selectedId === n.id ? 'cur' : ''} style={{ paddingLeft: 6 + depth * 14 }} onClick={() => useEditor.getState().select(n.id)}>
          {nodeSummary(n)}
        </button>,
      );
      if (n.children) walk(n.children, depth + 1);
    });
  walk(page.nodes, 0);
  return (
    <section>
      <p className="lbl">Layers</p>
      <div className="tree">{rows.length ? rows : <p className="note">This page is empty.</p>}</div>
    </section>
  );
}

export function LeftPanel() {
  return (
    <aside className="side left">
      <Tips />
      <Palette />
      <Pages />
      <Layers />
    </aside>
  );
}
