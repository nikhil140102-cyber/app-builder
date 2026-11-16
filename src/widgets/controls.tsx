import { useState } from 'react';
import { flutterOnTap, rnOnTap, TAP_DEFAULTS, TAP_FIELDS } from '@/codegen/actions';
import { b, dartColor as dC, dartString as dS, fieldKey, hex, jsString as J, n, s } from '@/codegen/helpers';
import { iconDef, iconSvg } from '@/core/icons';
import { useEditor } from '@/core/store';
import type { WidgetDefinition } from '@/core/types';

/** Splits a "one per line" list into clean, unique options. */
export function optionList(v: unknown): string[] {
  const list = String(v ?? '')
    .split(/\r?\n|,/)
    .map((x) => x.trim())
    .filter(Boolean);
  return [...new Set(list)].length ? [...new Set(list)] : ['Option 1'];
}

function Svg({ name, size, color }: { name: unknown; size: number; color: string }) {
  return <span style={{ display: 'inline-flex', lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: iconSvg(name, size, color) }} />;
}

export const icon: WidgetDefinition = {
  type: 'icon',
  label: 'Icon',
  category: 'Basic',
  icon: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
  defaultProps: { name: 'star', size: 28, color: '#1B1B1B' },
  fields: [
    { key: 'name', label: 'Icon', kind: 'icon' },
    { key: 'size', label: 'Size', kind: 'number', min: 12, max: 96, group: 'Style' },
    { key: 'color', label: 'Colour', kind: 'color', group: 'Style' },
  ],
  Render: ({ props: p }) => <Svg name={p.name} size={n(p.size)} color={hex(p.color)} />,
  toFlutter: ({ props: p }) => `Icon(Icons.${iconDef(p.name).flutter}, size: ${n(p.size)}, color: ${dC(p.color)})`,
  toReactNative: ({ props: p }) => `<MaterialIcons name=${J(iconDef(p.name).rn)} size={${n(p.size)}} color="${hex(p.color)}" />`,
};

export const iconButton: WidgetDefinition = {
  type: 'iconbutton',
  label: 'Icon button',
  category: 'Basic',
  icon: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8.5v7M8.5 12h7"/>',
  defaultProps: { name: 'add', size: 24, color: '#FFFFFF', bg: '#0F7F64', label: '', ...TAP_DEFAULTS },
  fields: [
    { key: 'name', label: 'Icon', kind: 'icon' },
    { key: 'label', label: 'Description (for screen readers)', kind: 'text' },
    { key: 'size', label: 'Icon size', kind: 'number', min: 12, max: 48, group: 'Style' },
    { key: 'color', label: 'Icon colour', kind: 'color', group: 'Style' },
    { key: 'bg', label: 'Background', kind: 'color', group: 'Style' },
    ...TAP_FIELDS,
  ],
  Render: ({ props: p, mode, runTap }) => (
    <span
      role={mode === 'preview' ? 'button' : undefined}
      aria-label={s(p.label) || undefined}
      onClick={() => mode === 'preview' && runTap(p)}
      style={{ display: 'inline-flex', padding: 10, borderRadius: 999, background: hex(p.bg), cursor: mode === 'preview' ? 'pointer' : undefined }}
    >
      <Svg name={p.name} size={n(p.size)} color={hex(p.color)} />
    </span>
  ),
  toFlutter: ({ props: p }, ctx) =>
    `IconButton(onPressed: ${flutterOnTap(p, ctx)}, tooltip: ${dS(s(p.label) || iconDef(p.name).label)}, style: IconButton.styleFrom(backgroundColor: ${dC(p.bg)}), icon: Icon(Icons.${iconDef(p.name).flutter}, size: ${n(p.size)}, color: ${dC(p.color)}))`,
  toReactNative: ({ props: p }, ctx) => {
    const I = ' '.repeat(ctx.indent);
    return `<Pressable onPress={${rnOnTap(p, ctx)}} accessibilityLabel={${J(s(p.label) || iconDef(p.name).label)}} style={{ backgroundColor: '${hex(p.bg)}', borderRadius: 999, padding: 10, alignSelf: 'flex-start' }}>
${I}  <MaterialIcons name=${J(iconDef(p.name).rn)} size={${n(p.size)}} color="${hex(p.color)}" />
${I}</Pressable>`;
  },
};

export const checkbox: WidgetDefinition = {
  type: 'checkbox',
  label: 'Checkbox',
  category: 'Form',
  icon: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12.5l3 3 5-6"/>',
  rowFit: 'expanded',
  defaultProps: { label: 'I agree to the terms', checked: false },
  fields: [
    { key: 'label', label: 'Label', kind: 'text' },
    { key: 'checked', label: 'Ticked at start', kind: 'boolean' },

    { key: 'field', label: 'Save as (field name)', kind: 'text', group: 'Action', help: 'Used by Sign in / Save the form. Sign-in needs fields named email and password.' },
  ],
  Render: function Checkbox({ props: p, mode }) {
    const [on, setOn] = useState(b(p.checked));
    const value = mode === 'preview' ? on : b(p.checked);
    return (
      <label className="x-check" onClick={(e) => { if (mode === 'preview') { e.preventDefault(); setOn(!on); } }}>
        <span className={`box${value ? ' on' : ''}`}>{value ? '✓' : ''}</span>
        {s(p.label)}
      </label>
    );
  },
  toFlutter: ({ props: p }) => `AbCheckbox(label: ${dS(p.label)}, initial: ${b(p.checked)}, onChanged: (v) => setValue(${dS(fieldKey(p))}, v))`,
  toReactNative: ({ props: p }) => `<AbCheckbox label={${J(p.label)}} initial={${b(p.checked)}} />`,
};

export const toggle: WidgetDefinition = {
  type: 'switch',
  label: 'Switch',
  category: 'Form',
  icon: '<rect x="3" y="7.5" width="18" height="9" rx="4.5"/><circle cx="15.5" cy="12" r="2.5"/>',
  rowFit: 'expanded',
  defaultProps: { label: 'Notifications', on: true },
  fields: [
    { key: 'label', label: 'Label', kind: 'text' },
    { key: 'on', label: 'On at start', kind: 'boolean' },

    { key: 'field', label: 'Save as (field name)', kind: 'text', group: 'Action', help: 'Used by Sign in / Save the form. Sign-in needs fields named email and password.' },
  ],
  Render: function Toggle({ props: p, mode }) {
    const [on, setOn] = useState(b(p.on));
    const value = mode === 'preview' ? on : b(p.on);
    return (
      <div className="x-switch" onClick={() => mode === 'preview' && setOn(!on)}>
        <span>{s(p.label)}</span>
        <span className={`track${value ? ' on' : ''}`}><i /></span>
      </div>
    );
  },
  toFlutter: ({ props: p }) => `AbSwitch(label: ${dS(p.label)}, initial: ${b(p.on)}, onChanged: (v) => setValue(${dS(fieldKey(p))}, v))`,
  toReactNative: ({ props: p }) => `<AbSwitch label={${J(p.label)}} initial={${b(p.on)}} />`,
};

export const dropdown: WidgetDefinition = {
  type: 'dropdown',
  label: 'Dropdown',
  category: 'Form',
  icon: '<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M14 11l2 2 2-2"/>',
  rowFit: 'expanded',
  defaultProps: { label: 'City', options: 'Delhi\nMumbai\nBengaluru\nJaipur' },
  fields: [
    { key: 'label', label: 'Label', kind: 'text' },
    { key: 'options', label: 'Options (one per line)', kind: 'textarea' },

    { key: 'field', label: 'Save as (field name)', kind: 'text', group: 'Action', help: 'Used by Sign in / Save the form. Sign-in needs fields named email and password.' },
  ],
  Render: function Dropdown({ props: p, mode }) {
    const opts = optionList(p.options);
    const [value, setValue] = useState(opts[0]);
    return (
      <div className="x-field">
        <label>{s(p.label)}</label>
        {mode === 'preview' ? (
          <select value={opts.includes(value) ? value : opts[0]} onChange={(e) => {
              setValue(e.target.value);
              useEditor.getState().setFormValue(fieldKey(p), e.target.value);
            }} aria-label={s(p.label)}>
            {opts.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        ) : (
          <div className="x-select">{opts[0]} <span>▾</span></div>
        )}
      </div>
    );
  },
  toFlutter: ({ props: p }) => `AbDropdown(label: ${dS(p.label)}, options: const [${optionList(p.options).map((o) => dS(o)).join(', ')}], onChanged: (v) => setValue(${dS(fieldKey(p))}, v))`,
  toReactNative: ({ props: p }) => `<AbDropdown label={${J(p.label)}} options={${JSON.stringify(optionList(p.options))}} />`,
};

/** Widgets whose Flutter code needs lib/widgets/form_controls.dart. */
export const FORM_HELPER_TYPES = new Set(['checkbox', 'switch', 'dropdown']);
