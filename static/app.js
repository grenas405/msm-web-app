// app.js — Progressive enhancement only. The site is fully usable without it.
// Three tiny, independent concerns: mobile nav, sticky-header shadow, reveals.

(function mobileNav() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const menu = document.querySelector("[data-mobile-nav]");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  // Close the menu after following a link.
  menu.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", () => {
      menu.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    })
  );
})();

(function stickyHeader() {
  const header = document.querySelector("[data-header]");
  if (!header) return;
  const onScroll = () => header.classList.toggle("scrolled", globalThis.scrollY > 8);
  onScroll();
  globalThis.addEventListener("scroll", onScroll, { passive: true });
})();

(function revealOnScroll() {
  const targets = document.querySelectorAll(
    ".section, .scripture, .cta-band, .leader-card",
  );
  if (!("IntersectionObserver" in window) || !targets.length) return;

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    }
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0 });

  targets.forEach((el) => {
    el.classList.add("reveal");
    observer.observe(el);
  });
})();

(function prayerWall() {
  const forms = document.querySelectorAll(".pray-form");
  if (!forms.length) return;

  // Remember which requests this browser already prayed for.
  const KEY = "msm-prayed";
  const prayed = new Set(JSON.parse(localStorage.getItem(KEY) || "[]"));
  const remember = (id) => {
    prayed.add(id);
    localStorage.setItem(KEY, JSON.stringify([...prayed]));
  };

  forms.forEach((form) => {
    const button = form.querySelector(".pray-btn");
    const id = button?.dataset.id;
    if (id && prayed.has(id)) button.classList.add("prayed");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!button || button.classList.contains("prayed")) return;
      button.disabled = true;
      try {
        const res = await fetch(form.action, {
          method: "POST",
          headers: { "accept": "application/json" },
          body: new FormData(form),
        });
        const data = await res.json();
        if (data.ok) {
          const count = form.querySelector(".pray-count");
          if (count) count.textContent = String(data.count);
          button.classList.add("prayed");
          remember(id);
        }
      } catch {
        form.submit(); // fall back to a full POST + redirect
        return;
      } finally {
        button.disabled = false;
      }
    });
  });
})();

(function shepherdVerses() {
  const el = document.querySelector(".admin-verse[data-verses]");
  if (!el) return;

  // Respect reduced-motion: leave the server-rendered verse in place.
  if (globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  let verses;
  try {
    verses = JSON.parse(el.dataset.verses);
  } catch {
    return;
  }
  if (!Array.isArray(verses) || verses.length < 2) return;

  const typedEl = el.querySelector(".admin-verse-typed");
  const refEl = el.querySelector(".admin-verse-refname");
  if (!typedEl || !refEl) return;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  // Hold long enough to read comfortably: a base pause plus time per character.
  const holdFor = (text) => 3400 + text.length * 45;

  async function type(text) {
    el.classList.add("is-typing");
    for (let i = 1; i <= text.length; i++) {
      typedEl.textContent = text.slice(0, i);
      await sleep(26 + Math.random() * 34);
    }
    el.classList.remove("is-typing");
  }

  async function erase() {
    el.classList.add("is-typing");
    const text = typedEl.textContent;
    for (let i = text.length; i >= 0; i--) {
      typedEl.textContent = text.slice(0, i);
      await sleep(11);
    }
  }

  async function run() {
    // Start from whichever verse the server rendered, then cycle onward.
    let i = verses.findIndex((v) => v.reference === refEl.textContent.trim());
    if (i < 0) i = 0;
    await sleep(holdFor(verses[i].text));
    while (true) {
      await erase();
      refEl.textContent = "";
      i = (i + 1) % verses.length;
      const v = verses[i];
      await type(v.text);
      refEl.textContent = v.reference;
      await sleep(holdFor(v.text));
    }
  }

  run();
})();
