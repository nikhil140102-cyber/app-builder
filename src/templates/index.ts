import { brand } from '@/config/brand';
import { newId } from '@/core/ids';
import { CURRENT_SCHEMA, DEFAULT_ORG } from '@/core/schema';
import { createNode as W } from '@/core/tree';
import type { AppDoc, PageDoc } from '@/core/types';
import '@/widgets';

export interface Template {
  id: string;
  name: string;
  description: string;
  build: (name: string) => AppDoc;
}

function shell(name: string, pages: PageDoc[], primary = brand.defaultPrimary): AppDoc {
  const now = new Date().toISOString();
  return { schemaVersion: CURRENT_SCHEMA, id: newId('p'), name, org: DEFAULT_ORG, theme: { primary }, nav: { enabled: false, items: [] }, backend: { provider: 'none', supabaseUrl: '', supabaseKey: '', firebaseProjectId: '', loginPageId: '' }, apis: [], share: { enabled: false, token: '' }, github: { repo: '', webUrl: '' }, pages, createdAt: now, updatedAt: now };
}

const blank: Template = {
  id: 'blank',
  name: 'Blank app',
  description: 'One empty page.',
  build: (name) =>
    shell(name, [{ id: newId('p'), name: 'Home', title: name, showAppBar: true, background: '#FFFFFF', requiresLogin: false, nodes: [] }]),
};

const cafeOrdering: Template = {
  id: 'cafe',
  name: 'Café ordering',
  description: 'Menu, cart and order confirmation (3 pages).',
  build: (name) => {
    const home = newId('p'), cart = newId('p'), done = newId('p');
    return shell(name, [
      {
        id: home, name: 'Home', title: name, showAppBar: true, background: '#FAF7F2', requiresLogin: false,
        nodes: [
          W('heading', { text: 'Good evening, Riya', size: 26, weight: '800' }),
          W('text', { text: 'Fresh chai and snacks, delivered in 20 minutes.' }),
          W('image', { alt: 'Masala chai banner', height: 150 }),
          W('row', {}, [W('heading', { text: 'Popular today', size: 18 }), W('chip', { text: '4 items' })]),
          W('card', {}, [
            W('row', {}, [W('heading', { text: 'Masala Chai', size: 17, weight: '600' }), W('chip', { text: '₹40', bg: '#DDF1EA', fg: '#0F5F4B' })]),
            W('text', { text: 'Ginger, cardamom and a slow boil.', size: 13 }),
            W('rating', { value: 5, size: 16 }),
          ]),
          W('listtile', { title: 'Bun Maska', subtitle: 'Soft bun, salted butter', trailing: '₹35' }),
          W('listtile', { title: 'Vada Pav', subtitle: 'Spicy, with green chutney', trailing: '₹30' }),
          W('button', { label: 'View cart · ₹105', action: cart }),
        ],
      },
      {
        id: cart, name: 'Cart', title: 'Your cart', showAppBar: true, background: '#FFFFFF', requiresLogin: false,
        nodes: [
          W('listtile', { title: 'Masala Chai × 1', subtitle: 'Regular', trailing: '₹40' }),
          W('listtile', { title: 'Bun Maska × 1', subtitle: '', trailing: '₹35' }),
          W('listtile', { title: 'Vada Pav × 1', subtitle: '', trailing: '₹30' }),
          W('divider'),
          W('row', {}, [W('heading', { text: 'Total', size: 18 }), W('heading', { text: '₹105', size: 18 })]),
          W('input', { label: 'Delivery note', hint: 'Ring the bell twice' }),
          W('button', { label: 'Place order', action: done }),
        ],
      },
      {
        id: done, name: 'Order placed', title: '', showAppBar: false, background: '#0F7F64', requiresLogin: false,
        nodes: [
          W('spacer', { height: 120 }),
          W('heading', { text: 'Order placed', size: 30, weight: '800', color: '#FFFFFF', align: 'center' }),
          W('text', { text: 'Your order is on the way. Arriving in about 20 minutes.', color: '#DDF1EA', align: 'center' }),
          W('spacer', { height: 24 }),
          W('button', { label: 'Back to home', bg: '#FFFFFF', fg: '#0F7F64', action: home }),
        ],
      },
    ]);
  },
};

const login: Template = {
  id: 'login',
  name: 'Sign-in flow',
  description: 'Welcome, sign-in and home pages.',
  build: (name) => {
    const welcome = newId('p'), signin = newId('p'), home = newId('p');
    return shell(name, [
      {
        id: welcome, name: 'Welcome', title: '', showAppBar: false, background: '#FFFFFF', requiresLogin: false,
        nodes: [
          W('spacer', { height: 60 }),
          W('image', { alt: 'Welcome illustration', height: 220, radius: 24 }),
          W('heading', { text: `Welcome to ${name}`, size: 28, weight: '800', align: 'center' }),
          W('text', { text: 'Everything you need, in one place.', align: 'center' }),
          W('spacer', { height: 12 }),
          W('button', { label: 'Get started', action: signin }),
        ],
      },
      {
        id: signin, name: 'Sign in', title: 'Sign in', showAppBar: true, background: '#FFFFFF', requiresLogin: false,
        nodes: [
          W('input', { label: 'Email', hint: 'you@example.com' }),
          W('input', { label: 'Password', hint: 'At least 8 characters', obscure: true }),
          W('button', { label: 'Sign in', action: home }),
          W('text', { text: 'Forgot password?', align: 'center', size: 14 }),
        ],
      },
      {
        id: home, name: 'Home', title: 'Home', showAppBar: true, background: '#F6F7F9', requiresLogin: false,
        nodes: [
          W('heading', { text: 'Hello again', size: 24 }),
          W('card', {}, [W('heading', { text: 'Your dashboard', size: 17, weight: '600' }), W('text', { text: 'Add widgets here.', size: 14 })]),
        ],
      },
    ]);
  },
};

const shopTabs: Template = {
  id: 'shop-tabs',
  name: 'Shop with tabs',
  description: 'Bottom navigation, icons, settings and contact buttons (4 pages).',
  build: (name) => {
    const home = newId('p'), search = newId('p'), profile = newId('p'), product = newId('p');
    const doc = shell(name, [
      {
        id: home, name: 'Home', title: name, showAppBar: true, background: '#F7F8F6', requiresLogin: false,
        nodes: [
          W('row', { justify: 'spaceBetween' }, [
            W('heading', { text: 'Namaste, Aditi', size: 22, weight: '800' }),
            W('iconbutton', { name: 'bell', bg: '#FFFFFF', color: '#1B1B1B', label: 'Notifications', tap: 'message', message: 'No new notifications' }),
          ]),
          W('image', { alt: 'Festive sale banner', height: 140, radius: 18 }),
          W('row', { justify: 'start', gap: 6 }, [W('chip', { text: 'New arrivals' }), W('chip', { text: 'Under ₹499', bg: '#DDF1EA', fg: '#0F5F4B' })]),
          W('card', {}, [
            W('row', {}, [W('heading', { text: 'Cotton kurta', size: 17, weight: '600' }), W('heading', { text: '₹899', size: 17, weight: '600' })]),
            W('rating', { value: 4, size: 16 }),
            W('button', { label: 'View details', tap: 'page', action: product }),
          ]),
          W('listtile', { title: 'Free delivery', subtitle: 'On orders above ₹999', trailing: '' }),
        ],
      },
      {
        id: search, name: 'Search', title: 'Search', showAppBar: true, background: '#FFFFFF', requiresLogin: false,
        nodes: [
          W('input', { label: 'Search products', hint: 'Kurta, saree, shoes…' }),
          W('dropdown', { label: 'Category', options: 'All\nWomen\nMen\nKids\nHome' }),
          W('checkbox', { label: 'Only show items in stock', checked: true }),
          W('button', { label: 'Search', tap: 'message', message: 'Showing 24 results' }),
        ],
      },
      {
        id: profile, name: 'Profile', title: 'Profile', showAppBar: true, background: '#F7F8F6', requiresLogin: false,
        nodes: [
          W('row', { justify: 'start', gap: 12 }, [W('icon', { name: 'person', size: 40, color: '#0F7F64' }), W('heading', { text: 'Aditi Sharma', size: 20 })]),
          W('card', {}, [W('switch', { label: 'Order updates', on: true }), W('switch', { label: 'Offers and discounts', on: false })]),
          W('button', { label: 'Chat with us on WhatsApp', tap: 'whatsapp', phone: '+919876543210', bg: '#1F9D55' }),
          W('button', { label: 'Call support', tap: 'call', phone: '+919876543210', bg: '#FFFFFF', fg: '#1B1B1B' }),
        ],
      },
      {
        id: product, name: 'Product', title: 'Cotton kurta', showAppBar: true, background: '#FFFFFF', requiresLogin: false,
        nodes: [
          W('image', { alt: 'Cotton kurta photo', height: 260, radius: 16 }),
          W('heading', { text: 'Cotton kurta', size: 22 }),
          W('text', { text: 'Breathable handloom cotton, made in Jaipur. Machine washable.' }),
          W('dropdown', { label: 'Size', options: 'S\nM\nL\nXL' }),
          W('button', { label: 'Add to cart · ₹899', tap: 'message', message: 'Added to cart' }),
          W('button', { label: 'Back', tap: 'back', bg: '#FFFFFF', fg: '#1B1B1B' }),
        ],
      },
    ]);
    doc.nav = {
      enabled: true,
      items: [
        { pageId: home, label: 'Home', icon: 'home' },
        { pageId: search, label: 'Search', icon: 'search' },
        { pageId: profile, label: 'Profile', icon: 'person' },
      ],
    };
    return doc;
  },
};

const membersApp: Template = {
  id: 'members',
  name: 'Login + database',
  description: 'Sign up, sign in, a members-only list from a database, and a form that saves (4 pages).',
  build: (name) => {
    const signin = newId('p'), signup = newId('p'), home = newId('p'), add = newId('p');
    const doc = shell(name, [
      {
        id: signin, name: 'Sign in', title: '', showAppBar: false, background: '#FFFFFF', requiresLogin: false,
        nodes: [
          W('spacer', { height: 40 }),
          W('icon', { name: 'lock', size: 44, color: '#0F7F64', _align: 'center' }),
          W('heading', { text: `Welcome to ${name}`, size: 26, weight: '800', align: 'center' }),
          W('text', { text: 'Sign in to continue.', align: 'center' }),
          W('input', { label: 'Email', hint: 'you@example.com', keyboard: 'email', field: 'email' }),
          W('input', { label: 'Password', hint: 'Your password', obscure: true, field: 'password' }),
          W('button', { label: 'Sign in', tap: 'signIn', after: home }),
          W('button', { label: 'Create an account', tap: 'page', action: signup, bg: '#FFFFFF', fg: '#0F7F64' }),
        ],
      },
      {
        id: signup, name: 'Sign up', title: 'Create account', showAppBar: true, background: '#FFFFFF', requiresLogin: false,
        nodes: [
          W('input', { label: 'Your name', hint: 'Aditi Sharma', field: 'name' }),
          W('input', { label: 'Email', hint: 'you@example.com', keyboard: 'email', field: 'email' }),
          W('input', { label: 'Password', hint: 'At least 8 characters', obscure: true, field: 'password' }),
          W('button', { label: 'Create account', tap: 'signUp', after: home }),
        ],
      },
      {
        id: home, name: 'Home', title: name, showAppBar: true, background: '#F7F8F6', requiresLogin: true,
        nodes: [
          W('text', { text: 'Signed in as {{user.email}}', size: 13 }),
          W('row', {}, [W('heading', { text: 'Products', size: 20 }), W('iconbutton', { name: 'add', tap: 'page', action: add, label: 'Add product' })]),
          W('datalist', { source: 'table', table: 'products', limit: 20, empty: 'No products yet. Tap + to add one.' }, [
            W('card', {}, [
              W('row', {}, [W('heading', { text: '{{name}}', size: 17, weight: '600' }), W('chip', { text: '₹{{price}}', bg: '#DDF1EA', fg: '#0F5F4B' })]),
            ]),
          ]),
          W('button', { label: 'Sign out', tap: 'signOut', after: signin, bg: '#FFFFFF', fg: '#B4351F' }),
        ],
      },
      {
        id: add, name: 'Add product', title: 'Add product', showAppBar: true, background: '#FFFFFF', requiresLogin: true,
        nodes: [
          W('input', { label: 'Product name', hint: 'Cotton kurta', field: 'name' }),
          W('input', { label: 'Price (₹)', hint: '899', keyboard: 'number', field: 'price' }),
          W('button', { label: 'Save product', tap: 'save', saveTo: 'table', table: 'products', message: 'Product saved', after: home }),
        ],
      },
    ]);
    doc.backend = { provider: 'supabase', supabaseUrl: '', supabaseKey: '', firebaseProjectId: '', loginPageId: signin };
    return doc;
  },
};

const otpLogin: Template = {
  id: 'otp',
  name: 'OTP login',
  description: 'Sign in with a one-time code sent by email — no password (3 pages).',
  build: (name) => {
    const start = newId('p'), verify = newId('p'), home = newId('p');
    const doc = shell(name, [
      {
        id: start, name: 'Login', title: '', showAppBar: false, background: '#FFFFFF', requiresLogin: false,
        nodes: [
          W('spacer', { height: 48 }),
          W('icon', { name: 'email', size: 44, color: '#0F7F64', _align: 'center' }),
          W('heading', { text: `Welcome to ${name}`, size: 26, weight: '800', align: 'center' }),
          W('text', { text: 'Enter your email. We will send you a code — no password needed.', align: 'center' }),
          W('input', { label: 'Email', hint: 'you@example.com', keyboard: 'email', field: 'email' }),
          W('button', { label: 'Send code', tap: 'sendCode', via: 'email', after: verify }),
        ],
      },
      {
        id: verify, name: 'Enter code', title: 'Enter code', showAppBar: true, background: '#FFFFFF', requiresLogin: false,
        nodes: [
          W('text', { text: 'Type the code from your email. It expires in an hour.' }),
          W('input', { label: 'Code', hint: '12345678', keyboard: 'number', field: 'code' }),
          W('button', { label: 'Verify and sign in', tap: 'verifyCode', via: 'email', after: home }),
          W('button', { label: 'Send a new code', tap: 'sendCode', via: 'email', bg: '#FFFFFF', fg: '#0F7F64' }),
        ],
      },
      {
        id: home, name: 'Home', title: name, showAppBar: true, background: '#F7F8F6', requiresLogin: true,
        nodes: [
          W('heading', { text: 'You are signed in', size: 22 }),
          W('text', { text: 'Signed in as {{user.email}}' }),
          W('button', { label: 'Sign out', tap: 'signOut', after: start, bg: '#FFFFFF', fg: '#B4351F' }),
        ],
      },
    ]);
    doc.backend = { provider: 'supabase', supabaseUrl: '', supabaseKey: '', firebaseProjectId: '', loginPageId: start };
    return doc;
  },
};

export const templates: Template[] = [blank, cafeOrdering, shopTabs, membersApp, otpLogin, login];
