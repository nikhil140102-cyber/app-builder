'use client';
import { useEffect, useMemo, useState } from 'react';
import { ICON_NAMES, ICONS, iconSvg } from '@/core/icons';
import { useEditor } from '@/core/store';
import { walkNodes } from '@/core/tree';
import type { AppDoc, FieldDef, PropValue } from '@/core/types';

/** Colours already used in this app, most used first — shown as one-click swatches. */
function useProjectColours(): string[] {
  const doc = useEditor((s) => s.doc);
  return useMemo(() => projectColours(doc), [doc]);
}

function projectColours(doc: AppDoc | null): string[] {
  if (!doc) return [];
  const count = new Map<string, number>();
  const add = (v: unknown) => {
    if (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)) count.set(v.toUpperCase(), (count.get(v.toUpperCase()) ?? 0) + 1);
  };
  add(doc.theme.primary);
  count.set(doc.theme.primary.toUpperCase(), 999);
  for (const p of doc.pages) {
    add(p.background);
    walkNodes(p.nodes, (n) => Object.values(n.props).forEach(add));
  }
  for (const base of ['#FFFFFF', '#1B1B1B', '#5A5A5A']) if (!count.has(base)) count.set(base, 0);
  return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c).slice(0, 12);
}

function IconPicker({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const list = ICON_NAMES.filter((name) => !q || name.includes(q.toLowerCase()) || ICONS[name].label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="iconpick">
      <button id={id} type="button" className="btn" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span dangerouslySetInnerHTML={{ __html: iconSvg(value, 20) }} />
        {ICONS[value]?.label ?? value}
        <span className="caret">▾</span>
      </button>
      {open && (
        <div className="iconpanel">
          <input id={`${id}-search`} type="text" placeholder="Search icons" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
          <div className="icongrid">
            {list.map((name) => (
              <button
                key={name}
                type="button"
                title={ICONS[name].label}
                aria-label={ICONS[name].label}
                className={name === value ? 'cur' : ''}
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                }}
                dangerouslySetInnerHTML={{ __html: iconSvg(name, 20) }}
              />
            ))}
            {!list.length && <span className="note">No icon matches “{q}”.</span>}
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  id: string;
  field: FieldDef;
  value: PropValue | undefined;
  onChange: (v: PropValue) => void;
}

function ColorInput({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  const swatches = useProjectColours();
  useEffect(() => setDraft(value), [value]);
  return (
    <>
    <div className="swatches" aria-label="Colours used in this app">
      {swatches.map((c) => (
        <button
          key={c}
          type="button"
          title={c}
          aria-label={`Use ${c}`}
          className={c === value.toUpperCase() ? 'cur' : ''}
          style={{ background: c }}
          onClick={() => onChange(c)}
        />
      ))}
    </div>
    <div className="colorrow">
      <input id={`${id}-pick`} type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'} onChange={(e) => onChange(e.target.value.toUpperCase())} aria-label="Pick colour" />
      <input
        id={id}
        type="text"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          if (/^#[0-9a-f]{6}$/i.test(e.target.value)) onChange(e.target.value.toUpperCase());
        }}
        onBlur={() => setDraft(value)}
      />
    </div>
    </>
  );
}

export function FieldControl({ id, field, value, onChange }: Props) {
  const pages = useEditor((s) => s.doc?.pages ?? []);
  const apis = useEditor((s) => s.doc?.apis ?? []);
  let control: React.ReactNode;
  switch (field.kind) {
    case 'textarea':
      control = <textarea id={id} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />;
      break;
    case 'number':
      control = (
        <input
          id={id}
          type="number"
          min={field.min}
          max={field.max}
          value={Number(value ?? 0)}
          onChange={(e) => {
            let v = Number(e.target.value) || 0;
            if (field.min !== undefined) v = Math.max(field.min, v);
            if (field.max !== undefined) v = Math.min(field.max, v);
            onChange(v);
          }}
        />
      );
      break;
    case 'color':
      return (
        <div className="field">
          <span>{field.label}</span>
          <ColorInput id={id} value={String(value ?? '#000000')} onChange={onChange} />
        </div>
      );
    case 'select':
      control = (
        <select id={id} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
          {(field.options ?? []).map((o, i) => (
            <option key={o} value={o}>
              {field.optionLabels?.[i] ?? o}
            </option>
          ))}
        </select>
      );
      break;
    case 'page':
      control = (
        <select id={id} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
          <option value="">Do nothing</option>
          {pages.map((p) => (
            <option key={p.id} value={p.id}>
              Go to {p.name}
            </option>
          ))}
        </select>
      );
      break;
    case 'api':
      control = (
        <select id={id} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
          <option value="">{apis.length ? 'Choose an API' : 'No APIs yet — add one under App → APIs'}</option>
          {apis.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      );
      break;
    case 'icon':
      return (
        <div className="field">
          <span>{field.label}</span>
          <IconPicker id={id} value={String(value ?? 'star')} onChange={onChange} />
        </div>
      );
    case 'boolean':
      return (
        <div className="field">
          <span>{field.label}</span>
          <label className="check">
            <input id={id} type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
            Yes
          </label>
        </div>
      );
    default:
      control = <input id={id} type="text" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />;
  }
  return (
    <label className="field">
      <span>{field.label}</span>
      {control}
      {field.help && <small>{field.help}</small>}
    </label>
  );
}
