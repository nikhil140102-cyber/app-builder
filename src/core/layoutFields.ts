import type { FieldDef } from './types';

/** Settings every widget gets, shown in the inspector's Layout section. */
export const LAYOUT_FIELDS: FieldDef[] = [
  { key: '_pad', label: 'Space around (px)', kind: 'number', min: 0, max: 64, group: 'Layout' },
  {
    key: '_align',
    label: 'Horizontal position',
    kind: 'select',
    group: 'Layout',
    options: ['', 'start', 'center', 'end'],
    optionLabels: ['Default', 'Left', 'Centre', 'Right'],
    help: 'Has no effect inside a Row.',
  },
];
