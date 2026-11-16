'use client';
import { create } from 'zustand';
import { findNode } from './tree';
import type { AppDoc, PageDoc } from './types';

type Recipe = (doc: AppDoc) => void;
type Item = Record<string, unknown>;

interface EditorState {
  doc: AppDoc | null;
  pageId: string | null;
  selectedId: string | null;
  mode: 'edit' | 'preview';
  /** Pages visited in Preview, for the Back action. */
  history: string[];
  /** In Preview: the Data-list row the current page was opened with (a tapped dish…). */
  pageItem: Item | null;
  itemHistory: (Item | null)[];
  /** Short message shown over the phone (Preview actions, copy/paste feedback). */
  toast: string | null;
  device: DeviceId;
  zoom: number;
  past: AppDoc[];
  future: AppDoc[];
  lastKey: string | null;
  lastAt: number;
  load: (doc: AppDoc) => void;
  /**
   * Apply a change. Each call becomes one undo step, except calls that share
   * the same `key` within a second (e.g. typing in one field), which merge.
   */
  update: (recipe: Recipe, opts?: { key?: string }) => void;
  undo: () => void;
  redo: () => void;
  select: (id: string | null) => void;
  setPage: (id: string) => void;
  setMode: (mode: 'edit' | 'preview') => void;
  /** Preview navigation: remembers where you came from. */
  goTo: (pageId: string, item?: Item | null) => void;
  goBack: () => void;
  showToast: (msg: string) => void;
  setDevice: (d: DeviceId) => void;
  setZoom: (z: number) => void;
}

export type DeviceId = 'small' | 'phone' | 'large' | 'tablet';
export const DEVICES: Record<DeviceId, { label: string; w: number; h: number }> = {
  small: { label: 'Small phone', w: 340, h: 640 },
  phone: { label: 'Phone', w: 360, h: 760 },
  large: { label: 'Large phone', w: 412, h: 860 },
  tablet: { label: 'Tablet', w: 744, h: 1000 },
};

let toastTimer: ReturnType<typeof setTimeout> | undefined;

const HISTORY_LIMIT = 100;

/** Keeps page and selection pointing at things that still exist. */
function reconcile(doc: AppDoc, pageId: string | null, selectedId: string | null) {
  const page = doc.pages.find((p) => p.id === pageId) ?? doc.pages[0];
  const sel = selectedId && findNode(page.nodes, selectedId) ? selectedId : null;
  return { pageId: page.id, selectedId: sel };
}

export const useEditor = create<EditorState>((set, get) => ({
  doc: null,
  pageId: null,
  selectedId: null,
  mode: 'edit',
  history: [],
  pageItem: null,
  itemHistory: [],
  toast: null,
  device: 'phone',
  zoom: 1,
  past: [],
  future: [],
  lastKey: null,
  lastAt: 0,

  load: (doc) =>
    set({ doc, pageId: doc.pages[0]?.id ?? null, selectedId: null, mode: 'edit', history: [], pageItem: null, itemHistory: [], past: [], future: [], lastKey: null }),

  update: (recipe, opts) => {
    const { doc, past, lastKey, lastAt, pageId, selectedId } = get();
    if (!doc) return;
    const next = structuredClone(doc);
    recipe(next);
    next.updatedAt = new Date().toISOString();
    const now = Date.now();
    const merge = !!opts?.key && opts.key === lastKey && now - lastAt < 1000;
    set({
      doc: next,
      past: merge ? past : [...past, doc].slice(-HISTORY_LIMIT),
      future: [],
      lastKey: opts?.key ?? null,
      lastAt: now,
      ...reconcile(next, get().pageId ?? pageId, get().selectedId ?? selectedId),
    });
  },

  undo: () => {
    const { doc, past, future, pageId, selectedId } = get();
    if (!doc || !past.length) return;
    const prev = past[past.length - 1];
    set({ doc: prev, past: past.slice(0, -1), future: [doc, ...future], lastKey: null, ...reconcile(prev, pageId, selectedId) });
  },

  redo: () => {
    const { doc, past, future, pageId, selectedId } = get();
    if (!doc || !future.length) return;
    const next = future[0];
    set({ doc: next, past: [...past, doc], future: future.slice(1), lastKey: null, ...reconcile(next, pageId, selectedId) });
  },

  select: (id) => set({ selectedId: id }),
  setPage: (id) => set({ pageId: id, selectedId: null }),
  setMode: (mode) => set({ mode, selectedId: null, history: [], pageItem: null, itemHistory: [] }),
  goTo: (id, item) => {
    const { pageId, history, doc, pageItem, itemHistory } = get();
    if (!doc?.pages.some((p) => p.id === id)) return;
    set({
      pageId: id,
      selectedId: null,
      history: pageId ? [...history, pageId].slice(-50) : history,
      itemHistory: pageId ? [...itemHistory, pageItem].slice(-50) : itemHistory,
      // A tapped row goes along; otherwise the current page's row is passed on (like the exported app).
      pageItem: item === undefined ? pageItem : item,
    });
  },
  goBack: () => {
    const { history } = get();
    if (!history.length) return get().showToast('Nothing to go back to');
    const { itemHistory } = get();
    set({
      pageId: history[history.length - 1],
      history: history.slice(0, -1),
      pageItem: itemHistory[itemHistory.length - 1] ?? null,
      itemHistory: itemHistory.slice(0, -1),
      selectedId: null,
    });
  },
  showToast: (msg) => {
    clearTimeout(toastTimer);
    set({ toast: msg });
    toastTimer = setTimeout(() => set({ toast: null }), 2200);
  },
  setDevice: (device) => set({ device }),
  setZoom: (zoom) => set({ zoom: Math.min(1.5, Math.max(0.5, Math.round(zoom * 10) / 10)) }),
}));

export function currentPage(state: { doc: AppDoc | null; pageId: string | null }): PageDoc | null {
  if (!state.doc) return null;
  return state.doc.pages.find((p) => p.id === state.pageId) ?? state.doc.pages[0];
}
