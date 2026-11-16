import { registerWidget } from './registry';
import type { WidgetDefinition } from './types';

/**
 * A plugin bundles extra functionality. Today plugins can add widgets;
 * the shape leaves room for templates, export targets and inspector panels.
 */
export interface AppBuilderPlugin {
  id: string;
  name: string;
  version: string;
  description?: string;
  widgets?: WidgetDefinition[];
}

const installed = new Map<string, AppBuilderPlugin>();

export function definePlugin(plugin: AppBuilderPlugin): AppBuilderPlugin {
  return plugin;
}

export function installPlugin(plugin: AppBuilderPlugin) {
  if (installed.has(plugin.id)) return;
  plugin.widgets?.forEach(registerWidget);
  installed.set(plugin.id, plugin);
}

export function installedPlugins(): AppBuilderPlugin[] {
  return [...installed.values()];
}
