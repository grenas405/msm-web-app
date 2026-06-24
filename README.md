# Mercy Seat Ministries — Web App

A fast, server-rendered website for **Mercy Seat Ministries (MSM), Oklahoma City** — a vibrant,
Christ-centered church. Built with [Deno](https://deno.com) using **only** the JSR standard library
`@std/http`. No build step, no client framework, no third-party runtime dependencies.

> _"And there I will meet with thee, and I will commune with thee from above the mercy seat." —
> Exodus 25:22_

## Quick start

```sh
deno task start      # serve on http://localhost:8000
deno task dev        # same, with --watch auto-reload
```

Set a custom port with the `PORT` environment variable:

```sh
PORT=3000 deno task start
```

## Design philosophy

The codebase follows the **Unix philosophy**: small modules that each do one thing, composed through
simple, explicit functions. There is no hidden state, no global magic, and no inheritance — every
page is a pure function `() => string` that returns a complete HTML document.

```
main.ts            Entry point: HTTP server + request handler (static vs. pages)
deno.json          Tasks, import map (only @std/http), fmt/lint config
src/
  content.ts       Single source of truth — all ministry data (no logic)
  html.ts          Safe HTML templating: escape(), html`` tagged template, raw()
  icons.ts         Inline SVG icon set; icon(name) -> trusted SVG
  layout.ts        The page shell: <head>, header/nav, footer  (page())
  pages.ts         One explicit function per page (home, …, prayer wall, admin)
  prayers.ts       Prayer Wall data layer — persists requests in Deno KV
  auth.ts          Admin auth: PBKDF2 password hashing, sessions, cookies
  kv.ts            The single shared Deno KV handle (honors MSM_KV_PATH)
  router.ts        Dispatcher: GET pages + Prayer Wall + Admin GET/POST endpoints
scripts/
  set-password.ts  CLI to set/change the admin password (deno task set-password)
static/
  styles.css       The full design system (navy + gold on ivory)
  app.js           Progressive enhancement (nav, sticky header, reveals, pray button)
  favicon.svg      Site icon
```

### How a request flows

1. `main.ts` receives the request. `/static/*` is served by `@std/http`'s `serveDir`.
2. Everything else is passed to `route(pathname)` in `src/router.ts`.
3. The router looks up the path in its table and calls the matching page builder.
4. The page builder composes section helpers + `content.ts` data through the `html` tagged template,
   then wraps the result in `layout.page()`.
5. A `Response` with `text/html` is returned. Unknown paths render the 404 page.

### Adding a page

1. Add the data/text to `src/content.ts`.
2. Write a `export function myPage(): string` in `src/pages.ts`.
3. Register it in the `ROUTES` table in `src/router.ts`.
4. Add a nav link in the `NAV` array in `src/content.ts` (optional).

## Pages

| Path           | Purpose                                                  |
| -------------- | -------------------------------------------------------- |
| `/`            | Home — hero, welcome, weekly services, call to act       |
| `/about`       | Story, the six pillars, leadership                       |
| `/services`    | Service times + ways to attend (in person/Zoom/phone)    |
| `/ministries`  | The ministries of the church                             |
| `/prayer-wall` | Interactive prayer requests, "I prayed" counts, answered |
| `/contact`     | Address, phone, email, Zoom, and an embedded map         |

## Prayer Wall

An interactive feature where the congregation shares prayer requests, taps **"I prayed"** to
encourage one another, and celebrates **answered prayers**. Requests persist in
[Deno KV](https://docs.deno.com/deploy/kv/manual/) (a few realistic examples are seeded on first run
so the wall is never empty).

- **Works without JavaScript** — forms POST and the server replies with a 303 redirect. With JS, the
  "I prayed" button updates the count in place and remembers your taps.
- **Management** (marking requests answered) happens in the password-protected [Admin](#admin) area,
  not on the public wall.

## Admin

Prayer Wall management lives behind a password-protected admin area. **The login page is
intentionally not linked anywhere** — the site manager navigates directly to it.

**1. Set a password** (do this before starting the server — the local KV is single-writer):

```sh
deno task set-password            # prompts, input hidden
# or, non-interactively:
deno task set-password "a-strong-passphrase"
```

**2. Sign in** at **`/admin/login`** → you land on **`/admin`**, where you can see the stats and
mark requests as answered (which moves them to the public testimonies).

How it works:

- The password is hashed with **PBKDF2-HMAC-SHA-256** and stored in Deno KV — never in plaintext.
  Sign-in mints a random **HttpOnly, SameSite=Strict** session cookie (7-day TTL; `Secure` is added
  automatically over https). Sign-out revokes the session.
- **Local persistence:** set `MSM_KV_PATH` to a file so the `set-password` script and the server
  share one store, e.g. `MSM_KV_PATH=./data/msm.db`. On Deno Deploy, leave it unset to use the
  managed KV.

```sh
MSM_KV_PATH=./data/msm.db deno task set-password
MSM_KV_PATH=./data/msm.db deno task start
```

### Resetting the database

Stop the server first (the local KV is single-writer), then:

```sh
deno task reset          # clear prayers + sessions; sample requests re-seed on
                         # next start. Keeps the admin password.
deno task reset --all    # also remove the admin password (full wipe)
```

On Windows PowerShell, prefix with the same `MSM_KV_PATH` you run the server with:

```powershell
$env:MSM_KV_PATH="./data/msm.db"; deno task reset
```

Alternatively, if you pinned `MSM_KV_PATH` to a file, you can just delete that file (and its
`-shm`/`-wal` siblings) while the server is stopped:

```powershell
Remove-Item ./data/msm.db*       # PowerShell
```

This gives a completely fresh store — prayers re-seed and you'll set a new password.

## Quality

```sh
deno check main.ts   # type-check
deno lint            # lint
deno fmt             # format
```

## Content & data

All editable text lives in `src/content.ts` — service times, contact details, the mission statement,
and the navigation. Update that one file to change the site's content.

> **Note:** Contact details (address, phone, pastor, Zoom link) were sourced from the ministry's
> current Weebly site (`msmokc.weebly.com`). The public email was not fully visible during sourcing
> and is set to a best-effort value in `src/content.ts` — **verify `CONTACT.email` before going
> live.**

## Permissions

The app requests the minimum Deno permissions:

- `--allow-net` — to serve HTTP
- `--allow-read` — to read static assets and the Deno KV store
- `--allow-write` — to persist Prayer Wall requests, the admin password, and sessions
- `--allow-env` — to read `PORT` and `MSM_KV_PATH`
- `--unstable-kv` — enables Deno KV (Prayer Wall + admin auth)
