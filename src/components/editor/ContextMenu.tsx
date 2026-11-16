'use client';
import { useEffect, useRef } from 'react';
import { create } from 'zustand';
import { copySelected, cutSelected, deleteSelected, duplicateSelected, moveSelected, paste, wrapSelected } from '@/core/actions';

interface MenuState {
  at: { x: number; y: number } | null;
  open: (x: number, y: number, nodeId: string) => void;
  close: () => void;
}

export const useContextMenu = create<MenuState>((set) => ({
  at: null,
  open: (x, y) => set({ at: { x, y } }),
  close: () => set({ at: null }),
}));

const ITEMS: { label: string; keys?: string; run: () => void; danger?: boolean }[] = [
  { label: 'Copy', keys: 'Ctrl+C', run: copySelected },
  { label: 'Cut', keys: 'Ctrl+X', run: cutSelected },
  { label: 'Paste after', keys: 'Ctrl+V', run: paste },
  { label: 'Duplicate', keys: 'Ctrl+D', run: duplicateSelected },
  { label: 'Move up', keys: 'Alt+↑', run: () => moveSelected(-1) },
  { label: 'Move down', keys: 'Alt+↓', run: () => moveSelected(1) },
  { label: 'Put inside a Card', run: () => wrapSelected('card') },
  { label: 'Put inside a Row', run: () => wrapSelected('row') },
  { label: 'Delete', keys: 'Del', run: deleteSelected, danger: true },
];

/** Right-click menu for widgets on the canvas. */
export function ContextMenu() {
  const at = useContextMenu((s) => s.at);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!at) return;
    const close = () => useContextMenu.getState().close();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    ref.current?.querySelector('button')?.focus();
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
    };
  }, [at]);

  if (!at) return null;
  const x = Math.min(at.x, window.innerWidth - 220);
  const y = Math.min(at.y, window.innerHeight - ITEMS.length * 34 - 16);
  return (
    <div ref={ref} className="ctxmenu" role="menu" style={{ left: x, top: y }} onPointerDown={(e) => e.stopPropagation()}>
      {ITEMS.map((it) => (
        <button
          key={it.label}
          role="menuitem"
          className={it.danger ? 'danger' : ''}
          onClick={() => {
            it.run();
            useContextMenu.getState().close();
          }}
        >
          <span>{it.label}</span>
          {it.keys && <kbd>{it.keys}</kbd>}
        </button>
      ))}
    </div>
  );
}
