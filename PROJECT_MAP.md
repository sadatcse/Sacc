# Project Map — USACC Website

University of South Asia Computer Club site. Next.js 16 (App Router, Turbopack) · React 19 · motion (animations) · **JavaScript only (no TypeScript)** · Tailwind 3 · MongoDB/Mongoose · JWT cookie auth.

- Import alias: `@/*` → `src/*` (e.g. `@/lib/db`, `@/components/ui/Button`)
- Routes live in `app/`; everything else lives in `src/`
- Route files stay thin: `app/**/page.jsx` renders a view from `src/views/` (dashboard/login) or composes `src/components/ui/*` (public pages)
- **Light / dark mode everywhere:** never use fixed greys (`bg-white`, `text-gray-700`, `bg-neutral-900`…). Use the theme tokens from [tailwind.config.js](tailwind.config.js): `bg-canvas` (page), `bg-canvas-2`, `bg-surface` (cards), `bg-surface-2`, `text-ink` (headings), `text-ink-2`, `text-body`, `text-muted`, `text-subtle`, `text-faint`, `border-line/10` (hairlines; `bg-line/5` tints). Values live in [src/styles/globals.css](src/styles/globals.css) (`:root` = light, `.dark` = dark). Accent text: `text-orange-600 dark:text-orange-400`. Keep `text-white` only on brand gradients / photos.
- **Responsive:** phones (< md) get stacked cards instead of tables (`DataTable`), bottom-sheet dialogs (`Modal`), a full-screen menu (`Navbar`); wide screens widen containers (`2xl:max-w-screen-2xl`) and scale type up from 1920px
- `npm run dev` · `npm run build` · `npm run lint` · `npm run seed` (demo accounts + starter content, safe to re-run; `-- --force` overwrites) · `npm run create-admin -- <email> <password> [name]`
- **Roles:** `admin` = teachers/faculty (dashboard, AdminProfile) · `student` (StudentProfile) · `alumni` (AlumniProfile, listed in the directory once approved)
- **Backend layers:** `app/api/**/route.js` (thin) → `src/server/controllers/` (HTTP) → `src/server/services/` (DB logic + input cleaning) → `src/models/` (Mongoose). Public pages call services directly.

## Where do I go to…

| Task | File(s) |
| --- | --- |
| Change club name, tagline, email, social links | [src/config/site.js](src/config/site.js) |
| Add or rename a menu link (navbar, footer, legal, dashboard sidebar) | [src/config/navigation.js](src/config/navigation.js) |
| Hide the Navbar/Footer on a route | `appOnlyRoutes` in [src/config/navigation.js](src/config/navigation.js) |
| Change brand colours / light & dark palettes | `primary` scale + tokens in [tailwind.config.js](tailwind.config.js); token values per theme in [src/styles/globals.css](src/styles/globals.css) |
| Theme switch (light / dark / system) | [src/components/layout/ThemeToggle.jsx](src/components/layout/ThemeToggle.jsx) + no-flash script in [app/layout.jsx](app/layout.jsx) |
| Site timezone, club registration on/off | Dashboard → **Settings** (`/dashboard/settings`); timezone helpers in [src/lib/timezone.js](src/lib/timezone.js) |
| Change the logo or favicon | `public/logo.png` (+ copies `app/icon.png`, `app/apple-icon.png`), `app/favicon.ico`; component [src/components/layout/Logo.jsx](src/components/layout/Logo.jsx) |
| Edit home page text, numbers, photos | [src/data/home.js](src/data/home.js) (static parts). **Upcoming/Recent Events, Activities & Achievements, Workshops & Seminars** and the committee come from MongoDB — manage them in Dashboard → News & Events / Executives |
| Edit Terms / Privacy / Cookie / Refund text | [src/data/legal.js](src/data/legal.js) (rendered by `LegalPage`) |
| Add / edit executives & committees | Dashboard → **Executives** (`/dashboard/executives`); data in MongoDB (`Executive` + `CommitteePosition`) via [src/server/services/executive.service.js](src/server/services/executive.service.js) |
| Add / edit news posts & events | Dashboard → **News & Events** (`/dashboard/news`); cover photos in `public/news/`; data in MongoDB (`Post`) via [src/server/services/news.service.js](src/server/services/news.service.js); body text format in [src/lib/news-format.js](src/lib/news-format.js) |
| Add gallery photos | Drop images into `public/gallery/` (sub-folder = album, readable file name = caption) — no code changes; scanned by [src/lib/gallery.js](src/lib/gallery.js) |
| Add / rename a news category | [src/data/news-categories.js](src/data/news-categories.js) ("Upcoming Events" is automatic: events not yet held) |
| Add / edit / approve alumni | Dashboard → **Alumni** (`/dashboard/alumni`); data in MongoDB (`AlumniProfile`) via [src/server/services/alumni.service.js](src/server/services/alumni.service.js) |
| Student → alumni (requests, executive conversion) | Students: Account → **Become Alumni**; admins: Dashboard → Alumni → *Requests*, and Dashboard → Executives → **Convert to Alumni**; logic in [src/server/services/alumni-request.service.js](src/server/services/alumni-request.service.js) |
| Edit the About page (mission, vision, numbers, journey) | Dashboard → **About Page** (`/dashboard/about`) → `Setting` key `about` via [src/server/services/settings.service.js](src/server/services/settings.service.js) (defaults there too) |
| Membership applications / registration open-closed, fee, bKash/Nagad/Rocket numbers | Dashboard → **Membership** (`/dashboard/membership`); form options in [src/config/membership.js](src/config/membership.js); logic in [src/server/services/membership.service.js](src/server/services/membership.service.js) |
| Manage users & roles | Dashboard → **Users** (`/dashboard/users`) → [src/server/services/user.service.js](src/server/services/user.service.js) |
| Change profile fields for a role | [src/config/profiles.js](src/config/profiles.js) (drives both the API allowlist and the profile form) + the role's model in `src/models/` |
| Starter content / demo accounts | [scripts/seed.js](scripts/seed.js) reading [src/data/seed/](src/data/seed/); account emails & passwords from `SEED_*` in `.env` |
| Home page layout / sections | [src/components/home/](src/components/home/) |
| Global CSS | [src/styles/globals.css](src/styles/globals.css) |
| Site-wide `<head>`/metadata | [app/layout.jsx](app/layout.jsx) |
| Protect routes / CORS / login redirect | [proxy.js](proxy.js) (Next 16's replacement for middleware): `/dashboard` admins only, `/account` any signed-in user |
| Add a public page | `app/<route>/page.jsx` + link in `mainNav` + entry in [app/sitemap.js](app/sitemap.js) |
| Add a dashboard page | `app/dashboard/<route>/page.jsx` → view in `src/views/dashboard/` + link in `dashboardNav` |
| Add an API endpoint | `app/api/<name>/route.js` exporting `route(controller.fn, { roles: ['admin'] })` from [src/server/http.js](src/server/http.js); logic in a controller + service |
| Add a database collection | `src/models/<Name>.js` (use the `mongoose.models.X \|\| mongoose.model(...)` pattern) |
| Contact form behaviour | [src/components/forms/ContactForm.jsx](src/components/forms/ContactForm.jsx) → [app/api/contact/route.js](app/api/contact/route.js) |
| Email (SMTP host/port/user/pass/from, which emails are sent) | Dashboard → **Settings → Email**; stored in `Setting` key `email` (password AES-encrypted via [src/lib/secret-box.js](src/lib/secret-box.js)); templates + senders in [src/server/services/mail.service.js](src/server/services/mail.service.js) — join received/approved/rejected, contact auto-reply, club-inbox notices |
| Navbar avatar / account dropdown | [src/components/layout/UserMenu.jsx](src/components/layout/UserMenu.jsx) (fed by `GET /api/auth/session`) |
| Visitor tracking | `useVisitorLog` in [src/components/layout/AppShell.jsx](src/components/layout/AppShell.jsx) → [app/api/visitor/log/route.js](app/api/visitor/log/route.js) |
| Login / register / session | [src/server/controllers/auth.controller.js](src/server/controllers/auth.controller.js), [src/lib/session.js](src/lib/session.js), [src/lib/auth-guard.js](src/lib/auth-guard.js), [src/providers/AuthProvider.jsx](src/providers/AuthProvider.jsx) |
| Environment variables | [.env.example](.env.example) |

## Root files

| File | Purpose |
| --- | --- |
| `next.config.mjs` | Security headers; pins `turbopack.root` (project is nested inside another Next app's folder) |
| `proxy.js` | CORS for `/api/*`; `/dashboard/*` admins only (others → `/account`), `/account/*` and `/alumni/<slug>` need a session (→ `/login?from=`); signed-in users skip `/login` & `/register` (→ `from` if safe, else their home) |
| `jsconfig.json` | `@/*` alias |
| `tailwind.config.js` / `postcss.config.js` | Tailwind setup; scans `app/` and `src/` |
| `eslint.config.mjs` | ESLint (next config) |
| `.env.example` | `NEXT_PUBLIC_SITE_URL`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `SMTP_*`, `CONTACT_NOTIFICATION_EMAIL`, `ALLOW_REGISTRATION`, `SEED_*` (demo accounts) |
| `scripts/create-admin.js` | Creates/promotes/resets an admin (faculty) user |
| `scripts/seed.js` | `npm run seed`: 3 demo accounts (admin/student/alumni, from `SEED_*`) + 2 test logins with full profiles (`test.student@usacc.edu.bd` / `TestStudent@123`, `test.alumni@usacc.edu.bd` / `TestAlumni@123`) + news, executives, alumni from `src/data/seed/` |
| `public/logo.png` | Club logo (270×251), served at `/logo.png`; used by `Logo` and the Open Graph image |
| `public/gallery/` | Gallery photos — everything here shows on `/gallery` and the home page preview (newest 6) |
| `public/news/` | News post cover photos |
| `public/about/` | About page photos (`inauguration-2024.jpg`) |
| `public/projects/` | Home page "Project Showcase" photos (one per project, set in `projects` in `src/data/home.js`) |
| `public/executives/` | Committee photos, one per person (`<slug>.jpg`, 600×600) |
| `AGENTS.md` / `CLAUDE.md` | Agent instructions (the Next.js block in AGENTS.md is auto-regenerated by `next dev`) |

## `app/` — routes

### Shell & special files
| File | Purpose |
| --- | --- |
| `app/layout.jsx` | Root layout: metadata, theme no-flash script, reads the `site` setting (timezone) per request (`dynamic = 'force-dynamic'`), wraps everything in `AppShell` |
| `app/loading.jsx` | Global loading UI |
| `app/not-found.jsx` | 404 page |
| `app/robots.js` | robots.txt |
| `app/sitemap.js` | sitemap.xml (nav pages + every published news post from MongoDB) |
| `app/error.jsx` | Error page (e.g. database unreachable) |
| `app/favicon.ico`, `app/icon.png`, `app/apple-icon.png` | Browser-tab / bookmark / iOS icons (Next serves these automatically) |

### Public pages
Executives, Alumni, News and the home page's committee are read from MongoDB on every request (`dynamic = 'force-dynamic'`).

| Route | File |
| --- | --- |
| `/` | `app/page.jsx`: dark designed home page (sections in `src/components/home/`, content in `src/data/home.js`, committee from DB) |
| `/about` | `app/about/page.jsx`: About page — mission/vision cards, "How it all started" (inauguration 9 March 2024, photo in `public/about/`), count-up numbers, alternating "Our Journey" timeline, join CTA (content from `Setting` `about`) |
| `/join` | `app/join/page.jsx`: club membership application via `JoinForm` (open/closed banner, fee + payment number with copy, photo upload, soft skills; no university email) → saved as **draft** |
| `/executives` (`?year=2025`) | `app/executives/page.jsx`: year tabs, Faculty Advisors + Student Executives cards (defaults to newest year) |
| `/executives/[slug]` (`?year=` sets breadcrumb) | `app/executives/[slug]/page.jsx`: profile, all positions held across years, stats; unknown slug → 404 |
| `/alumni` | `app/alumni/page.jsx`: Alumni Directory (search, filters, sort) via `AlumniDirectory`; header button by visitor (signed out: **Apply for Alumni Membership** → `/register?type=alumni`; alumni: update profile; admin: manage) + "Join the alumni network" section (3 steps) for signed-out visitors; each card opens the profile and shows social links (everyone) + shared email / phone / WhatsApp (signed-in visitors only — contact is not even sent to signed-out browsers) |
| `/alumni/[slug]` | `app/alumni/[slug]/page.jsx`: alumni profile — header (job, batch, shift, class of, location, mentor badge, links, email if shown), About, Message to students, Experience timeline, Education, Achievements, Quick facts, Skills, mentoring CTA, More alumni; approved entries only (student ID never shown); **members only** — signed-out visitors go to `/login?from=…` and return here after signing in / signing up |
| `/news` | `app/news/page.jsx`: dark News & Events list (featured post, category chips, type filter, search, load more) via `NewsDirectory`; `?category=<key>` preselects a category |
| `/news/[slug]` | `app/news/[slug]/page.jsx`: `ArticleView` (blog layout) or `EventView` (details sidebar, guests, seats) by post `type`, plus related posts; unknown slug → 404 |
| `/gallery` | `app/gallery/page.jsx`: dark masonry Photo Gallery with album chips + lightbox via `GalleryGrid`; photos auto-loaded from `public/gallery/` (re-scanned every 5 min) |
| `/contact` | `app/contact/page.jsx` (uses `ContactForm`) |
| `/legal/termsofuse` · `/appprivacypolicy` · `/cookiepolicy` · `/refundpolicy` | `app/legal/*/page.jsx` → `LegalPage docKey=…` (tabs between documents, sticky contents list, numbered sections; text in `src/data/legal.js`) |

### Auth & accounts
| Route | File | View |
| --- | --- | --- |
| `/login` | `app/login/page.jsx` | `src/views/LoginView.jsx` (all roles; redirects by role) |
| `/register` | `app/register/page.jsx` | `src/views/RegisterView.jsx` (**Alumni** — student ID + batch required — or **Faculty** sign-up, `?type=faculty` preselects; account starts `pending`, "waiting for approval" screen; students are sent to `/join`) |
| `/account` | `app/account/page.jsx` (layout `AccountShell`) | `ProfileForm` — own account + role profile |
| `/account/security` | `app/account/security/page.jsx` | `PasswordForm` |
| `/account/alumni` | `app/account/alumni/page.jsx` | `AlumniRequestForm` — students ask to become alumni (graduation details, "don't show my profile" tick); shows pending / rejected status (tab only for students) |

### Admin dashboard (role `admin`)
| Route | File | View |
| --- | --- | --- |
| `/dashboard/*` layout | `app/dashboard/layout.jsx` | `DashboardShell` (noindex, admins only) |
| `/dashboard` | `app/dashboard/page.jsx` | `src/views/dashboard/DashboardHome.jsx` (counts from `/api/stats`) |
| `/dashboard/news` · `/new` · `/[id]` | `app/dashboard/news/**` | `NewsManager.jsx`, `NewsEditor.jsx` |
| `/dashboard/executives` | `app/dashboard/executives/page.jsx` | `ExecutivesManager.jsx` (committee per year + people with type, ID, batch, department, shift; missing details flagged; **Convert to Alumni** per student / "Alumni ✓") |
| `/dashboard/alumni` | `app/dashboard/alumni/page.jsx` | `AlumniManager.jsx` (approve / hide / edit every profile field, link to the public profile; *Requests to become alumni* panel with Approve / Reject + note; "hidden by alumnus" badge) |
| `/dashboard/membership` | `app/dashboard/membership/page.jsx` | `MembershipManager.jsx` (review drafts → approve/reject, photo, admin note, CSV export, registration settings) |
| `/dashboard/about` | `app/dashboard/about/page.jsx` | `AboutEditor.jsx` (text + numbers + timeline with `ListEditor`) |
| `/dashboard/users` (`?status=pending`) | `app/dashboard/users/page.jsx` | `UsersManager.jsx` (roles, status, passwords; "waiting for approval" banner, sign-up details and one-click **Approve** → email) |
| `/dashboard/login-history` | `app/dashboard/login-history/page.jsx` | `AuditLogs.jsx` → `LoginHistory` (every sign-in attempt, filters, `?search=`) |
| `/dashboard/activity` | `app/dashboard/activity/page.jsx` | `AuditLogs.jsx` → `UserActivity` (every change by signed-in users, `?user=<id>`) |
| `/dashboard/settings` | `app/dashboard/settings/page.jsx` | `SettingsView.jsx` (timezone with live clock, registration on/off switch + fee & numbers, email/SMTP + test send, appearance) |
| `/dashboard/profile` | `app/dashboard/profile/page.jsx` | `ProfileForm` + `PasswordForm` (faculty profile) |
| `/dashboard/traffic` | `app/dashboard/traffic/page.jsx` | `src/views/dashboard/TrafficAnalytics.jsx` |
| `/dashboard/contact-messages` | `app/dashboard/contact-messages/page.jsx` | `src/views/dashboard/ContactMessages.jsx` |

### API (`app/api/**/route.js`)
| Endpoint | Methods | Access | Notes |
| --- | --- | --- | --- |
| `/api/auth/sign-in` | POST | public | Rate-limited per IP; any role; blocks pending ("waiting for approval") and suspended; sets `token` cookie; returns `redirectTo` |
| `/api/auth/register` | POST | public | `{ type: alumni\|faculty, name, email, phone, password, profile }` → `pending` account (role comes from `type` only; faculty → admin), emails the user + club inbox, no session (off when `ALLOW_REGISTRATION=false`); rate-limited |
| `/api/auth/me` | GET | signed in | Current user + role profile (from DB) |
| `/api/auth/session` | GET | public | `{ name, email, role, photo, home }` or `null` (Navbar avatar; never 401) |
| `/api/auth/logout` | POST | any | Clears cookie |
| `/api/auth/password` | PUT | signed in | `{ currentPassword, newPassword }` |
| `/api/profile` | GET, PUT | signed in | Own account (`name`, `phone`) + `profile` fields for the role |
| `/api/users` · `/api/users/[id]` | GET, POST · GET, PATCH, DELETE | admin | User management (cannot demote/delete yourself) |
| `/api/news` · `/api/news/[id]` | GET (public), POST · GET (id or slug), PATCH, DELETE | public read / admin write | `?all=1` (admin) includes drafts; body via `bodyText`, guests via `event.guestsText` |
| `/api/executives` · `/api/executives/[id]` | GET (public), POST · GET (slug), PATCH, DELETE | public read / admin write | `?year=` committee; `?all=1` (admin) people with stats |
| `/api/committee` · `/api/committee/[id]` | GET, POST · PATCH, DELETE | public read / admin write | Committee positions (`executive`, `year`, `type`, `role`, `order`) |
| `/api/alumni` · `/api/alumni/[id]` | GET (public), POST · PATCH, DELETE | public read / admin write | Public = approved and not hidden by the alumnus; `?all=1` (admin) everything |
| `/api/alumni-requests` · `/me` · `/[id]` | POST, GET · GET · PATCH | student (POST) / admin (GET list) · signed in · admin | Student → alumni requests: submit (one pending at a time) · own latest · `{ status: approved\|rejected, adminNote }` (approve = role → alumni + AlumniProfile; emails) |
| `/api/executives/[id]/alumni` | POST | admin | `{ graduationYear?, jobTitle?, company?, hideProfile? }` → creates / links the person's alumni entry (photo, links, latest position as badge; linked student login becomes alumni) |
| `/api/membership` | POST · GET | public (multipart, rate-limited 20/15 min per IP) · admin | Submit application (status `draft`; 403 when registration closed; 409 duplicate student ID) · list |
| `/api/membership/[id]` · `/[id]/photo` | PATCH, DELETE · GET | admin | Review `{ status, adminNote }` / delete · applicant photo (never public) |
| `/api/settings/[key]` | GET · PUT | public · admin | `site` (timezone), `about` and `membership` settings; `email` is admin-only for reading too (password never returned) |
| `/api/settings/email/test` | POST | admin | `{ to }` — sends a test email with the saved SMTP settings |
| `/api/logs/logins` · `/api/logs/activity` | GET | admin | Login history / user activity + stats (filters: result, action, entity, role, search, days, user) |
| `/api/stats` | GET | admin | Dashboard counters (incl. membership applications by status) |
| `/api/contact` | POST | public | Dedupe (10 min) → save `ContactMessage` → email notification |
| `/api/contact` | GET | admin | List messages (filterable, max 500) |
| `/api/contact/[id]` | PATCH, DELETE | admin | Update `status` / delete |
| `/api/visitor/log` | POST | public | Records a `VisitorLog` (source, country, path) |
| `/api/visitor/summary` | GET | public | Today / total / online counts (footer) |
| `/api/visitor/stats` | GET | admin | Full analytics for the Traffic page |

## `src/` — shared code

### `src/config/`
- `site.js` — `siteConfig` (name, shortName, tagline, description, url, contact, social)
- `navigation.js` — `mainNav`, `footerNav` (main menu minus Gallery / Join Us), `legalNav`, `dashboardNav` (with react-icons), `accountNav`, `appOnlyRoutes`
- `profiles.js` — `ROLE_LABELS`, `PROFILE_CONFIG` (fields per role, incl. headings), `LINK_FIELDS`, `EXPERIENCE_COLUMNS`, `EDUCATION_COLUMNS`, `SHIFT_SELECT`, `formField(name, field)` (config → EntityForm field), `profileFieldTypes(role)`
- `socialLinks.js` — `SOCIAL_LINKS` (key, label, icon) for every profile link type, in display order
- `membership.js` — `TSHIRT_SIZES`, `BLOOD_GROUPS`, `SHIFT_OPTIONS`, `PAYMENT_METHODS`, `MOBILE_PAYMENT_METHODS`, `SOFT_SKILLS`, `APPLICATION_STATUSES`, photo limits

### `src/components/ui/` — generic building blocks (all default exports)
`Skeleton` + `SkeletonText`, `LoadingLabel` (loading placeholders) · `SocialLinks` (icon row for a profile's `links`; `exclude`) · `DarkPageHeader` (page banner for every public page: breadcrumbs, title + orange accent, children; theme-aware) · `Alert` (`success\|error\|info\|warning`) · `Badge` · `Button` · `Card` (`className="p-0"` = no padding) · `ConfirmDialog` · `Container` · `EmptyState` · `Modal` (`size` `md\|lg`; bottom sheet on phones) · `Placeholder` (label, className) · `Section` · `Spinner`

### `src/components/forms/`
- `FormField.jsx` — named exports `Input`, `Textarea`, `Select`
- `EntityForm.jsx` — renders a form from a field list (dotted names like `links.github`; types incl. `lines` and `rows` → `ListEditor`); named `getPath`, `setPath`
- `ListEditor.jsx` — add / reorder / remove rows of small records (About stats & timeline)
- `ContactForm.jsx` — public contact form → `POST /api/contact`

### `src/components/layout/`
- `AppShell.jsx` — client; public routes get Navbar + Footer + visitor logging, `appOnlyRoutes` get `AuthProvider` instead
- `Navbar.jsx` — sticky header: links, theme toggle, Sign in (visitors) or `UserMenu` avatar (signed in), **Join Us** button; full-screen menu on phones/tablets
- `UserMenu.jsx` — avatar (photo or initials) + dropdown: Dashboard & My profile (admin) / My account & Change password, Log out; named `Avatar`, `userMenuLinks`
- `Footer.jsx`
- `NavigationProgress.jsx` — client; top progress bar while a link click navigates
- `ThemeToggle.jsx` — light → dark → system (`variant` `icon` | `row`); stored in `localStorage('theme')`
- `Logo.jsx` — logo image + short name (`showText` prop); the single source for every logo on the site
- `LegalPage.jsx` — template for `/legal/*` pages (`docKey` → `legalDocs` in `src/data/legal.js`)

### `src/components/dashboard/`
`DashboardShell` (layout + admin check; theme toggle in the mobile bar) · `Sidebar` (reads `dashboardNav`; theme row) · `CrudModal` (add/edit/delete dialog over `EntityForm`; `fields` can be a function of the values) · `PageTitle` · `StatCard` + named `StatGrid` (2 per row on phones) · `DataTable` (cards on phones, table from md) · `FilterBar` · `Pagination` · `BarList`

### `src/components/home/` (home page only, dark theme, uses `motion`)
- `Hero.jsx` — client; headline + animated logo orbit
- `Sections.jsx` — About (count-up stats), What We Do, Tech + Projects, Events (DB: upcoming, else recent), Achievements (DB: category counts + latest photos), Workshops (DB: latest `workshops-seminars`), Executives (DB), Faculty/Alumni/Gallery, Explore CSE/Join/Contact
- `ui.jsx` — `HomeSection`, `HomeHeading`, `HomeButton`, `Panel`, `IconBadge`, `DateBadge`, `CoverImage`
- `motion.jsx` — client; `MotionRoot` (respects reduced motion), `Reveal`, `Stagger`/`StaggerItem`, `Counter`

### `src/components/executives/`
- `ExecutiveCard.jsx` — committee card (links to profile) + `initials()` helper
- `YearTabs.jsx` — client; year switcher with sliding pill (links to `/executives?year=`)
- `RoleIcon.jsx` — picks a react-icon from the role title (President → crown, Treasurer → coins, …)

### `src/components/alumni/`
- `AlumniDirectory.jsx` — client; takes `alumni` prop; search, Filters (batch/company/position/featured), sort, animated card grid; named `AlumniCard` (whole card links to `/alumni/<slug>`, also used for "More alumni")

### `src/components/auth/` & `src/components/account/`
- `AuthCard.jsx` — dark card + `AuthInput`, `AuthButton`, `AuthError` for `/login` & `/register`
- `AccountShell.jsx` — client; `/account` layout (banner, tabs, logout)
- `ProfileForm.jsx` — own account + role profile (fields from `src/config/profiles.js`) → `PUT /api/profile`
- `PasswordForm.jsx` — `PUT /api/auth/password`
- `AlumniRequestForm.jsx` — student → alumni request (`/account/alumni`)

### `src/components/loading/`
- `PageSkeletons.jsx` — `HomeSkeleton`, `CardGridSkeleton`, `PeopleGridSkeleton`, `DirectorySkeleton`, `ProfileSkeleton`, `PostSkeleton`, `ContentSkeleton`, `DashboardSkeleton`, `TableRowsSkeleton`, `FormSkeleton` (used by `app/**/loading.jsx` and dashboard components)

### `src/components/join/`
- `JoinForm.jsx` — client; dark membership application form → `POST /api/membership` (multipart); success screen

### `src/components/gallery/`
- `GalleryGrid.jsx` — client; album chips, masonry grid, full-screen lightbox (arrows, swipe, Esc)

### `src/components/news/`
- `NewsDirectory.jsx` — client; featured post, category chips with counts (synced to `?category=`), type select, search, load more
- `NewsCard.jsx` — post card + named `CategoryBadge`, `StatusBadge`
- `ArticleView.jsx`, `EventView.jsx` — detail layouts
- `RichText.jsx` — renders body blocks (p, h2, h3, ul, ol, quote, code, table, image) with inline `**bold**`, `*italic*`, `` `code` ``, `[link](url)`
- `CodeBlock.jsx`, `ShareButton.jsx` — client; copy-to-clipboard / native share

### `src/data/`
- `news-categories.js` — `newsCategories` (key, label, icon), `UPCOMING`, `categoryLabel(key)`
- `legal.js` — `legalDocs` (Terms of Use, Privacy, Cookie, Refund: title, summary, lastUpdated, sections) and `LEGAL_ORDER`
- `home.js` — all home page content (sample data) + `unsplash(id, width)` image helper; remote images allowed from `images.unsplash.com` in `next.config.mjs`
- `seed/` — starter content for `npm run seed` only (the site reads MongoDB): `news.js` (31 real posts from the University and SACC Facebook pages, documents the post + body-block shape), `executives.js` (real 2024, 2025 and 2026 committees — 55 people, each listed once with one photo in `public/executives/`), `alumni.js` (sample alumni)

### `src/views/` — full page bodies (client components)
- `LoginView.jsx`, `RegisterView.jsx`
- `dashboard/DashboardHome.jsx`, `TrafficAnalytics.jsx`, `ContactMessages.jsx`, `NewsManager.jsx`, `NewsEditor.jsx`, `ExecutivesManager.jsx`, `AlumniManager.jsx`, `UsersManager.jsx`, `MembershipManager.jsx`, `AboutEditor.jsx`, `SettingsView.jsx`

### `src/hooks/`
- `useAuth.js` — `{ user, profile, loading, signIn, register, logOut, refresh, setUser, setProfile }` from `AuthProvider`
- `useApi.js` — `useApi(url, { select })` → `{ data, setData, loading, error, reload }`; admin GET, redirects to `/login` on 401/403
- `usePagination.js` — client-side `{ page, setPage, pageCount, pageItems }`

### `src/providers/`
- `AuthProvider.jsx` — `AuthContext`; restores the session + profile via `/api/auth/me` (mounted on `appOnlyRoutes`); `register` does not sign in (accounts start pending)

### `src/server/` — backend (server-only)
| File | Purpose |
| --- | --- |
| `http.js` | `route(handler, { roles?, auth? })` wrapper (session, role check, `connectDB`, error → JSON), `ok`, `created`, `fail`, `readJson`, `HttpError` |
| `validate.js` | `clean(input, fieldTypes)` (links: http(s) / valid email only — `javascript:` and `#` are dropped) (types: text, longtext, url, number, boolean, list, lines, links, shift, experience, education), `str`, `list`, `lines`, `rows`, `links`, `assertId`, `notFound`, `makeSlug`, `toPlain` |
| `controllers/auth.controller.js` | `signIn`, `register`, `me`, `logout`, `changePassword` |
| `controllers/profile.controller.js` | `show`, `update` (own profile) |
| `controllers/user.controller.js` | admin `list`, `create`, `show`, `update`, `remove` |
| `controllers/news.controller.js` | `list`, `show`, `create`, `update`, `remove` |
| `controllers/executive.controller.js` | people `listPeople`, `showPerson`, `createPerson`, `updatePerson`, `removePerson`; positions `listPositions`, `createPosition`, `updatePosition`, `removePosition` |
| `controllers/alumni.controller.js` | `list`, `create`, `update`, `remove` |
| `controllers/membership.controller.js` | `submit` (public multipart), `list`, `review`, `remove`, `photo` |
| `controllers/settings.controller.js` | `show`, `update` (`about`, `membership`, `email`), `testEmail` |
| `controllers/stats.controller.js` | `overview` (dashboard counts) |
| `services/user.service.js` | Users + role profiles: `authenticate`, `createUser`, `updateUser`, `deleteUser`, `listUsers`, `getProfile`, `updateProfile`, `updateOwnAccount`, `changePassword`, `toPublicUser`, `activateUser` (pending → active; approves an alumni's directory entry with it); `listUsers` adds `signup` details to pending accounts |
| `services/news.service.js` | `getPublishedPosts`, `getPostBySlug`, `getRelatedPosts`, `getHomeFeed` (cached per request: upcoming / recent events, workshops, achievement photos, category counts) (public); `listPosts`, `getPostById`, `createPost`, `updatePost`, `deletePost`, `countPosts` |
| `services/executive.service.js` | `getYears`, `getLatestYear`, `getCommittee(year)`, `getPerson(slug)`, `getPositionsFor(id)` (public); people & position CRUD |
| `services/settings.service.js` | `DEFAULTS` (`site`, `about`, `membership`, `email`), `PRIVATE_KEYS`, `getSetting(key)` (stored value merged over defaults), `updateSetting(key, input)` |
| `services/mail.service.js` | `getMailConfig`, `getMailSettingsForAdmin`, `sendMembershipReceived/Approved/Rejected/AdminNotice`, `sendContactAutoReply`, `sendContactAdminNotice`, `sendAccountReceived/Approved/AdminNotice`, `sendAlumniRequestAdminNotice`, `sendAlumniRequestDecision`, `sendTestEmail` (never throw; respect the notify toggles) |
| `services/membership.service.js` | `submitApplication(formData)` (validation, image sniffing, duplicate check), `listApplications`, `reviewApplication`, `getPhoto`, `deleteApplication`, `countApplications` |
| `services/audit.service.js` | `recordLogin`, `recordActivity`, `describeChange` (method + path → sentence), `listLogins`, `listActivity`, `loginStats`, `activityStats` |
| `controllers/logs.controller.js` | `logins`, `activity` (admin) |
| `services/alumni-request.service.js` | `submitRequest`, `getMyRequest`, `listRequests`, `countPendingRequests`, `reviewRequest` (approve converts the account), `convertExecutive`, `alumniIdsForExecutives` — one person = one AlumniProfile (matches by account or student ID, fills only empty fields) |
| `controllers/alumni-request.controller.js` | `submit`, `mine`, `list`, `review`, `convertExecutive` |
| `services/alumni.service.js` | `getApprovedAlumni` (directory shape), `getAlumniBySlug` (public profile, private fields stripped), `getRelatedAlumni`, `ensureAlumniSlug`; `listAlumni`, `createAlumni`, `updateAlumni`, `deleteAlumni`, `countAlumni` |

### `src/lib/` — shared utilities
| File | Exports |
| --- | --- |
| `db.js` | default `connectDB()` (cached Mongoose connection) |
| `session.js` | `SESSION_COOKIE` (`'token'`), `createSessionToken`, `setSessionCookie`, `clearSessionCookie` |
| `auth-guard.js` | `verifySessionToken`, `getSession(req)`, `requireRole(req, roles)`, `requireAdmin(req)` (role `admin` only), `getServerSession()`, `homeForRole`, `unauthorizedResponse()` |
| `rate-limit.js` | `isRateLimited(key, { limit, windowMs })` (in-memory) |
| `dedupe-guard.js` | `findRecentDuplicate(Model, query, windowMinutes)` |
| `secret-box.js` | `encryptSecret`, `decryptSecret` (AES-256-GCM, key from `JWT_SECRET`) |
| `gallery.js` | `getGalleryPhotos()` (server-only: scans `public/gallery`, reads image dimensions, albums, captions), `DEFAULT_ALBUM` |
| `news-utils.js` | `readingTime`, `eventStatus`, `toCard` (client-safe card data), `todayISO` (site timezone) |
| `news-format.js` | `textToBlocks` / `blocksToText` (editor text ⇄ body blocks), `textToGuests` / `guestsToText` |
| `user-agent.js` | `parseUserAgent(ua)` → `{ browser, os, device }` |
| `visitor.js` | `detectSource`, `getClientIp`, `resolveCountry` |
| `api-client.js` | axios `api` (public) and `apiSecure` (with credentials), base `/api`; `apiError(err)` |
| `redirect.js` | `safeRedirect(from, role, fallback)` (same-site paths only; /dashboard for admins), `isMembersOnlyPath(pathname)` |
| `utils.js` | `cn`, `escapeHtml`, `escapeRegex`, `formatDate` (site timezone), `formatCalendarDate`, `slugify` |
| `timezone.js` | `DEFAULT_TIME_ZONE` (`Asia/Dhaka`), `setTimeZone` / `getTimeZone` (set by `app/layout.jsx` on the server and `AppShell` in the browser), `todayInTimeZone`, `isValidTimeZone`, `offsetLabel` |

### `src/models/` — Mongoose (relative imports use `.js` so `scripts/` can load them in plain Node)
| Model | Fields |
| --- | --- |
| `User` | name, email (unique), password (bcrypt via pre-save hook, `select:false`), role `admin\|student\|alumni`, status `active\|pending\|suspended` (pending = signed up, waiting for an admin), phone, lastLoginAt; `checkPassword()` |
| `AdminProfile` | user (unique), designation, department, employeeId, office, photo, bio, expertise[], links |
| `StudentProfile` | user (unique), studentId, department, batch, semester, section, photo, bio, skills[], links |
| `AlumniProfile` | user? (unique, sparse), slug (unique, auto from name in a pre-validate hook), name, photo, studentId, department, degree, batch, shift, graduationYear, jobTitle, company, industry, location, country, bio, quote, skills[], achievements[], experience[{title, company, location, start, end, description}], education[{degree, institution, start, end}], links, openToMentor, showEmail, phone, showPhone (email / phone shown only to signed-in members, and only when shared), featured, approved, hideProfile (the alumnus' own "keep me off the website") |
| `Executive` | slug (unique), name, kind `student\|faculty`, studentId, batch, department, shift `day\|evening`, designation, employeeId, school, office, officePhone (public faculty details), phone + personalEmail (`select:false`, admin-only), photo, bio, links (links.email = public official email), user? — required: student → ID, batch, department, shift; faculty → department, designation (enforced in `executive.service.js`) |
| `AlumniRequest` | user, name, email, studentId, department, batch, shift, degree, graduationYear, jobTitle, company, location, note, hideProfile, status `pending\|approved\|rejected`, adminNote, reviewedBy, reviewedAt |
| `CommitteePosition` | executive → Executive, year, type `advisor\|executive`, role, order (unique per executive+year+role) |
| `Post` | slug (unique), type `article\|event`, status `published\|draft`, category, title, excerpt, cover, date `YYYY-MM-DD`, author{name,role,verified}, tags[], featured, body[blocks], event{…}, createdBy |
| `MembershipApplication` | firstName, lastName, personalEmail, phone, backupPhone, studentId, department, batch, shift, tshirtSize, bloodGroup, facebook, paymentMethod, paymentFrom, transactionId, amount, softSkills[], experience, photo{data (select:false), contentType, size}, status `draft\|approved\|rejected`, user → User (the member's login), accountCreated, adminNote, reviewedBy, reviewedAt, ip |
| `Setting` | key (unique: `site`, `about`, `membership`), value (Mixed), updatedBy |
| `LoginLog` | user?, email, name, role, success, reason, ip, country, city, browser, os, device, userAgent, createdAt (TTL 180 days) |
| `ActivityLog` | user, name, email, role, action, entity, entityId, summary, method, path, ip, country, browser, os, device, createdAt (TTL 180 days) |
| `ContactMessage` | fullName, email, phone, subject, message, status `unread\|read\|replied` (`CONTACT_STATUSES`) |
| `VisitorLog` | ip, country, referrer, source `Direct\|Search Engine\|Referral`, sourceName, path, userAgent, createdAt |
| `shared.js` | `LinksSchema` (linkedin, googleScholar, researchGate, ieee, github, facebook, website, email), `LINK_KEYS` |

## Request flows

- **Auth:** `LoginView` → `AuthProvider.signIn` → `POST /api/auth/sign-in` → `createSessionToken` + httpOnly `token` cookie (JWT with role) → redirect by role (admin → `/dashboard`, others → `/account`) → `proxy.js` checks the JWT + role → API routes check roles in `route(…, { roles })`
- **Register (alumni / faculty):** `RegisterView` → `POST /api/auth/register` → `User` (status `pending`) + role profile → emails (user: waiting, club inbox: to approve) → admin approves in Users (or, for alumni, by approving the directory entry in Alumni — the login and the entry are one record) → `activateUser` → "approved, sign in" email
- **Users never see or change their role:** it is not shown in the account pages / navbar, and `/api/profile` only accepts name, phone and profile fields
- **Content:** dashboard manager → `/api/news|executives|committee|alumni` → service → MongoDB → public pages read the same services on the next request
- **Membership:** `JoinForm` (incl. password) → `POST /api/membership` (FormData) → `submitApplication` (registration open? valid? photo is a real image? not a duplicate?) → pending student `User` + `StudentProfile` (or links an existing active account when its password matches) → `MembershipApplication` status `draft` → reviewed in `/dashboard/membership`: approve activates the login (+ welcome email with sign-in link); deleting an application removes a never-approved login
- **Tracking:** `route()` in `src/server/http.js` writes an `ActivityLog` for every successful POST/PUT/PATCH/DELETE by a signed-in user; `auth.controller` writes a `LoginLog` for every sign-in attempt (and registration)
- **Loading:** each data page has `loading.jsx` (skeletons in `src/components/loading/PageSkeletons.jsx`); dashboard tables/cards/editors show skeletons while `useApi` loads; `NavigationProgress` shows a top bar on link clicks; the root layout reads the timezone through a 60 s in-memory cache
- **Contact:** `ContactForm` → `POST /api/contact` → `findRecentDuplicate` → `ContactMessage.create` → (after response) auto-reply + club-inbox email → shown in `/dashboard/contact-messages`
- **Traffic:** `AppShell` (once per browser session) → `POST /api/visitor/log` → `VisitorLog` → `/api/visitor/summary` (footer) and `/api/visitor/stats` (dashboard)

## Conventions
- API routes: wrap handlers with `route()` (it connects to the DB and handles errors); respond `{ success, message?, data? }`
- Services clean every input with `clean()` / explicit checks — never pass a request body straight to Mongoose
- Dynamic route `params` are async: `const { slug } = await params;`
- Add `'use client'` only to components that need hooks or the browser
- Keep this map up to date when you add, move, or delete files
