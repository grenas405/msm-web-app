// router.ts — The request dispatcher. Maps a Request to a Response.
//
// Two kinds of routes:
//   • Static GET pages   — pure () => string builders in the ROUTES table.
//   • The Prayer Wall     — reads/writes Deno KV, so it has its own GET and
//                           POST handlers below.
//
// Forms POST and the server replies with a 303 redirect, so the wall works
// with JavaScript disabled. The pray endpoint also answers JSON when asked,
// which lets app.js update a counter in place.

import { STATUS_CODE } from "@std/http/status";
import * as pages from "./pages.ts";
import { addPrayer, getStats, listPrayers, markAnswered, prayFor } from "./prayers.ts";

/** A page builder produces a complete HTML document. */
type PageBuilder = () => string;

/** The static GET route table. Add a line here to add a simple page. */
const ROUTES: Record<string, PageBuilder> = {
  "/": pages.home,
  "/about": pages.about,
  "/services": pages.services,
  "/ministries": pages.ministries,
  "/contact": pages.contact,
};

const ADMIN_KEY = Deno.env.get("PRAYER_ADMIN_KEY") ?? "pastor";

/** Dispatch a request to the right handler. */
export async function route(request: Request, url: URL): Promise<Response> {
  const path = normalize(url.pathname);

  if (request.method === "POST") {
    return await handlePost(request, url, path);
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", { status: STATUS_CODE.MethodNotAllowed });
  }

  if (path === "/prayer-wall") {
    return await renderPrayerWall(url);
  }

  const builder = ROUTES[path];
  if (builder) {
    return htmlResponse(builder(), STATUS_CODE.OK);
  }
  return htmlResponse(pages.notFound(), STATUS_CODE.NotFound);
}

/** GET /prayer-wall — gather data from KV and render the page. */
async function renderPrayerWall(url: URL): Promise<Response> {
  const adminKey = url.searchParams.get("admin");
  const isAdmin = adminKey !== null && adminKey === ADMIN_KEY;
  const [active, answered, stats] = await Promise.all([
    listPrayers("active"),
    listPrayers("answered"),
    getStats(),
  ]);
  return htmlResponse(
    pages.prayerWall({ active, answered, stats, isAdmin, adminKey: isAdmin ? adminKey : null }),
    STATUS_CODE.OK,
  );
}

/** Handle the three Prayer Wall POST endpoints. */
async function handlePost(request: Request, url: URL, path: string): Promise<Response> {
  const form = await request.formData();

  if (path === "/prayer-wall") {
    const body = String(form.get("body") ?? "");
    if (body.trim().length >= 3) {
      await addPrayer({
        name: String(form.get("name") ?? ""),
        body,
        category: String(form.get("category") ?? "Other"),
      });
    }
    return redirect("/prayer-wall#wall");
  }

  if (path === "/prayer-wall/pray") {
    const id = String(form.get("id") ?? "");
    const count = await prayFor(id);
    if (wantsJson(request)) {
      return Response.json({ ok: count !== null, count });
    }
    return redirect("/prayer-wall#wall");
  }

  if (path === "/prayer-wall/answer") {
    if (url.searchParams.get("admin") !== ADMIN_KEY) {
      return new Response("Forbidden", { status: STATUS_CODE.Forbidden });
    }
    await markAnswered(String(form.get("id") ?? ""));
    return redirect(`/prayer-wall?admin=${encodeURIComponent(ADMIN_KEY)}#wall`);
  }

  return htmlResponse(pages.notFound(), STATUS_CODE.NotFound);
}

/** Build an HTML Response with the given status. */
function htmlResponse(body: string, status: number): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-cache",
    },
  });
}

/** A 303 redirect so a POST is followed by a clean GET. */
function redirect(location: string): Response {
  return new Response(null, {
    status: STATUS_CODE.SeeOther,
    headers: { location },
  });
}

/** True when the caller (app.js fetch) prefers a JSON reply. */
function wantsJson(request: Request): boolean {
  return request.headers.get("accept")?.includes("application/json") ?? false;
}

/** Strip a trailing slash (except for root) so "/about/" === "/about". */
function normalize(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}
