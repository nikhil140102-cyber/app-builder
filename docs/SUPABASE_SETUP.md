# Accounts and cloud saving with Supabase

With Supabase connected, people **sign up and sign in**, and every app they design is saved in **their own account**, so it opens from any computer. Without Supabase, the builder saves apps as files on this computer and needs no sign-in.

## 1. Create the Supabase project (one time)

1. supabase.com → **New project**. Name: `app-builder`. Database password: **Generate** and save it. Region: **South Asia (Mumbai)**.
2. **SQL Editor → New query** → paste everything from [`supabase/schema.sql`](../supabase/schema.sql) → **Run**. You should see *Success*.
3. **Authentication → Sign In / Providers** → make sure **Email** is on.
4. **Authentication → URL Configuration**
   - Site URL: `http://localhost:3000`
   - Redirect URLs → Add: `http://localhost:3000/**`
   - When you put the builder online, also add `https://your-domain.com/**`.

## 2. Connect the builder

1. Supabase → **Project Settings → API Keys** (or the **Connect** button). Copy:
   - **Project URL** — `https://xxxx.supabase.co`
   - **Publishable key** — starts with `sb_publishable_` (older projects: the **anon public** key)
2. In the builder folder, create `.env` if it does not exist (`copy .env.example .env`) and set:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxx
   ```
   Leave `NEXT_PUBLIC_STORAGE` empty or as `server`. Only `local` or `browser` turn accounts off.
3. Close the builder window and start it again (`start-windows.bat`).

**Never** put the `secret` / `service_role` key in `.env` or anywhere in the app. It bypasses all security.

## 3. First sign-in

1. Open http://localhost:3000. You are sent to **Sign in**.
2. Click **New here? Create an account**, enter name, email and a password (8+ characters).
3. Open the confirmation email **on the same computer** and click the link. You land back in the builder, signed in.
4. If you had apps saved on this computer, a box offers **Copy them to my account**. The originals stay on disk as a backup.

Other ways in: **Sign in without a password** (emailed link) and **Forgot password?**.

## Make yourself the platform admin

The admin page (**Admin** button next to your name, or `/admin`) lists every user, their app counts and last edit, and lets you **pause** or unpause accounts.

1. Run the latest `supabase/schema.sql` again (it adds the `profiles` and `admins` tables; your data is kept).
2. In the SQL Editor run, with your own email:
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = 'you@example.com' on conflict do nothing;
   ```
3. Reload the builder. The **Admin** button appears in the top bar.

A paused user sees "Your account is paused" and cannot open or change apps. Only admins can unpause.

## Checking it worked

Supabase → **Table Editor → projects**: each app you create appears as a row. **Authentication → Users** lists everyone who signed up.

## Problems and fixes

| What you see | Fix |
|---|---|
| Still no sign-in page | `.env` values missing, or `NEXT_PUBLIC_STORAGE` is `local` or `browser`. Fix `.env` and restart the builder. |
| "Cannot reach Supabase" | Internet is off, or the free project paused after a week unused: Supabase dashboard → **Restore project**. |
| "The projects table is missing" | Run `supabase/schema.sql` in the SQL Editor. |
| "The Supabase key in .env is wrong" | Copy the **Publishable** key again; no spaces or quotes. Restart. |
| Confirmation email never arrives | Check spam. Free Supabase sends only a few emails per hour — wait, or for testing turn off **Authentication → Sign In / Providers → Email → Confirm email**. Before launch, connect your own SMTP (Zoho, Brevo, Amazon SES) under **Authentication → Emails → SMTP Settings**. |
| Email link opens "localhost refused to connect" | Start the builder first, then click the link. Links only work on the computer running the builder. |
| "Email link is invalid or has expired" | Links last one hour and work once. Request a new one. |
| "Not saved — check your internet or sign in again" | Your session ended. Reload the page and sign in; unsaved edits from the last few seconds may need redoing. |

## Going online later

Deploying to Vercel works with the same two values: add them under **Vercel → Project → Settings → Environment Variables**, add your domain to Supabase Redirect URLs, and redeploy. "Save to my computer" is hidden online; users download ZIPs instead.
