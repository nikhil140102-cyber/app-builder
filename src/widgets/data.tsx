import { useEffect, useState } from 'react';
import { dartString as dS, n, s } from '@/codegen/helpers';
import { useEditor } from '@/core/store';
import type { AppDoc, Props, WidgetDefinition } from "@/core/types";

type Item = Record<string, unknown>;

/** "search, category" → ["search", "category"] */
export const splitList = (v: unknown) =>
  String(v ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

/** Same rule as rowMatches() in the exported app: every query must appear in the chosen fields. */
export function rowMatches(row: Item, queries: string[], keys: string[]): boolean {
  const parts = keys.length ? keys.map((k) => fillPreview(`{{${k}}}`, row)) : Object.values(row).map((v) => (v == null ? '' : String(v)));
  const hay = parts.join(' ').toLowerCase();
  return queries.every((q) => {
    const t = q.trim().toLowerCase();
    return !t || t === 'all' || t.startsWith('all ') || hay.includes(t);
  });
}

/** Reads "a.b.c" from an object. */
export function pick(obj: unknown, path: string): unknown {
  return path
    .split('.')
    .filter(Boolean)
    .reduce<unknown>((acc, k) => (acc && typeof acc === 'object' ? (acc as Item)[k] : undefined), obj);
}

/** Fills {{field}} placeholders for the editor preview. */
export function fillPreview(text: string, item: Item | null): string {
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, key: string) => {
    if (key === 'user.email') return 'you@example.com';
    const v = item ? pick(item, key) : undefined;
    if (v === undefined || v === null) return item ? '' : `{{${key}}}`;
    // Lists of plain values read naturally: ["New Delhi"] → New Delhi, ["a","b"] → a, b
    if (Array.isArray(v) && v.every((x) => typeof x !== 'object')) return v.join(', ');
    return typeof v === 'object' ? JSON.stringify(v) : String(v);
  });
}

/** Turns an API reply into a list of rows, following listPath ("data.items"). */
export function toRows(json: unknown, listPath: string): Item[] {
  const list = listPath.trim() ? pick(json, listPath.trim()) : json;
  if (!Array.isArray(list)) return [];
  return list.map((x) => (x && typeof x === 'object' && !Array.isArray(x) ? (x as Item) : { value: x }));
}

/** Loads real rows for Preview: APIs straight from the browser, Supabase tables through its REST API. */
export async function loadPreviewRows(doc: AppDoc, p: Props): Promise<Item[]> {
  const limit = Math.max(1, Math.min(50, n(p.limit) || 20));
  if (s(p.source) === 'api') {
    const api = doc.apis.find((a) => a.id === s(p.api));
    if (!api?.url) throw new Error('Choose an API for this list.');
    const res = await fetch(api.url);
    if (!res.ok) throw new Error(`The API answered ${res.status}.`);
    return toRows(await res.json(), api.listPath).slice(0, limit);
  }
  const b = doc.backend;
  if (b.provider === 'supabase' && b.supabaseUrl && b.supabaseKey && s(p.table)) {
    const url = `${b.supabaseUrl.replace(/\/$/, '')}/rest/v1/${encodeURIComponent(s(p.table))}?select=*&limit=${limit}`;
    const res = await fetch(url, { headers: { apikey: b.supabaseKey, Authorization: `Bearer ${b.supabaseKey}` } });
    if (!res.ok) throw new Error(res.status === 404 ? `Table "${s(p.table)}" not found.` : `Supabase answered ${res.status} (the table may need a policy that allows reading).`);
    return (await res.json()) as Item[];
  }
  throw new Error('sample');
}

const SAMPLE: Item[] = [{}, {}, {}];

export const dataList: WidgetDefinition = {
  type: 'datalist',
  label: 'Data list',
  category: 'Data',
  icon: '<rect x="4" y="4" width="16" height="4" rx="1"/><rect x="4" y="10" width="16" height="4" rx="1"/><rect x="4" y="16" width="16" height="4" rx="1"/>',
  container: 'vertical',
  rowFit: 'expanded',
  defaultProps: { source: 'table', table: 'products', api: '', limit: 20, empty: 'Nothing here yet.', filterBy: '', searchIn: '' },
  fields: [
    { key: 'source', label: 'Get rows from', kind: 'select', options: ['table', 'api'], optionLabels: ['A database table / collection', 'An API'] },
    { key: 'table', label: 'Table / collection name', kind: 'text', showIf: (p) => s(p.source) !== 'api', help: 'Set the database under App → Backend.' },
    { key: 'api', label: 'API', kind: 'api', showIf: (p) => s(p.source) === 'api', help: 'Add APIs under App → APIs.' },
    { key: 'limit', label: 'Show at most', kind: 'number', min: 1, max: 200 },
    { key: 'empty', label: 'Text when there are no rows', kind: 'text' },
    {
      key: 'filterBy',
      label: 'Filter by (fields on this page)',
      kind: 'text',
      group: 'Search & filter',
      help: 'The "Save as" name of a search box, dropdown or filter chips on this page, e.g. search. Several: search, category',
    },
    {
      key: 'searchIn',
      label: 'Look in (row fields)',
      kind: 'text',
      group: 'Search & filter',
      showIf: (p) => !!s(p.filterBy).trim(),
      help: 'Which fields of each row to search, e.g. strMeal or title, category. Empty = all fields.',
    },
  ],
  Render: function DataListView({ node, props: p, mode, renderChildren, renderTemplate }) {
    const doc = useEditor((st) => st.doc);
    const formValues = useEditor((st) => st.formValues);
    const [rows, setRows] = useState<Item[] | null>(null);
    const [note, setNote] = useState('');
    const key = `${s(p.source)}|${s(p.table)}|${s(p.api)}|${n(p.limit)}`;

    useEffect(() => {
      if (mode !== 'preview' || !doc) return;
      let alive = true;
      setRows(null);
      setNote('');
      loadPreviewRows(doc, p).then(
        (r) => alive && setRows(r),
        (e: Error) => {
          if (!alive) return;
          setRows(SAMPLE);
          const msg = /failed to fetch|networkerror|load failed/i.test(e.message) ? 'The browser could not read this data.' : e.message;
          setNote(e.message === 'sample' ? 'Sample rows — real data appears in the exported app.' : `${msg} Showing sample rows; the app loads the real data.`);
        },
      );
      return () => {
        alive = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, key, doc?.apis, doc?.backend]);

    if (mode === 'edit') {
      return (
        <div className="x-datalist">
          <div className="x-datalist-head">
            Repeats for each row of {s(p.source) === 'api' ? doc?.apis.find((a) => a.id === s(p.api))?.name ?? 'an API' : `"${s(p.table)}"`}. Write {'{{field}}'} in any text.
          </div>
          {renderChildren?.({ gap: 8 })}
        </div>
      );
    }
    if (!rows) return <div className="x-datalist-note">Loading…</div>;
    const by = splitList(p.filterBy);
    const shown = rows === SAMPLE || !by.length ? rows : rows.filter((r) => rowMatches(r, by.map((k) => formValues[k] ?? ''), splitList(p.searchIn)));
    return (
      <div className="x-datalist" style={{ gap: 8 }}>
        {note && <div className="x-datalist-note">{note}</div>}
        {rows.length === 0 && <div className="x-datalist-note">{s(p.empty)}</div>}
        {rows.length > 0 && shown.length === 0 && <div className="x-datalist-note">No matches. Try another search or filter.</div>}
        {shown.map((row, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {renderTemplate?.(rows === SAMPLE ? null : row, `${node.id}-${i}`)}
          </div>
        ))}
      </div>
    );
  },
  toFlutter: ({ props: p }, ctx) => {
    const I = ' '.repeat(ctx.indent);
    const limit = Math.max(1, n(p.limit) || 20);
    let load: string;
    if (s(p.source) === 'api') {
      const api = ctx.doc.apis.find((a) => a.id === s(p.api));
      load = api ? `() => Api.getList(${dS(api.url)}, ${dS(api.listPath)}, limit: ${limit})` : `() async => <Map<String, dynamic>>[]`;
    } else {
      load = `() => Backend.list(${dS(s(p.table).trim() || 'items')}, limit: ${limit})`;
    }
    const by = splitList(p.filterBy);
    const filter = by.length
      ? `
${I}  listen: changes,
${I}  filter: (row) => rowMatches(row, [${by.map((k) => `value(${dS(k)})`).join(', ')}], const [${splitList(p.searchIn).map((k) => dS(k)).join(', ')}]),`
      : '';
    return `DataList(
${I}  load: ${load},
${I}  emptyText: ${dS(p.empty)},${filter}
${I}  itemBuilder: (context, item) => Column(
${I}    crossAxisAlignment: CrossAxisAlignment.stretch,
${I}    spacing: 8,
${I}    children: [
${ctx.renderChildren({ inRow: false, extraIndent: 6, inList: true })}
${I}    ],
${I}  ),
${I})`;
  },
  toReactNative: (_node, ctx) => {
    const I = ' '.repeat(ctx.indent);
    return `{/* Data list: loads real rows in the Flutter export. Shown once here as a preview. */}
${I}<View style={{ gap: 8 }}>
${ctx.renderChildren({ inRow: false, extraIndent: 2 })}
${I}</View>`;
  },
};
