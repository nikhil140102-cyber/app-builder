# Troubleshooting

## Builder

| Symptom | Fix |
|---|---|
| Export stuck on "Preparing…" / `Loading chunk … failed` | Builder is inside OneDrive. Move it to `C:\projects\app-builder`, run `npm install`, restart, press Ctrl+Shift+R. |
| `'npm' is not recognized` | Install Node.js and open a new window. |
| `Port 3000 is in use` | Close the other builder window, or run `npm run dev -- -p 3001` and open http://localhost:3001. |
| "Not saved — check the server" | The black builder window was closed. Start it again; nothing typed before the message was lost. |
| Projects disappeared | They are in `data/projects/`. Check you started the builder from the same folder. |

## Flutter app

| Symptom | Fix |
|---|---|
| `'flutter' is not recognized` | Add Flutter's `bin` to PATH; open a new PowerShell. |
| `No pubspec.yaml file found` | `cd` into the app folder first. |
| Hundreds of "isn't defined" errors | Run `flutter pub get` inside the app folder. Never run `flutter analyze` from your user folder. |
| `The '<' operator is reserved` | Replace placeholders like `<emulator_id>` with the real value, without `<` `>`. |
| Error mentioning `spacing` | `flutter upgrade` (needs 3.27+). |
| `expect` / `find` isn't defined | Old export. Export again, or add `flutter_test: sdk: flutter` under `dev_dependencies`. |
| `include file 'package:flutter_lints/…' can't be found` | Old export. Replace `analysis_options.yaml` with the one from a new export. |
| `Device emulator-5554 is offline` | Wait for the home screen; `& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" kill-server`; `flutter devices`. Else Cold Boot Now, or use an API 35 emulator. |
| Only Windows/Chrome/Edge listed | Start the emulator first. |
| Stuck on `assembleDebug` | First build: 5–15 min. `flutter run -v` shows progress. |
| `WARNING: A restricted method in java.lang.System` | Harmless. |
| Many `I/` and `W/` lines | Normal Android logs. |
| Only the Flutter logo shows | Wait 30 s, press **R**, or run `flutter run` from the terminal. |
| Android Studio: no Flutter settings page | Install the plugin, restart, **open the app project first**. |
| Android Studio: "SDK installation is incomplete" | Use the folder printed by `where.exe flutter`, minus `\bin`. Remove duplicate Flutter installs from PATH. |
| Web images missing in release APK | `dart tool/prepare_android.dart`, then rebuild. |
| `compileSdk` errors on a brand-new emulator | Use an API 35 emulator. |

Still stuck: share the output of `flutter doctor -v` and the last 30 lines of the error.

## Features added in 0.3

| Symptom | Fix |
|---|---|
| Call / WhatsApp / website buttons do nothing in the Flutter app | Run `flutter pub get` (the export adds `url_launcher`). On an emulator without WhatsApp, the chat opens in the browser. |
| `Target of URI doesn't exist: package:url_launcher` | Run `flutter pub add url_launcher`, then `flutter pub get`. `run_windows.bat` does this for you. |
| Expo: `Unable to resolve @react-navigation/bottom-tabs` or `@expo/vector-icons` | Run `npm run setup` in the app folder. |
| Icons show as “?” in the Expo app | Run `npx expo install @expo/vector-icons` and restart with `npx expo start -c`. |
