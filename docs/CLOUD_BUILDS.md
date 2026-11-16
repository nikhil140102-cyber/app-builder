# Cloud builds, web publishing and phone preview

## Preview on a phone (live, while you design)

1. In the editor, click **📱 On phone → Turn on live preview**.
2. Scan the QR code with the phone camera. The app opens in Preview mode and updates a few seconds after each save.
3. Send the same link to a client to review the design. **Turn off link** stops it working.

Running the builder on your own computer: the phone must be on the **same Wi-Fi**. The first time, Windows may ask whether Node.js can use the network: allow **Private networks**. If it was blocked earlier: Windows Security → Firewall → Allow an app → Node.js → tick Private.

With accounts (Supabase), run the latest `supabase/schema.sql` once — it adds the `previews` table.

## Build an Android app and a website without installing Flutter

The builder uploads the Flutter export to **your GitHub account**; GitHub Actions builds it (free plan: about 2,000 minutes/month; one build takes 6–10 minutes).

### One-time: connect GitHub
1. Create a free account at github.com if needed.
2. **Export app → ☁ Cloud build & publish → open GitHub token page**. Keep the scopes **repo** and **workflow**, set an expiry, **Generate token**, copy it.
3. Paste it and click **Connect GitHub**. The token is stored only in this browser and sent only to GitHub.

### Each build
1. Check the **Repository** name (`your-name/app-name`). For a new repository choose **Public** to also get a free website, or **Private** for the APK only.
2. Click **Build in the cloud**. The steps show: Upload → Build (with a link to the live log) → Downloads ready.
3. When done:
   - **Download Android app (APK)** — open it on an Android phone and allow "Install unknown apps".
   - **Open the website** — `https://your-name.github.io/app-name/`, with a QR code for phones.
   - Every build is also listed under the repository's **Releases**.

Building again uploads the latest design. `pubspec.yaml` and other files you changed on GitHub are kept.

### What gets added to the repository
`.github/workflows/build.yml` — creates the Android/iOS/web folders on the first build, runs the automatic checks, builds the APK (attached to a GitHub Release) and publishes the website to GitHub Pages.

## Problems and fixes

| What you see | Fix |
|---|---|
| "GitHub rejected the token" | It expired or was copied wrongly. Create a new classic token with **repo** + **workflow**. |
| "The token needs the workflow scope" | Create a new token and tick **workflow**. |
| Fine-grained token warning | Use a **classic** token (Personal access tokens → Tokens (classic)). |
| "Web publishing … needs a public repository" | GitHub Pages is free for public repositories only. Make the repository public (Settings → Danger zone → Change visibility) or use the APK. |
| Build fails at "Check Firebase setup" | Run `run_windows.bat` once on your computer, then upload `lib/firebase_options.dart` to the repository (Add file → Upload files) and build again. |
| Build fails at "Build Android app" | Open the log, copy the red lines, and share them for help. |
| Website shows a blank page | Wait 1–2 minutes after the build, then reload. Check Settings → Pages shows "GitHub Actions" as the source. |
| APK won't install | Allow installing from your browser/files app (Settings → Apps → Special access → Install unknown apps). |
| Phone can't open the live preview | Same Wi-Fi as the computer, firewall allows Node.js, and the builder is running. Or put the builder online. |
| "Preview not available" | The link was turned off, or (with accounts) `supabase/schema.sql` v3 has not been run. |
