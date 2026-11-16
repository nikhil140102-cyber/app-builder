import { getWidget } from '@/core/registry';
import type { AppDoc, CodegenContext, WidgetNode } from '@/core/types';
import { dartString, jsString, n, pad, pascal, s as str, slug, snake, uniqueNames } from './helpers';

/** True if text contains {{placeholders}} that must be filled at runtime. */
export const hasBinding = (v: unknown) => /\{\{\s*[\w.]+\s*\}\}/.test(String(v ?? ''));

export interface PageNames {
  className: string; // HomePage
  fileName: string; // home_page.dart
  route: string; // '/' or '/cart'
  screen: string; // React Navigation name
  component: string; // HomeScreen
}

/** Stable, collision-free names for every page, shared by all generators. */
export function pageNames(doc: AppDoc): Map<string, PageNames> {
  const bases = uniqueNames(doc.pages, (p) => pascal(p.name));
  const screens = uniqueNames(doc.pages, (p) => p.name.trim() || 'Page');
  const map = new Map<string, PageNames>();
  doc.pages.forEach((p, i) => {
    const base = bases[i];
    map.set(p.id, {
      className: `${base}Page`,
      fileName: `${snake(base)}_page.dart`,
      route: i === 0 ? '/' : `/${slug(base)}`,
      screen: screens[i],
      component: `${base}Screen`,
    });
  });
  return map;
}

type Target = 'flutter' | 'reactNative';

/** Pages shown in the bottom navigation bar, in order (empty when the bar is off). */
export function navPages(doc: AppDoc) {
  if (!doc.nav?.enabled) return [];
  const ids = new Set(doc.pages.map((p) => p.id));
  return doc.nav.items.filter((it) => ids.has(it.pageId));
}

const FLUTTER_ALIGN: Record<string, string> = { start: 'Alignment.centerLeft', center: 'Alignment.center', end: 'Alignment.centerRight' };
const RN_ALIGN: Record<string, string> = { start: 'flex-start', center: 'center', end: 'flex-end' };

/** Walks the widget tree and asks each widget definition for its code. */
export function makeRenderer(doc: AppDoc, target: Target) {
  const names = pageNames(doc);
  const tabIds = new Set(navPages(doc).map((it) => it.pageId));
  const sep = target === 'flutter' ? ',\n' : '\n';

  function render(node: WidgetNode, indent: number, inRow: boolean, inList = false): string {
    const def = getWidget(node.type);
    if (!def) {
      return target === 'flutter'
        ? `const SizedBox.shrink() /* unknown widget: ${node.type} */`
        : `{/* unknown widget: ${node.type} */}`;
    }
    const ctx: CodegenContext = {
      doc,
      indent,
      inRow,
      inList,
      dartText: (v) => {
        const raw = String(v ?? '');
        if (target !== 'flutter' || !hasBinding(raw)) return dartString(raw);
        return `fill(${inList ? 'item' : 'pageItem(context)'}, ${dartString(raw)})`;
      },
      routeFor: (id) => names.get(id)?.route ?? null,
      screenFor: (id) => names.get(id)?.screen ?? null,
      rnNavigate: (id) => {
        const nm = names.get(id);
        if (!nm) return null;
        return tabIds.has(id)
          ? `navigation.navigate('AppTabs', { screen: ${jsString(nm.screen)} })`
          : `navigation.navigate(${jsString(nm.screen)})`;
      },
      renderChildren: ({ inRow: childInRow, extraIndent, inList: childInList }) => {
        const kids = node.children ?? [];
        if (!kids.length) return '';
        const ci = indent + extraIndent;
        return kids.map((c) => pad(ci) + render(c, ci, childInRow, childInList ?? inList)).join(sep) + (target === 'flutter' ? ',' : '');
      },
    };
    let code = target === 'flutter' ? def.toFlutter(node, ctx) : def.toReactNative(node, ctx);

    // Universal layout settings available on every widget.
    const space = n(node.props._pad);
    const align = inRow ? '' : str(node.props._align);
    if (target === 'flutter') {
      if (FLUTTER_ALIGN[align]) code = `Align(alignment: ${FLUTTER_ALIGN[align]}, child: ${code})`;
      if (space > 0) code = `Padding(padding: const EdgeInsets.all(${space}), child: ${code})`;
    } else if (space > 0 || RN_ALIGN[align]) {
      const style = [space > 0 ? `padding: ${space}` : '', RN_ALIGN[align] ? `alignItems: '${RN_ALIGN[align]}'` : ''].filter(Boolean).join(', ');
      code = `<View style={{ ${style} }}>\n${pad(indent + 2)}${code.replace(/\n/g, '\n  ')}\n${pad(indent)}</View>`;
    }

    if (inRow && def.rowFit) {
      if (target === 'flutter') {
        code = `${def.rowFit === 'expanded' ? 'Expanded' : 'Flexible'}(child: ${code})`;
      } else {
        const style = def.rowFit === 'expanded' ? 'flex: 1' : 'flexShrink: 1';
        code = `<View style={{ ${style} }}>\n${pad(indent + 2)}${code.replace(/\n/g, '\n  ')}\n${pad(indent)}</View>`;
      }
    }
    return code;
  }

  function renderList(nodes: WidgetNode[], indent: number): string {
    if (!nodes.length) return '';
    return nodes.map((n) => pad(indent) + render(n, indent, false)).join(sep) + (target === 'flutter' ? ',' : '');
  }

  return { names, render, renderList };
}
