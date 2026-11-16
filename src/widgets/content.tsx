import { dartString as dS, fieldKey, jsString as J, s } from '@/codegen/helpers';
import type { WidgetDefinition } from '@/core/types';

const FLUTTER_KEYBOARD: Record<string, string> = { email: 'TextInputType.emailAddress', number: 'TextInputType.number', phone: 'TextInputType.phone' };
const RN_KEYBOARD: Record<string, string> = { email: ' keyboardType="email-address" autoCapitalize="none"', number: ' keyboardType="numeric"', phone: ' keyboardType="phone-pad"' };

export const listItem: WidgetDefinition = {
  type: 'listtile',
  label: 'List item',
  category: 'Content',
  icon: '<path d="M4 7h10M4 11h7M4 17h10M18 8h2M18 17h2"/>',
  rowFit: 'expanded',
  defaultProps: { title: 'List item', subtitle: 'Supporting text', trailing: '' },
  fields: [
    { key: 'title', label: 'Title', kind: 'text' },
    { key: 'subtitle', label: 'Subtitle', kind: 'text' },
    { key: 'trailing', label: 'Trailing text', kind: 'text' },
  ],
  Render: ({ props: p }) => (
    <div className="x-tile">
      <div>
        <b>{s(p.title)}</b>
        {s(p.subtitle) && <span>{s(p.subtitle)}</span>}
      </div>
      {s(p.trailing) && <em>{s(p.trailing)}</em>}
    </div>
  ),
  toFlutter: ({ props: p }, ctx) =>
    `ListTile(contentPadding: EdgeInsets.zero, title: Text(${ctx.dartText(p.title)})` +
    (s(p.subtitle) ? `, subtitle: Text(${ctx.dartText(p.subtitle)})` : '') +
    (s(p.trailing) ? `, trailing: Text(${ctx.dartText(p.trailing)}, style: const TextStyle(fontWeight: FontWeight.w600))` : '') +
    ')',
  toReactNative: ({ props: p }, ctx) => {
    const I = ' '.repeat(ctx.indent);
    return `<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}>
${I}  <View style={{ flexShrink: 1 }}>
${I}    <Text style={{ fontSize: 15, fontWeight: '600' }}>{${J(p.title)}}</Text>${s(p.subtitle) ? `\n${I}    <Text style={{ fontSize: 13, color: '#6A6A6A' }}>{${J(p.subtitle)}}</Text>` : ''}
${I}  </View>${s(p.trailing) ? `\n${I}  <Text style={{ fontWeight: '600' }}>{${J(p.trailing)}}</Text>` : ''}
${I}</View>`;
  },
};

export const textField: WidgetDefinition = {
  type: 'input',
  label: 'Text field',
  category: 'Form',
  icon: '<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M7 10v4"/>',
  rowFit: 'expanded',
  defaultProps: { label: 'Label', hint: 'Type here…', obscure: false, keyboard: 'text', field: '' },
  fields: [
    { key: 'label', label: 'Label', kind: 'text' },
    { key: 'hint', label: 'Placeholder', kind: 'text' },
    { key: 'keyboard', label: 'Keyboard', kind: 'select', options: ['text', 'email', 'number', 'phone'], optionLabels: ['Normal', 'Email', 'Numbers', 'Phone number'] },
    { key: 'obscure', label: 'Hide what is typed (passwords)', kind: 'boolean' },
    { key: 'field', label: 'Save as (field name)', kind: 'text', group: 'Action', help: 'Used by Sign in / Save the form. Sign-in needs fields named email and password.' },
  ],
  Render: ({ props: p, mode }) => (
    <div className="x-field">
      <label>{s(p.label)}</label>
      {mode === 'preview' ? (
        <input type={p.obscure === true ? 'password' : 'text'} placeholder={s(p.hint)} aria-label={s(p.label)} />
      ) : (
        <div>{s(p.hint)}</div>
      )}
    </div>
  ),
  toFlutter: ({ props: p }) =>
    `TextField(controller: field(${dS(fieldKey(p))}), ${p.obscure === true ? 'obscureText: true, ' : ''}${FLUTTER_KEYBOARD[s(p.keyboard)] ? `keyboardType: ${FLUTTER_KEYBOARD[s(p.keyboard)]}, ` : ''}decoration: InputDecoration(labelText: ${dS(p.label)}, hintText: ${dS(p.hint)}, border: const OutlineInputBorder()))`,
  toReactNative: ({ props: p }, ctx) => {
    const I = ' '.repeat(ctx.indent);
    return `<View style={{ gap: 6 }}>
${I}  <Text style={{ fontSize: 13, color: '#5A5A5A' }}>{${J(p.label)}}</Text>
${I}  <TextInput placeholder={${J(p.hint)}}${p.obscure === true ? ' secureTextEntry' : ''}${RN_KEYBOARD[s(p.keyboard)] ?? ''} style={{ borderWidth: 1, borderColor: '#CFCFCF', borderRadius: 10, padding: 12 }} />
${I}</View>`;
  },
};
