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
