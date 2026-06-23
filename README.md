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
  pages.ts         One explicit function per page (home, about, services, …)
  router.ts        A tiny route table: pathname -> Response
static/
  styles.css       The full design system (navy + gold on ivory)
  app.js           Progressive enhancement only (nav, sticky header, reveals)
  favicon.svg      Site icon
```

### How a request flows

1. `main.ts` receives the request. `/static/*` is served by `@std/http`'s `serveDir`.
2. Everything else is passed to `route(pathname)` in `src/router.ts`.
3. The router looks up the path in its table and calls the matching page builder.
4. The page builder composes section helpers + `content.ts` data through the `html`
   tagged template, then wraps the result in `layout.page()`.
5. A `Response` with `text/html` is returned. Unknown paths render the 404 page.

### Adding a page

1. Add the data/text to `src/content.ts`.
2. Write a `export function myPage(): string` in `src/pages.ts`.
3. Register it in the `ROUTES` table in `src/router.ts`.
4. Add a nav link in the `NAV` array in `src/content.ts` (optional).

## Pages

| Path          | Purpose                                               |
| ------------- | ----------------------------------------------------- |
| `/`           | Home — hero, welcome, weekly services, call to act    |
| `/about`      | Story, the six pillars, leadership                    |
| `/services`   | Service times + ways to attend (in person/Zoom/phone) |
| `/ministries` | The ministries of the church                          |
| `/contact`    | Address, phone, email, Zoom, and an embedded map      |

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
- `--allow-read` — to read static assets from disk
- `--allow-env` — to read the optional `PORT` variable
