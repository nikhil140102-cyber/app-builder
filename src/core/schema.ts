import { brand } from '@/config/brand';
import { newId, SAFE_ID } from './ids';
import type { AppDoc, PageDoc, WidgetNode } from './types';

/**
 * Bump this when the saved document shape changes, and add a step to
 * `migrations` so older projects keep opening.
 */
export const CURRENT_SCHEMA = 1;

export const DEFAULT_ORG = 'com.example';

const migrations: Record<number, (doc: Record<string, unknown>) => Record<string, unknown>> = {
  // 1: (doc) => ({ ...doc, newField: 'default', schemaVersion: 2 }),
};

export class InvalidProjectError extends Error {}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function cleanNode(raw: unknown): WidgetNode {
  if (!isObj(raw) || typeof raw.type !== 'string') throw new InvalidProjectError('A widget is missing its type.');
  const node: WidgetNode = {
    id: typeof raw.id === 'string' && SAFE_ID.test(raw.id) ? raw.id : newId('w'),
    type: raw.type,
    props: isObj(raw.props) ? (raw.props as WidgetNode['props']) : {},
  };
  // Buttons saved before "When tapped" existed only stored the target page.
  if (node.props.tap === undefined && typeof node.props.action === 'string') node.props.tap = node.props.action ? 'page' : 'none';
  if (Array.isArray(raw.children)) node.children = raw.children.map(cleanNode);
  return node;
}

function cleanPage(raw: unknown): PageDoc {
  if (!isObj(raw)) throw new InvalidProjectError('A page is not valid.');
  return {
    id: typeof raw.id === 'string' && SAFE_ID.test(raw.id) ? raw.id : newId('p'),
    name: typeof raw.name === 'string' && raw.name ? raw.name : 'Page',
    title: typeof raw.title === 'string' ? raw.title : '',
    showAppBar: raw.showAppBar !== false,
    requiresLogin: raw.requiresLogin === true,
    background: typeof raw.background === 'string' ? raw.background : '#FFFFFF',
    nodes: Array.isArray(raw.nodes) ? raw.nodes.map(cleanNode) : [],
  };
}

/** Upgrades an older document and validates its shape. Throws InvalidProjectError. */
export function migrate(input: unknown): AppDoc {
  if (!isObj(input)) throw new InvalidProjectError('This file is not a project.');
  let doc = input;
  let version = typeof doc.schemaVersion === 'number' ? doc.schemaVersion : 1;
  if (version > CURRENT_SCHEMA) {
    throw new InvalidProjectError(`This project was saved by a newer version (schema ${version}). Update ${brand.name} to open it.`);
  }
  while (version < CURRENT_SCHEMA) {
    const step = migrations[version];
    if (!step) throw new InvalidProjectError(`No upgrade path from schema ${version}.`);
    doc = step(doc);
    version++;
  }
  if (!Array.isArray(doc.pages) || doc.pages.length === 0) throw new InvalidProjectError('The project has no pages.');
  const now = new Date().toISOString();
  const theme = isObj(doc.theme) ? doc.theme : {};
  const pages = doc.pages.map(cleanPage);
  const pageIds = new Set(pages.map((p) => p.id));
  const rawNav = isObj(doc.nav) ? doc.nav : {};
  const nav = {
    enabled: rawNav.enabled === true,
    items: (Array.isArray(rawNav.items) ? rawNav.items : [])
      .filter((it): it is Record<string, unknown> => isObj(it) && typeof it.pageId === 'string' && pageIds.has(it.pageId))
      .map((it) => ({ pageId: it.pageId as string, label: typeof it.label === 'string' ? it.label : 'Tab', icon: typeof it.icon === 'string' ? it.icon : 'home' })),
  };
  const rawBackend = isObj(doc.backend) ? doc.backend : {};
  const str = (v: unknown) => (typeof v === 'string' ? v : '');
  const provider = ['supabase', 'firebase'].includes(str(rawBackend.provider)) ? (str(rawBackend.provider) as 'supabase' | 'firebase') : 'none';
  const backend = {
    provider,
    supabaseUrl: str(rawBackend.supabaseUrl),
    supabaseKey: str(rawBackend.supabaseKey),
    firebaseProjectId: str(rawBackend.firebaseProjectId),
    loginPageId: pageIds.has(str(rawBackend.loginPageId)) ? str(rawBackend.loginPageId) : '',
  } as const;
  const apis = (Array.isArray(doc.apis) ? doc.apis : [])
    .filter(isObj)
    .map((a) => ({ id: str(a.id) || newId('api'), name: str(a.name) || 'API', url: str(a.url), listPath: str(a.listPath) }));
  return {
    schemaVersion: CURRENT_SCHEMA,
    id: typeof doc.id === 'string' && SAFE_ID.test(doc.id) ? doc.id : newId('p'),
    name: typeof doc.name === 'string' && doc.name ? doc.name : 'Untitled app',
    org: typeof doc.org === 'string' && doc.org ? doc.org : DEFAULT_ORG,
    theme: { primary: typeof theme.primary === 'string' ? theme.primary : brand.defaultPrimary },
    nav,
    backend: { ...backend },
    apis,
    share: {
      enabled: isObj(doc.share) && doc.share.enabled === true,
      token: isObj(doc.share) && /^[A-Za-z0-9_-]{12,64}$/.test(str(doc.share.token)) ? str(doc.share.token) : '',
    },
    github: {
      repo: isObj(doc.github) && /^[\w.-]+\/[\w.-]+$/.test(str(doc.github.repo)) ? str(doc.github.repo) : '',
      webUrl: isObj(doc.github) && /^https:\/\//.test(str(doc.github.webUrl)) ? str(doc.github.webUrl) : '',
    },
    pages,
    createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : now,
    updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : now,
  };
}
