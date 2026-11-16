import type { WidgetDefinition } from './types';

/**
 * The widget registry. Every widget — built-in or from a plugin — is
 * registered here, and the editor, inspector and code generators all read
 * from it. Adding a widget never requires touching the editor.
 */
const registry = new Map<string, WidgetDefinition>();

export function registerWidget(def: WidgetDefinition) {
  if (registry.has(def.type) && registry.get(def.type) !== def) {
    console.warn(`[registry] Widget "${def.type}" was registered twice; the later one wins.`);
  }
  registry.set(def.type, def);
}

export function getWidget(type: string): WidgetDefinition | undefined {
  return registry.get(type);
}

export function allWidgets(): WidgetDefinition[] {
  return [...registry.values()];
}

export function widgetsByCategory(): [string, WidgetDefinition[]][] {
  const groups = new Map<string, WidgetDefinition[]>();
  for (const w of registry.values()) {
    if (!groups.has(w.category)) groups.set(w.category, []);
    groups.get(w.category)!.push(w);
  }
  return [...groups.entries()];
}
