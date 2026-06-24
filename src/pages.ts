// pages.ts — One explicit function per page. Each returns a full HTML document.
// Pages compose small section builders; sections compose content + html helpers.

import { html, raw } from "./html.ts";
import { page } from "./layout.ts";
import { icon } from "./icons.ts";
import {
  BENEDICTION,
  CONTACT,
  PILLARS,
  PRAYER_CATEGORIES,
  PRAYER_VERSE,
  SCRIPTURE,
  SERVICES,
  SHEPHERD_VERSES,
  SITE,
  type Verse,
  VERSES,
} from "./content.ts";
import type { Prayer, PrayerStats } from "./prayers.ts";

// ── Shared section builders ───────────────────────────────────────────────

/** A decorative scripture banner. Pass any verse; defaults to the primary one. */
function scriptureBanner(verse: Verse = SCRIPTURE): string {
  return html`
    <section class="scripture">
      <div class="container">
        <p class="scripture-text">&ldquo;${verse.text}&rdquo;</p>
        <p class="scripture-ref">— ${verse.reference}</p>
      </div>
    </section>
  `;
}

/** A grid of New Testament promise cards. */
function verseCards(): string {
  const cards = VERSES.map((v) =>
    html`
      <blockquote class="verse-card">
        <p class="verse-text">${v.text}</p>
        <cite class="verse-ref">${v.reference}</cite>
      </blockquote>
    `
  ).join("");
  return raw(cards).value;
}

/** Compact list of weekly services for reuse. */
function serviceCards(): string {
  const cards = SERVICES.map((s) =>
    html`
      <article class="service-card">
        <span class="service-day">${s.day}</span>
        <h3 class="service-name">${s.name}</h3>
        <p class="service-time">${raw(icon("clock").value)} ${s.time}</p>
        <p class="service-note">${s.note}</p>
      </article>
    `
  ).join("");
  return raw(cards).value;
}

/** A reusable call-to-action band. */
function ctaBand(): string {
  return html`
    <section class="cta-band">
      <div class="container cta-inner">
        <div>
          <h2>You're welcome at the table.</h2>
          <p>Join us in person in Newcastle, or gather with us online from anywhere.</p>
        </div>
        <div class="cta-actions">
          <a class="btn btn-light" href="/services">Service Times</a>
          <a class="btn btn-outline-light" href="/contact">Plan a Visit ${raw(
            icon("arrow").value,
          )}</a>
        </div>
      </div>
    </section>
  `;
}

// ── Home ──────────────────────────────────────────────────────────────────

export function home(): string {
  const pillars = PILLARS.slice(0, 3).map((p) =>
    html`
      <article class="pillar">
        <span class="pillar-icon">${raw(icon(p.icon).value)}</span>
        <h3>${p.title}</h3>
        <p>${p.body}</p>
      </article>
    `
  ).join("");

  const body = html`
    <section class="hero">
      <div class="hero-overlay"></div>
      <div class="container hero-content">
        <a class="hero-promo" href="/prayer-wall">
          <span class="hero-promo-tag">New</span>
          <span class="hero-promo-label">
            ${raw(icon("hands").value)} Introducing our Prayer Wall<span
              class="hero-promo-more"
            >
              — share &amp; pray together</span>
          </span>
          <span class="hero-promo-arrow">${raw(icon("arrow").value)}</span>
        </a>
        <p class="eyebrow eyebrow-rule">Welcome to ${SITE.name}</p>
        <h1 class="hero-title">Come and find<br><em>grace &amp; rest.</em></h1>
        <p class="hero-lead">
          No matter where you've been or what you carry, there is mercy waiting for you here. Come as
          you are, meet the living God, and discover the life He has for you.
        </p>
        <div class="hero-actions">
          <a class="btn btn-light btn-lg" href="/services">Join Us This Week ${raw(
            icon("arrow").value,
          )}</a>
          <a class="btn btn-outline-light btn-lg" href="/about">Who We Are</a>
        </div>
        <ul class="hero-facts">
          <li>${raw(icon("clock").value)}<span>Sundays at 10:15 AM</span></li>
          <li>${raw(icon("pin").value)}<span>${CONTACT.address.city}, ${CONTACT.address
            .state}</span></li>
          <li>${raw(icon("video").value)}<span>Streaming live on Zoom</span></li>
        </ul>
      </div>
    </section>

    ${raw(scriptureBanner())}

    <section class="section">
      <div class="container welcome-grid">
        <div class="welcome-copy">
          <p class="eyebrow">Our Heart</p>
          <h2>A vibrant, Christ-centered church in Oklahoma City.</h2>
          <p class="lead">${SITE.description}</p>
          <p>
            Whether you are exploring faith for the very first time or have walked with Jesus for
            decades, there is a seat for you here. We are a family being changed by grace — gathering
            around the Word, welcoming the presence of the Holy Spirit, and carrying His love into our
            city and beyond.
          </p>
          <p class="mission-quote">${SITE.mission}</p>
          <a class="link-arrow" href="/about">Read our story ${raw(icon("arrow").value)}</a>
        </div>
        <div class="welcome-pillars">${raw(pillars)}</div>
      </div>
    </section>

    <section class="section section-tint">
      <div class="container">
        <div class="section-head">
          <p class="eyebrow">Promises to Stand On</p>
          <h2>His Word, our hope.</h2>
          <p class="section-lead">
            The same God who met His people above the mercy seat now invites us, in Christ, to His
            throne of grace. These are the promises we build our lives upon.
          </p>
        </div>
        <div class="verse-grid">${raw(verseCards())}</div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head">
          <p class="eyebrow">Gather With Us</p>
          <h2>Weekly rhythms of worship.</h2>
        </div>
        <div class="service-grid">${raw(serviceCards())}</div>
      </div>
    </section>

    ${raw(ctaBand())}
  `;

  return page({
    title: "Home",
    description: SITE.description,
    path: "/",
    body,
  });
}

// ── About ─────────────────────────────────────────────────────────────────

export function about(): string {
  const body = html`
    <section class="page-hero">
      <div class="container">
        <p class="eyebrow">About Us</p>
        <h1>Light, love, and the knowledge of Christ.</h1>
        <p class="page-hero-lead">${SITE.mission}</p>
      </div>
    </section>

    <section class="section">
      <div class="container prose">
        <p class="lead">${SITE.description}</p>
        <p>
          The name <strong>Mercy Seat</strong> recalls the lid of the Ark of the Covenant — the very
          place God promised to meet with His people. That is our prayer for this church: that every
          gathering would be a place where heaven and earth meet, where grace is found, and where lives
          are transformed by the presence of Jesus.
        </p>
      </div>
    </section>

    <section class="section section-tint">
      <div class="container">
        <div class="section-head">
          <p class="eyebrow">What We're Built On</p>
          <h2>Six pillars of our common life.</h2>
        </div>
        <div class="pillar-grid">
          ${raw(
            PILLARS.map((p) =>
              html`
                <article class="pillar pillar-lg">
                  <span class="pillar-icon">${raw(icon(p.icon).value)}</span>
                  <h3>${p.title}</h3>
                  <p>${p.body}</p>
                </article>
              `
            ).join(""),
          )}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container leader-card">
        <div class="leader-avatar">${raw(icon("flame").value)}</div>
        <div>
          <p class="eyebrow">Our Shepherd</p>
          <h2>${CONTACT.pastor}</h2>
          <p>
            Our pastor leads Mercy Seat Ministries with a deep love for Scripture and a heart for the
            people of Oklahoma City. You are warmly invited to reach out, ask questions, and visit any
            of our weekly gatherings.
          </p>
          <a class="btn" href="/contact">Get in Touch ${raw(icon("arrow").value)}</a>
        </div>
      </div>
    </section>

    ${raw(scriptureBanner())}
  `;

  return page({
    title: "About",
    description:
      "Learn about Mercy Seat Ministries — a vibrant, Christ-centered church in Oklahoma City built on the Word, the Holy Spirit, prayer, worship, and compassion.",
    path: "/about",
    body,
  });
}

// ── Services ──────────────────────────────────────────────────────────────

export function services(): string {
  const body = html`
    <section class="page-hero">
      <div class="container">
        <p class="eyebrow">Service Times</p>
        <h1>Come and worship with us.</h1>
        <p class="page-hero-lead">
          Join us in person in Newcastle, by Zoom, or by phone — all are welcome.
        </p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="service-grid service-grid-lg">${raw(serviceCards())}</div>
      </div>
    </section>

    <section class="section section-tint">
      <div class="container ways-grid">
        <article class="way-card">
          <span class="pillar-icon">${raw(icon("pin").value)}</span>
          <h3>In Person</h3>
          <p>
            ${CONTACT.address.line1}, ${CONTACT.address.detail}<br>
            ${CONTACT.address.city}, ${CONTACT.address.state} ${CONTACT.address.zip}
          </p>
        </article>
        <article class="way-card">
          <span class="pillar-icon">${raw(icon("video").value)}</span>
          <h3>Online via Zoom</h3>
          <p>Worship with us from anywhere in the world.</p>
          <a class="btn btn-sm" href="${CONTACT.zoom}" target="_blank" rel="noopener">
            Join Zoom ${raw(icon("arrow").value)}</a>
        </article>
        <article class="way-card">
          <span class="pillar-icon">${raw(icon("phone").value)}</span>
          <h3>By Phone</h3>
          <p>Prefer to call in? Reach us for dial-in details.</p>
          <a class="btn btn-sm" href="${CONTACT.phoneHref}">${CONTACT.phone}</a>
        </article>
      </div>
    </section>

    ${raw(ctaBand())}
  `;

  return page({
    title: "Service Times",
    description:
      "Weekly service times for Mercy Seat Ministries OKC — Sunday School, Sunday Worship, Tuesday Prayers, and Friday Communion & Bible Study. In person, Zoom, or phone.",
    path: "/services",
    body,
  });
}

// ── Ministries ────────────────────────────────────────────────────────────

export function ministries(): string {
  const body = html`
    <section class="page-hero">
      <div class="container">
        <p class="eyebrow">Our Ministries</p>
        <h1>Faith expressed in every season of life.</h1>
        <p class="page-hero-lead">
          From the youngest child to the seasoned saint, there is a place to belong, grow, and serve.
        </p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="pillar-grid">
          ${raw(
            PILLARS.map((p) =>
              html`
                <article class="pillar pillar-lg">
                  <span class="pillar-icon">${raw(icon(p.icon).value)}</span>
                  <h3>${p.title}</h3>
                  <p>${p.body}</p>
                </article>
              `
            ).join(""),
          )}
        </div>
      </div>
    </section>

    <section class="section section-tint">
      <div class="container prose">
        <p class="eyebrow">Compassion & Evangelism</p>
        <h2>Beacons to our city and the world.</h2>
        <p class="lead">
          We believe the love of Christ is meant to be shared. Through compassionate service and
          faithful evangelism, we seek to be beacons unto as many persons and communities as possible
          — locally in Oklahoma City and beyond.
        </p>
        <a class="link-arrow" href="/contact">Serve with us ${raw(icon("arrow").value)}</a>
      </div>
    </section>

    ${raw(ctaBand())}
  `;

  return page({
    title: "Ministries",
    description:
      "Explore the ministries of Mercy Seat Ministries OKC — the Word, the Holy Spirit, prayer, worship, compassion and evangelism, and the next generation.",
    path: "/ministries",
    body,
  });
}

// ── Contact ───────────────────────────────────────────────────────────────

export function contact(): string {
  const mapQuery = encodeURIComponent(
    `${CONTACT.address.line1}, ${CONTACT.address.city}, ${CONTACT.address.state} ${CONTACT.address.zip}`,
  );

  const body = html`
    <section class="page-hero">
      <div class="container">
        <p class="eyebrow">Contact &amp; Visit</p>
        <h1>We would love to meet you.</h1>
        <p class="page-hero-lead">
          Reach out with any question, prayer request, or to plan your first visit.
        </p>
      </div>
    </section>

    <section class="section">
      <div class="container contact-grid">
        <div class="contact-details">
          <div class="contact-row">
            <span class="contact-icon">${raw(icon("pin").value)}</span>
            <div>
              <h3>Worship Location</h3>
              <p>
                ${CONTACT.address.line1}, ${CONTACT.address.detail}<br>
                ${CONTACT.address.city}, ${CONTACT.address.state} ${CONTACT.address.zip}
              </p>
            </div>
          </div>
          <div class="contact-row">
            <span class="contact-icon">${raw(icon("phone").value)}</span>
            <div>
              <h3>Call Us</h3>
              <p><a href="${CONTACT.phoneHref}">${CONTACT.phone}</a></p>
              <p class="muted">${CONTACT.pastor}</p>
            </div>
          </div>
          <div class="contact-row">
            <span class="contact-icon">${raw(icon("mail").value)}</span>
            <div>
              <h3>Email</h3>
              <p><a href="mailto:${CONTACT.email}">${CONTACT.email}</a></p>
            </div>
          </div>
          <div class="contact-row">
            <span class="contact-icon">${raw(icon("video").value)}</span>
            <div>
              <h3>Join Online</h3>
              <p><a href="${CONTACT
                .zoom}" target="_blank" rel="noopener">Worship with us on Zoom</a></p>
              <p class="muted">Skype: ${CONTACT.skype}</p>
            </div>
          </div>
        </div>
        <div class="contact-map">
          <iframe
            title="Map to Mercy Seat Ministries"
            src="https://www.google.com/maps?q=${raw(mapQuery)}&output=embed"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>
    </section>

    ${raw(scriptureBanner(BENEDICTION))}
  `;

  return page({
    title: "Contact",
    description:
      "Contact Mercy Seat Ministries OKC. Visit us at 705 NW 10th Street, Newcastle, OK, call (405) 402-7274, or join us online via Zoom.",
    path: "/contact",
    body,
  });
}

// ── 404 ───────────────────────────────────────────────────────────────────

export function notFound(): string {
  const body = html`
    <section class="page-hero error-hero">
      <div class="container">
        <p class="eyebrow">404</p>
        <h1>This page wandered off.</h1>
        <p class="page-hero-lead">
          The page you're looking for isn't here, but the door is always open.
        </p>
        <a class="btn btn-light" href="/">Return Home</a>
      </div>
    </section>
  `;

  return page({
    title: "Not Found",
    description: "Page not found.",
    path: "/404",
    body,
  });
}

// ── Prayer Wall ───────────────────────────────────────────────────────────

export interface PrayerWallView {
  active: Prayer[];
  answered: Prayer[];
  stats: PrayerStats;
}

/** Human-friendly relative time, e.g. "3 hours ago". */
function timeAgo(ts: number): string {
  const seconds = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  const units: [number, string][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.345, "week"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];
  let value = seconds;
  let unit = "second";
  for (const [size, name] of units) {
    if (value < size) {
      unit = name;
      break;
    }
    value = Math.floor(value / size);
    unit = name;
  }
  const rounded = Math.floor(value);
  return `${rounded} ${unit}${rounded === 1 ? "" : "s"} ago`;
}

/** Render the big counter for the stats row. */
function statTile(value: number, label: string, ic: string, highlight = false): string {
  return html`
    <div class="stat-tile${highlight ? " stat-tile-gold" : ""}">
      <span class="stat-icon">${raw(icon(ic).value)}</span>
      <span class="stat-text">
        <span class="stat-value">${value.toLocaleString("en-US")}</span>
        <span class="stat-label">${label}</span>
      </span>
    </div>
  `;
}

/** Render one active prayer request card for the public wall. */
function prayerCard(p: Prayer): string {
  const who = p.name ? p.name : "Anonymous";
  return html`
    <article class="prayer-card" data-id="${p.id}">
      <div class="prayer-top">
        <span class="chip">${p.category}</span>
        <span class="prayer-time">${raw(timeAgo(p.createdAt))}</span>
      </div>
      <p class="prayer-body">${p.body}</p>
      <div class="prayer-foot">
        <span class="prayer-who">${raw(icon("users").value)} ${who}</span>
        <form class="pray-form" method="post" action="/prayer-wall/pray">
          <input type="hidden" name="id" value="${p.id}">
          <button class="pray-btn" type="submit" data-id="${p.id}">
            ${raw(icon("hands").value)}
            <span class="pray-label">I prayed</span>
            <span class="pray-count">${p.prayedCount}</span>
          </button>
        </form>
      </div>
    </article>
  `;
}

/** Render one answered testimony card for the public wall. */
function testimonyCard(p: Prayer): string {
  const who = p.name ? p.name : "Anonymous";
  const detail = p.outcome
    ? html`
      <p class="testimony-outcome">&ldquo;${p.outcome}&rdquo;</p>
      <p class="testimony-origin">${raw(icon("hands").value)} Prayed: ${p.body}</p>
    `
    : html`
      <p class="prayer-body">${p.body}</p>
    `;
  return html`
    <article class="testimony-card">
      <span class="answered-badge">${raw(icon("check").value)} Answered</span>
      ${raw(detail)}
      <div class="prayer-foot">
        <span class="prayer-who">${raw(icon("spark").value)} ${who}</span>
        <span class="prayer-time">
          ${p.prayedCount.toLocaleString("en-US")} prayed
        </span>
      </div>
    </article>
  `;
}

export function prayerWall(view: PrayerWallView): string {
  const options = PRAYER_CATEGORIES.map((c) =>
    html`
      <option value="${c}">${c}</option>
    `
  )
    .join("");

  const activeList = view.active.length > 0
    ? html`
      <div class="prayer-grid">
        ${raw(view.active.map((p) => prayerCard(p)).join(""))}
      </div>
    `
    : html`
      <p class="empty-note">
        No active requests right now. Be the first to share — your church is ready to pray.
      </p>
    `;

  const testimonies = view.answered.length > 0
    ? html`
      <section class="section section-tint">
        <div class="container">
          <div class="section-head">
            <p class="eyebrow">Answered Prayers</p>
            <h2>Giving thanks together.</h2>
            <p class="section-lead">
              Every answered prayer is a testimony of God's faithfulness. To Him be the glory.
            </p>
          </div>
          <div class="prayer-grid">
            ${raw(view.answered.map(testimonyCard).join(""))}
          </div>
        </div>
      </section>
    `
    : "";

  const body = html`
    <section class="page-hero">
      <div class="container">
        <p class="eyebrow">Prayer Wall</p>
        <h1>Carry one another's burdens.</h1>
        <p class="page-hero-lead">
          Share what's on your heart, and join the church in praying over every request. You're never
          meant to carry it alone.
        </p>
      </div>
    </section>

    <section class="section prayer-stats-section">
      <div class="container">
        <div class="stat-row">
          ${raw(statTile(view.stats.requests, "Requests shared", "hands"))} ${raw(
            statTile(view.stats.prayersOffered, "Prayers offered", "heart"),
          )} ${raw(statTile(view.stats.answered, "Prayers answered", "check"))}
        </div>
      </div>
    </section>

    <section class="section" id="wall">
      <div class="container prayer-layout">
        <aside class="prayer-form-card">
          <h2>Share a request</h2>
          <p class="muted">
            Posts are visible to the whole church. Share anonymously if you'd prefer.
          </p>
          <form method="post" action="/prayer-wall">
            <label>
              <span>Your name <em>(optional)</em></span>
              <input type="text" name="name" maxlength="60" placeholder="Leave blank to stay anonymous">
            </label>
            <label>
              <span>Category</span>
              <select name="category">${raw(options)}</select>
            </label>
            <label>
              <span>Your prayer request</span>
              <textarea
                name="body"
                rows="5"
                maxlength="600"
                required
                placeholder="What can we pray with you about?"
              ></textarea>
            </label>
            <button class="btn btn-lg" type="submit">
              ${raw(icon("hands").value)} Post to the Wall
            </button>
          </form>
          <p class="prayer-verse">
            &ldquo;${PRAYER_VERSE.text}&rdquo;<br><cite>— ${PRAYER_VERSE.reference}</cite>
          </p>
        </aside>

        <div class="prayer-feed">
          <div class="section-head feed-head">
            <h2>Praying now</h2>
            <p class="section-lead">Tap “I prayed” to let others know they're not alone.</p>
          </div>
          ${raw(activeList)}
        </div>
      </div>
    </section>

    ${raw(testimonies)} ${raw(scriptureBanner(PRAYER_VERSE))}
  `;

  return page({
    title: "Prayer Wall",
    description:
      "Share a prayer request with Mercy Seat Ministries OKC and join the church in praying for one another. Read testimonies of answered prayer.",
    path: "/prayer-wall",
    body,
  });
}

// ── Admin ─────────────────────────────────────────────────────────────────

export interface AdminLoginView {
  error: string | null;
  configured: boolean;
}

/** The admin sign-in page. Not linked anywhere on the public site. */
export function adminLogin(view: AdminLoginView): string {
  const alert = view.error
    ? html`
      <p class="admin-alert" role="alert">${view.error}</p>
    `
    : "";

  const form = view.configured
    ? html`
      <form method="post" action="/admin/login" class="admin-form">
        ${raw(alert)}
        <label>
          <span>Password</span>
          <input type="password" name="password" autocomplete="current-password" autofocus required>
        </label>
        <button class="btn btn-lg" type="submit">${raw(icon("flame").value)} Sign in</button>
      </form>
    `
    : html`
      <div class="admin-form">
        <p class="admin-alert" role="alert">
          No admin password is set yet. Run
          <code>deno task set-password</code> on the server, then reload this page.
        </p>
      </div>
    `;

  const body = html`
    <section class="admin-auth">
      <div class="admin-card">
        <span class="admin-mark">${raw(icon("flame").value)}</span>
        <h1>${SITE.name}</h1>
        <p class="admin-sub">Site administration</p>
        ${raw(form)}
      </div>
    </section>
  `;

  return page({
    title: "Admin Login",
    description: "Administrator sign-in.",
    path: "/admin/login",
    body,
    bare: true,
  });
}

export interface AdminDashboardView {
  active: Prayer[];
  answered: Prayer[];
  stats: PrayerStats;
}

/** A time-of-day greeting based on the server clock. */
function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** "Pastor James Olufowote" -> "Pastor James" (title + first name). */
function pastorShortName(): string {
  return CONTACT.pastor.split(" ").slice(0, 2).join(" ");
}

/** Today's date, written out long-form. */
function todayLong(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Pick a shepherd's verse that changes once per day. */
function shepherdVerse(): Verse {
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  return SHEPHERD_VERSES[dayIndex % SHEPHERD_VERSES.length];
}

/** One manageable request row. `topId` gets a "most prayed" highlight. */
function adminRow(p: Prayer, topId: string | null): string {
  const who = p.name ? p.name : "Anonymous";
  const ribbon = p.id === topId && p.prayedCount > 0
    ? html`
      <span class="top-ribbon">${raw(icon("spark").value)} Most prayed</span>
    `
    : "";
  return html`
    <article class="admin-row${p.id === topId && p.prayedCount > 0 ? " admin-row-top" : ""}">
      <div class="admin-row-main">
        <div class="prayer-top">
          <span class="chip">${p.category}</span>
          ${raw(ribbon)}
          <span class="prayer-time">${raw(timeAgo(p.createdAt))}</span>
        </div>
        <p class="prayer-body">${p.body}</p>
        <div class="admin-row-meta">
          <span class="prayer-who">${raw(icon("users").value)} ${who}</span>
          <span class="pray-tally">${raw(icon("hands").value)} ${p.prayedCount.toLocaleString(
            "en-US",
          )} prayed</span>
        </div>
      </div>
      <details class="answer-details">
        <summary class="answer-summary">${raw(icon("check").value)} Mark answered</summary>
        <form method="post" action="/admin/answer" class="answer-form-full">
          <input type="hidden" name="id" value="${p.id}">
          <label class="answer-field">
            <span>Share the praise report — what did God do?
              <em>(optional · becomes a public testimony)</em></span>
            <textarea
              name="outcome"
              rows="3"
              maxlength="600"
              placeholder="e.g. The surgery went perfectly and recovery is ahead of schedule — praise God!"
            ></textarea>
          </label>
          <button class="btn btn-sm" type="submit">
            ${raw(icon("spark").value)} Record &amp; give thanks
          </button>
        </form>
      </details>
    </article>
  `;
}

/** A compact, celebratory card for an answered request. */
function adminAnsweredCard(p: Prayer): string {
  const who = p.name ? p.name : "Anonymous";
  const when = p.answeredAt ? timeAgo(p.answeredAt) : "";
  const detail = p.outcome
    ? html`
      <p class="testimony-outcome">&ldquo;${p.outcome}&rdquo;</p>
      <p class="testimony-origin">${raw(icon("hands").value)} Prayed: ${p.body}</p>
    `
    : html`
      <p class="prayer-body">${p.body}</p>
    `;
  return html`
    <article class="admin-answered">
      <span class="answered-badge">${raw(icon("check").value)} Answered ${raw(when)}</span>
      ${raw(detail)}
      <span class="prayer-who">${raw(icon("spark").value)} ${who}</span>
    </article>
  `;
}

/** The protected admin dashboard — a daily ministry view for the pastor. */
export function adminDashboard(view: AdminDashboardView): string {
  const verse = shepherdVerse();
  const awaiting = view.active.length;

  // Find the most-prayed active request to highlight.
  const topId = view.active.reduce<string | null>(
    (top, p) => {
      const topCount = view.active.find((x) => x.id === top)?.prayedCount ?? -1;
      return p.prayedCount > topCount ? p.id : top;
    },
    view.active[0]?.id ?? null,
  );

  const rows = view.active.length > 0
    ? html`
      <div class="admin-list">
        ${raw(view.active.map((p) => adminRow(p, topId)).join(""))}
      </div>
    `
    : html`
      <p class="empty-note">
        All caught up — no requests are awaiting prayer right now. 🙏
      </p>
    `;

  const answered = view.answered.length > 0
    ? html`
      <div class="section-head feed-head admin-section-head">
        <h2>Recently answered</h2>
        <p class="section-lead">Rejoice with those who rejoice — God has been faithful.</p>
      </div>
      <div class="admin-answered-grid">
        ${raw(view.answered.slice(0, 6).map(adminAnsweredCard).join(""))}
      </div>
    `
    : "";

  const impact = view.stats.prayersOffered > 0
    ? html`
      <p class="admin-impact">
        Together, your church has lifted up
        <strong>${view.stats.prayersOffered.toLocaleString("en-US")}</strong> prayers across
        <strong>${view.stats.requests.toLocaleString("en-US")}</strong> requests — and celebrated
        <strong>${view.stats.answered.toLocaleString("en-US")}</strong> answered.
      </p>
    `
    : "";

  const body = html`
    <section class="admin-shell">
      <div class="container">
        <header class="admin-bar">
          <div class="admin-brand">
            <span class="admin-mark">${raw(icon("flame").value)}</span>
            <div>
              <p class="eyebrow">${SITE.name} · Prayer Wall</p>
              <h1>${greeting()}, ${pastorShortName()}</h1>
              <p class="admin-date">${todayLong()}</p>
            </div>
          </div>
          <div class="admin-bar-actions">
            <a class="btn btn-sm btn-outline" href="/prayer-wall" target="_blank" rel="noopener">
              View wall ${raw(icon("arrow").value)}
            </a>
            <form method="post" action="/admin/logout">
              <button class="btn btn-sm" type="submit">Sign out</button>
            </form>
          </div>
        </header>

        <div class="admin-verse" data-verses="${JSON.stringify(SHEPHERD_VERSES)}">
          <span class="admin-verse-icon">${raw(icon("book").value)}</span>
          <div>
            <p class="admin-verse-text">
              &ldquo;<span class="admin-verse-typed">${verse
                .text}</span>&rdquo;
            </p>
            <p class="admin-verse-ref">— <span class="admin-verse-refname">${verse
              .reference}</span></p>
          </div>
        </div>

        <div class="stat-row admin-stats">
          ${raw(statTile(awaiting, "Awaiting prayer", "hands", true))} ${raw(
            statTile(view.stats.requests, "Requests shared", "users"),
          )} ${raw(statTile(view.stats.prayersOffered, "Prayers offered", "heart"))} ${raw(
            statTile(view.stats.answered, "Prayers answered", "check"),
          )}
        </div>
        ${raw(impact)}

        <div class="section-head feed-head admin-section-head">
          <h2>Requests awaiting prayer ${awaiting > 0
            ? raw(`<span class="count-badge">${awaiting}</span>`)
            : ""}</h2>
          <p class="section-lead">Mark a request answered to move it to the public testimonies.</p>
        </div>
        ${raw(rows)} ${raw(answered)}
      </div>
    </section>
  `;

  return page({
    title: "Admin",
    description: "Prayer Wall administration.",
    path: "/admin",
    body,
    bare: true,
  });
}
