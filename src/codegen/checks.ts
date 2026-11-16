import { getWidget } from '@/core/registry';
import { walkNodes } from '@/core/tree';
import type { AppDoc } from '@/core/types';
import { TAP_WIDGETS, tapKind, usesBackend } from './actions';
import { fieldKey } from './helpers';
import { splitList } from '@/widgets/data';
import { ORG_PATTERN, pascal } from './helpers';

export interface Check {
  level: 'error' | 'warning' | 'tip';
  message: string;
  pageId?: string;
}

/** Plain-language checks shown before export, so problems are caught in the builder. */
export function checkProject(doc: AppDoc): Check[] {
  const out: Check[] = [];
  const pageIds = new Set(doc.pages.map((p) => p.id));
  const reachable = new Set<string>([doc.pages[0].id]);

  if (!doc.name.trim()) out.push({ level: 'error', message: 'Give the app a name (right panel → App name).' });
  if (!/[a-zA-Z]/.test(doc.name)) out.push({ level: 'warning', message: 'The app name has no letters, so the code will use a default name like "my_app".' });
  if (doc.org && !ORG_PATTERN.test(doc.org)) {
    out.push({ level: 'warning', message: `App ID prefix "${doc.org}" is not valid. Use lowercase words separated by dots, like com.yourcompany. "com.example" will be used.` });
  } else if (!doc.org || doc.org === 'com.example') {
    out.push({ level: 'tip', message: 'Set your own App ID prefix (right panel → App, for example com.yourcompany) before publishing to the Play Store or App Store.' });
  }

  const seen = new Map<string, string>();
  for (const page of doc.pages) {
    const key = pascal(page.name).toLowerCase();
    if (seen.has(key)) out.push({ level: 'warning', message: `Pages "${seen.get(key)}" and "${page.name}" have names that become the same in code. Rename one so they are easy to tell apart.`, pageId: page.id });
    else seen.set(key, page.name);

    if (!page.nodes.length) out.push({ level: 'warning', message: `Page "${page.name}" is empty.`, pageId: page.id });

    walkNodes(page.nodes, (n) => {
      const def = getWidget(n.type);
      if (!def) {
        out.push({ level: 'error', message: `Page "${page.name}" uses a widget "${n.type}" that is not installed. It will be left out of the export.`, pageId: page.id });
        return;
      }
      for (const f of def.fields) {
        if (f.kind !== 'page' || (f.showIf && !f.showIf(n.props))) continue;
        const target = String(n.props[f.key] ?? '');
        if (target && pageIds.has(target)) reachable.add(target);
        else if (target) out.push({ level: 'warning', message: `A ${def.label.toLowerCase()} on "${page.name}" points to a page that was deleted. It will do nothing.`, pageId: page.id });
        else if (tapKind(n.props) === 'page') out.push({ level: 'warning', message: `A ${def.label.toLowerCase()} on "${page.name}" is set to go to a page, but no page is chosen.`, pageId: page.id });
      }
      if ((n.type === 'button' || n.type === 'iconbutton') && tapKind(n.props) === 'none') out.push({ level: 'tip', message: `A ${def.label.toLowerCase()} on "${page.name}" does nothing when tapped. Set "When tapped" in its Action section.`, pageId: page.id });
      if (['link'].includes(tapKind(n.props)) && !/^https?:\/\/[^/\s]+\.[^\s]+/.test(String(n.props.url ?? ''))) out.push({ level: 'warning', message: `A ${def.label.toLowerCase()} on "${page.name}" opens a website, but the address is incomplete.`, pageId: page.id });
      if (['call', 'whatsapp'].includes(tapKind(n.props)) && String(n.props.phone ?? '').replace(/\D/g, '').length < 8) out.push({ level: 'warning', message: `A ${def.label.toLowerCase()} on "${page.name}" needs a phone number with country code.`, pageId: page.id });
      if (n.type === 'button' && !String(n.props.label ?? '').trim()) out.push({ level: 'warning', message: `A button on "${page.name}" has no label.`, pageId: page.id });
      if (n.type === 'image' && !String(n.props.src ?? '').trim()) out.push({ level: 'tip', message: `An image on "${page.name}" has no URL, so the app shows a grey placeholder.`, pageId: page.id });
      if (n.children && !n.children.length) out.push({ level: 'tip', message: `An empty ${def.label.toLowerCase()} on "${page.name}" can be removed.`, pageId: page.id });
    });
  }

  // ----- sign-in, data and APIs -----
  const b = doc.backend;
  let needsBackend = false;
  let usesData = false;
  for (const page of doc.pages) {
    const keys = new Set<string>();
    walkNodes(page.nodes, (n) => {
      if (['input', 'checkbox', 'switch', 'dropdown'].includes(n.type)) keys.add(fieldKey(n.props));
    });
    walkNodes(page.nodes, (n) => {
      const t = tapKind(n.props);
      if (TAP_WIDGETS.has(n.type) && usesBackend(n.props)) {
        usesData = true;
        if (!(t === 'save' && String(n.props.saveTo) === 'api')) needsBackend = true;
        if ((t === 'signIn' || t === 'signUp') && !(keys.has('email') && keys.has('password')))
          out.push({ level: 'warning', message: `The ${t === 'signIn' ? 'Sign in' : 'Create account'} button on "${page.name}" needs text fields saved as "email" and "password" on the same page (Action → Save as).`, pageId: page.id });
        if (t === 'sendCode') {
          const need = String(n.props.via) === 'phone' ? 'phone' : 'email';
          if (!keys.has(need) && !keys.has('code'))
            out.push({ level: 'warning', message: `The "Send code" button on "${page.name}" needs a text field saved as "${need}" on the same page.`, pageId: page.id });
          if (b.provider === 'firebase' && need === 'email')
            out.push({ level: 'error', message: `Firebase sends codes by SMS only. Set the "Send code" button on "${page.name}" to SMS, or use Supabase.`, pageId: page.id });
          if (need === 'phone') out.push({ level: 'tip', message: 'SMS codes need an SMS provider in your backend (Supabase: Twilio, Vonage, MessageBird or Textlocal; Firebase: Phone sign-in). SMS costs money per message.' });
        }
        if (t === 'verifyCode' && !keys.has('code'))
          out.push({ level: 'warning', message: `The "Verify" button on "${page.name}" needs a text field saved as "code" on the same page.`, pageId: page.id });
        if (t === 'save' && String(n.props.saveTo) !== 'api' && !String(n.props.table ?? '').trim())
          out.push({ level: 'warning', message: `A "Save the form" button on "${page.name}" has no table name.`, pageId: page.id });
        if (t === 'save' && String(n.props.saveTo) === 'api' && !doc.apis.some((a) => a.id === n.props.api))
          out.push({ level: 'warning', message: `A "Save the form" button on "${page.name}" has no API chosen.`, pageId: page.id });
        if (t === 'save' && keys.size === 0)
          out.push({ level: 'warning', message: `A "Save the form" button on "${page.name}" has no form fields on its page to save.`, pageId: page.id });
      }
      if (n.type === 'datalist') {
        usesData = true;
        if (String(n.props.source) === 'api') {
          if (!doc.apis.some((a) => a.id === n.props.api)) out.push({ level: 'warning', message: `A Data list on "${page.name}" has no API chosen.`, pageId: page.id });
        } else {
          needsBackend = true;
          if (!String(n.props.table ?? '').trim()) out.push({ level: 'warning', message: `A Data list on "${page.name}" has no table name.`, pageId: page.id });
        }
        if (!n.children?.length) out.push({ level: 'warning', message: `A Data list on "${page.name}" is empty. Drop a Card or List item inside it and use {{field}} in its text.`, pageId: page.id });
      }
    });
    if (page.requiresLogin) needsBackend = true;

    // Search & filter: lists and the boxes / chips that drive them must use the same names.
    const filterTaps = new Set<string>();
    const listFilters = new Set<string>();
    walkNodes(page.nodes, (n) => {
      if (TAP_WIDGETS.has(n.type) && tapKind(n.props) === 'filter') filterTaps.add(String(n.props.filterField ?? '').trim() || 'filter');
      if (n.type === 'datalist') splitList(n.props.filterBy).forEach((k) => listFilters.add(k));
    });
    for (const k of listFilters) {
      if (!keys.has(k) && !filterTaps.has(k))
        out.push({ level: 'warning', message: `A Data list on "${page.name}" filters by "${k}", but no search box, dropdown or filter chip on that page is saved as "${k}".`, pageId: page.id });
    }
    for (const k of filterTaps) {
      if (!listFilters.has(k))
        out.push({ level: 'warning', message: `A filter chip on "${page.name}" sets "${k}", but no Data list on that page has "${k}" in its "Filter by".`, pageId: page.id });
    }
  }
  if (needsBackend && b.provider === 'none')
    out.push({ level: 'error', message: 'This app uses sign-in or a database, but no backend is chosen. Right panel → App → Backend → choose Supabase or Firebase.' });
  if (b.provider === 'supabase' && (!/^https:\/\/.+/.test(b.supabaseUrl) || b.supabaseKey.trim().length < 20))
    out.push({ level: 'error', message: 'Supabase is chosen but the Project URL or publishable key is missing (App → Backend).' });
  if (b.provider === 'supabase' && /secret|service_role/i.test(b.supabaseKey))
    out.push({ level: 'error', message: 'That looks like a SECRET Supabase key. Use the publishable key — the secret key must never be put inside an app.' });
  if (b.provider === 'firebase' && !b.firebaseProjectId.trim())
    out.push({ level: 'error', message: 'Firebase is chosen but the Firebase project ID is missing (App → Backend).' });
  if (doc.pages.some((p) => p.requiresLogin) && !doc.pages.some((p) => p.id === b.loginPageId && !p.requiresLogin))
    out.push({ level: 'warning', message: 'Some pages are members-only, but no login page is chosen (App → Backend → Login page). Signed-out users will see a plain "Please sign in" screen.' });
  if (doc.pages[0]?.requiresLogin)
    out.push({ level: 'tip', message: `The start page "${doc.pages[0].name}" is members-only, so new users first see the login page. That is usually what you want.` });
  if (usesData) out.push({ level: 'tip', message: 'Sign-in, Data lists and saving forms work in the Flutter export. The React Native export shows the screens without them for now.' });

  if (doc.nav?.enabled) {
    if (doc.nav.items.length < 2) out.push({ level: 'warning', message: 'The bottom navigation bar needs at least 2 pages (right panel → App → Bottom navigation).' });
    if (doc.nav.items.length > 5) out.push({ level: 'warning', message: 'The bottom navigation bar has more than 5 tabs. Phones fit 3–5 comfortably.' });
    if (doc.nav.items.length && !doc.nav.items.some((it) => it.pageId === doc.pages[0].id)) out.push({ level: 'warning', message: `The start page "${doc.pages[0].name}" is not in the bottom navigation bar, so the bar only appears after users open one of its pages.` });
    doc.nav.items.forEach((it) => reachable.add(it.pageId));
  }

  for (const page of doc.pages.slice(1)) {
    if (!reachable.has(page.id)) out.push({ level: 'warning', message: `No button opens page "${page.name}", so users cannot reach it. Add a button with When tapped → Go to a page → ${page.name}, or add it to the bottom navigation bar.`, pageId: page.id });
  }

  const order = { error: 0, warning: 1, tip: 2 };
  return out.sort((a, b) => order[a.level] - order[b.level]);
}
