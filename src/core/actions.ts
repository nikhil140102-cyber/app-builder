'use client';
import { newId } from './ids';
import { getWidget } from './registry';
import { currentPage, useEditor } from './store';
import { cloneWithNewIds, containsId, createNode, findNode, listFor } from './tree';
import type { AppDoc, PageDoc, WidgetNode } from './types';

/** All editing operations live here so UI components stay thin. */

const pageOf = (doc: AppDoc) => doc.pages.find((p) => p.id === useEditor.getState().pageId) ?? doc.pages[0];

export function addWidget(type: string) {
  const node = createNode(type);
  const { selectedId } = useEditor.getState();
  useEditor.getState().update((doc) => {
    const page = pageOf(doc);
    let list = page.nodes;
    let index = list.length;
    const hit = selectedId ? findNode(page.nodes, selectedId) : null;
    if (hit) {
      if (hit.node.children) {
        list = hit.node.children;
        index = list.length;
      } else {
        list = hit.list;
        index = hit.index + 1;
      }
    }
    list.splice(index, 0, node);
  });
  useEditor.getState().select(node.id);
}

export type DragItem = { kind: 'new'; type: string } | { kind: 'move'; id: string };

export function canDrop(item: DragItem, parentId: string): boolean {
  if (item.kind === 'new' || parentId === 'root') return true;
  const page = currentPage(useEditor.getState());
  const hit = page && findNode(page.nodes, item.id);
  return !!hit && !containsId(hit.node, parentId);
}

export function dropAt(item: DragItem, parentId: string, index: number) {
  if (!canDrop(item, parentId)) return;
  let movedId = '';
  useEditor.getState().update((doc) => {
    const page = pageOf(doc);
    let node;
    if (item.kind === 'new') node = createNode(item.type);
    else {
      const hit = findNode(page.nodes, item.id);
      if (!hit) return;
      node = hit.node;
      hit.list.splice(hit.index, 1);
    }
    const list = listFor(page, parentId) ?? page.nodes;
    list.splice(Math.max(0, Math.min(index, list.length)), 0, node);
    movedId = node.id;
  });
  if (movedId) useEditor.getState().select(movedId);
}

export function setProp(nodeId: string, key: string, value: string | number | boolean) {
  useEditor.getState().update(
    (doc) => {
      const hit = findNode(pageOf(doc).nodes, nodeId);
      if (hit) hit.node.props[key] = value;
    },
    { key: `${nodeId}:${key}` },
  );
}

export function moveSelected(delta: -1 | 1) {
  const id = useEditor.getState().selectedId;
  if (!id) return;
  useEditor.getState().update((doc) => {
    const hit = findNode(pageOf(doc).nodes, id);
    if (!hit) return;
    const to = hit.index + delta;
    if (to < 0 || to >= hit.list.length) return;
    hit.list.splice(hit.index, 1);
    hit.list.splice(to, 0, hit.node);
  });
}

export function duplicateSelected() {
  const id = useEditor.getState().selectedId;
  if (!id) return;
  let copyId = '';
  useEditor.getState().update((doc) => {
    const hit = findNode(pageOf(doc).nodes, id);
    if (!hit) return;
    const copy = cloneWithNewIds(hit.node);
    hit.list.splice(hit.index + 1, 0, copy);
    copyId = copy.id;
  });
  if (copyId) useEditor.getState().select(copyId);
}

export function deleteSelected() {
  const id = useEditor.getState().selectedId;
  if (!id) return;
  useEditor.getState().update((doc) => {
    const hit = findNode(pageOf(doc).nodes, id);
    if (hit) hit.list.splice(hit.index, 1);
  });
  useEditor.getState().select(null);
}

export function updatePage(patch: Partial<Omit<PageDoc, 'id' | 'nodes'>>, key?: string) {
  const pid = useEditor.getState().pageId;
  useEditor.getState().update(
    (doc) => {
      const page = doc.pages.find((p) => p.id === pid);
      if (page) Object.assign(page, patch);
    },
    { key: key ? `page:${pid}:${key}` : undefined },
  );
}

export function addPage() {
  const id = newId('p');
  useEditor.getState().update((doc) => {
    const n = doc.pages.length + 1;
    doc.pages.push({ id, name: `Page ${n}`, title: `Page ${n}`, showAppBar: true, background: '#FFFFFF', requiresLogin: false, nodes: [] });
  });
  useEditor.getState().setPage(id);
}

export function duplicatePage() {
  const pid = useEditor.getState().pageId;
  const id = newId('p');
  useEditor.getState().update((doc) => {
    const i = doc.pages.findIndex((p) => p.id === pid);
    if (i < 0) return;
    const src = doc.pages[i];
    doc.pages.splice(i + 1, 0, { ...structuredClone(src), id, name: `${src.name} copy`, nodes: src.nodes.map(cloneWithNewIds) });
  });
  useEditor.getState().setPage(id);
}

export function deletePage() {
  const pid = useEditor.getState().pageId;
  useEditor.getState().update((doc) => {
    if (doc.pages.length <= 1) return;
    doc.pages = doc.pages.filter((p) => p.id !== pid);
    doc.nav.items = doc.nav.items.filter((it) => it.pageId !== pid);
    // Buttons that pointed at the deleted page now do nothing instead of breaking.
    const clear = (nodes: typeof doc.pages[number]['nodes']) =>
      nodes.forEach((n) => {
        getWidget(n.type)?.fields.forEach((f) => {
          if (f.kind === 'page' && n.props[f.key] === pid) n.props[f.key] = '';
        });
        if (n.children) clear(n.children);
      });
    doc.pages.forEach((p) => clear(p.nodes));
  });
}

export function updateApp(patch: { name?: string; primary?: string; org?: string }) {
  useEditor.getState().update(
    (doc) => {
      if (patch.name !== undefined) doc.name = patch.name;
      if (patch.org !== undefined) doc.org = patch.org;
      if (patch.primary !== undefined) doc.theme.primary = patch.primary;
    },
    { key: `app:${Object.keys(patch).join()}` },
  );
}

/* ---------- clipboard ---------- */

const CLIP_KEY = 'app-builder:clipboard';
let memoryClip: WidgetNode | null = null;

export function copySelected(): boolean {
  const { selectedId } = useEditor.getState();
  const page = currentPage(useEditor.getState());
  const hit = selectedId && page ? findNode(page.nodes, selectedId) : null;
  if (!hit) return false;
  memoryClip = structuredClone(hit.node);
  try {
    localStorage.setItem(CLIP_KEY, JSON.stringify(memoryClip));
  } catch {}
  useEditor.getState().showToast(`Copied ${getWidget(hit.node.type)?.label ?? 'widget'}`);
  return true;
}

export function cutSelected() {
  if (copySelected()) deleteSelected();
}

function readClip(): WidgetNode | null {
  try {
    const raw = localStorage.getItem(CLIP_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return memoryClip;
}

/** Pastes after the selected widget (or inside it if it is a container), on any page. */
export function paste() {
  const clip = readClip();
  if (!clip || !getWidget(clip.type)) return useEditor.getState().showToast('Nothing to paste');
  const node = cloneWithNewIds(clip);
  const { selectedId } = useEditor.getState();
  useEditor.getState().update((doc) => {
    const page = pageOf(doc);
    const hit = selectedId ? findNode(page.nodes, selectedId) : null;
    if (hit?.node.children) hit.node.children.push(node);
    else if (hit) hit.list.splice(hit.index + 1, 0, node);
    else page.nodes.push(node);
  });
  useEditor.getState().select(node.id);
}

/** Puts the selected widget inside a new Card or Row. */
export function wrapSelected(type: 'card' | 'row') {
  const id = useEditor.getState().selectedId;
  if (!id) return;
  const wrapper = createNode(type);
  useEditor.getState().update((doc) => {
    const hit = findNode(pageOf(doc).nodes, id);
    if (!hit) return;
    wrapper.children = [hit.node];
    hit.list.splice(hit.index, 1, wrapper);
  });
  useEditor.getState().select(wrapper.id);
}

/* ---------- pages ---------- */

export function movePage(delta: -1 | 1) {
  const pid = useEditor.getState().pageId;
  useEditor.getState().update((doc) => {
    const i = doc.pages.findIndex((p) => p.id === pid);
    const to = i + delta;
    if (i < 0 || to < 0 || to >= doc.pages.length) return;
    const [pg] = doc.pages.splice(i, 1);
    doc.pages.splice(to, 0, pg);
  });
}

export function setStartPage() {
  const pid = useEditor.getState().pageId;
  useEditor.getState().update((doc) => {
    const i = doc.pages.findIndex((p) => p.id === pid);
    if (i <= 0) return;
    const [pg] = doc.pages.splice(i, 1);
    doc.pages.unshift(pg);
  });
  useEditor.getState().showToast('This is now the start page');
}

/* ---------- bottom navigation ---------- */

export function setNavEnabled(enabled: boolean) {
  useEditor.getState().update((doc) => {
    doc.nav.enabled = enabled;
    if (enabled && doc.nav.items.length === 0) {
      const icons = ['home', 'search', 'cart', 'person', 'settings'];
      doc.nav.items = doc.pages.slice(0, 3).map((p, i) => ({ pageId: p.id, label: p.name.slice(0, 14), icon: icons[i] }));
    }
  });
}

export function toggleNavPage(pageId: string, on: boolean) {
  useEditor.getState().update((doc) => {
    if (on && !doc.nav.items.some((it) => it.pageId === pageId)) {
      const p = doc.pages.find((x) => x.id === pageId);
      doc.nav.items.push({ pageId, label: (p?.name ?? 'Tab').slice(0, 14), icon: 'star' });
    } else if (!on) {
      doc.nav.items = doc.nav.items.filter((it) => it.pageId !== pageId);
    }
  });
}

export function updateNavItem(pageId: string, patch: { label?: string; icon?: string }) {
  useEditor.getState().update(
    (doc) => {
      const it = doc.nav.items.find((x) => x.pageId === pageId);
      if (it) Object.assign(it, patch);
    },
    { key: `nav:${pageId}:${Object.keys(patch).join()}` },
  );
}

export function moveNavItem(pageId: string, delta: -1 | 1) {
  useEditor.getState().update((doc) => {
    const i = doc.nav.items.findIndex((x) => x.pageId === pageId);
    const to = i + delta;
    if (i < 0 || to < 0 || to >= doc.nav.items.length) return;
    const [it] = doc.nav.items.splice(i, 1);
    doc.nav.items.splice(to, 0, it);
  });
}

/* ---------- backend and APIs ---------- */

export function updateBackend(patch: Partial<AppDoc['backend']>, key?: string) {
  useEditor.getState().update(
    (doc) => {
      Object.assign(doc.backend, patch);
    },
    { key: key ? `backend:${key}` : undefined },
  );
}

export function addApi() {
  const id = newId('api');
  useEditor.getState().update((doc) => {
    doc.apis.push({ id, name: `API ${doc.apis.length + 1}`, url: 'https://', listPath: '' });
  });
  return id;
}

export function updateApi(id: string, patch: Partial<Omit<AppDoc['apis'][number], 'id'>>) {
  useEditor.getState().update(
    (doc) => {
      const api = doc.apis.find((a) => a.id === id);
      if (api) Object.assign(api, patch);
    },
    { key: `api:${id}:${Object.keys(patch).join()}` },
  );
}

export function removeApi(id: string) {
  useEditor.getState().update((doc) => {
    doc.apis = doc.apis.filter((a) => a.id !== id);
  });
}
