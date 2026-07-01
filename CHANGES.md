# Changelog

All notable changes to the Mercy Seat Ministries web app are documented here.

## Unreleased

### Added

- `scripts/diagnose-tls-reset.sh` — VPS-side diagnostic for the "connection reset" that hits
  `msmokc.org` over HTTPS while sibling vhosts on the same box work. It probes each SNI over both
  loopback and the public IP, runs a `tcpdump` self-test to see who sends the RST, and inspects
  nginx, netfilter/nftables, any inline IPS (suricata/snort/crowdsec/NFQUEUE), fail2ban, and
  recent config changes, then prints a heuristic verdict (on-box vs provider-edge SNI filtering).

### Changed

- Removed the fictional Prayer Wall requests and answered-prayer testimony. A one-time migration
  deletes the four legacy examples from existing databases, and new installations start with an
  empty wall ready for genuine submissions.
- Added permanent **Delete** controls for active requests and answered testimonies in the protected
  Prayer Wall admin dashboard. Deleting all entries leaves the public wall active with its normal
  empty state.
- Added a public **Bible Study** page and top-level menu option for Friday chapter and passage
  links. The pastor can post dated links and delete old ones from a new protected **Bible Study**
  admin tab; links are validated and persisted in Deno KV.
- The desktop navigation now switches to the mobile menu at 1400px to accommodate the additional
  top-level option without crowding.

## [1.11.0] — 2026-06-27

### Changed

- **Flattened the navigation** — removed the "Resources" dropdown; Sunday School, Daily Devotionals,
  Prayer Wall, and Social Media are now their own top-level menu items.
- **Bigger, friendlier mobile menu** — larger tap targets and type in the hamburger menu; it now
  engages a bit wider (≤1300px) so the full menu is never cramped. Removed the redundant desktop
  "Plan a Visit" button (Contact is in the nav; it remains in the mobile menu) and widened the
  header so all items fit on desktop.

### Added

- **Givelify giving** on the `/giving` page, alongside Zelle and PayPal. The Givelify link is a new
  field in the **Contact Info** admin tab; the "Give with Givelify" button appears once it's set.

## [1.10.0] — 2026-06-26

### Added

- **Daily Devotionals page** (`/devotionals`) — curated links to Our Daily Bread, My Utmost for His
  Highest, and the YouVersion Bible App, each opening in a new tab.
- **Social Media page** (`/social`) — Facebook and Instagram cards that show "Coming soon" until the
  pastor adds the links. The Facebook/Instagram URLs are new fields in the **Contact Info** admin
  tab; once set, the cards become live links and **Facebook/Instagram icons appear in the site
  footer**.
- **"Resources" dropdown** in the main navigation, grouping Sunday School, Daily Devotionals, Prayer
  Wall, and Social Media so the top bar stays clean (CSS-only; shown inline in the mobile menu).
  `NavItem` now supports `children`.

## [1.9.0] — 2026-06-25

Second round of pastor-requested changes.

### Added

- **PayPal giving** alongside Zelle on the `/giving` page. The PayPal link is set by the pastor in
  the **Contact Info** admin tab (`paypalUrl`); the button appears once it's set.
- **Sunday School lesson migration.** `deno task import-lessons` pulls the full archive (~203 weekly
  lessons, Aug 2022 – Jun 2026) from the old Weebly site into the new Sunday School page. Idempotent
  (skips already-imported files); supports `--dry` and a numeric limit for testing. Dates are
  derived from the weekly cadence with an alignment guard.

### Changed

- **Bigger "Welcome to Mercy Seat Ministries"** eyebrow on the home hero.
- **All three phone numbers** now appear in the site footer (every page) and the Services "By Phone"
  card — not just the primary number.
- **Contact photo caption** now reads "James and Folake Olufowote".

## [1.8.0] — 2026-06-24

### Added

- **Editable contact details.** A new **Contact Info** admin tab (`/admin/contact`) lets the pastor
  update the email, phone numbers (one per line — `tel:` links are generated automatically), street
  address, Zoom link, and Zelle giving email at any time, with no code changes. Edits go live
  instantly across the Contact page, site footer, and Giving page, and persist in Deno KV.
  `content.ts` provides the defaults; `src/settings.ts` holds the live values (loaded at startup,
  refreshed on save).

## [1.7.0] — 2026-06-24

Changes requested by the pastor.

### Added

- **Sunday School page** (`/sunday-school`) — download the latest lesson and browse the archive,
  newest first. Lessons are managed from a new **admin upload page** (`/admin/lessons`): upload a
  PDF with a title and date, or delete old ones. PDFs are stored on disk under `MSM_DATA_DIR`
  (default `./data`), validated as PDFs and capped at 25 MB; metadata lives in Deno KV. New
  `src/lessons.ts` data layer.
- **Giving page** (`/giving`) — online tithes/offerings via **Zelle** (to `msmokc@outlook.com`) with
  step-by-step instructions. Card/debit giving can be added later via a hosted link.
- **Fellowship** ministry on the Ministries page, anchored by **Acts 2:46**.
- **Pastor & First Lady photo** (James & Folake) on the Contact page, pulled from the ministry's
  previous site.
- Admin tab navigation (Prayer Wall · Sunday School); a `.gitignore` for runtime data.

### Changed

- **Corrected email** to `msmokc@outlook.com`.
- **Contact page now lists all three phone numbers** — (405) 402-7274, (765) 409-2623, and (405)
  639-1693.
- Slightly tighter top-nav spacing (two new links) and the mobile menu now engages a bit earlier so
  the wider nav never overflows.

### Removed

- The **Skype** address from the Contact page (no longer used).

## [1.6.1] — 2026-06-23

### Changed

- **Polished the admin dashboard styling** for a more professional, app-like feel and easier
  navigation — scoped so the public site is untouched:
  - A **sticky, frosted floating header** keeps the greeting and actions (View wall, Sign out) in
    reach while scrolling.
  - **Bigger, more confident typography** throughout — greeting, stat values, verse banner, section
    headings, and request text.
  - **Redesigned stat tiles** (icon + stacked value/label, hover lift) and **roomier,
    hover-responsive request and testimony cards** with clearer section headers.
  - Subtle layered background and a more premium verse banner.

## [1.6.0] — 2026-06-23

### Added

- **Praise reports on answered prayers.** Marking a request answered now opens a field for the
  pastor to record _what God did_. The outcome is shown as the headline of the public testimony
  (with the original request as context) and on the admin "Recently answered" cards. Stored as a new
  `outcome` field on each prayer (older records fall back to the request body).
- **Animated shepherd's scriptures.** The dashboard verse banner now types a verse out character by
  character, holds long enough to read, then erases and types the next — cycling through an expanded
  set of 11 encouragements. Honors `prefers-reduced-motion` (renders one static verse) and works
  without JS (server renders the daily verse).

## [1.5.1] — 2026-06-23

### Added

- **Database reset script** (`deno task reset`) — clears Prayer Wall requests and sessions (sample
  requests re-seed on next start) while keeping the admin password. Pass `--all` to also remove the
  password for a full wipe. Documented alongside the file-delete method.

## [1.5.0] — 2026-06-23

### Changed

- **Reimagined the admin dashboard** as a daily ministry view for Pastor James:
  - A **personal, time-aware greeting** ("Good morning, Pastor James") with the full date and the
    ministry brand mark.
  - A **rotating shepherd's encouragement verse** (1 Peter 5:2, Galatians 6:9, Numbers 6:24–25, 1
    Peter 5:10, Matthew 25:23) in a gold-on-navy banner.
  - **Impact-framed stats** — a gold "Awaiting prayer" tile plus requests, prayers offered, and
    answered, with a one-line summary of the church's collective prayer.
  - A **"Most prayed" highlight** on the top active request, a count badge on the section heading, a
    per-request prayed tally, and a celebratory **"Recently answered"** section.
- Added `SHEPHERD_VERSES` to `content.ts`; `statTile` gained a gold-highlight variant.

## [1.4.0] — 2026-06-23

### Added

- **Admin authentication.** A real sign-in replaces the old `?admin=KEY` query trick:
  - `scripts/set-password.ts` (`deno task set-password`) sets the admin password, hashed with
    **PBKDF2-HMAC-SHA-256** (Web Crypto — no new deps) and stored in Deno KV. Supports hidden
    interactive entry or a non-interactive argument.
  - **`/admin/login`** — password form. Mints a random session token stored in KV with a 7-day TTL,
    returned as an **HttpOnly, SameSite=Strict** cookie (Secure on https).
  - **`/admin`** — protected dashboard to manage the Prayer Wall (stats + "Mark answered"), plus
    sign-out. Redirects to the login page when not authenticated.
  - The login page is **not linked anywhere** on the public site and is marked `noindex`.
- **`src/auth.ts`** (password hashing, sessions, cookie helpers, constant-time compare) and
  **`src/kv.ts`** (one shared KV handle; honors `MSM_KV_PATH` to pin the database).

### Changed

- Mark-answered moved off the public Prayer Wall into the protected `/admin` dashboard; the public
  wall no longer accepts an `?admin` key. `page()` gained a `bare` mode (no public header/footer,
  `noindex`) used by the admin screens.

### Security

- Passwords are never stored in plaintext; password checks are constant-time. Sessions are revoked
  on logout. POST bodies are parsed defensively.

## [1.3.1] — 2026-06-23

### Added

- **Promotional Prayer Wall pill in the hero.** A glassy, gold-accented announcement button at the
  top of the hero ("New · Introducing our Prayer Wall") linking to `/prayer-wall`, with a hover
  nudge. Its descriptive tail collapses gracefully on small screens. Promotes the new feature
  without crowding the two primary CTAs.

## [1.3.0] — 2026-06-23

### Added

- **Prayer Wall** (`/prayer-wall`) — an interactive, persistent feature where the congregation can:
  - **Share a request** (optional name/anonymous, category, body) via a form that works with or
    without JavaScript.
  - Tap **"I prayed"** to increment a live counter; with JS this updates in place via a JSON
    endpoint and remembers your taps in `localStorage`, otherwise it falls back to a POST + 303
    redirect.
  - Read **answered-prayer testimonies**, with a headline stats row (requests shared, prayers
    offered, prayers answered).
  - **Pastor/admin view** at `/prayer-wall?admin=KEY` adds "Mark answered" controls; the key is set
    with the `PRAYER_ADMIN_KEY` env var (default `pastor`).
- **`src/prayers.ts`** — the data layer, persisting requests in **Deno KV** with atomic, race-safe
  pray-count increments. Seeds a few realistic example requests on first run so the wall is never
  empty in a demo.
- New `check`, `users`, and `spark` icons; Prayer Wall nav link; `PRAYER_VERSE` (Galatians 6:2) and
  `PRAYER_CATEGORIES` in `content.ts`; full Prayer Wall styling.

### Changed

- The router is now async and dispatches both GET pages and the Prayer Wall's GET/POST endpoints.
  `deno task start`/`dev` now run with `--unstable-kv --allow-write` for KV.

## [1.2.1] — 2026-06-23

### Removed

- **Hero scroll-cue indicator.** Removed the animated mouse/scroll dot at the bottom of the hero
  (markup, CSS, and the `scroll` keyframes) — it read as a stray floating circle and the hero's CTAs
  and facts bar already guide the eye.

## [1.2.0] — 2026-06-23

### Changed

- **Industry-grade hero redesign.** Tighter display typography (refined size, line-height, and
  tracking), a gold rule accent on the eyebrow, larger primary/secondary CTAs, and a wider, more
  readable lead.
- **Reworked hero calls to action.** The arrow now sits on the primary "Join Us This Week" button;
  "Who We Are" is a clean outline button — fixing the awkward arrow spacing that appeared on it
  before.

### Added

- **Hero quick-facts bar** beneath the CTAs — service time, city, and online option, each with a
  gold icon — adding trust signals and polish.

## [1.1.0] — 2026-06-23

### Changed

- **Replaced the Exodus 25:22 banner verse with Hebrews 4:16** ("approach God's throne of grace...
  receive mercy") — the New Testament fulfillment of the mercy seat in Christ.
- **More inspiring landing copy.** New hero headline ("Come and find grace and rest") and a warmer,
  invitation-focused welcome section, with the mission statement set as a quote.

### Added

- **"Promises to Stand On" verse section** on the home page with three New Testament promises
  (Matthew 11:28, 2 Corinthians 5:17, Ephesians 2:8) as styled scripture cards.
- **Benediction verse** (Ephesians 3:20–21) closing the Contact page for variety.
- New `Verse` type plus `VERSES` and `BENEDICTION` exports in `content.ts`; the scripture banner now
  accepts any verse. Styles for verse cards, the mission quote, and section lead.

## [1.0.1] — 2026-06-23

### Fixed

- **Static assets now serve on Windows.** `STATIC_ROOT` previously used
  `new URL("./static", import.meta.url).pathname`, which yields an invalid leading-slash path on
  Windows (`/C:/...`) and caused all `/static/*` assets to 404. It now uses `import.meta.dirname`,
  which is a native OS path on every platform.

## [1.0.0] — 2026-06-23

Initial release. A complete, server-rendered website for Mercy Seat Ministries OKC.

### Added

- **Deno HTTP server** (`main.ts`) using only JSR `@std/http`. Serves static assets via `serveDir`
  and dispatches all other GET requests to the page router. Configurable `PORT` (default `8000`).
- **Unix-philosophy architecture** — small, single-purpose modules composed through simple, explicit
  functions. Every page is a pure `() => string` builder.
  - `src/content.ts` — single source of truth for all ministry data.
  - `src/html.ts` — safe HTML templating (`escape`, `html` tagged template, `raw`).
  - `src/icons.ts` — inline SVG icon set.
  - `src/layout.ts` — shared document shell (head, header/nav, footer).
  - `src/pages.ts` — one function per page.
  - `src/router.ts` — explicit path → `Response` route table with 404 fallback.
- **Five pages**: Home, About, Services, Ministries, Contact — plus a styled 404.
- **Professional design system** (`static/styles.css`) — a covenant-navy + gold palette on warm
  ivory, Cormorant Garamond display type over Inter, full hero, scripture banners, service/ministry
  cards, CTA bands, and an embedded contact map.
- **Progressive enhancement** (`static/app.js`) — mobile nav, sticky-header shadow, and
  reveal-on-scroll. The site is fully functional with JavaScript disabled.
- **Accessibility & SEO** — skip link, semantic landmarks, `aria` labels, per-page `<title>`/meta
  description, Open Graph tags, and `prefers-reduced-motion` support.
- **Responsive layout** down to small mobile screens.
- **Content sourced** from the ministry's current Weebly site: mission statement, service times,
  pastor, address, phone, and Zoom worship link.
- Tooling config in `deno.json` (`start`/`dev` tasks, import map, `fmt`/`lint` rules).
- `README.md` documenting architecture, request flow, and how to extend the site.

### Notes

- `CONTACT.email` in `src/content.ts` is a best-effort value — the public address was not fully
  visible when sourcing; verify before launch.
