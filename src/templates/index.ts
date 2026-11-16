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
  description: 'Products from a live demo API, working search and category tabs, bottom navigation (4 pages).',
  build: (name) => {
    const home = newId('p'), search = newId('p'), profile = newId('p'), product = newId('p');
    const apiProducts = newId('api');

    /** Product card, repeated for each row. "View details" opens the product page with that product. */
    const productCard = () =>
      W('card', { radius: 16 }, [
        W('image', { src: '{{thumbnail}}', alt: 'Product photo', height: 150, radius: 12 }),
        W('row', {}, [W('heading', { text: '{{title}}', size: 16, weight: '600' }), W('chip', { text: '${{price}}', bg: '#DDF1EA', fg: '#0F5F4B' })]),
        W('text', { text: '{{category}} · ★ {{rating}}', size: 13, color: '#6B6B6B' }),
        W('button', { label: 'View details', tap: 'page', action: product, bg: '#FFFFFF', fg: '#0F7F64' }),
      ]);
    const tab = (text: string, value: string) =>
      W('chip', { text, bg: '#F1F3F1', fg: '#0F5F4B', tap: 'filter', filterField: 'category', filterValue: value });

    const doc = shell(name, [
      {
        id: home, name: 'Home', title: name, showAppBar: true, background: '#F7F8F6', requiresLogin: false,
        nodes: [
          W('row', { justify: 'spaceBetween' }, [
            W('heading', { text: 'Namaste, Aditi', size: 22, weight: '800' }),
            W('iconbutton', { name: 'search', bg: '#FFFFFF', color: '#1B1B1B', label: 'Search', tap: 'page', action: search }),
          ]),
          W('card', { bg: '#0F7F64', radius: 18 }, [
            W('heading', { text: 'Festive sale', size: 22, weight: '800', color: '#FFFFFF' }),
            W('text', { text: 'Up to 40% off on beauty and home.', color: '#DDF1EA' }),
          ]),
          W('heading', { text: 'Popular right now', size: 18 }),
          W('datalist', { source: 'api', api: apiProducts, limit: 6, empty: 'No products yet.' }, [productCard()]),
        ],
      },
      {
        id: search, name: 'Search', title: 'Search', showAppBar: true, background: '#FFFFFF', requiresLogin: false,
        nodes: [
          W('input', { label: 'Search products', hint: 'Mascara, perfume, bed…', field: 'search' }),
          W('row', { justify: 'start', gap: 6 }, [tab('All', ''), tab('Beauty', 'beauty'), tab('Groceries', 'groceries')]),
          W('row', { justify: 'start', gap: 6 }, [tab('Fragrances', 'fragrances'), tab('Furniture', 'furniture')]),
          W('datalist', { source: 'api', api: apiProducts, limit: 30, empty: 'No products found.', filterBy: 'search, category', searchIn: 'title, category' }, [productCard()]),
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
        id: product, name: 'Product', title: 'Product details', showAppBar: true, background: '#FFFFFF', requiresLogin: false,
        nodes: [
          W('image', { src: '{{thumbnail}}', alt: 'Product photo', height: 260, radius: 16 }),
          W('row', {}, [W('heading', { text: '{{title}}', size: 22 }), W('chip', { text: '★ {{rating}}', bg: '#FFF4E5', fg: '#B26A00' })]),
          W('heading', { text: '${{price}}', size: 20, weight: '800', color: '#0F7F64' }),
          W('text', { text: '{{description}}' }),
          W('button', { label: 'Add to cart', tap: 'message', message: 'Added to cart' }),
          W('button', { label: 'Back', tap: 'back', bg: '#FFFFFF', fg: '#1B1B1B' }),
        ],
      },
    ]);
    doc.apis = [{ id: apiProducts, name: 'Products (DummyJSON demo)', url: 'https://dummyjson.com/products?limit=30', listPath: 'products' }];
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

/** Zomato-style food delivery: real dishes from TheMealDB (free, no key), checkout that posts the order. */
const foodDelivery: Template = {
  id: 'food',
  name: 'Food delivery',
  description: 'Zomato-style: dishes from a live demo API, tappable filters, dish page, checkout and order placed (9 pages).',
  build: (name) => {
    const home = newId('p'), veg = newId('p'), explore = newId('p'), profile = newId('p');
    const dish = newId('p'), checkout = newId('p'), placed = newId('p'), quick = newId('p'), sweets = newId('p');
    const RED = '#E23744';
    const apiChicken = newId('api'), apiVeg = newId('api'), apiCats = newId('api'), apiOrders = newId('api');
    const apiQuick = newId('api'), apiSweets = newId('api');
    const MEALS = 'https://www.themealdb.com/api/json/v1/1';

    /** One dish card, repeated for every row of a Data list. Tapping it opens the dish page with that dish. */
    const dishCard = (tag: string) =>
      W('card', { padding: 0, radius: 18 }, [
        W('image', { src: '{{strMealThumb}}', alt: 'Dish photo', height: 170, radius: 18 }),
        W('row', { _pad: 12 }, [
          W('heading', { text: '{{strMeal}}', size: 17, weight: '700' }),
          W('chip', { text: '4.3 ★', bg: '#24963F', fg: '#FFFFFF' }),
        ]),
        W('text', { text: `${tag} · ₹249 for one · 30–35 min`, size: 13, color: '#6B6B6B', _pad: 12 }),
        W('button', { label: 'View dish', tap: 'page', action: dish, bg: '#FFFFFF', fg: RED, _pad: 8 }),
      ]);

    const doc = shell(
      name,
      [
        {
          id: home, name: 'Home', title: name, showAppBar: false, background: '#FFFFFF', requiresLogin: false,
          nodes: [
            W('spacer', { height: 8 }),
            W('row', {}, [
              W('icon', { name: 'location', size: 24, color: RED }),
              W('heading', { text: 'Home · Jaipur', size: 17, weight: '700' }),
              W('iconbutton', { name: 'person', bg: '#F4F4F4', color: '#1B1B1B', label: 'Profile', tap: 'page', action: profile }),
            ]),
            W('input', { label: 'Search dishes', hint: 'Try “curry”, “tikka”, “rice”…', field: 'search' }),
            // Tappable chips: each opens a page with its own dish list.
            W('row', { justify: 'start', gap: 6 }, [
              W('chip', { text: 'Pure veg', bg: '#E8F5EC', fg: '#24963F', tap: 'page', action: veg }),
              W('chip', { text: 'Quick bites', bg: '#F4F4F4', fg: '#1B1B1B', tap: 'page', action: quick }),
              W('chip', { text: 'Desserts', bg: '#F4F4F4', fg: '#1B1B1B', tap: 'page', action: sweets }),
            ]),
            W('card', { bg: '#FFF1F2', radius: 18 }, [
              W('heading', { text: '50% OFF up to ₹100', size: 20, weight: '800', color: RED }),
              W('text', { text: 'On your first 3 orders. Use code WELCOME50.', size: 13 }),
            ]),
            W('heading', { text: 'Top dishes near you', size: 20, weight: '800' }),
            W('datalist', { source: 'api', api: apiChicken, limit: 30, empty: 'No dishes right now.', filterBy: 'search', searchIn: 'strMeal' }, [dishCard('North Indian')]),
          ],
        },
        {
          id: veg, name: 'Veg', title: 'Pure veg', showAppBar: true, background: '#FFFFFF', requiresLogin: false,
          nodes: [
            W('text', { text: '100% vegetarian kitchens near you.', color: '#24963F' }),
            W('datalist', { source: 'api', api: apiVeg, limit: 12, empty: 'No veg dishes right now.' }, [dishCard('Pure veg')]),
          ],
        },
        {
          id: quick, name: 'Quick bites', title: 'Quick bites', showAppBar: true, background: '#FFFFFF', requiresLogin: false,
          nodes: [
            W('text', { text: 'Starters and light meals, ready fast.', color: '#6B6B6B' }),
            W('datalist', { source: 'api', api: apiQuick, limit: 12, empty: 'No quick bites right now.' }, [dishCard('Starter')]),
          ],
        },
        {
          id: sweets, name: 'Desserts', title: 'Desserts', showAppBar: true, background: '#FFFFFF', requiresLogin: false,
          nodes: [
            W('text', { text: 'Something sweet to finish.', color: '#6B6B6B' }),
            W('datalist', { source: 'api', api: apiSweets, limit: 12, empty: 'No desserts right now.' }, [dishCard('Dessert')]),
          ],
        },
        {
          id: explore, name: 'Explore', title: 'Explore cuisines', showAppBar: true, background: '#F7F7F7', requiresLogin: false,
          nodes: [
            W('text', { text: 'What’s on your mind?' }),
            W('datalist', { source: 'api', api: apiCats, limit: 10, empty: 'No cuisines found.' }, [
              W('card', { radius: 18 }, [
                W('image', { src: '{{strCategoryThumb}}', alt: 'Cuisine photo', height: 120, radius: 14 }),
                W('heading', { text: '{{strCategory}}', size: 17, weight: '700' }),
              ]),
            ]),
          ],
        },
        {
          id: profile, name: 'Profile', title: 'Profile', showAppBar: true, background: '#F7F7F7', requiresLogin: false,
          nodes: [
            W('row', { justify: 'start', gap: 12 }, [W('icon', { name: 'person', size: 44, color: RED }), W('heading', { text: 'Your account', size: 20 })]),
            W('card', {}, [
              W('listtile', { title: 'Your orders', subtitle: 'Track and reorder', trailing: '›' }),
              W('listtile', { title: 'Saved addresses', subtitle: 'Home, Work', trailing: '›' }),
              W('listtile', { title: 'Payment methods', subtitle: 'UPI, cards, cash', trailing: '›' }),
            ]),
            W('card', {}, [W('switch', { label: 'Order updates', on: true }), W('switch', { label: 'Offers and deals', on: false })]),
            W('button', { label: 'Chat with support on WhatsApp', tap: 'whatsapp', phone: '+919876543210', bg: '#1F9D55' }),
          ],
        },
        {
          id: dish, name: 'Dish', title: '', showAppBar: true, background: '#FFFFFF', requiresLogin: false,
          nodes: [
            W('image', { src: '{{strMealThumb}}', alt: 'Dish photo', height: 260, radius: 20 }),
            W('row', {}, [W('heading', { text: '{{strMeal}}', size: 24, weight: '800' }), W('chip', { text: '4.3 ★', bg: '#24963F', fg: '#FFFFFF' })]),
            W('rating', { value: 4, size: 18 }),
            W('text', { text: 'Freshly cooked when you order and packed hot. Serves 1. Ask for less spicy in the cooking note.', color: '#4A4A4A' }),
            W('row', { justify: 'start', gap: 6 }, [
              W('chip', { text: 'Bestseller', bg: '#FFF4E5', fg: '#B26A00' }),
              W('chip', { text: '30–35 min', bg: '#F4F4F4', fg: '#1B1B1B' }),
            ]),
            W('divider'),
            W('row', {}, [W('heading', { text: '₹249', size: 22, weight: '800' }), W('text', { text: 'Inclusive of all taxes', size: 12, color: '#6B6B6B' })]),
            W('button', { label: 'Add to order · ₹249', tap: 'page', action: checkout, bg: RED }),
          ],
        },
        {
          id: checkout, name: 'Checkout', title: 'Checkout', showAppBar: true, background: '#F7F7F7', requiresLogin: false,
          nodes: [
            W('card', {}, [
              W('row', {}, [W('heading', { text: '{{strMeal}}', size: 17, weight: '700' }), W('heading', { text: '₹249', size: 17 })]),
              W('listtile', { title: 'Delivery fee', subtitle: 'Free above ₹499', trailing: '₹30' }),
              W('listtile', { title: 'Taxes and charges', subtitle: '', trailing: '₹12' }),
              W('divider'),
              W('row', {}, [W('heading', { text: 'To pay', size: 18, weight: '800' }), W('heading', { text: '₹291', size: 18, weight: '800' })]),
            ]),
            W('heading', { text: 'Delivery details', size: 18, weight: '700' }),
            W('input', { label: 'Your name', hint: 'Aditi Sharma', field: 'name' }),
            W('input', { label: 'Phone', hint: '98765 43210', keyboard: 'phone', field: 'phone' }),
            W('input', { label: 'Address', hint: 'House no., street, area', field: 'address' }),
            W('dropdown', { label: 'Payment', options: 'Cash on delivery\nUPI on delivery', field: 'payment' }),
            W('input', { label: 'Cooking note (optional)', hint: 'Less spicy, no onion…', field: 'note' }),
            W('button', { label: 'Place order · ₹291', tap: 'save', saveTo: 'api', api: apiOrders, withItem: true, message: 'Order placed!', after: placed, bg: RED }),
          ],
        },
        {
          id: placed, name: 'Order placed', title: '', showAppBar: false, background: '#24963F', requiresLogin: false,
          nodes: [
            W('spacer', { height: 110 }),
            W('icon', { name: 'check', size: 64, color: '#FFFFFF', _align: 'center' }),
            W('heading', { text: 'Order placed!', size: 30, weight: '800', color: '#FFFFFF', align: 'center' }),
            W('text', { text: 'Your food is being prepared and will reach you in about 30 minutes.', color: '#E8F5EC', align: 'center' }),
            W('spacer', { height: 24 }),
            W('button', { label: 'Back to home', tap: 'page', action: home, bg: '#FFFFFF', fg: '#24963F' }),
          ],
        },
      ],
      RED,
    );
    doc.apis = [
      { id: apiChicken, name: 'Top dishes (TheMealDB)', url: `${MEALS}/filter.php?c=Chicken`, listPath: 'meals' },
      { id: apiVeg, name: 'Veg dishes (TheMealDB)', url: `${MEALS}/filter.php?c=Vegetarian`, listPath: 'meals' },
      { id: apiQuick, name: 'Quick bites (TheMealDB)', url: `${MEALS}/filter.php?c=Starter`, listPath: 'meals' },
      { id: apiSweets, name: 'Desserts (TheMealDB)', url: `${MEALS}/filter.php?c=Dessert`, listPath: 'meals' },
      { id: apiCats, name: 'Cuisines (TheMealDB)', url: `${MEALS}/categories.php`, listPath: 'categories' },
      { id: apiOrders, name: 'Orders (demo — replace with your own)', url: 'https://jsonplaceholder.typicode.com/posts', listPath: '' },
    ];
    doc.nav = {
      enabled: true,
      items: [
        { pageId: home, label: 'Delivery', icon: 'home' },
        { pageId: veg, label: 'Veg', icon: 'favorite' },
        { pageId: explore, label: 'Explore', icon: 'grid' },
        { pageId: profile, label: 'Profile', icon: 'person' },
      ],
    };
    return doc;
  },
};

export const templates: Template[] = [blank, foodDelivery, cafeOrdering, shopTabs, membersApp, otpLogin, login];
