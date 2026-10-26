# CareBridge 💚 — daily check-ins for older adults

CareBridge helps an older adult check in each day, save a mood or note, manage gentle reminders, and request help. Invited family members can check in on a separate account. This is a **starter web app connected to Supabase**, intended for a school coding project, not an emergency response service.

## Files

```text
CareBridge/
├── index.html                 # Interface: mobile-friendly CareBridge
├── src/
│   ├── app.js                 # Bootstrap, session lifecycle and events
│   ├── data.js                # Supabase response/error helper
│   ├── screens.js             # Check-ins, family, wellness, account views
│   ├── planner.js             # Shared task planner and calendar
│   ├── utils.js               # Dates, formatting and safe HTML escaping
│   ├── config.example.js      # Copy this to config.js
│   └── config.js              # YOU create this; ignored by Git
├── supabase/
│   └── schema.sql             # Database tables, RLS, invitation-code functions
├── tests/
│   └── planner.test.mjs         # Node built-in tests (no npm install)
├── package.json                # Optional test runner; no build step
├── .gitignore
├── START_HERE.txt             # Short setup checklist
└── README.md
```

This is vanilla HTML/CSS/JavaScript. **No npm install is required.** It imports a specific version of Supabase JS through jsDelivr, so the browser needs internet access.

## 1. Create a Supabase project

1. Go to https://supabase.com/dashboard and sign in.
2. Click **New project**; select your organization, set the project name to `CareBridge`, choose a region and a strong **database password**, and create the project.
3. When it is ready, open **SQL Editor** → **New query**.
4. Copy **all** of `supabase/schema.sql` into the SQL Editor and press **Run**. This creates `care_profiles`, `caregiver_links`, `check_ins`, `daily_notes`, `reminders`, `followups`, and a private `pairing_codes` table, as well as access rules and invitation-code functions.
   Optionally run `supabase/verify.sql` next. Each CareBridge table must have RLS enabled.
5. Under **Table Editor**, verify that the tables exist. Under **Authentication → Providers → Email**, leave email/password enabled. Hosted projects usually require email confirmation by default; keep that protection turned on.
6. Under **Authentication → URL Configuration**, set **Site URL** to `http://localhost:5500` and add `http://localhost:5500/**` to **Redirect URLs** for email confirmation while developing locally. If you use VS Code Live Server's port 5500, this is the default.
7. Open **Connect** or **Project Settings → API Keys** to get the **Project URL** and **publishable key** (`sb_publishable_...`). Do NOT use the secret key or legacy `service_role` key in browser code.

RLS controls row access: an older adult owns their rows, and only explicitly linked caregivers may read selected data. The pairing invitation is one-use and expires after 20 minutes.

**Important:** If the SQL Editor shows an error, do not proceed as if setup succeeded. Fix the error before using the app. Since this starter has not been tested against your Supabase project, test each access rule before entering real personal data.

## 2. Open and run in VS Code

1. Download and unzip this project, then open **Visual Studio Code**.
2. Choose **File → Open Folder…** and select the unzipped `CareBridge_GitHub_Supabase` folder.
3. In VS Code Explorer, duplicate `src/config.example.js` as `src/config.js` (or use `cp src/config.example.js src/config.js` in the terminal).
4. Open `src/config.js` and paste the Project URL and **publishable** key:

   ```js
   export const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
   export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_YOUR_KEY';
   ```

5. Start a local web server (do **not** double-click the HTML file). On macOS, open **Terminal → New Terminal** in VS Code and run:

   ```bash
   python3 -m http.server 5500
   ```

6. Open **http://localhost:5500** in your browser. You can also use the VS Code **Live Server** extension instead, then select **Go Live** (port may vary).
7. Keep the server terminal running while developing; use **Ctrl+C** to stop it.

If `python3` is unavailable, on Windows try `py -m http.server 5500` or use the Live Server extension. If login works but data does not load, check that you ran `schema.sql` and that **Supabase → Integrations → Data API** exposes the `public` schema.

## 3. Test the actual database

1. Choose **Create an account** and use a testing email and password (at least 8 characters). Verify the email if requested.
2. Sign in again. Choose **I'm an older adult** and enter a first name.
3. Press **I'm okay today**; optionally choose a mood. Go to **Settings** → **Create invitation code**. Copy the temporary code.
4. Open a **private/incognito browser window** or use a different browser, go to http://localhost:5500, and register a **different** email for the family member.
5. Sign in as the family member, enter the invitation code, and press **Connect to my loved one**.
6. The family dashboard should display the senior's check-in. In the older adult account, try **I could use help** and **Save note for family**. Refresh the family window to verify both updates.
7. In Supabase Dashboard → **Table Editor**, inspect `check_ins` and `caregiver_links` and confirm records were created.
8. Sign in with an unrelated third account; it must NOT be able to view the first older adult's data. This is a basic access-control check, not a substitute for thorough automated RLS testing.

Only use **fictional/sample data** until you've tested privacy and consent with your real project. Do not put passwords or sensitive medical information in the Git repository or test database.

## 4. Upload to GitHub

1. Create a new **empty** repository on https://github.com/new with name `CareBridge`. Choose **Public** or **Private**. For the commands below, **do not** select *Initialize with README*, *Add .gitignore*, or *License*, because these files already exist locally.
2. In the **VS Code terminal**, make sure you're inside the folder containing `index.html`, and run:

   ```bash
   git init
   git add .
   git status
   git commit -m "Build CareBridge with Supabase daily check-ins"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/CareBridge.git
   git push -u origin main
   ```

3. Replace `YOUR_USERNAME` with your actual GitHub username. GitHub may open a browser login or ask you to authenticate. GitHub does not accept your account password as a Git HTTPS password; use a credential manager, browser sign-in, or approved personal access token.
4. Refresh the GitHub repository webpage. You should see `index.html`, `src/app.js`, `src/config.example.js`, `supabase/schema.sql`, and this README. You should **not** see `src/config.js` because `.gitignore` excludes it.

When editing later:

```bash
git add .
git commit -m "Describe your change"
git push
```

If `git commit` reports that author identity is unknown, set it with Git's `git config --global user.name "Your Name"` and `git config --global user.email "you@example.com"` and retry. If remote `origin` already exists, don't add it again.

## 5. Publishing online (optional)

**Pushing to GitHub does not automatically create a public website.** A private repository just stores your source code, and even a public repository won't run on its own.

This static app can be hosted on GitHub Pages, but the deployed site also needs `src/config.js`. The Supabase publishable key is intentionally **public**, so putting only the URL and **publishable key** into that file is acceptable **after** RLS is configured and tested. Never publish a secret key or service-role key. Alternatively, use a host with build-time environment variables and move config out of the static file.

If using GitHub Pages: your site URL will be something like `https://YOUR_USERNAME.github.io/CareBridge/`. Set that as an additional **Site URL / Redirect URL** in Supabase Authentication settings, and handle config carefully. Do not publish this app with real user information until you have performed privacy/security tests and added operational protections.

## Features implemented vs. planned

**Implemented:** email-password signup/sign-in; senior/family separation; private profile; one-tap check-in; mood; daily note; reminders; help request; caregiver follow-up; last 7 days; family invitation codes; accessibility controls; refresh/sync on returning to the page.

**Not implemented:** automatic daily push/SMS notifications; caregiver alert emails; continuous live push updates; emergency dispatch; delivery guarantees; multi-caregiver management UI; comprehensive rate limiting/audit logs; production security review. A missed check-in preview is just a demo scenario.

### Supabase reference docs

- https://supabase.com/docs/guides/getting-started/api-keys
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/auth/passwords

## New: shared Care Planner (TickTick-inspired)

This upgraded folder adds an accessible **My planner / Care planner** tab for both roles, with:

- **Today, Upcoming, and calendar views** with category filters.
- **Medication, doctor appointment, important event, wellness, and other** tasks.
- **Dates, optional times, notes, and one-time / daily / weekly repeats.**
- Caregivers can **create and manage the tasks they add** for a linked older adult. Older adults may edit or delete any of their own shared tasks.
- **Only the older adult can mark tasks completed**. Family members can see the recorded status after refreshing the app.
- Large touch targets and readable task descriptions.

### Updating an existing CareBridge project

1. **Keep your existing `src/config.js`.** It contains your project URL and publishable key and is excluded from the downloadable ZIP and from Git by `.gitignore`.
2. Your CareBridge Supabase project's `care_tasks` and `care_task_completions` tables and associated policies have **already been created** for the connected project. Do not re-run `schema.sql`, which is intended for a new empty project.
3. From the project directory, run `git pull origin main` to receive the latest modules. Keep `src/config.js` local and do not commit it.
4. In VS Code, start `python3 -m http.server 5500` and open `http://localhost:5500`. Refresh with Cmd+Shift+R if cached.
5. Test with the senior account and a linked caregiver account in separate browser sessions. Caregiver: go to **Care planner → Add a task**, fill out a doctor's appointment, save. Senior: refresh, open **My planner** and mark that task done. Caregiver: refresh and see completion.

`supabase/planner_migration.sql` documents the exact database changes for a different or future Supabase project; only run it once for each project. The connected database was updated already.

**Limitations:** This is a task and acknowledgment system, not a medication dispensing or emergency response app. No scheduled browser notifications, SMS, email, push alerts, or automatic background reminders are included. Check off a medication task only as an acknowledgment, not as proof a drug was taken. Browser sync occurs on manual refresh or when the app regains focus.

## Source code structure (ES modules)

- `src/app.js`: small entry point and event controller (auth, Supabase session, check-ins and user actions).
- `src/screens.js`: reusable page renderers for seniors, family, wellness and account setup.
- `src/planner.js`: shared task planner, category filters, recurring dates, calendar toggle and task editor.
- `src/data.js`: Supabase query result/error helper.
- `src/utils.js`: date and HTML formatting helpers.
- `src/config.example.js`: public credentials template; copy to `src/config.js` (ignored by Git).

Uses native browser JavaScript ES modules and Python's static server; no build tool or `npm install` is necessary. Changes are automatically picked up after a hard refresh.

### Run automated tests

With Node installed, run `node --test tests/*.test.mjs` (or `npm test`). Neither command requires installing packages. The tests cover planner recurrence, calendar visibility, HTML escaping, and edit permissions in the UI. The real Supabase RLS permissions are enforced by the database, not these client-side tests.

For your existing Supabase project, **do not rerun the original SQL schema**: the database is already configured and no database changes are needed for this refactor.

## Nearby Places — Google Maps iframe and saved places (no Google API key)

The older-adult **Nearby** page uses Google Maps's `www.google.com/maps?q=...&output=embed` iframe format for viewing searches and saved places. It does **not** request Places API access or load Maps JavaScript API. The iframe format is not Google's guaranteed Maps Embed API: if it stops working, open the search using **Open in Google Maps**, which uses the officially supported key-free Maps URLs.

Features:
- Choose Pharmacies, Doctors & clinics, Groceries, Parks, Libraries, Senior centers, or Cafés.
- Enter a city or ZIP and click **Find on map**, or explicitly allow device location. The map shows a Google Maps search query, not a structured list returned to CareBridge.
- **My saved places** reads from the private `public.businesses` table in Supabase. Save a name and address, search the list, select a saved place, remove one, or open Google Maps directions.
- **Hide map / Show map** provides a larger saved-place list.
- No Google Maps API key, map ID, or JavaScript maps loader is used. The previous `src/maps-config.js` can remain locally but is ignored.

Database setup: The connected CareBridge Supabase project already has the `businesses` table after this update. For a different project, apply `supabase/businesses_migration.sql` once. Each user's saved places are isolated by row-level security policies. The page does not store GPS coordinates obtained from the browser.

Run with `python3 -m http.server 5501` and visit `http://localhost:5501` with your older-adult account. Google Maps URLs search/directions are supported without API keys; Google's official Maps Embed API requires an API key, so this lightweight iframe format might vary by browser.