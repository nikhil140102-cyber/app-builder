# Getting started

## 1. Start the builder

1. Install **Node.js 20 LTS or newer** from nodejs.org. Check with `node -v`.
2. Keep the builder in a local folder such as `C:\projects\app-builder` — **not OneDrive**.
3. Double-click **`start-windows.bat`** (Mac/Linux: `./start-mac-linux.sh`).
4. Your browser opens **http://localhost:3000**. Keep the black window open; close it to stop.

Manual alternative:

```powershell
cd C:\projects\app-builder
npm install
npm run dev
```

## 2. Design

| Task | How |
|---|---|
| New app | My apps → type a name → pick a template → **Create app** |
| Add a widget | Drag it onto the phone, or click it to add below the selected widget |
| Edit a widget | Click it on the phone, change it in the right panel |
| Put widgets side by side | Add a **Row** and drop widgets into it |
| Group widgets on a card | Add a **Card** and drop widgets into it |
| Add a page | Pages → **+ Add page** |
| Link a button to a page | Select the button → **Action → When tapped → Go to a page** |
| Other button actions | **When tapped**: Go back, Open a website, Call a number, Open WhatsApp chat, Show a message |
| Icons | Add **Icon** or **Icon button**, then pick from the searchable icon list |
| Bottom navigation bar | Right panel → **App → Bottom navigation** → tick 3–5 pages, set label and icon |
| Forms | **Text field** (keyboard type, password), **Checkbox**, **Switch**, **Dropdown** (one option per line) |
| Space and position | Select a widget → **Layout** section → Space around, Horizontal position |
| Reuse colours | Click a swatch above any colour field — it lists colours already in your app |
| Copy / cut / paste | Ctrl+C / Ctrl+X / Ctrl+V — also works between pages |
| More options | Right-click a widget: duplicate, move, put inside a Card or Row, delete |
| Reorder pages | Select the page → **Page order** → Move up / down / Make start page |
| Phone size and zoom | Use the bar above the phone |
| Try the app | **Preview**, then tap buttons and tabs. **Esc** returns to editing |
| Undo / redo | Ctrl+Z / Ctrl+Shift+Z |
| App name, colour, App ID | Right panel → **App → App details** |

Designs save automatically to `data/projects/`. Use **Export file** on the dashboard for a backup you can **Import** later.

## 3. Export

**Export app** → choose **Flutter** or **React Native (Expo)**:

- **Checks** tab: fix anything marked *Problem* or *Check*.
- **Save to my computer**: writes the project to `exports/flutter/<app>` (change the place with `EXPORT_DIR` in `.env`). Saving again updates the pages and keeps your platform folders.
- **Download ZIP**: unzip it to `C:\projects\apps`.

Then follow [RUN_YOUR_APP.md](RUN_YOUR_APP.md).
