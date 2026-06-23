// pages.ts — One explicit function per page. Each returns a full HTML document.
// Pages compose small section builders; sections compose content + html helpers.

import { html, raw } from "./html.ts";
import { page } from "./layout.ts";
import { icon } from "./icons.ts";
import {
  BENEDICTION,
  CONTACT,
  PILLARS,
  SCRIPTURE,
  SERVICES,
  SITE,
  type Verse,
  VERSES,
} from "./content.ts";

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
      <div class="hero-scroll" aria-hidden="true"><span></span></div>
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
