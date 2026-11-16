import type { CSSProperties } from 'react';
import { b, dartColor as dC, dartString as dS, hex, jsString as J, n, s } from '@/codegen/helpers';
import { flutterOnTap, rnOnTap, TAP_DEFAULTS, TAP_FIELDS, tapKind } from '@/codegen/actions';
import type { WidgetDefinition } from '@/core/types';

const ALIGN = ['left', 'center', 'right'];

function textWidget(type: string, label: string, icon: string, defaults: WidgetDefinition['defaultProps']): WidgetDefinition {
  return {
    type,
    label,
    category: 'Basic',
    icon,
    rowFit: 'flexible',
    defaultProps: defaults,
    fields: [
      { key: 'text', label: 'Text', kind: 'textarea' },
      { key: 'size', label: 'Font size', kind: 'number', min: 8, max: 96, group: 'Style' },
      { key: 'weight', label: 'Weight', kind: 'select', options: ['400', '500', '600', '700', '800'], optionLabels: ['Regular', 'Medium', 'Semibold', 'Bold', 'Extra bold'], group: 'Style' },
      { key: 'color', label: 'Colour', kind: 'color', group: 'Style' },
      { key: 'align', label: 'Text alignment', kind: 'select', options: ALIGN, optionLabels: ['Left', 'Centre', 'Right'], group: 'Style' },
    ],
    Render: ({ props: p }) => (
      <p
        className="x-txt"
        style={{ fontSize: n(p.size), fontWeight: n(p.weight), color: hex(p.color), textAlign: s(p.align) as CSSProperties['textAlign'] }}
      >
        {s(p.text)}
      </p>
    ),
    toFlutter: ({ props: p }, ctx) =>
      `Text(${ctx.dartText(p.text)}, textAlign: TextAlign.${s(p.align) || 'left'}, style: TextStyle(fontSize: ${n(p.size)}, fontWeight: FontWeight.w${s(p.weight) || '400'}, color: ${dC(p.color)}))`,
    toReactNative: ({ props: p }) =>
      `<Text style={{ fontSize: ${n(p.size)}, fontWeight: '${s(p.weight) || '400'}', color: '${hex(p.color)}', textAlign: '${s(p.align) || 'left'}' }}>{${J(p.text)}}</Text>`,
  };
}

export const heading = textWidget('heading', 'Heading', '<path d="M5 5v14M15 5v14M5 12h10M19 9v10"/>', {
  text: 'Heading', size: 24, weight: '700', color: '#1B1B1B', align: 'left',
});

export const text = textWidget('text', 'Text', '<path d="M4 7h16M4 12h16M4 17h10"/>', {
  text: 'Body text goes here.', size: 15, weight: '400', color: '#5A5A5A', align: 'left',
});

export const button: WidgetDefinition = {
  type: 'button',
  label: 'Button',
  category: 'Basic',
  icon: '<rect x="3" y="7" width="18" height="10" rx="5"/><path d="M9 12h6"/>',
  defaultProps: { label: 'Continue', bg: '#0F7F64', fg: '#FFFFFF', radius: 12, full: true, ...TAP_DEFAULTS },
  fields: [
    { key: 'label', label: 'Label', kind: 'text' },
    { key: 'bg', label: 'Background', kind: 'color', group: 'Style' },
    { key: 'fg', label: 'Text colour', kind: 'color', group: 'Style' },
    { key: 'radius', label: 'Corner radius', kind: 'number', min: 0, max: 40, group: 'Style' },
    { key: 'full', label: 'Full width', kind: 'boolean', group: 'Style' },
    ...TAP_FIELDS,
  ],
  Render: ({ props: p, mode, runTap }) => (
    <div
      className="x-btn"
      role={mode === 'preview' ? 'button' : undefined}
      style={{ background: hex(p.bg), color: hex(p.fg), borderRadius: n(p.radius), width: b(p.full) ? '100%' : 'auto', cursor: mode === 'preview' ? 'pointer' : undefined }}
      onClick={() => {
        if (mode === 'preview') runTap(p);
      }}
    >
      {s(p.label)}
    </div>
  ),
  toFlutter: ({ props: p }, ctx) => {
    const btn = `ElevatedButton(onPressed: ${flutterOnTap(p, ctx)}, style: ElevatedButton.styleFrom(backgroundColor: ${dC(p.bg)}, foregroundColor: ${dC(p.fg)}, padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(${n(p.radius)}))), child: Text(${ctx.dartText(p.label)}))`;
    return b(p.full) && !ctx.inRow ? `SizedBox(width: double.infinity, child: ${btn})` : btn;
  },
  toReactNative: ({ props: p }, ctx) => {
    const I = ' '.repeat(ctx.indent);
    return `<Pressable onPress={${rnOnTap(p, ctx)}} style={{ backgroundColor: '${hex(p.bg)}', borderRadius: ${n(p.radius)}, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center', alignSelf: '${b(p.full) && !ctx.inRow ? 'stretch' : 'flex-start'}' }}>
${I}  <Text style={{ color: '${hex(p.fg)}', fontWeight: '600', fontSize: 16 }}>{${J(p.label)}}</Text>
${I}</Pressable>`;
  },
};

/** Exported for the code generators, which need to know which buttons navigate. */
export { tapKind };

export const image: WidgetDefinition = {
  type: 'image',
  label: 'Image',
  category: 'Basic',
  icon: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 8"/>',
  rowFit: 'expanded',
  defaultProps: { src: '', alt: 'Image', height: 160, radius: 14 },
  fields: [
    { key: 'src', label: 'Image URL', kind: 'text', help: 'Shown in the exported app. Leave empty for a placeholder.' },
    { key: 'alt', label: 'Description', kind: 'text' },
    { key: 'height', label: 'Height', kind: 'number', min: 20, max: 600, group: 'Style' },
    { key: 'radius', label: 'Corner radius', kind: 'number', min: 0, max: 60, group: 'Style' },
  ],
  Render: ({ props: p }) => (
    <div className="x-img" style={{ height: n(p.height), borderRadius: n(p.radius) }}>
      {s(p.src) && !s(p.src).includes('{{') ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={s(p.src)} alt={s(p.alt)} />
      ) : (
        <>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="9" cy="10" r="2" />
            <path d="M21 16l-5-5-9 8" />
          </svg>
          <span>{s(p.src).includes('{{') ? `Photo from data: ${s(p.src)}` : s(p.alt) || 'Image'}</span>
        </>
      )}
    </div>
  ),
  toFlutter: ({ props: p }, ctx) =>
    s(p.src)
      ? `ClipRRect(borderRadius: BorderRadius.circular(${n(p.radius)}), child: Image.network(${ctx.dartText(p.src)}, height: ${n(p.height)}, width: double.infinity, fit: BoxFit.cover, semanticLabel: ${dS(p.alt)}, errorBuilder: (context, error, stack) => Container(height: ${n(p.height)}, color: const Color(0xFFDCE6DF), alignment: Alignment.center, child: const Icon(Icons.broken_image_outlined))))`
      : `Container(height: ${n(p.height)}, decoration: BoxDecoration(color: const Color(0xFFDCE6DF), borderRadius: BorderRadius.circular(${n(p.radius)})), alignment: Alignment.center, child: const Icon(Icons.image_outlined))`,
  toReactNative: ({ props: p }) =>
    s(p.src)
      ? `<Image source={{ uri: ${J(p.src)} }} accessibilityLabel={${J(p.alt)}} style={{ width: '100%', height: ${n(p.height)}, borderRadius: ${n(p.radius)} }} />`
      : `<View accessibilityLabel={${J(p.alt)}} style={{ height: ${n(p.height)}, borderRadius: ${n(p.radius)}, backgroundColor: '#DCE6DF' }} />`,
};

export const chip: WidgetDefinition = {
  type: 'chip',
  label: 'Chip',
  category: 'Basic',
  icon: '<rect x="4" y="8" width="16" height="8" rx="4"/>',
  defaultProps: { text: 'New', bg: '#FDE7D3', fg: '#9A4A10', ...TAP_DEFAULTS },
  fields: [
    { key: 'text', label: 'Text', kind: 'text' },
    { key: 'bg', label: 'Background', kind: 'color', group: 'Style' },
    { key: 'fg', label: 'Text colour', kind: 'color', group: 'Style' },
    ...TAP_FIELDS,
  ],
  Render: ({ props: p, mode, runTap }) => {
    const tappable = tapKind(p) !== 'none';
    return (
      <span
        className="x-chip"
        role={mode === 'preview' && tappable ? 'button' : undefined}
        style={{ background: hex(p.bg), color: hex(p.fg), cursor: mode === 'preview' && tappable ? 'pointer' : undefined }}
        onClick={() => {
          if (mode === 'preview' && tappable) runTap(p);
        }}
      >
        {s(p.text)}
      </span>
    );
  },
  // A chip with "When tapped" set becomes a tappable ActionChip (filters, shortcuts).
  toFlutter: ({ props: p }, ctx) =>
    tapKind(p) === 'none'
      ? `Chip(label: Text(${ctx.dartText(p.text)}, style: TextStyle(color: ${dC(p.fg)})), backgroundColor: ${dC(p.bg)}, side: BorderSide.none)`
      : `ActionChip(onPressed: ${flutterOnTap(p, ctx)}, label: Text(${ctx.dartText(p.text)}, style: TextStyle(color: ${dC(p.fg)})), backgroundColor: ${dC(p.bg)}, side: BorderSide.none)`,
  toReactNative: ({ props: p }, ctx) => {
    const I = ' '.repeat(ctx.indent);
    const tag = tapKind(p) === 'none' ? 'View' : 'Pressable';
    const press = tapKind(p) === 'none' ? '' : ` onPress={${rnOnTap(p, ctx)}}`;
    return `<${tag}${press} style={{ backgroundColor: '${hex(p.bg)}', borderRadius: 999, paddingVertical: 5, paddingHorizontal: 11, alignSelf: 'flex-start' }}>
${I}  <Text style={{ color: '${hex(p.fg)}', fontSize: 12, fontWeight: '600' }}>{${J(p.text)}}</Text>
${I}</${tag}>`;
  },
};

export const divider: WidgetDefinition = {
  type: 'divider',
  label: 'Divider',
  category: 'Basic',
  icon: '<path d="M3 12h18"/>',
  rowFit: 'expanded',
  defaultProps: { color: '#E2E2E2' },
  fields: [{ key: 'color', label: 'Color', kind: 'color' }],
  Render: ({ props: p }) => <div style={{ height: 1, background: hex(p.color) }} />,
  toFlutter: ({ props: p }) => `Divider(color: ${dC(p.color)})`,
  toReactNative: ({ props: p }) => `<View style={{ height: 1, backgroundColor: '${hex(p.color)}' }} />`,
};

export const spacer: WidgetDefinition = {
  type: 'spacer',
  label: 'Spacer',
  category: 'Basic',
  icon: '<path d="M12 4v16M8 8l4-4 4 4M8 16l4 4 4-4"/>',
  defaultProps: { height: 16 },
  fields: [{ key: 'height', label: 'Height', kind: 'number', min: 0, max: 400 }],
  Render: ({ props: p, mode }) => <div className={mode === 'edit' ? 'x-spacer' : undefined} style={{ height: n(p.height) }} />,
  toFlutter: ({ props: p }) => `SizedBox(height: ${n(p.height)})`,
  toReactNative: ({ props: p }) => `<View style={{ height: ${n(p.height)} }} />`,
};
