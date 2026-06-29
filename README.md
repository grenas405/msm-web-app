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

Bind to a specific interface with `HOST`:

```sh
HOST=127.0.0.1 PORT=8005 deno task start
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

| Path             | Purpose                                                    |
| ---------------- | ---------------------------------------------------------- |
| `/`              | Home — hero, welcome, weekly services, call to act         |
| `/about`         | Story, the pillars, leadership                             |
| `/services`      | Service times + ways to attend (in person/Zoom/phone)      |
| `/ministries`    | The ministries of the church (incl. Fellowship, Acts 2:46) |
| `/sunday-school` | Download this week's lesson + browse the PDF archive       |
| `/devotionals`   | Links to Our Daily Bread, My Utmost, YouVersion Bible App  |
| `/prayer-wall`   | Interactive prayer requests, "I prayed" counts, answered   |
| `/social`        | Facebook & Instagram (links set in admin)                  |
| `/giving`        | Online giving via Zelle + PayPal                           |
| `/contact`       | Pastors' photo, phones, email, Zoom, and an embedded map   |

Sunday School, Daily Devotionals, Prayer Wall, and Social Media are grouped under a **"Resources"**
dropdown in the top navigation.

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
mark requests as answered. When marking one answered, the pastor can record a **praise report**
("what did God do?") — it becomes the headline of the public testimony. The dashboard also greets
the pastor by name and cycles encouraging scriptures with a typing animation.

The admin area has three tabs:

- **Prayer Wall** (`/admin`) — manage requests and answered testimonies.
- **Sunday School** (`/admin/lessons`) — upload a lesson PDF with a title and date, and delete old
  ones. PDFs are stored on disk under `MSM_DATA_DIR` (default `./data`); metadata lives in KV.
  Uploads are validated as PDFs and capped at 25 MB. The public archive is at `/sunday-school`.
- **Contact Info** (`/admin/contact`) — edit the email, phone numbers, address, Zoom link, Zelle
  giving email, **PayPal link**, and **Facebook/Instagram links** anytime. Changes go live
  immediately across the Contact page, footer, Giving page, and Social Media page (defaults live in
  `content.ts`; overrides in KV via `src/settings.ts`). The PayPal button, the social cards, and the
  footer social icons all appear once their links are set.

### Importing the old Sunday School archive

To migrate the lessons from the previous Weebly site into the new Sunday School page, run this once
(with the server stopped, so it can write to KV):

```sh
deno task import-lessons --dry   # preview the date → file mapping
deno task import-lessons         # download + import all ~203 lessons
```

It's safe to re-run — already-imported lessons are skipped. On the VPS, prefix with the same
`MSM_KV_PATH` / `MSM_DATA_DIR` the service uses.

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

## Systemd

A production unit is provided at `deploy/systemd/msm-web-app.service`. It assumes the checkout path
is `/home/sysadmin/.local/src/development/msm-web-app`, runs as `sysadmin`, listens on
`127.0.0.1:8005`, and stores Deno KV data in `/var/lib/msm-web-app/msm.db`.

```sh
sudo cp deploy/systemd/msm-web-app.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo install -o sysadmin -g sysadmin -d /var/lib/msm-web-app /var/cache/msm-web-app
```

Set the admin password against the same KV path used by the service while the service is stopped:

```sh
sudo -u sysadmin env PATH=/home/sysadmin/.deno/bin:/usr/local/bin:/usr/bin:/bin \
  MSM_KV_PATH=/var/lib/msm-web-app/msm.db deno task set-password
sudo systemctl enable --now msm-web-app
sudo journalctl -u msm-web-app -f
```

## Content & data

All editable text lives in `src/content.ts` — service times, contact details (email, the list of
phone numbers, pastor), the mission statement, ministries, and the navigation. Update that one file
to change the site's content. Sunday School lessons and answered-prayer testimonies are managed from
the [Admin](#admin) area instead of code.

## Permissions

The app requests the minimum Deno permissions:

- `--allow-net` — to serve HTTP
- `--allow-read` — to read static assets and the Deno KV store
- `--allow-write` — to persist KV data and uploaded lesson PDFs (`MSM_DATA_DIR`)
- `--allow-env` — to read `HOST`, `PORT`, `MSM_KV_PATH`, and `MSM_DATA_DIR`
- `--unstable-kv` — enables Deno KV (Prayer Wall + admin auth + lessons)
