// main.ts — Entry point. Wires the HTTP server to two concerns:
//   1. Static assets under /static  (handled by @std/http's serveDir)
//   2. Everything else              (handled by the page router)
//
// The only external dependency is JSR @std/http. The handler is a single,
// explicit function so the request lifecycle reads top to bottom.

import { serveDir } from "@std/http/file-server";
import { route } from "./src/router.ts";
import { seedIfEmpty } from "./src/prayers.ts";

// import.meta.dirname is the directory of this module as a native OS path,
// so this resolves correctly on Windows (C:\...) as well as POSIX. Using
// new URL(...).pathname would prepend a leading slash on Windows ("/C:/...")
// and break asset reads.
const STATIC_ROOT = `${import.meta.dirname}/static`;
const PORT = Number(Deno.env.get("PORT") ?? 8000);

/** Route a single request to static files or the page router. */
async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname.startsWith("/static/")) {
    return await serveDir(request, {
      fsRoot: STATIC_ROOT,
      urlRoot: "static",
      quiet: true,
    });
  }

  return await route(request, url);
}

if (import.meta.main) {
  await seedIfEmpty();
  Deno.serve({ port: PORT, onListen }, handler);
}

/** Friendly startup banner. */
function onListen({ hostname, port }: { hostname: string; port: number }): void {
  const host = hostname === "0.0.0.0" ? "localhost" : hostname;
  console.log(`\n  Mercy Seat Ministries — serving at http://${host}:${port}\n`);
}
