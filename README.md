# App Builder

Design mobile apps with drag and drop, preview them, and export real **Flutter** or **React Native (Expo)** projects that run on Android, iPhone and the web.

**New here? Open `START-HERE.txt`.**

## Quick start

1. Install **Node.js 20+** from nodejs.org.
2. Put this folder at `C:\projects\app-builder` (not in OneDrive).
3. Double-click **`start-windows.bat`** (Mac/Linux: `./start-mac-linux.sh`).
4. Use it at **http://localhost:3000**. Click **Help** inside the builder for the full guide.

Manual start: `npm install` then `npm run dev`.

## What you can do

- **Accounts (optional, Supabase):** sign up, sign in, password reset, email-link sign-in; each user sees only their own apps, from any computer
- **Apps that do real work (Flutter export):** sign-in / sign-up / sign-out, members-only pages, Data lists from Supabase tables, Firebase collections or any REST API with `{{field}}` placeholders, and forms that save to a table or POST to an API
- **Ship without installing Flutter:** one click builds an Android APK and publishes a website through the user's own GitHub (Actions + Pages)
- **Phone preview:** live preview link with QR code that updates as you design; also works as a client review link
- **Admin page:** every user, app counts, last activity, pause/unpause accounts
- **My apps:** create from templates, open, duplicate, import/export project files, delete
- **Editor:** drag-and-drop widgets, rows and cards, multiple pages, live Preview, undo/redo, autosave
- **16 widgets** including icons, icon buttons, checkbox, switch and dropdown, plus a star-rating plugin
- **Bottom navigation bar** with icons, and button actions: go to page, go back, website, call, WhatsApp, message
- **Faster editing:** grouped settings panel, colour swatches, widget search, right-click menu, copy/paste between pages, device sizes and zoom
- **Export:** Flutter or Expo project as a ZIP, or **Save to my computer** straight into a folder
- **Built-in checks** before export: empty pages, unreachable pages, buttons without actions, invalid App ID
- **Every export runs with one click** (`run_windows.bat` / `run_mac_linux.sh`) and includes `HOW_TO_RUN.md`
- **Flutter exports include automatic tests** that open every page at phone size and tap every navigation button

## Guides

| Guide | For |
|---|---|
| [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md) | Starting and using the builder |
| [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) | Turning on accounts, cloud saving and the admin page |
| [docs/CLOUD_BUILDS.md](docs/CLOUD_BUILDS.md) | Phone preview, cloud builds (APK) and web publishing |
| [docs/BACKENDS.md](docs/BACKENDS.md) | Sign-in, databases (Supabase / Firebase) and APIs in the apps people build |
| [docs/RUN_YOUR_APP.md](docs/RUN_YOUR_APP.md) | Running exported apps (Windows, Android Studio, VS Code, Expo) |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Every common error and its fix |
| [docs/DEVELOPERS.md](docs/DEVELOPERS.md) | Code structure, adding widgets and templates, databases, deploying, roadmap |

## Settings (`.env`)

Created automatically from `.env.example` on first start. Updates never overwrite it.

| Setting | Meaning |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Turn on **accounts**: sign-up, sign-in, and apps saved in Supabase. See [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) |
| *(no Supabase values)* | Save designs as files in `data/projects/`, no sign-in |
| `NEXT_PUBLIC_STORAGE=browser` | Save in the browser (for static hosting) |
| `NEXT_PUBLIC_STORAGE=local` | Use files even when Supabase values are set |
| `EXPORT_DIR=C:\projects\apps` | Where **Save to my computer** writes apps (default: `exports/`) |

Restart the builder after changing `.env`.

## Requirements to run exported apps

- Flutter apps: **Flutter 3.27+**, Android Studio (emulator), Xcode for iPhone builds on a Mac
- Expo apps: Node.js 20+ and the Expo Go app

Built with Next.js 15, React 19, TypeScript and Zustand.
