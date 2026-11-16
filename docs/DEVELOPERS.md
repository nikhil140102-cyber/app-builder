# Developer guide

For people changing or extending the builder itself.

## Project structure

```
src/
  config/brand.ts          ← product name, tagline, default colour (rebrand here)
  core/
    types.ts               ← document model and the WidgetDefinition contract
    registry.ts            ← widget registry; everything reads widgets from here
    plugins.ts             ← plugin API (definePlugin / installPlugin)
    schema.ts              ← schema version + migrations + validation of saved files
    store.ts               ← editor state, undo/redo
    actions.ts             ← every editing operation (add, move, delete, pages…)
    tree.ts, dnd.ts, ids.ts
    storage/               ← StorageAdapter interface + browser and server adapters
  widgets/                 ← built-in widgets (basic, content, layout)
  plugins/                 ← plugin packs; rating/ is a working example
  codegen/                 ← Flutter and React Native generators
  templates/               ← starter projects shown on the dashboard
  components/editor/       ← editor UI (canvas, panels, inspector, export dialog)
  server/projectsRepo.ts   ← file-based repository used by the API
  app/                     ← Next.js pages and API routes
```

## How to extend it

### Add a widget

Each widget is one object that describes everything about it: palette entry, editable fields, how it looks in the editor, and its Flutter and React Native code. The editor, inspector and exporters pick it up automatically.

The quickest path is a plugin. Copy `src/plugins/rating/` to `src/plugins/my-widgets/`, change the definition, then add it to `src/plugins/index.ts`:

```ts
import rating from './rating';
import myWidgets from './my-widgets';
export const plugins = [rating, myWidgets];
```

Field kinds available in the inspector: `text`, `textarea`, `number`, `color`, `select`, `boolean`, `page` (a page picker for navigation).

### Add a template

Add an entry to `src/templates/index.ts`. It appears on the dashboard immediately.

### Use a real database

Write a class that implements `StorageAdapter` (`src/core/storage/types.ts`) — for example with Supabase or Postgres — and select it in `src/core/storage/index.ts`. For a server-side database, replace the functions in `src/server/projectsRepo.ts` instead; the API routes and the editor stay the same.

### Change the saved format

Increase `CURRENT_SCHEMA` in `src/core/schema.ts` and add a migration step. Older project files are upgraded automatically when opened.

### Rebrand

Edit `src/config/brand.ts`. Colours of the editor itself are the CSS tokens at the top of `src/app/globals.css`.

## Deploying

- **Your own server / VPS:** `npm run build && npm start` with `NEXT_PUBLIC_STORAGE=server`. Keep `data/` on persistent disk.
- **Vercel / Netlify:** their file system is not permanent, so set `NEXT_PUBLIC_STORAGE=browser` until you connect a database adapter.

## Roadmap to a sellable product

1. Accounts and teams (e.g. Auth.js or Supabase Auth) and a database storage adapter
2. Data binding: REST API connector and Firebase/Supabase collections bound to lists
3. Variables, state and a visual action builder (beyond navigation)
4. More widgets: tabs, bottom navigation, grids, forms with validation, icons library
5. Responsive tablet/web canvas sizes and design tokens per project
6. Cloud builds (APK/IPA) and live preview on device via QR code
7. Plugin marketplace, billing (Stripe/Razorpay) and usage limits per plan
8. AI: generate pages and whole apps from a prompt

## Export pipeline

```
src/codegen/
  common.ts        page naming + tree walker shared by all targets
  flutter.ts       Flutter project, tests, tool/prepare_android.dart, run scripts
  reactNative.ts   Expo project (package.json, app.json, index.js, App.js, screens/), run scripts
  guides.ts        README.md and HOW_TO_RUN.md written into every export
  checks.ts        plain-language checks shown in the Export dialog
src/server/exportWriter.ts   "Save to my computer" (POST /api/export)
src/app/api/system           facts used for the OneDrive warning
src/app/help/page.tsx        in-app Help page
```

`GeneratedFile.keepIfExists` protects files users customise (pubspec.yaml, package.json…) when saving into an existing folder; `.appbuilder-files.json` in each exported folder lists generated files so renamed pages are cleaned up without touching the user's own files.

## Checks before a release

```bash
npm run typecheck
npm run build
```

Then export the Café ordering template for Flutter and run `run_windows.bat` (or `flutter test`) on a real machine.
