import { dartColor as dC, hex, jsString as J, n } from '@/codegen/helpers';
import { definePlugin } from '@/core/plugins';

/**
 * Example plugin. Copy this folder to create your own widget pack,
 * then add it to src/plugins/index.ts.
 */
export default definePlugin({
  id: 'rating',
  name: 'Star rating',
  version: '1.0.0',
  description: 'Adds a star rating widget.',
  widgets: [
    {
      type: 'rating',
      label: 'Rating',
      category: 'Content',
      icon: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
      defaultProps: { value: 4, max: 5, size: 20, color: '#E8A317' },
      fields: [
        { key: 'value', label: 'Stars filled', kind: 'number', min: 0, max: 10 },
        { key: 'max', label: 'Total stars', kind: 'number', min: 1, max: 10 },
        { key: 'size', label: 'Star size', kind: 'number', min: 10, max: 48 },
        { key: 'color', label: 'Color', kind: 'color' },
      ],
      Render: ({ props: p }) => {
        const max = Math.max(1, n(p.max));
        const val = Math.min(max, n(p.value));
        return (
          <div style={{ color: hex(p.color), fontSize: n(p.size), letterSpacing: 2, lineHeight: 1 }} aria-label={`${val} of ${max} stars`}>
            {'★'.repeat(val)}
            <span style={{ opacity: 0.3 }}>{'★'.repeat(max - val)}</span>
          </div>
        );
      },
      toFlutter: ({ props: p }) =>
        `Row(mainAxisSize: MainAxisSize.min, children: List.generate(${Math.max(1, n(p.max))}, (i) => Icon(i < ${n(p.value)} ? Icons.star : Icons.star_border, color: ${dC(p.color)}, size: ${n(p.size)})))`,
      toReactNative: ({ props: p }) => {
        const max = Math.max(1, n(p.max));
        const val = Math.min(max, n(p.value));
        return `<Text style={{ color: '${hex(p.color)}', fontSize: ${n(p.size)}, letterSpacing: 2 }}>{${J('★'.repeat(val) + '☆'.repeat(max - val))}}</Text>`;
      },
    },
  ],
});
