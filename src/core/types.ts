import type { CSSProperties, ReactNode } from 'react';

/* ---------- Project document (what gets saved) ---------- */

export type PropValue = string | number | boolean;
export type Props = Record<string, PropValue>;

export interface WidgetNode {
  id: string;
  type: string;
  props: Props;
  /** Present only on container widgets (card, row, …). */
  children?: WidgetNode[];
}

export interface PageDoc {
  id: string;
  name: string;
  title: string;
  showAppBar: boolean;
  background: string;
  /** Only signed-in users can open this page; others see the login page. */
  requiresLogin: boolean;
  nodes: WidgetNode[];
}

export interface AppDoc {
  schemaVersion: number;
  id: string;
  name: string;
  /** Reverse-domain prefix for the app id, e.g. com.yourcompany → com.yourcompany.my_app */
  org: string;
  theme: { primary: string };
  /** Bottom navigation bar shared by the pages listed in items. */
  nav: AppNav;
  /** Where the generated app keeps users and data. */
  backend: AppBackend;
  /** REST APIs the app reads from or sends forms to. */
  apis: ApiSource[];
  /** Live preview link for phones and clients. */
  share: { enabled: boolean; token: string };
  /** GitHub repository used for cloud builds and web publishing, as "owner/name". */
  github: { repo: string; webUrl: string };
  pages: PageDoc[];
  createdAt: string;
  updatedAt: string;
}

export interface NavItem {
  pageId: string;
  label: string;
  icon: string;
}

export type BackendProvider = 'none' | 'supabase' | 'firebase';

export interface AppBackend {
  provider: BackendProvider;
  /** The generated app's own Supabase project (publishable key only). */
  supabaseUrl: string;
  supabaseKey: string;
  /** Firebase project id, used by the "flutterfire configure" setup step. */
  firebaseProjectId: string;
  /** Page shown to signed-out users who open a members-only page. */
  loginPageId: string;
}

export interface ApiSource {
  id: string;
  name: string;
  url: string;
  /** Where the list sits in the JSON reply, e.g. "data.items". Empty = the reply itself. */
  listPath: string;
}

export interface AppNav {
  enabled: boolean;
  items: NavItem[];
}

export interface ProjectSummary {
  id: string;
  name: string;
  pageCount: number;
  updatedAt: string;
}

/* ---------- Widget definitions (the extension point) ---------- */

export type FieldKind = 'text' | 'textarea' | 'number' | 'color' | 'select' | 'boolean' | 'page' | 'icon' | 'api';

/** Inspector sections. Fields without a group go in "Content". */
export type FieldGroup = 'Content' | 'Search & filter' | 'Style' | 'Action' | 'Layout';

export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  options?: string[];
  min?: number;
  max?: number;
  help?: string;
  group?: FieldGroup;
  /** Show this field only when the widget's props match. */
  showIf?: (props: Props) => boolean;
  /** Friendly labels for select options, same order as options. */
  optionLabels?: string[];
}

export interface RenderProps {
  node: WidgetNode;
  props: Props;
  mode: 'edit' | 'preview';
  navigate: (pageId: string) => void;
  /** Runs a tap action in Preview mode (go to page, go back, or show what would happen). */
  runTap: (props: Props) => void;
  /** Data list only: renders the item template once per item (read-only). */
  renderTemplate?: (item: Record<string, unknown> | null, key: string) => ReactNode;
  /** Container widgets call this to place their child drop zone. */
  renderChildren?: (style?: CSSProperties) => ReactNode;
}

export interface CodegenContext {
  doc: AppDoc;
  /** Current indentation (spaces) of the line this widget starts on. */
  indent: number;
  /** True when the widget is a direct child of a horizontal container. */
  inRow: boolean;
  /** Flutter route ('/cart') for a page id, or null if the page no longer exists. */
  routeFor: (pageId: string) => string | null;
  /** React Navigation screen name for a page id, or null. */
  screenFor: (pageId: string) => string | null;
  /** React Native statement that opens a page (handles bottom-tab pages), or null. */
  rnNavigate: (pageId: string) => string | null;
  /** Renders this node's children. Returns '' when there are none. */
  renderChildren: (opts: { inRow: boolean; extraIndent: number; inList?: boolean }) => string;
  /** True inside a Data list template, where {{field}} placeholders are filled per item. */
  inList: boolean;
  /** Dart expression for a piece of text, filling {{field}} and {{user.email}} placeholders. */
  dartText: (value: unknown) => string;
}

export interface WidgetDefinition {
  type: string;
  label: string;
  category: string;
  /** Inner SVG markup for a 24×24 stroke icon. */
  icon: string;
  /** Set for widgets that hold other widgets. */
  container?: 'vertical' | 'horizontal';
  /** How the widget sizes itself inside a horizontal container. */
  rowFit?: 'expanded' | 'flexible';
  defaultProps: Props;
  fields: FieldDef[];
  Render: (p: RenderProps) => ReactNode;
  toFlutter: (node: WidgetNode, ctx: CodegenContext) => string;
  toReactNative: (node: WidgetNode, ctx: CodegenContext) => string;
}

export interface GeneratedFile {
  path: string;
  content: string;
  /** Mark shell scripts so they keep execute permission on macOS/Linux. */
  executable?: boolean;
  /** When saving into an existing folder, keep the user's copy if this file already exists. */
  keepIfExists?: boolean;
}
