// router.ts — A tiny, explicit route table mapping paths to page builders.
// Each route is a pure function: () => string (HTML). The dispatcher turns the
// matched HTML into an HTTP Response. Unmatched paths fall through to 404.

import { STATUS_CODE } from "@std/http/status";
import * as pages from "./pages.ts";

/** A page builder produces a complete HTML document. */
type PageBuilder = () => string;

/** The full route table. Add a line here to add a page. */
const ROUTES: Record<string, PageBuilder> = {
  "/": pages.home,
  "/about": pages.about,
  "/services": pages.services,
  "/ministries": pages.ministries,
  "/contact": pages.contact,
};

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

/**
 * Resolve a request pathname to an HTTP Response.
 * Trailing slashes are normalized; unknown paths return a 404 page.
 */
export function route(pathname: string): Response {
  const path = normalize(pathname);
  const builder = ROUTES[path];
  if (builder) {
    return htmlResponse(builder(), STATUS_CODE.OK);
  }
  return htmlResponse(pages.notFound(), STATUS_CODE.NotFound);
}

/** Strip a trailing slash (except for root) so "/about/" === "/about". */
function normalize(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}
