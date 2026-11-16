# Run your exported app

Every export contains `run_windows.bat`, `run_mac_linux.sh` and a detailed `HOW_TO_RUN.md`.

## Flutter

### One-time setup

1. Install the Flutter SDK (3.27+) to `C:\src\flutter`; add `C:\src\flutter\bin` to PATH.
2. New PowerShell window:
   ```powershell
   flutter --version
   where.exe flutter        # must list ONE folder only
   ```
3. Install Android Studio → SDK Manager → SDK Tools → tick **Android SDK Command-line Tools**.
4. Device Manager → **Create device** → Pixel 8 → **API 35** image.
5. ```powershell
   flutter doctor --android-licenses
   flutter doctor
   ```

### Each time

1. Start the emulator (Device Manager → ▶) and wait for the home screen.
2. Double-click **`run_windows.bat`** in the app folder.

Or by hand, **inside the app folder**:

```powershell
cd C:\projects\apps\my_app
flutter create --org com.yourcompany --project-name my_app --platforms android,ios,web .
flutter pub get
dart tool/prepare_android.dart
flutter test
flutter run
```

### Android Studio

1. Settings → Plugins → install **Flutter** → restart.
2. File → Open → the app folder (with `pubspec.yaml`) → Trust.
3. Settings → Languages & Frameworks → Flutter → SDK path = folder before `\bin` (e.g. `C:\src\flutter`).
4. **Pub get** → choose the emulator → ▶ Run.

### Build an installable file

```powershell
flutter build apk        # build\app\outputs\flutter-apk\app-release.apk
flutter build appbundle  # for Google Play
```

## React Native (Expo)

1. Install Node.js and the **Expo Go** app on your phone.
2. Double-click **`run_windows.bat`** in the app folder (or `npm run setup` then `npx expo start`).
3. Scan the QR code with Expo Go (same Wi-Fi).
