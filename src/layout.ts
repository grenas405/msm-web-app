// layout.ts — The page shell: <head>, header/nav, footer.
// One function, `page()`, wraps any body content in the full document.

import { html, raw } from "./html.ts";
import { NAV, type NavItem, SITE } from "./content.ts";
import { contact } from "./settings.ts";
import { icon } from "./icons.ts";

export interface PageOptions {
  title: string;
  description: string;
  path: string;
  body: string;
  /** When true, omit the public header/footer and mark the page noindex. */
  bare?: boolean;
}

/** A single nav anchor, marked active on the current page. */
function navLink(item: NavItem, currentPath: string): string {
  const cls = item.href === currentPath ? "active" : "";
  return html`
    <a class="${cls}" href="${item.href}">${item.label}</a>
  `;
}

/** Build the navigation, rendering a dropdown for any item with children. */
function nav(currentPath: string): string {
  return NAV.map((item) => {
    if (!item.children) return navLink(item, currentPath);
    const active = item.children.some((c) => c.href === currentPath) ? " active" : "";
    const sub = item.children.map((c) => navLink(c, currentPath)).join("");
    return html`
      <div class="nav-group">
        <button class="nav-group-toggle${active}" type="button" aria-haspopup="true">
          ${item.label} ${raw(icon("chevron").value)}
        </button>
        <div class="nav-submenu">${raw(sub)}</div>
      </div>
    `;
  }).join("");
}

/** Flatten the nav into its leaf links (for the footer). */
function navLeaves(): NavItem[] {
  return NAV.flatMap((i) => i.children ?? [i]);
}

/** Facebook/Instagram icon links — only the ones that have a URL set. */
function socialIcons(className: string): string {
  const c = contact();
  const links: string[] = [];
  if (c.facebookUrl) {
    links.push(html`
      <a href="${c.facebookUrl}" target="_blank" rel="noopener" aria-label="Facebook">${raw(
        icon("facebook").value,
      )}</a>
    `);
  }
  if (c.instagramUrl) {
    links.push(html`
      <a href="${c.instagramUrl}" target="_blank" rel="noopener" aria-label="Instagram">${raw(
        icon("instagram").value,
      )}</a>
    `);
  }
  if (links.length === 0) return "";
  return html`
    <div class="${className}">${raw(links.join(""))}</div>
  `;
}

/** Render a complete HTML document. */
export function page(opts: PageOptions): string {
  const fullTitle = opts.path === "/"
    ? `${SITE.name} — ${SITE.tagline}`
    : `${opts.title} · ${SITE.name}`;

  const robots = opts.bare ? `<meta name="robots" content="noindex,nofollow">` : "";
  const header = opts.bare ? "" : siteHeader(opts.path);
  const footer = opts.bare ? "" : siteFooter();
  const skip = opts.bare ? "" : `<a class="skip-link" href="#main">Skip to content</a>`;

  const document = html`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="${opts.description}">
        <meta name="theme-color" content="#0b1f3a">
        ${raw(robots)}
        <meta property="og:title" content="${fullTitle}">
        <meta property="og:description" content="${opts.description}">
        <meta property="og:type" content="website">
        <title>${fullTitle}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"
        >
        <link rel="stylesheet" href="/static/styles.css">
        <link rel="icon" href="/static/favicon.svg" type="image/svg+xml">
      </head>
      <body>
        ${raw(skip)} ${raw(header)}

        <main id="main">
          ${raw(opts.body)}
        </main>

        ${raw(footer)}

        <script src="/static/app.js" defer></script>
      </body>
    </html>
  `;

  // Trim formatter-introduced indentation so the doc starts at <!DOCTYPE html>.
  return document.trim();
}

/** The public site header with primary + mobile navigation. */
function siteHeader(path: string): string {
  return html`
    <header class="site-header" data-header>
      <div class="container header-inner">
        <a class="brand" href="/">
          <span class="brand-mark">${icon("flame")}</span>
          <span class="brand-text">
            <span class="brand-name">${SITE.name}</span>
            <span class="brand-tag">${SITE.tagline}</span>
          </span>
        </a>
        <nav class="site-nav" aria-label="Primary">
          ${raw(nav(path))}
        </nav>
        <button class="nav-toggle" data-nav-toggle aria-label="Toggle menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>
      <nav class="mobile-nav" data-mobile-nav aria-label="Mobile">
        ${raw(nav(path))}
        <a class="btn header-cta" href="/contact">Plan a Visit</a>
      </nav>
    </header>
  `;
}

/** The public site footer. */
function siteFooter(): string {
  return html`
    <footer class="site-footer">
      <div class="container footer-grid">
        <div class="footer-brand">
          <span class="brand-mark">${icon("flame")}</span>
          <div>
            <p class="footer-name">${SITE.name}</p>
            <p class="footer-mission">${SITE.mission}</p>
            ${raw(socialIcons("footer-social"))}
          </div>
        </div>
        <div class="footer-col">
          <h3>Visit</h3>
          <p>
            ${contact().address.line1}<br>${contact().address.detail}<br>
            ${contact().address.city}, ${contact().address.state} ${contact().address.zip}
          </p>
        </div>
        <div class="footer-col">
          <h3>Connect</h3>
          <p>
            ${raw(
              contact().phones.map((ph) =>
                html`
                  <a href="${ph.href}">${ph.display}</a>
                `
              ).join("<br>"),
            )}<br>
            <a href="mailto:${contact().email}">${contact().email}</a>
          </p>
        </div>
        <div class="footer-col">
          <h3>Gather</h3>
          <nav class="footer-links" aria-label="Footer">
            ${raw(
              navLeaves().map((i) =>
                html`
                  <a href="${i.href}">${i.label}</a>
                `
              ).join(""),
            )}
          </nav>
        </div>
      </div>
      <div class="container footer-bottom">
        <p>&copy; ${new Date().getFullYear()} ${SITE.name} — ${SITE
          .tagline}. All rights reserved.</p>
        <p>${SITE.mission}</p>
      </div>
    </footer>
  `;
}
