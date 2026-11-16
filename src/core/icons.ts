/**
 * Icon set used by the icon, icon button and bottom-navigation widgets.
 * `svg` is a simple 24×24 stroke drawing for the editor preview. Exported apps
 * use the platform's own Material icons: Flutter `Icons.<flutter>` and Expo
 * `<MaterialIcons name="<rn>" />` (bundled with Expo, no extra install).
 * To add an icon, add one entry; everything else picks it up.
 */
export interface IconDef {
  label: string;
  svg: string;
  flutter: string;
  rn: string;
}

export const ICONS: Record<string, IconDef> = {
  home: { label: 'Home', flutter: 'home_outlined', rn: 'home', svg: '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>' },
  search: { label: 'Search', flutter: 'search', rn: 'search', svg: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>' },
  person: { label: 'Profile', flutter: 'person_outline', rn: 'person-outline', svg: '<circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6"/>' },
  settings: { label: 'Settings', flutter: 'settings_outlined', rn: 'settings', svg: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>' },
  cart: { label: 'Cart', flutter: 'shopping_cart_outlined', rn: 'shopping-cart', svg: '<path d="M3 4h2l2.4 11h10.2L20 7H6.3"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>' },
  favorite: { label: 'Heart', flutter: 'favorite_border', rn: 'favorite-border', svg: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>' },
  star: { label: 'Star', flutter: 'star_outline', rn: 'star-outline', svg: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>' },
  add: { label: 'Add', flutter: 'add', rn: 'add', svg: '<path d="M12 5v14M5 12h14"/>' },
  close: { label: 'Close', flutter: 'close', rn: 'close', svg: '<path d="M6 6l12 12M18 6L6 18"/>' },
  check: { label: 'Check', flutter: 'check', rn: 'check', svg: '<path d="M5 12.5l4.5 4.5L19 7.5"/>' },
  back: { label: 'Back', flutter: 'arrow_back', rn: 'arrow-back', svg: '<path d="M19 12H5M11 6l-6 6 6 6"/>' },
  forward: { label: 'Forward', flutter: 'arrow_forward', rn: 'arrow-forward', svg: '<path d="M5 12h14M13 6l6 6-6 6"/>' },
  menu: { label: 'Menu', flutter: 'menu', rn: 'menu', svg: '<path d="M4 7h16M4 12h16M4 17h16"/>' },
  bell: { label: 'Notifications', flutter: 'notifications_none', rn: 'notifications-none', svg: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>' },
  phone: { label: 'Phone', flutter: 'phone_outlined', rn: 'phone', svg: '<path d="M5 4h4l1.5 4.5-2.3 1.4a11 11 0 0 0 5.9 5.9l1.4-2.3L20 15v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>' },
  email: { label: 'Email', flutter: 'mail_outline', rn: 'mail-outline', svg: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/>' },
  location: { label: 'Location', flutter: 'location_on_outlined', rn: 'location-on', svg: '<path d="M12 21s-6-5.7-6-11a6 6 0 0 1 12 0c0 5.3-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>' },
  calendar: { label: 'Calendar', flutter: 'calendar_today_outlined', rn: 'calendar-today', svg: '<rect x="4" y="5.5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3.5v4M16 3.5v4"/>' },
  chat: { label: 'Chat', flutter: 'chat_bubble_outline', rn: 'chat-bubble-outline', svg: '<path d="M4 5h16v11H9l-5 4z"/>' },
  share: { label: 'Share', flutter: 'share_outlined', rn: 'share', svg: '<circle cx="6" cy="12" r="2.2"/><circle cx="18" cy="6" r="2.2"/><circle cx="18" cy="18" r="2.2"/><path d="M8 11l8-4M8 13l8 4"/>' },
  delete: { label: 'Delete', flutter: 'delete_outline', rn: 'delete-outline', svg: '<path d="M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13"/>' },
  edit: { label: 'Edit', flutter: 'edit_outlined', rn: 'edit', svg: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>' },
  info: { label: 'Info', flutter: 'info_outline', rn: 'info-outline', svg: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v6M12 7.5v.5"/>' },
  lock: { label: 'Lock', flutter: 'lock_outline', rn: 'lock-outline', svg: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>' },
  grid: { label: 'Grid', flutter: 'grid_view', rn: 'grid-view', svg: '<rect x="4" y="4" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1"/>' },
  bag: { label: 'Bag', flutter: 'shopping_bag_outlined', rn: 'shopping-bag', svg: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8a3 3 0 0 1 6 0"/>' },
  receipt: { label: 'Orders', flutter: 'receipt_long_outlined', rn: 'receipt', svg: '<path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3z"/><path d="M9 8h6M9 12h6"/>' },
  play: { label: 'Play', flutter: 'play_circle_outline', rn: 'play-circle-outline', svg: '<circle cx="12" cy="12" r="8.5"/><path d="M10 8.5l5.5 3.5-5.5 3.5z"/>' },
  whatsapp: { label: 'WhatsApp / chat', flutter: 'chat', rn: 'chat', svg: '<path d="M5 19l1.2-3.6A7.5 7.5 0 1 1 9 18.3z"/><path d="M9.5 9.5c.3 2 2 3.7 4 4l1-1"/>' },
  globe: { label: 'Website', flutter: 'language', rn: 'language', svg: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.5 2.5 14.5 0 17M12 3.5c-2.5 2.5-2.5 14.5 0 17"/>' },
};

export const ICON_NAMES = Object.keys(ICONS);

export function iconDef(name: unknown): IconDef {
  return ICONS[String(name)] ?? ICONS.star;
}

/** Inline SVG markup for the editor. */
export function iconSvg(name: unknown, size = 24, color = 'currentColor'): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${iconDef(name).svg}</svg>`;
}
