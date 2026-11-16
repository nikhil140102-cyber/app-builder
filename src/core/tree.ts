import { newId } from './ids';
import { getWidget } from './registry';
import type { PageDoc, Props, WidgetNode } from './types';

export interface FoundNode {
  node: WidgetNode;
  list: WidgetNode[];
  index: number;
  parent: WidgetNode | null;
}

export function findNode(nodes: WidgetNode[], id: string, parent: WidgetNode | null = null): FoundNode | null {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.id === id) return { node, list: nodes, index: i, parent };
    if (node.children) {
      const hit = findNode(node.children, id, node);
      if (hit) return hit;
    }
  }
  return null;
}

/** True if `id` is `node` itself or anywhere inside it. */
export function containsId(node: WidgetNode, id: string): boolean {
  if (node.id === id) return true;
  return (node.children ?? []).some((c) => containsId(c, id));
}

/** The child list for a drop target: 'root' means the page itself. */
export function listFor(page: PageDoc, parentId: string): WidgetNode[] | null {
  if (parentId === 'root') return page.nodes;
  const hit = findNode(page.nodes, parentId);
  return hit?.node.children ?? null;
}

export function createNode(type: string, props: Props = {}, children?: WidgetNode[]): WidgetNode {
  const def = getWidget(type);
  if (!def) throw new Error(`Unknown widget type "${type}"`);
  const node: WidgetNode = { id: newId('w'), type, props: { ...def.defaultProps, ...props } };
  if (def.container) node.children = children ?? [];
  return node;
}

export function cloneWithNewIds<T extends WidgetNode>(node: T): T {
  const copy = structuredClone(node);
  const walk = (n: WidgetNode) => {
    n.id = newId('w');
    n.children?.forEach(walk);
  };
  walk(copy);
  return copy;
}

export function walkNodes(nodes: WidgetNode[], fn: (n: WidgetNode) => void) {
  for (const n of nodes) {
    fn(n);
    if (n.children) walkNodes(n.children, fn);
  }
}

export function nodeSummary(node: WidgetNode): string {
  const def = getWidget(node.type);
  const text = node.props.text ?? node.props.label ?? node.props.title;
  return (def?.label ?? node.type) + (text ? ` · ${String(text)}` : '');
}
