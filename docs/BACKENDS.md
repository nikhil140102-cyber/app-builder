# Sign-in, databases and APIs in the apps you build

Apps made in the builder can sign users in, show lists from a database or an API, and save forms. These features export to **Flutter** (the React Native export shows the screens without them for now).

## 1. Choose a backend for the app

Right panel → **App → Backend (sign-in & database)**:

| Backend | What you enter | Good for |
|---|---|---|
| **Supabase** | Project URL + **publishable** key of the app's Supabase project | SQL tables, simple setup, India region (Mumbai) |
| **Firebase** | Firebase project ID | Google ecosystem, Firestore collections |
| None | — | Apps without sign-in or a database |

Also choose the **Login page**: the page with your Sign in button. Members-only pages show it to signed-out users.

Never paste a **secret** / **service_role** key. The checks block it.

## 2. Build the screens

| You want | Do this |
|---|---|
| A sign-in screen | Two **Text fields** with *Action → Save as* `email` and `password`, plus a **Button** → *When tapped → Sign in* → *Then go to* your home page |
| A sign-up screen | Text fields `name`, `email`, `password` + Button → *Create account* |
| A sign-out button | Button → *Sign out* |
| OTP login (no password) | Text field saved as `email` (or `phone`) + Button → *Send a one-time code*; on the next page a Text field saved as `code` + Button → *Verify the code and sign in*. Template: **OTP login** |
| A members-only page | Select the page → *Members only* |
| A list from a database | Add a **Data list** → *Get rows from: table* → table name. Drop a Card inside and write `{{column}}` in its texts, e.g. `{{name}}`, `₹{{price}}` |
| A list from an API | *App → APIs → + Add API*, paste the URL, click **Test this API** to see the field names. Then Data list → *Get rows from: API* |
| A form that saves | Text fields / checkboxes / dropdowns with *Save as* names, and a Button → *Save the form* → table name (or an API for a POST) |
| Show the user's email | Write `{{user.email}}` in any text |

The fastest start: create an app from the **Login + database** template.

**Preview** shows real rows when the browser can read the source (APIs that allow it, and Supabase tables whose rules allow reading); otherwise it shows the template with placeholders.

### Detail pages (tap a row to open it)
Put a **Button** inside a Data list's card and set *When tapped → Go to a page*. The tapped row travels to that page, so `{{field}}` on the detail page shows that row (for example `{{strMeal}}` and `{{strMealThumb}}` for a dish). It also travels one step further when that page opens another page (dish → checkout).
On a form page opened this way, tick **Also save the item this page shows** on the *Save the form* button to send the row along as `item` (for a Supabase table, add a `jsonb` column named `item`).
The **Food delivery** template shows the whole flow: dishes from TheMealDB (free, no key) → dish page → checkout → order placed. Its orders go to a demo API that accepts but does not keep them; point the *Orders* API at your own server, or switch the button to *A database table* (`orders`).

### Search box and category tabs
1. Add a **Text field** (or Dropdown) to the page with the Data list and set its *Save as* to `search`.
2. Select the **Data list** → *Search & filter* → **Filter by**: `search`, and **Look in**: the row fields to search (e.g. `strMeal`, or `title, category`). The list now filters as you type, in Preview and in the app.
3. For category tabs, add **Chips** with *When tapped → Filter a list on this page*, *Filter name* `category` and *Show rows containing* `beauty` (leave empty for an "All" tab). Add `category` to the list's *Filter by* too: `search, category`. The tapped tab shows a ✓.
The **Shop with tabs** template shows this on its Search page.

## 3. Prepare the backend

### Supabase
1. Authentication → Sign In / Providers → **Email** on.
2. Create each table your app uses, with row level security. Example (`products`):

```sql
create table if not exists public.products (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id uuid default auth.uid(),
  name text,
  price numeric,
  image text
);
alter table public.products enable row level security;
create policy "Anyone can read products" on public.products for select using (true);
create policy "Signed-in users can add products" on public.products for insert to authenticated with check ((select auth.uid()) = user_id);
```
Column names must match the **Save as** field names and the `{{placeholders}}`.

### OTP (one-time code) login with Supabase
1. Authentication → **Emails** → **Templates**: in **Magic Link** *and* **Confirm signup**, add the code to the message, e.g. `<p>Your code: <b>{{ .Token }}</b></p>`, then **Save**.
2. Authentication → Sign In / Providers → **Email**: check *Email OTP Expiration* (e.g. 3600 s) and *Email OTP Length* (6).
3. SMS codes: Authentication → Sign In / Providers → **Phone** → enable and connect an SMS provider (Twilio, MessageBird, Vonage or Textlocal). Each SMS is charged by the provider.

### Firebase
1. Firebase console → **Authentication → Sign-in method → Email/Password → Enable**.
2. **Firestore Database → Create database**, then set rules (example: anyone reads, signed-in users write):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{collection}/{doc} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```
3. On your computer, once: `npm install -g firebase-tools` then `firebase login`.

## 4. Export and run

**Export app → Flutter → Save to my computer**, then double-click `run_windows.bat`. It adds the packages (`supabase_flutter`, or `firebase_core` + `firebase_auth` + `cloud_firestore`, and `http` for APIs) and, for Firebase, runs `flutterfire configure` to create `lib/firebase_options.dart`.

## Problems and fixes

| What you see in the app | Fix |
|---|---|
| "Invalid login credentials" | Wrong email/password, or the account was never created. |
| "Email not confirmed" | Open the confirmation email, or turn off *Confirm email* in Supabase while testing. |
| A list shows "relation … does not exist" | Create the table in Supabase (SQL above). |
| A list shows "permission denied" / is always empty | Add a *select* policy to the table (Supabase) or fix Firestore rules. |
| Saving shows "violates row-level security" | Add an *insert* policy; for signed-in users include `user_id uuid default auth.uid()`. |
| "No backend connected" | App → Backend → choose Supabase or Firebase and export again. |
| Firebase: "Could not connect" in `run_windows.bat` | Install the Firebase CLI, run `firebase login`, check the project ID. |
| `Target of URI doesn't exist: package:supabase_flutter` | Run `flutter pub get` in the app folder. |
