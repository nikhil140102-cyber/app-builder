'use client';
import { useRef, type CSSProperties, type DragEvent } from 'react';
import { canDrop, dropAt } from '@/core/actions';
import { useDnd } from '@/core/dnd';
import { getWidget } from '@/core/registry';
import { previewTap } from '@/codegen/actions';
import { n as num, s as str } from '@/codegen/helpers';
import { iconSvg } from '@/core/icons';
import { currentPage, DEVICES, useEditor, type DeviceId } from '@/core/store';
import type { Props, WidgetNode } from '@/core/types';
import { useContextMenu } from './ContextMenu';
import { fillPreview } from '@/widgets/data';

/** Copies props with {{field}} placeholders filled for one data-list row. */
function fillProps(p: Props, item: Record<string, unknown> | null): Props {
  const out: Props = {};
  for (const [k, v] of Object.entries(p)) out[k] = typeof v === 'string' && v.includes('{{') ? fillPreview(v, item) : v;
  return out;
}

/** Read-only rendering of a widget for one data-list row in Preview. */
function TemplateNode({ node, item, inRow }: { node: WidgetNode; item: Record<string, unknown> | null; inRow: boolean }) {
  const def = getWidget(node.type);
  if (!def) return null;
  const Render = def.Render;
  const props = fillProps(node.props, item);
  return (
    <div className={`w${inRow && def.rowFit === 'expanded' ? ' grow' : ''}`} style={layoutStyle(props, inRow)}>
      <Render
        node={node}
        props={props}
        mode="preview"
        navigate={(id) => useEditor.getState().goTo(id)}
        runTap={(p) => runTap(fillProps(p, item), item)}
        renderChildren={
          def.container
            ? (style) => (
                <div className={`dz${def.container === 'horizontal' ? ' h' : ''}`} style={style}>
                  {(node.children ?? []).map((c) => (
                    <TemplateNode key={c.id} node={c} item={item} inRow={def.container === 'horizontal'} />
                  ))}
                </div>
              )
            : undefined
        }
        renderTemplate={(row, key) => (
          <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(node.children ?? []).map((c) => (
              <TemplateNode key={c.id} node={c} item={row} inRow={false} />
            ))}
          </div>
        )}
      />
    </div>
  );
}

const ALIGN_CSS: Record<string, string> = { start: 'flex-start', center: 'center', end: 'flex-end' };

/** Preview of a tap. `item` is the Data-list row the widget belongs to, if any. */
function runTap(p: Props, item?: Record<string, unknown> | null) {
  const st = useEditor.getState();
  const r = previewTap(p);
  if (r.toast) st.showToast(r.toast);
  if (r.filter) st.setFormValue(r.filter.field, r.filter.value);
  // Only "Go to a page" carries the tapped row along, like the exported app.
  if (r.page) st.goTo(r.page, item && str(p.tap || (p.action ? 'page' : '')) === 'page' ? item : undefined);
  else if (r.back) st.goBack();
}

function DropZone({ parentId, nodes, horizontal, style }: { parentId: string; nodes: WidgetNode[]; horizontal: boolean; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const mode = useEditor((s) => s.mode);
  const target = useDnd((s) => s.target);
  const dragging = useDnd((s) => s.item);
  const movingId = dragging?.kind === 'move' ? dragging.id : null;

  function onDragOver(e: DragEvent) {
    const item = useDnd.getState().item;
    if (!item || mode !== 'edit' || !canDrop(item, parentId)) return; // let an outer zone take it
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = item.kind === 'move' ? 'move' : 'copy';
    const kids = Array.from(ref.current?.children ?? []).filter(
      (c): c is HTMLElement => c instanceof HTMLElement && !!c.dataset.nodeId && c.dataset.nodeId !== movingId,
    );
    let index = kids.length;
    for (let i = 0; i < kids.length; i++) {
      const r = kids[i].getBoundingClientRect();
      if (horizontal ? e.clientX < r.left + r.width / 2 : e.clientY < r.top + r.height / 2) {
        index = i;
        break;
      }
    }
    useDnd.getState().setTarget({ parentId, index });
  }

  function onDrop(e: DragEvent) {
    const { item, target: t } = useDnd.getState();
    if (!item || !t || t.parentId !== parentId) return;
    e.preventDefault();
    e.stopPropagation();
    useDnd.getState().end();
    dropAt(item, t.parentId, t.index);
  }

  const visible = nodes.filter((n) => n.id !== movingId);
  const phIndex = target?.parentId === parentId ? target.index : -1;
  const items: React.ReactNode[] = [];
  let shown = 0;
  nodes.forEach((n) => {
    if (n.id !== movingId && shown === phIndex) items.push(<div className="ph" key="__ph" />);
    items.push(<NodeView key={n.id} node={n} inRow={horizontal} />);
    if (n.id !== movingId) shown++;
  });
  if (phIndex >= visible.length && phIndex >= 0) items.push(<div className="ph" key="__ph" />);

  return (
    <div
      ref={ref}
      className={`dz${horizontal ? ' h' : ''}${nodes.length ? '' : ' empty'}${phIndex >= 0 ? ' has-ph' : ''}`}
      data-parent={parentId}
      style={style}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {items}
    </div>
  );
}

function layoutStyle(p: Props, inRow: boolean): React.CSSProperties | undefined {
  const pad = num(p._pad);
  const align = inRow ? '' : str(p._align);
  if (!pad && !ALIGN_CSS[align]) return undefined;
  return {
    padding: pad || undefined,
    ...(ALIGN_CSS[align] ? { display: 'flex', flexDirection: 'column', alignItems: ALIGN_CSS[align] } : {}),
  };
}

function NodeView({ node, inRow }: { node: WidgetNode; inRow: boolean }) {
  const def = getWidget(node.type);
  const selected = useEditor((s) => s.selectedId === node.id);
  const mode = useEditor((s) => s.mode);
  const pageItem = useEditor((s) => s.pageItem);
  const dragging = useDnd((s) => s.item?.kind === 'move' && s.item.id === node.id);
  if (!def) return <div className="unknown" data-node-id={node.id}>Unknown widget “{node.type}”. Install the plugin that provides it.</div>;
  const Render = def.Render;
  const edit = mode === 'edit';
  return (
    <div
      className={`w${selected && edit ? ' sel' : ''}${inRow && def.rowFit === 'expanded' ? ' grow' : ''}${dragging ? ' dragging' : ''}`}
      data-node-id={node.id}
      data-label={def.label}
      draggable={edit}
      onDragStart={(e) => {
        e.stopPropagation();
        e.dataTransfer.setData('text/plain', node.id);
        e.dataTransfer.effectAllowed = 'move';
        useDnd.getState().start({ kind: 'move', id: node.id });
      }}
      onDragEnd={() => useDnd.getState().end()}
      onClick={(e) => {
        if (!edit) return;
        e.stopPropagation();
        useEditor.getState().select(node.id);
      }}
      onContextMenu={(e) => {
        if (!edit) return;
        e.preventDefault();
        e.stopPropagation();
        useEditor.getState().select(node.id);
        useContextMenu.getState().open(e.clientX, e.clientY, node.id);
      }}
      style={layoutStyle(node.props, inRow)}
    >
      <Render
        node={node}
        props={mode === 'preview' ? fillProps(node.props, pageItem) : node.props}
        mode={mode}
        navigate={(id) => useEditor.getState().goTo(id)}
        runTap={runTap}
        renderTemplate={(item, key) => (
          <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(node.children ?? []).map((c) => (
              <TemplateNode key={c.id} node={c} item={item} inRow={false} />
            ))}
          </div>
        )}
        renderChildren={
          def.container
            ? (style) => <DropZone parentId={node.id} nodes={node.children ?? []} horizontal={def.container === 'horizontal'} style={style} />
            : undefined
        }
      />
    </div>
  );
}

function BottomBar({ pageId }: { pageId: string }) {
  const nav = useEditor((s) => s.doc?.nav);
  if (!nav?.enabled || !nav.items.some((it) => it.pageId === pageId)) return null;
  return (
    <nav className="bottombar" aria-label="Bottom navigation">
      {nav.items.map((it) => (
        <button
          key={it.pageId}
          className={it.pageId === pageId ? 'cur' : ''}
          onClick={(e) => {
            e.stopPropagation();
            // Switching tabs is not a "go back" step, just like on a real phone.
            useEditor.setState({ history: [], itemHistory: [], pageItem: null });
            useEditor.getState().setPage(it.pageId);
          }}
        >
          <span dangerouslySetInnerHTML={{ __html: iconSvg(it.icon, 22) }} />
          <small>{it.label || 'Tab'}</small>
        </button>
      ))}
    </nav>
  );
}

function StageToolbar() {
  const device = useEditor((s) => s.device);
  const zoom = useEditor((s) => s.zoom);
  return (
    <div className="stagebar" onClick={(e) => e.stopPropagation()}>
      <select id="device" aria-label="Device size" value={device} onChange={(e) => useEditor.getState().setDevice(e.target.value as DeviceId)}>
        {Object.entries(DEVICES).map(([id, d]) => (
          <option key={id} value={id}>
            {d.label} · {d.w}×{d.h}
          </option>
        ))}
      </select>
      <div className="zoom">
        <button className="btn small" aria-label="Zoom out" onClick={() => useEditor.getState().setZoom(zoom - 0.1)}>−</button>
        <button className="btn small" title="Reset zoom" onClick={() => useEditor.getState().setZoom(1)}>{Math.round(zoom * 100)}%</button>
        <button className="btn small" aria-label="Zoom in" onClick={() => useEditor.getState().setZoom(zoom + 0.1)}>+</button>
      </div>
    </div>
  );
}

export function Canvas({ standalone = false }: { standalone?: boolean }) {
  const page = useEditor(currentPage);
  const doc = useEditor((s) => s.doc);
  const mode = useEditor((s) => s.mode);
  const device = useEditor((s) => s.device);
  const zoom = useEditor((s) => s.zoom);
  const toast = useEditor((s) => s.toast);
  const canGoBack = useEditor((s) => s.history.length > 0);
  if (!page || !doc) return null;
  const isStart = doc.pages[0].id === page.id;
  const size = DEVICES[device];
  const showBack = mode === 'preview' ? canGoBack : !isStart;
  return (
    <main className={`stage${standalone ? ' standalone' : ''}`} onClick={() => mode === 'edit' && useEditor.getState().select(null)}>
      {!standalone && <StageToolbar />}
      <div
        className={`phone ${mode === 'edit' ? 'editing' : 'preview'}`}
        style={{ background: page.background, width: size.w + 20, height: size.h + 20, zoom }}
      >
        <div className="status">
          <span>9:41</span>
          <span>100%</span>
        </div>
        {page.showAppBar && (
          <div className="appbar">
            {showBack && (
              <button className="back" aria-label="Back" onClick={(e) => { e.stopPropagation(); if (mode === 'preview') useEditor.getState().goBack(); }}>
                ‹
              </button>
            )}
            <span>{page.title || page.name}</span>
          </div>
        )}
        <div className="screen">
          {mode === 'edit' && page.nodes.length === 0 ? (
            <div className="emptypage">
              <b>This page is empty</b>
              <span>Drag a widget from the left panel onto the phone, or click a widget to add it.</span>
              <DropZone parentId="root" nodes={page.nodes} horizontal={false} style={{ minHeight: 160 }} />
            </div>
          ) : (
            <DropZone parentId="root" nodes={page.nodes} horizontal={false} style={{ minHeight: '100%' }} />
          )}
        </div>
        <BottomBar pageId={page.id} />
        {toast && <div className="toast" role="status">{toast}</div>}
      </div>
    </main>
  );
}
