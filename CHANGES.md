# Changelog

All notable changes to the Mercy Seat Ministries web app are documented here.

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
