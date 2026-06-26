// router.ts — The request dispatcher. Maps a Request to a Response.
//
//   • Static GET pages   — pure () => string builders in the ROUTES table.
//   • Prayer Wall         — public GET + POST (share, pray), backed by Deno KV.
//   • Admin               — /admin/login and /admin, protected by a session
//                           cookie. The login page is intentionally unlinked.
//
// Forms POST and the server replies with a 303 redirect, so the site works
// with JavaScript disabled. The pray endpoint also answers JSON when asked.

import { STATUS_CODE } from "@std/http/status";
import { serveFile } from "@std/http/file-server";
import * as pages from "./pages.ts";
import { addPrayer, getStats, listPrayers, markAnswered, prayFor } from "./prayers.ts";
import { addLesson, deleteLesson, getLesson, lessonPath, listLessons } from "./lessons.ts";
import { contact, saveContact } from "./settings.ts";
import {
  clearCookie,
  createSession,
  destroySession,
  hasPassword,
  readSessionCookie,
  sessionCookie,
  validateSession,
  verifyPassword,
} from "./auth.ts";

/** Largest PDF we accept for a Sunday School lesson. */
const MAX_LESSON_BYTES = 25 * 1024 * 1024;

/** A page builder produces a complete HTML document. */
type PageBuilder = () => string;

/** The static GET route table. Add a line here to add a simple page. */
const ROUTES: Record<string, PageBuilder> = {
  "/": pages.home,
  "/about": pages.about,
  "/services": pages.services,
  "/ministries": pages.ministries,
  "/giving": pages.giving,
  "/devotionals": pages.devotionals,
  "/social": pages.social,
  "/contact": pages.contact,
};

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
    return await renderPrayerWall();
  }
  if (path === "/sunday-school") {
    return htmlResponse(pages.sundaySchool(await listLessons()));
  }
  if (path.startsWith("/lessons/") && path.endsWith(".pdf")) {
    return await serveLesson(request, path);
  }
  if (path === "/admin/login") {
    // Already signed in? Skip straight to the dashboard.
    if (await isAuthed(request)) return redirect("/admin");
    return htmlResponse(pages.adminLogin({ error: null, configured: await hasPassword() }));
  }
  if (path === "/admin") {
    if (!(await isAuthed(request))) return redirect("/admin/login");
    return await renderAdmin();
  }
  if (path === "/admin/lessons") {
    if (!(await isAuthed(request))) return redirect("/admin/login");
    return htmlResponse(pages.adminLessons({ lessons: await listLessons(), error: null }));
  }
  if (path === "/admin/contact") {
    if (!(await isAuthed(request))) return redirect("/admin/login");
    return htmlResponse(
      pages.adminContact({ info: contact(), saved: url.searchParams.has("saved") }),
    );
  }

  const builder = ROUTES[path];
  if (builder) {
    return htmlResponse(builder());
  }
  return htmlResponse(pages.notFound(), STATUS_CODE.NotFound);
}

/** GET /lessons/:id.pdf — stream a lesson PDF from disk if it exists. */
async function serveLesson(request: Request, path: string): Promise<Response> {
  const id = path.slice("/lessons/".length, -".pdf".length);
  const lesson = await getLesson(id);
  if (!lesson) return htmlResponse(pages.notFound(), STATUS_CODE.NotFound);
  return await serveFile(request, lessonPath(id));
}

/** GET /prayer-wall — gather data from KV and render the public wall. */
async function renderPrayerWall(): Promise<Response> {
  const [active, answered, stats] = await Promise.all([
    listPrayers("active"),
    listPrayers("answered"),
    getStats(),
  ]);
  return htmlResponse(pages.prayerWall({ active, answered, stats }));
}

/** GET /admin — render the protected dashboard. */
async function renderAdmin(): Promise<Response> {
  const [active, answered, stats] = await Promise.all([
    listPrayers("active"),
    listPrayers("answered"),
    getStats(),
  ]);
  return htmlResponse(pages.adminDashboard({ active, answered, stats }));
}

/** Parse a form body, tolerating an empty/typeless POST (e.g. logout). */
async function readForm(request: Request): Promise<FormData> {
  try {
    return await request.formData();
  } catch {
    return new FormData();
  }
}

/** Handle every POST endpoint. */
async function handlePost(request: Request, url: URL, path: string): Promise<Response> {
  const form = await readForm(request);

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
    const count = await prayFor(String(form.get("id") ?? ""));
    if (wantsJson(request)) return Response.json({ ok: count !== null, count });
    return redirect("/prayer-wall#wall");
  }

  if (path === "/admin/login") {
    const password = String(form.get("password") ?? "");
    if (await verifyPassword(password)) {
      const token = await createSession();
      return redirect("/admin", {
        "set-cookie": sessionCookie(token, isSecure(request, url)),
      });
    }
    return htmlResponse(
      pages.adminLogin({ error: "Incorrect password. Please try again.", configured: true }),
      STATUS_CODE.Unauthorized,
    );
  }

  if (path === "/admin/logout") {
    await destroySession(readSessionCookie(request));
    return redirect("/admin/login", { "set-cookie": clearCookie(isSecure(request, url)) });
  }

  if (path === "/admin/answer") {
    if (!(await isAuthed(request))) return redirect("/admin/login");
    await markAnswered(String(form.get("id") ?? ""), String(form.get("outcome") ?? ""));
    return redirect("/admin");
  }

  if (path === "/admin/lessons") {
    if (!(await isAuthed(request))) return redirect("/admin/login");
    return await uploadLesson(form);
  }

  if (path === "/admin/lessons/delete") {
    if (!(await isAuthed(request))) return redirect("/admin/login");
    await deleteLesson(String(form.get("id") ?? ""));
    return redirect("/admin/lessons");
  }

  if (path === "/admin/contact") {
    if (!(await isAuthed(request))) return redirect("/admin/login");
    await saveContact({
      pastor: String(form.get("pastor") ?? ""),
      email: String(form.get("email") ?? ""),
      zelleEmail: String(form.get("zelleEmail") ?? ""),
      paypalUrl: String(form.get("paypalUrl") ?? ""),
      facebookUrl: String(form.get("facebookUrl") ?? ""),
      instagramUrl: String(form.get("instagramUrl") ?? ""),
      phones: String(form.get("phones") ?? ""),
      line1: String(form.get("line1") ?? ""),
      detail: String(form.get("detail") ?? ""),
      city: String(form.get("city") ?? ""),
      state: String(form.get("state") ?? ""),
      zip: String(form.get("zip") ?? ""),
      zoom: String(form.get("zoom") ?? ""),
    });
    return redirect("/admin/contact?saved=1");
  }

  return htmlResponse(pages.notFound(), STATUS_CODE.NotFound);
}

/** Validate and store an uploaded Sunday School PDF. */
async function uploadLesson(form: FormData): Promise<Response> {
  const fail = async (message: string) =>
    htmlResponse(
      pages.adminLessons({ lessons: await listLessons(), error: message }),
      STATUS_CODE.BadRequest,
    );

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return await fail("Please choose a PDF file to upload.");
  }
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return await fail("That file isn't a PDF. Please upload a PDF lesson.");
  if (file.size > MAX_LESSON_BYTES) {
    return await fail("That PDF is larger than 25 MB. Please upload a smaller file.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  await addLesson(
    { title: String(form.get("title") ?? ""), date: String(form.get("date") ?? "") },
    bytes,
  );
  return redirect("/admin/lessons");
}

/** True when the request carries a valid admin session cookie. */
async function isAuthed(request: Request): Promise<boolean> {
  return await validateSession(readSessionCookie(request));
}

/** Whether to set the Secure cookie flag (https only). */
function isSecure(request: Request, url: URL): boolean {
  return url.protocol === "https:" ||
    request.headers.get("x-forwarded-proto") === "https";
}

/** Build an HTML Response with the given status (default 200 OK). */
function htmlResponse(body: string, status: number = STATUS_CODE.OK): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-cache",
    },
  });
}

/** A 303 redirect so a POST is followed by a clean GET. */
function redirect(location: string, extraHeaders: Record<string, string> = {}): Response {
  return new Response(null, {
    status: STATUS_CODE.SeeOther,
    headers: { location, ...extraHeaders },
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
