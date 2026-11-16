import type { Metadata } from 'next';
import Link from 'next/link';
import { brand } from '@/config/brand';

export const metadata: Metadata = { title: `Help — ${brand.name}` };

const problems: [string, string][] = [
  ['Export shows “Preparing…” forever, or “Loading chunk … failed”', 'The builder folder is inside OneDrive. Move it to C:\\projects\\app-builder, run npm install, start it again and press Ctrl+Shift+R in the browser.'],
  ["'flutter' is not recognized", "Flutter's bin folder is not on PATH. Add it (for example C:\\src\\flutter\\bin) and open a new PowerShell window."],
  ['No pubspec.yaml file found', 'You are in the wrong folder. cd into the exported app folder first. The prompt should end with the app folder name.'],
  ['Hundreds of errors like “SingleChildScrollView isn’t defined”', 'Run flutter pub get inside the app folder. Never run flutter analyze from C:\\Users\\YourName.'],
  ["The '<' operator is reserved", 'You typed a placeholder like <emulator_id>. Replace it with the real value and leave out < and >.'],
  ['Error mentioning “spacing”', 'Flutter is older than 3.27. Run flutter upgrade.'],
  ['“expect” / “find” isn’t defined in test/', 'The app was exported by an older version of the builder. Export it again, or add flutter_test under dev_dependencies in pubspec.yaml.'],
  ['Device emulator-5554 is offline', 'Wait for the phone’s home screen. Then run adb kill-server (see the guide) and flutter devices. Still offline: Device Manager → ⋮ → Cold Boot Now, or create an API 35 emulator.'],
  ['Only Windows, Chrome and Edge in the device list', 'The emulator is not running yet. Start it from Android Studio → Device Manager and wait for the home screen.'],
  ['Stuck on “Running Gradle task assembleDebug”', 'The first Android build downloads tools and takes 5–15 minutes. Leave it running. flutter run -v shows progress.'],
  ['WARNING: A restricted method in java.lang.System', 'Harmless Java message. Ignore it.'],
  ['Many lines starting with I/ or W/ while the app starts', 'Normal Android logs. Real errors start with E/flutter, EXCEPTION CAUGHT, FAILURE or Error:.'],
  ['App shows only the Flutter logo', 'Wait 30 seconds, then press R (hot restart), or stop and run flutter run from the terminal.'],
  ['Android Studio: no Flutter under Languages & Frameworks', 'Install the Flutter plugin, restart Android Studio, then open the app project first. The page only appears while a Flutter project is open.'],
  ['Android Studio: “Flutter SDK installation is incomplete”', 'Wrong SDK path. Run where.exe flutter and use the folder before \\bin. If it lists two folders, remove one from PATH.'],
  ['Images from the web missing in the release APK', 'Run dart tool/prepare_android.dart in the app folder, then build again. run_windows.bat does this for you.'],
];

export default function HelpPage() {
  return (
    <div className="dash help">
      <div className="dash-head">
        <Link href="/" className="brand"><i />{brand.name}</Link>
        <div className="grow" />
        <Link className="btn" href="/">Back to my apps</Link>
      </div>

      <div>
        <h1>Help &amp; setup guide</h1>
        <p className="lede">Everything you need to design an app here and run it on a phone. No coding needed for the basics.</p>
      </div>

      <nav className="toc" aria-label="Sections">
        <a className="btn small" href="#install">1. Start the builder</a>
        <a className="btn small" href="#accounts">Accounts</a>
        <a className="btn small" href="#design">2. Design an app</a>
        <a className="btn small" href="#data">Sign-in & data</a>
        <a className="btn small" href="#export">3. Export</a>
        <a className="btn small" href="#ship">Phone preview & cloud builds</a>
        <a className="btn small" href="#run-flutter">4. Run the Flutter app</a>
        <a className="btn small" href="#run-rn">5. Run the React Native app</a>
        <a className="btn small" href="#check">6. Check it works</a>
        <a className="btn small" href="#problems">Problems and fixes</a>
      </nav>

      <section id="install">
        <h2>1. Start the builder</h2>
        <ol>
          <li>Install <b>Node.js 20 LTS or newer</b> from nodejs.org.</li>
          <li>Unzip the builder to a local folder such as <code>C:\projects\app-builder</code>. <b>Not</b> inside OneDrive, Desktop or Documents if those are synced.</li>
          <li>Double-click <code>start-windows.bat</code> (Mac/Linux: <code>./start-mac-linux.sh</code>). The first start installs packages and takes a few minutes, then your browser opens <code>http://localhost:3000</code>.</li>
          <li>Keep the black window open while you work. Close it to stop the builder.</li>
        </ol>
        <p>Your designs are saved automatically in the <code>data/projects</code> folder. Back up that folder to back up every app.</p>
      </section>

      <section id="accounts">
        <h2>Accounts</h2>
        <p>When the builder is connected to Supabase, everyone signs in and their apps are saved in their own account, so they open from any computer. Without Supabase, apps are saved on this computer and no sign-in is needed.</p>
        <ol>
          <li><b>New user:</b> Sign in page → <i>New here? Create an account</i> → open the confirmation email on the same computer.</li>
          <li><b>Forgot password:</b> Sign in page → <i>Forgot password?</i> → open the email → choose a new password.</li>
          <li><b>No password:</b> <i>Sign in without a password</i> emails you a one-time link.</li>
          <li><b>Apps made before accounts:</b> after signing in, click <i>Copy them to my account</i>. The originals stay on this computer.</li>
        </ol>
        <p>Setting up Supabase: see <code>docs/SUPABASE_SETUP.md</code> in the builder folder.</p>
      </section>

      <section id="design">
        <h2>2. Design an app</h2>
        <ol>
          <li>On <b>My apps</b>, type a name, pick a starting template and click <b>Create app</b>.</li>
          <li>Drag widgets from the left onto the phone, or click a widget to add it below the one you selected.</li>
          <li>Click anything on the phone to edit its text, colours and size in the right panel.</li>
          <li>Add pages under <b>Pages</b>. Select a button and set <b>Action → When tapped → Go to a page</b> to link them. Buttons can also go back, open a website, call, open WhatsApp or show a message.</li>
          <li>For a bottom tab bar, open <b>App → Bottom navigation</b> on the right and tick 3–5 pages.</li>
          <li>Right-click any widget to copy, duplicate, move or put it inside a Card or Row. Ctrl+C / Ctrl+V work between pages.</li>
          <li>Click <b>Preview</b> and tap through the app. Press <b>Esc</b> to go back to editing.</li>
          <li>In the right panel under <b>App</b>, set the app name, brand colour and <b>App ID prefix</b> (for example <code>com.yourcompany</code>).</li>
        </ol>
        <p>Shortcuts: <code>Ctrl+Z</code> undo, <code>Ctrl+Shift+Z</code> redo, <code>Ctrl+C</code> / <code>Ctrl+X</code> / <code>Ctrl+V</code> copy, cut, paste, <code>Ctrl+D</code> duplicate, <code>Alt+↑</code> / <code>Alt+↓</code> move, <code>Delete</code> remove.</p>
      </section>

      <section id="data">
        <h2>Sign-in, databases and APIs in your app</h2>
        <ol>
          <li>Right panel → <b>App → Backend</b>: choose <b>Supabase</b> (Project URL + publishable key) or <b>Firebase</b> (project ID), and the <b>Login page</b>.</li>
          <li><b>Sign-in screen:</b> Text fields saved as <code>email</code> and <code>password</code> (Action → Save as) and a Button → <i>When tapped → Sign in</i>.</li>
          <li><b>Members-only page:</b> select the page → tick <i>Members only</i>.</li>
          <li><b>List from a database:</b> add a <b>Data list</b>, set the table name, drop a Card inside and write <code>{'{{name}}'}</code>-style placeholders in its texts.</li>
          <li><b>List from an API:</b> App → APIs → + Add API → <i>Test this API</i> shows the field names to use.</li>
          <li><b>Form that saves:</b> fields with <i>Save as</i> names and a Button → <i>Save the form</i> → table name or API.</li>
        </ol>
        <p>Start quickly with the <b>Login + database</b> template. These features export to Flutter. Full guide: <code>docs/BACKENDS.md</code>.</p>
      </section>

      <section id="export">
        <h2>3. Export</h2>
        <ol>
          <li>Click <b>Export app</b> and choose <b>Flutter</b> or <b>React Native (Expo)</b>.</li>
          <li>Open the <b>Checks</b> tab and fix anything marked <i>Problem</i> or <i>Check</i>, such as pages no button leads to.</li>
          <li>Click <b>Save to my computer</b> to write the project into the builder’s <code>exports</code> folder, or <b>Download ZIP</b> and unzip it to <code>C:\projects\apps</code>.</li>
        </ol>
        <p>Saving again after a design change updates the pages and keeps your Android/iOS folders, so you only set up once.</p>
      </section>

      <section id="ship">
        <h2>Phone preview, cloud builds and web publishing</h2>
        <h3>Try the app on your phone</h3>
        <ol>
          <li>In the editor click <b>📱 On phone → Turn on live preview</b> and scan the QR code.</li>
          <li>The phone shows the app in Preview mode and updates a few seconds after each save. Send the link to clients for review.</li>
          <li>On your own computer the phone must be on the same Wi-Fi; allow Node.js through Windows Firewall if asked.</li>
        </ol>
        <h3>Get an Android app and a website without installing Flutter</h3>
        <ol>
          <li><b>Export app → ☁ Cloud build &amp; publish</b> → create a GitHub token (scopes <i>repo</i> and <i>workflow</i>) → <b>Connect GitHub</b>.</li>
          <li>Choose the repository name and <b>Public</b> (free website) or <b>Private</b> (APK only), then <b>Build in the cloud</b>.</li>
          <li>After 6–10 minutes: <b>Download Android app (APK)</b> and <b>Open the website</b>, each with a QR code.</li>
        </ol>
        <p>Full guide: <code>docs/CLOUD_BUILDS.md</code>.</p>
      </section>

      <section id="run-flutter">
        <h2>4. Run the Flutter app</h2>
        <h3>One-time setup on your computer</h3>
        <ol>
          <li>Install the <b>Flutter SDK</b> (3.27 or newer) to <code>C:\src\flutter</code> and add <code>C:\src\flutter\bin</code> to PATH. Check with <code>flutter --version</code> and <code>where.exe flutter</code> (it must list only one folder).</li>
          <li>Install <b>Android Studio</b>. In <b>SDK Manager → SDK Tools</b> tick <b>Android SDK Command-line Tools</b>. In <b>Device Manager</b> create a <b>Pixel 8</b> with an <b>API 35</b> image.</li>
          <li>Run <code>flutter doctor --android-licenses</code> (press y for each) and then <code>flutter doctor</code>.</li>
        </ol>
        <h3>Each time</h3>
        <ol>
          <li>Start the emulator: Android Studio → Device Manager → ▶. Wait for the home screen.</li>
          <li>Double-click <code>run_windows.bat</code> in the app folder. It creates the platform folders, downloads packages, runs the automatic checks and starts the app.</li>
        </ol>
        <h3>In Android Studio instead</h3>
        <ol>
          <li>File → Settings → Plugins → Marketplace → install <b>Flutter</b> → restart.</li>
          <li>File → Open → the app folder (the one with <code>pubspec.yaml</code>) → Trust Project.</li>
          <li>File → Settings → Languages &amp; Frameworks → Flutter → SDK path <code>C:\src\flutter</code>.</li>
          <li>Click <b>Pub get</b>, choose the emulator in the toolbar and press ▶ Run.</li>
        </ol>
        <p>The first Android build takes 5–15 minutes. Later runs take seconds. Each app folder also contains <code>HOW_TO_RUN.md</code> with the same steps.</p>
      </section>

      <section id="run-rn">
        <h2>5. Run the React Native app</h2>
        <ol>
          <li>Install <b>Node.js</b> and the <b>Expo Go</b> app on your phone.</li>
          <li>Double-click <code>run_windows.bat</code> in the app folder.</li>
          <li>Scan the QR code with Expo Go. Phone and computer must be on the same Wi-Fi.</li>
        </ol>
      </section>

      <section id="check">
        <h2>6. Check the app works</h2>
        <p><code>flutter test</code> (run automatically by <code>run_windows.bat</code>) opens every page at phone size and taps every button that leads to a page. “All tests passed!” means no page has layout errors and every link works. Then check by hand:</p>
        <ul>
          <li>Every page matches the design.</li>
          <li>Every button goes to the right page, and the phone’s Back button works.</li>
          <li>Long pages scroll and text fields accept typing.</li>
          <li>No yellow-and-black striped bars appear.</li>
        </ul>
        <p>Make an installable Android file with <code>flutter build apk</code>. It is saved in <code>build\app\outputs\flutter-apk\</code>.</p>
      </section>

      <section id="problems">
        <h2>Problems and fixes</h2>
        <div className="tablewrap">
          <table>
            <thead><tr><th>What you see</th><th>Fix</th></tr></thead>
            <tbody>
              {problems.map(([a, b]) => (
                <tr key={a}><td>{a}</td><td>{b}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>Still stuck? Run <code>flutter doctor -v</code> and share its output together with the last 30 lines of the error.</p>
      </section>
    </div>
  );
}
