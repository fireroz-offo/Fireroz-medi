// Shared UI helpers: inline SVG icons, ripple effect, count-up numbers, animated ring.
const P = {
  home: "M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  pill: "M10.5 20.5l-7-7a5 5 0 0 1 7-7l7 7a5 5 0 0 1-7 7z M8.5 8.5l7 7",
  users: "M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2 M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M21 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8",
  qr: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h3v3h-3z M20 14v.01 M14 20h3 M20 17v4",
  file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z M14 3v5h5 M9 13h6 M9 17h6",
  cal: "M7 3v3 M17 3v3 M4 8h16 M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
  spark: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z",
  sliders: "M4 6h9 M17 6h3 M4 12h3 M11 12h9 M4 18h11 M19 18h1 M15 4v4 M9 10v4 M17 16v4",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.7 21a2 2 0 0 1-3.4 0",
  plus: "M12 5v14 M5 12h14",
  trash: "M3 6h18 M8 6V4h8v2 M6 6l1 14h10l1-14 M10 11v6 M14 11v6",
  edit: "M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  check: "M5 12l5 5L20 7",
  x: "M6 6l12 12 M18 6L6 18",
  download: "M12 3v12 M7 10l5 5 5-5 M5 21h14",
  share: "M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M8.6 13.5l6.8 4 M15.4 6.5l-6.8 4",
  heart: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z",
  pulse: "M3 12h4l3-8 4 16 3-8h4",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M9 12l2 2 4-4",
  chev: "M9 6l6 6-6 6",
  back: "M19 12H5 M12 19l-7-7 7-7",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 11v5 M12 8v.01",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
  msg: "M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  lock: "M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z M8 11V8a4 4 0 0 1 8 0v3",
  save: "M12 3v12 M7 10l5 5 5-5 M4 17v3h16v-3",
  upload: "M12 15V3 M7 8l5-5 5 5 M4 17v3h16v-3",
  alert: "M12 3l10 18H2z M12 10v5 M12 18v.01"
};

export const icon = (name, size = 22, extra = "") =>
  `<svg class="ic ${extra}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[name] || P.info}"/></svg>`;

// Material-style ripple on any tappable element (delegated, one listener).
export function initRipple() {
  document.addEventListener("pointerdown", e => {
    const el = e.target.closest && e.target.closest("button,.tile,.rip,.tab,.app-item,.stat");
    if (!el || el.disabled) return;
    const r = el.getBoundingClientRect(), d = Math.max(r.width, r.height) * 1.6;
    const s = document.createElement("span");
    s.className = "ripple";
    s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    if (getComputedStyle(el).position === "static") el.style.position = "relative";
    el.classList.add("has-ripple");
    el.appendChild(s);
    setTimeout(() => s.remove(), 650);
  }, { passive: true });
}

// Animate numbers from 0 -> target. Elements: <span data-count="12">.
export function runCounters(root = document) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.querySelectorAll("[data-count]").forEach(el => {
    const to = Number(el.dataset.count) || 0;
    if (reduce || to === 0) { el.textContent = to; return; }
    const t0 = performance.now(), dur = 900;
    const tick = t => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(to * e);
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

// Animated score ring: <svg class="ring" data-pct="78"> (circle.ring-fg inside)
export function runRings(root = document, animate = true) {
  root.querySelectorAll(".ring[data-pct]").forEach(svg => {
    const fg = svg.querySelector(".ring-fg");
    if (!fg) return;
    const len = 2 * Math.PI * Number(fg.getAttribute("r"));
    const pct = Math.max(0, Math.min(100, Number(svg.dataset.pct) || 0));
    fg.style.strokeDasharray = String(len);
    fg.style.strokeDashoffset = String(len);
    const target = String(len * (1 - pct / 100));
    if (!animate || prefersReduced()) { fg.style.transition = "none"; fg.style.strokeDashoffset = target; return; }
    requestAnimationFrame(() => requestAnimationFrame(() => { fg.style.strokeDashoffset = target; }));
  });
}

export const prefersReduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// Toast (slides up from the bottom, auto hides).
export function toast(msg, kind = "ok") {
  let t = document.getElementById("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.className = "toast " + kind;
  t.innerHTML = (kind === "err" ? icon("alert", 18) : icon("check", 18)) + "<span></span>";
  t.querySelector("span").textContent = msg;
  void t.offsetWidth;
  t.classList.add("show");
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("show"), 2800);
}
