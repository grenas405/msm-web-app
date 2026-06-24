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
  }, { threshold: 0.12 });

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
