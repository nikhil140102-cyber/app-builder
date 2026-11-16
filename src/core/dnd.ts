'use client';
import { create } from 'zustand';
import type { DragItem } from './actions';

interface DndState {
  item: DragItem | null;
  target: { parentId: string; index: number } | null;
  start: (item: DragItem) => void;
  setTarget: (t: { parentId: string; index: number } | null) => void;
  end: () => void;
}

export const useDnd = create<DndState>((set, get) => ({
  item: null,
  target: null,
  start: (item) => set({ item, target: null }),
  setTarget: (t) => {
    const cur = get().target;
    if (cur?.parentId === t?.parentId && cur?.index === t?.index) return;
    set({ target: t });
  },
  end: () => set({ item: null, target: null }),
}));
