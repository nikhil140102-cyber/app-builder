import { dartColor as dC, hex, n, s } from '@/codegen/helpers';
import type { WidgetDefinition } from '@/core/types';

const JUSTIFY_CSS: Record<string, string> = {
  spaceBetween: 'space-between',
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
};

export const card: WidgetDefinition = {
  type: 'card',
  label: 'Card',
  category: 'Layout',
  icon: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8 9h8M8 13h5"/>',
  container: 'vertical',
  rowFit: 'expanded',
  defaultProps: { bg: '#FFFFFF', padding: 16, radius: 16 },
  fields: [
    { key: 'bg', label: 'Background', kind: 'color', group: 'Style' },
    { key: 'padding', label: 'Inner padding', kind: 'number', min: 0, max: 64, group: 'Style' },
    { key: 'radius', label: 'Corner radius', kind: 'number', min: 0, max: 48, group: 'Style' },
  ],
  Render: ({ props: p, renderChildren }) =>
    renderChildren?.({
      background: hex(p.bg),
      padding: n(p.padding),
      borderRadius: n(p.radius),
      boxShadow: '0 1px 3px rgba(0,0,0,.08)',
      gap: 8,
    }),
  toFlutter: ({ props: p }, ctx) => {
    const I = ' '.repeat(ctx.indent);
    return `Container(
${I}  padding: EdgeInsets.all(${n(p.padding)}),
${I}  decoration: BoxDecoration(color: ${dC(p.bg)}, borderRadius: BorderRadius.circular(${n(p.radius)}), boxShadow: const [BoxShadow(color: Color(0x14000000), blurRadius: 4, offset: Offset(0, 1))]),
${I}  child: Column(
${I}    crossAxisAlignment: CrossAxisAlignment.stretch,
${I}    spacing: 8,
${I}    children: [
${ctx.renderChildren({ inRow: false, extraIndent: 6 })}
${I}    ],
${I}  ),
${I})`;
  },
  toReactNative: ({ props: p }, ctx) => {
    const I = ' '.repeat(ctx.indent);
    return `<View style={{ backgroundColor: '${hex(p.bg)}', padding: ${n(p.padding)}, borderRadius: ${n(p.radius)}, gap: 8, elevation: 1, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } }}>
${ctx.renderChildren({ inRow: false, extraIndent: 2 })}
${I}</View>`;
  },
};

export const row: WidgetDefinition = {
  type: 'row',
  label: 'Row',
  category: 'Layout',
  icon: '<rect x="3" y="8" width="6" height="8" rx="1.5"/><rect x="15" y="8" width="6" height="8" rx="1.5"/>',
  container: 'horizontal',
  rowFit: 'expanded',
  defaultProps: { justify: 'spaceBetween', gap: 8 },
  fields: [
    { key: 'justify', label: 'Distribution', kind: 'select', options: ['spaceBetween', 'start', 'center', 'end'], optionLabels: ['Spread out', 'Left', 'Centre', 'Right'] },
    { key: 'gap', label: 'Gap between items', kind: 'number', min: 0, max: 48 },
  ],
  Render: ({ props: p, renderChildren }) =>
    renderChildren?.({ justifyContent: JUSTIFY_CSS[s(p.justify)] ?? 'flex-start', gap: n(p.gap) }),
  toFlutter: ({ props: p }, ctx) => {
    const I = ' '.repeat(ctx.indent);
    return `Row(
${I}  mainAxisAlignment: MainAxisAlignment.${JUSTIFY_CSS[s(p.justify)] ? s(p.justify) : 'start'},
${I}  spacing: ${n(p.gap)},
${I}  children: [
${ctx.renderChildren({ inRow: true, extraIndent: 4 })}
${I}  ],
${I})`;
  },
  toReactNative: ({ props: p }, ctx) => {
    const I = ' '.repeat(ctx.indent);
    return `<View style={{ flexDirection: 'row', justifyContent: '${JUSTIFY_CSS[s(p.justify)] ?? 'flex-start'}', alignItems: 'center', gap: ${n(p.gap)} }}>
${ctx.renderChildren({ inRow: true, extraIndent: 2 })}
${I}</View>`;
  },
};
