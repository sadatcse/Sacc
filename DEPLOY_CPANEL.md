# Deploying on cPanel

The site is a Next.js 16 app. cPanel runs it with **Setup Node.js App** (Phusion Passenger) using the startup file `server.cjs`. The database is MongoDB (Atlas or any MongoDB server). Uploaded photos are saved on the server's disk.

## What you need

- cPanel with **Setup Node.js App**, **Node.js 20.9 or newer** (pick 22 if offered).
- A MongoDB connection string (e.g. a free MongoDB Atlas cluster). In Atlas → Network Access, allow your server's IP (or `0.0.0.0/0`).
- About 1.5 GB of free memory while building (see "If the build runs out of memory").

## 1. Make the upload package (on your computer)

```bash
npm run pack:cpanel
```

This creates `deploy/usacc-cpanel.tar.gz` with the source code. It leaves out `node_modules`, `.next`, `.env` and the `uploads` folder.

## 2. Create the Node.js app in cPanel

cPanel → **Setup Node.js App** → **Create Application**:

| Field | Value |
| --- | --- |
| Node.js version | 20.9+ (22 recommended) |
| Application mode | Production |
| Application root | e.g. `usacc` (the folder `/home/<user>/usacc`) |
| Application URL | your domain, e.g. `southasiacomputerclub.com` |
| Application startup file | `server.cjs` |

Click **Create**, then **Stop App** for now.

## 3. Upload the code

cPanel → **File Manager** → open the application root (`usacc`) → **Upload** `usacc-cpanel.tar.gz` → right-click → **Extract** → delete the `.tar.gz`.

## 4. Environment variables

In **Setup Node.js App** → your app → **Environment variables**, add (or put them in a `.env` file in the application root — copy `.env.example`):

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.com` (no trailing slash) — **must be set before building** |
| `MONGO_URI` | your MongoDB connection string |
| `JWT_SECRET` | a long random string (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
| `UPLOAD_DIR` | `/home/<user>/usacc-uploads` — keeps uploaded photos **outside** the app folder, so a redeploy never deletes them |
| `SMTP_*`, `CONTACT_NOTIFICATION_EMAIL` | optional (email can also be set in Dashboard → Settings → Email) |
| `GOOGLE_SITE_VERIFICATION` | optional — the code from Google Search Console |

## 5. Install and build

In **Setup Node.js App** click **Run NPM Install** (keep `package-lock.json` in the upload so the server gets exactly the same package versions).

Then **build** — this creates the `.next` folder; the site cannot start without it ("Could not find a production build in the '.next' directory" means this step was skipped or failed):

- **Without a terminal:** Setup Node.js App → your app → **Run JS script** → choose **build** → wait until it finishes (a few minutes).
- **With the Terminal:** run the command shown at the top of the app's page ("Enter to the virtual environment"), for example:

```bash
source /home/<user>/nodevenv/usacc/22/bin/activate && cd /home/<user>/usacc
npm run build
```

Then **Start App** (or **Restart**). Open your domain — the site should load.

### Older servers (CentOS 7 / CloudLinux 7–8)

Next.js is pinned to **16.2.12** on purpose: it is the newest release whose native compiler runs on old servers (glibc 2.17+). Next.js 16.3 and newer need glibc 2.30 — on these servers they fall back to a WebAssembly compiler that runs out of memory. **Don't upgrade `next` past 16.2.x** while the site is hosted here.

On a server with a per-process memory cap (CloudLinux), `npm run build` automatically builds gently: webpack, one process, 1 GB heap. Click **Stop App** before building so the running site doesn't use the same memory.

### Older notes

`npm run build` checks the server first. If its system library (glibc) is older than 2.29 — errors like *"Turbopack is not supported on this platform"* or *"GLIBC_2.29 not found"* — it automatically:

- builds with **webpack** instead of Turbopack (takes a few minutes longer),
- runs Node with `--disable-wasm-trap-handler` and **low-resource settings** (1 worker, 1.5 GB heap). Without this the WebAssembly compiler reserves ~10 GB of address space and CloudLinux stops the build with *"JavaScript heap out of memory"* even though little memory is used, and
- if the image library (sharp) can't run natively, installs its **WebAssembly build** so uploaded photos are still resized and converted to WebP. If the build then prints *"add NODE_OPTIONS = --disable-wasm-trap-handler"*, add that environment variable to the app, run **build** again and Restart.

If even the WebAssembly image library can't run, the site still works: photos are shown as uploaded (`.image-unoptimized` marker file). You don't need to do anything — just run **build** as usual. (After every **Run NPM Install**, run **build** again — it re-installs the WebAssembly image library.)

**Tip:** click **Stop App** before building — the running site counts against the same account memory limit as the build.

### If the server can't build at all (too little memory) — the way to deploy on cdc.multisports.com.bd

This hosting account's memory limit is too small to run a Next.js build, so the site is built on GitHub instead.

Build on Linux elsewhere and upload a package that already contains the build:

1. Push your changes to `main` on GitHub — the **cPanel package** workflow then builds automatically (or: **Actions** → **cPanel package** → **Run workflow**, optionally with another site URL). The site URL comes from the repository variable `SITE_URL` (Settings → Secrets and variables → Actions → Variables), default `https://cdc.multisports.com.bd`. Wait ~3–5 minutes for the green tick.
2. Open the finished run → download the artifact **usacc-cpanel-built** (a zip containing `usacc-cpanel-built.tar.gz`).
3. cPanel → File Manager → upload `usacc-cpanel-built.tar.gz` into the application root → **Extract** (it replaces `.next`).
4. **Run NPM Install** → **Restart**. Do **not** run build on the server (it would replace the uploaded build).

(On any Linux machine / WSL: `npm ci && NEXT_PUBLIC_SITE_URL=https://… npm run build && npm run pack:cpanel -- --with-build`. Don't upload a build made on Windows.)

### If the build runs out of memory

Shared hosting often limits memory. Try:

```bash
npm run build:low-memory
```

If it still fails, ask your host to raise the memory limit for the build, or build on a Linux machine / WSL with the **same Node.js version**, then upload the `.next` folder into the application root (keep `node_modules` from "Run NPM Install" on the server — never upload Windows `node_modules`, the image library `sharp` is platform-specific).

## 6. First admin account

In the Terminal (inside the virtual environment, in the app folder):

```bash
npm run create-admin -- you@example.com YourStrongPassword "Your Name"
```

Optional demo content: `npm run seed`.

## Updating the site later

1. `npm run pack:cpanel` on your computer.
2. Upload and extract over the old files (your `.env` and `UPLOAD_DIR` folder are not touched).
3. **Run NPM Install** (only if `package.json` changed) → `npm run build` in the Terminal → **Restart**.

## Photos and uploads

- Every photo field (news covers and article images, executives, alumni, profiles, About page) accepts a link **or** an uploaded file. Uploads are converted to WebP (max 2000 px) and saved in `UPLOAD_DIR` (default `<app>/uploads`), served at `/uploads/…`.
- Gallery uploads are stored in MongoDB; files in `public/gallery` are imported from Dashboard → Gallery.
- **Back up `UPLOAD_DIR`** with your cPanel backups — it is the only copy of uploaded pictures.
- The upload limit is 10 MB per image. If uploads fail with "413", raise the request size limit in cPanel (or ask your host).

## Background jobs

Donation reminder emails are sent by the app itself every 5 minutes while it runs (`instrumentation.js`). Passenger may stop an idle app; to make sure reminders still go out, add a cPanel **Cron Job** (every 10 minutes):

```bash
curl -s -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/donation-reminders > /dev/null
```

and set the same `CRON_SECRET` in the environment variables.

## SEO checklist after going live

- Check `https://your-domain.com/robots.txt` and `https://your-domain.com/sitemap.xml`.
- Add the site to **Google Search Console** (and Bing Webmaster Tools), verify with `GOOGLE_SITE_VERIFICATION` / `BING_SITE_VERIFICATION`, and submit the sitemap.
- Enable **SSL** (cPanel → SSL/TLS Status → AutoSSL) and make `NEXT_PUBLIC_SITE_URL` use `https://`.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| "eval: syntax error near unexpected token `)`" (from `nodevenv/…/bin/npm`) | An environment variable in Setup Node.js App was typed **with quote marks** (e.g. `SMTP_PASS` = `"abc)"`). Enter values **without quotes**. Passwords with `)` `(` `;` etc. are better saved in Dashboard → Settings → Email instead of an environment variable. |
| "JavaScript heap out of memory" / "Out of memory error may be caused by hitting LVE limits" | Upload the current `scripts/build.js` + `next.config.mjs` (they disable the WebAssembly memory reservation and build with 1 worker), run **build** again. If it still fails, ask the host to raise the account's LVE memory limit to 2 GB+ for the build. |
| "Cannot find module …/node_modules/next/dist/bin/next" / "Next.js is not installed for this app" | The `node_modules` link in the app folder is gone (it points into the Node.js virtual environment). **Run NPM Install**, then **build**. Don't delete `node_modules` in File Manager and don't upload one from your computer. |
| "ENOENT … .next/server/preview-props.json" / "The build was made with Next.js X, but Next.js Y is installed" | The `.next` folder came from another computer or another Next.js version. Never upload `.next` from Windows — run **build** on the server (or use the GitHub "cPanel package"). `package.json` pins the exact versions, so after **Run NPM Install** the server matches. |
| "Turbopack is not supported on this platform" / "GLIBC_2.29 not found" | You ran `next build` directly or an old `package.json`. Upload the current `package.json` and `scripts/build.js`, then Run JS script → **build** (it switches to webpack automatically). |
| "Could not find a production build in the '.next' directory" / "The website has not been built yet" | Build first: Run JS script → **build** (or `npm run build` in the Terminal), then **Restart**. Don't use Run JS script → start — Passenger starts `server.cjs` itself. |
| "Could not start the website" / 503 | Run `npm run build` again, then Restart. Check the app's log (`stderr.log` in the app root). |
| Pages load but say the database is unreachable | Check `MONGO_URI` and the Atlas IP allow-list. |
| Uploaded photos disappear after an update | Set `UPLOAD_DIR` to a folder outside the application root. |
| Links in emails / sitemap show `localhost` | Set `NEXT_PUBLIC_SITE_URL` and rebuild. |
