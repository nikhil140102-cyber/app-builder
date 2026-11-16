import type { CodegenContext, FieldDef, Props } from '@/core/types';
import { dartString as dS, jsString as J, s } from './helpers';

/**
 * What happens when a button or icon button is tapped.
 * Older projects only stored `action` (a page id); they read as "page".
 */
export type TapKind = 'none' | 'page' | 'back' | 'link' | 'call' | 'whatsapp' | 'message' | 'signIn' | 'signUp' | 'signOut' | 'save' | 'sendCode' | 'verifyCode';

/** Taps that use the app's backend and the form values on the page. */
const BACKEND_TAPS: TapKind[] = ['signIn', 'signUp', 'signOut', 'save', 'sendCode', 'verifyCode'];
const OTP_TAPS: TapKind[] = ['sendCode', 'verifyCode'];
export const usesBackend = (p: Props) => BACKEND_TAPS.includes(tapKind(p));

export function tapKind(p: Props): TapKind {
  const t = s(p.tap) as TapKind;
  if (t) return t;
  return s(p.action) ? 'page' : 'none';
}

export const TAP_DEFAULTS: Props = { via: 'email', tap: 'none', action: '', after: '', url: 'https://', phone: '', message: 'Done!', saveTo: 'table', table: '', api: '', withItem: false };

export const TAP_FIELDS: FieldDef[] = [
  {
    key: 'tap',
    label: 'When tapped',
    kind: 'select',
    group: 'Action',
    options: ['none', 'page', 'back', 'link', 'call', 'whatsapp', 'message', 'signIn', 'signUp', 'signOut', 'save', 'sendCode', 'verifyCode'],
    optionLabels: [
      'Do nothing',
      'Go to a page',
      'Go back',
      'Open a website',
      'Call a number',
      'Open WhatsApp chat',
      'Show a message',
      'Sign in (uses the email and password fields)',
      'Create account (email, password, name fields)',
      'Sign out',
      'Save the form (to a table or API)',
      'Send a one-time code (OTP login)',
      'Verify the code and sign in (OTP login)',
    ],
  },
  {
    key: 'via',
    label: 'Code sent by',
    kind: 'select',
    group: 'Action',
    options: ['email', 'phone'],
    optionLabels: ['Email (uses the field saved as email)', 'SMS (uses the field saved as phone)'],
    showIf: (p) => OTP_TAPS.includes(tapKind(p)),
    help: 'The code box must be saved as "code".',
  },
  { key: 'action', label: 'Page', kind: 'page', group: 'Action', showIf: (p) => tapKind(p) === 'page' },
  {
    key: 'saveTo',
    label: 'Save to',
    kind: 'select',
    group: 'Action',
    options: ['table', 'api'],
    optionLabels: ['A database table / collection', 'An API (sends a POST request)'],
    showIf: (p) => tapKind(p) === 'save',
  },
  { key: 'table', label: 'Table / collection name', kind: 'text', group: 'Action', showIf: (p) => tapKind(p) === 'save' && s(p.saveTo) !== 'api', help: 'Each field name on this page becomes a column.' },
  { key: 'api', label: 'API', kind: 'api', group: 'Action', showIf: (p) => tapKind(p) === 'save' && s(p.saveTo) === 'api' },
  {
    key: 'withItem',
    label: 'Also save the item this page shows',
    kind: 'boolean',
    group: 'Action',
    showIf: (p) => tapKind(p) === 'save',
    help: 'For pages opened from a Data list (e.g. the dish being ordered). Saved as "item".',
  },
  { key: 'after', label: 'Then go to (optional)', kind: 'page', group: 'Action', showIf: (p) => BACKEND_TAPS.includes(tapKind(p)) },
  { key: 'url', label: 'Website address', kind: 'text', group: 'Action', showIf: (p) => tapKind(p) === 'link', help: 'Starts with https://' },
  { key: 'phone', label: 'Phone number', kind: 'text', group: 'Action', showIf: (p) => ['call', 'whatsapp'].includes(tapKind(p)), help: 'With country code, e.g. +919876543210' },
  { key: 'message', label: 'Message', kind: 'text', group: 'Action', showIf: (p) => tapKind(p) === 'message' || tapKind(p) === 'save', help: 'For "Save the form": shown after saving.' },
];

const digits = (v: unknown) => s(v as string).replace(/[^\d+]/g, '');
const waNumber = (v: unknown) => s(v as string).replace(/\D/g, '');

/** True if this tap needs the url_launcher package in Flutter. */
export function needsLauncher(p: Props) {
  return ['link', 'call', 'whatsapp'].includes(tapKind(p));
}

/** Dart expression for onPressed. */
export function flutterOnTap(p: Props, ctx: CodegenContext): string {
  switch (tapKind(p)) {
    case 'page': {
      const route = ctx.routeFor(s(p.action));
      if (!route) return '() {}';
      // Inside a Data list the tapped row goes along; elsewhere the page's own row is passed on.
      return ctx.inList
        ? `() => Navigator.pushNamed(context, '${route}', arguments: item)`
        : `() => Navigator.pushNamed(context, '${route}', arguments: ModalRoute.of(context)?.settings.arguments)`;
    }
    case 'back':
      return '() => Navigator.maybePop(context)';
    case 'link':
      return `() => launchUrl(Uri.parse(${dS(p.url)}), mode: LaunchMode.externalApplication)`;
    case 'call':
      return `() => launchUrl(Uri.parse(${dS('tel:' + digits(p.phone))}))`;
    case 'whatsapp':
      return `() => launchUrl(Uri.parse(${dS('https://wa.me/' + waNumber(p.phone))}), mode: LaunchMode.externalApplication)`;
    case 'message':
      return `() => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(${dS(p.message)})))`;
    case 'signIn':
      return `() => run(() => Backend.signIn(text('email'), text('password')), goTo: ${afterRoute(p, ctx)})`;
    case 'signUp':
      return `() => run(() => Backend.signUp(text('email'), text('password'), name: text('name')), goTo: ${afterRoute(p, ctx)})`;
    case 'sendCode': {
      const phone = s(p.via) === 'phone';
      const msg = phone ? 'Code sent by SMS.' : 'Code sent. Check your email.';
      return `() => run(() => Backend.sendCode(text('${phone ? 'phone' : 'email'}'), phone: ${phone}), message: ${dS(msg)}, goTo: ${afterRoute(p, ctx)}, clear: false)`;
    }
    case 'verifyCode': {
      const phone = s(p.via) === 'phone';
      return `() => run(() => Backend.verifyCode(text('code'), contact: text('${phone ? 'phone' : 'email'}'), phone: ${phone}), goTo: ${afterRoute(p, ctx)})`;
    }
    case 'signOut': {
      const login = ctx.routeFor(ctx.doc.backend.loginPageId);
      const after = ctx.routeFor(s(p.after));
      return `() => run(Backend.signOut, goTo: ${dS(after ?? login ?? '/')})`;
    }
    case 'save': {
      const msg = s(p.message).trim() ? `, message: ${dS(p.message)}` : '';
      const data = p.withItem ? `{...collect(), 'item': pageItem(context)}` : 'collect()';
      if (s(p.saveTo) === 'api') {
        const api = ctx.doc.apis.find((a) => a.id === s(p.api));
        return api
          ? `() => run(() => Api.post(${dS(api.url)}, ${data})${msg}, goTo: ${afterRoute(p, ctx)})`
          : `() => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No API chosen for this button.')))`;
      }
      return `() => run(() => Backend.insert(${dS(s(p.table).trim() || 'items')}, ${data})${msg}, goTo: ${afterRoute(p, ctx)})`;
    }
    default:
      return '() {}';
  }
}

function afterRoute(p: Props, ctx: CodegenContext): string {
  const r = ctx.routeFor(s(p.after));
  return r ? dS(r) : 'null';
}

/** JavaScript arrow function for onPress. */
export function rnOnTap(p: Props, ctx: CodegenContext): string {
  switch (tapKind(p)) {
    case 'page': {
      const call = ctx.rnNavigate(s(p.action));
      return call ? `() => ${call}` : '() => {}';
    }
    case 'back':
      return '() => navigation.canGoBack() && navigation.goBack()';
    case 'link':
      return `() => Linking.openURL(${J(p.url)})`;
    case 'call':
      return `() => Linking.openURL(${J('tel:' + digits(p.phone))})`;
    case 'whatsapp':
      return `() => Linking.openURL(${J('https://wa.me/' + waNumber(p.phone))})`;
    case 'message':
      return `() => Alert.alert(${J(p.message)})`;
    case 'signIn':
    case 'signUp':
    case 'signOut':
    case 'save':
    case 'sendCode':
    case 'verifyCode':
      return `() => Alert.alert('Coming soon', 'Sign-in and saving are in the Flutter export of this app.')`;
    default:
      return '() => {}';
  }
}

/** Short description for the editor's preview mode. */
export function previewTap(p: Props): { page?: string; toast?: string; back?: boolean } {
  switch (tapKind(p)) {
    case 'page':
      return { page: s(p.action) };
    case 'back':
      return { back: true };
    case 'link':
      return { toast: `Opens ${s(p.url)}` };
    case 'call':
      return { toast: `Calls ${s(p.phone) || '(no number set)'}` };
    case 'whatsapp':
      return { toast: `Opens WhatsApp chat with ${s(p.phone) || '(no number set)'}` };
    case 'message':
      return { toast: s(p.message) };
    case 'signIn':
      return { toast: 'Signs the user in with the email and password typed on this page (works in the exported app).', page: s(p.after) || undefined };
    case 'signUp':
      return { toast: 'Creates an account from the email, password and name fields (works in the exported app).', page: s(p.after) || undefined };
    case 'signOut':
      return { toast: 'Signs the user out.', page: s(p.after) || undefined };
    case 'save':
      return { toast: s(p.message) || 'Saves the form (works in the exported app).', page: s(p.after) || undefined };
    case 'sendCode':
      return { toast: s(p.via) === 'phone' ? 'Sends a 6-digit code by SMS (works in the exported app).' : 'Sends a one-time code by email (works in the exported app).', page: s(p.after) || undefined };
    case 'verifyCode':
      return { toast: 'Checks the code and signs the user in (works in the exported app).', page: s(p.after) || undefined };
    default:
      return {};
  }
}
