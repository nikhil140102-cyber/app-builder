import { installPlugin } from '@/core/plugins';
import { registerWidget } from '@/core/registry';
import { plugins } from '@/plugins';
import { button, chip, divider, heading, image, spacer, text } from './basic';
import { listItem, textField } from './content';
import { card, row } from './layout';
import { checkbox, dropdown, icon, iconButton, toggle } from './controls';
import { dataList } from './data';

let done = false;

/** Registers built-in widgets and installs plugins. Safe to call many times. */
export function setupWidgets() {
  if (done) return;
  [heading, text, button, icon, iconButton, image, chip, divider, spacer, card, row, listItem, textField, checkbox, toggle, dropdown, dataList].forEach(registerWidget);
  plugins.forEach(installPlugin);
  done = true;
}

setupWidgets();
