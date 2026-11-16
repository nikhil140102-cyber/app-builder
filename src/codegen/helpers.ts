import type { PropValue } from '@/core/types';

export const s = (v: PropValue | undefined) => String(v ?? '');
export const n = (v: PropValue | undefined) => (Number.isFinite(Number(v)) ? Number(v) : 0);
export const b = (v: PropValue | undefined) => v === true || v === 'true';
export const hex = (v: PropValue | undefined, fallback = '#000000') =>
  /^#[0-9a-fA-F]{6}$/.test(s(v)) ? s(v).toUpperCase() : fallback;

/** Dart single-quoted string literal. */
export const dartString = (v: PropValue | undefined) =>
  "'" + s(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\$/g, '\\$').replace(/\r?\n/g, '\\n') + "'";

/** Dart Color literal from #RRGGBB. */
export const dartColor = (v: PropValue | undefined) => `Color(0xFF${hex(v).slice(1)})`;

/** JavaScript string literal. */
export const jsString = (v: PropValue | undefined) => JSON.stringify(s(v));

export const pascal = (v: string) =>
  v
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('')
    .replace(/^[0-9]/, (d) => `P${d}`) || 'Page';

export const snake = (v: string) =>
  v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/^([0-9])/, 'app_$1') || 'page';

export const slug = (v: string) =>
  v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'page';

export const pad = (count: number) => ' '.repeat(count);

/** A valid lowercase reverse-domain id prefix (com.yourcompany). Falls back to com.example. */
export function cleanOrg(v: string): string {
  const parts = v
    .toLowerCase()
    .split('.')
    .map((p) => p.replace(/[^a-z0-9_]/g, '').replace(/^[0-9_]+/, ''))
    .filter(Boolean);
  return parts.length >= 2 ? parts.join('.') : 'com.example';
}

export const ORG_PATTERN = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;

/** Makes names unique by appending 2, 3, … to repeats. */
export function uniqueNames<T>(items: T[], nameOf: (t: T) => string): string[] {
  const seen = new Map<string, number>();
  return items.map((it) => {
    const base = nameOf(it);
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}${count}`;
  });
}

/** Name a form value is saved under: the "field" setting, or the label in snake_case. */
export function fieldKey(p: Record<string, unknown>): string {
  const explicit = String(p.field ?? '').trim();
  const base = explicit || String(p.label ?? '');
  return base.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'field';
}
