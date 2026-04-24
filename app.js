// Visual + FX defaults. Flip any boolean to disable that effect.
const TWEAK_DEFAULTS = {
  accent: "blue",
  mode: "dark",
  texture: "grid",
  heroHeadline: "own",
  nameStyle: "caps",
  font: "geist",
  fxDeviceParallax: true,
  fxTileRipple: true,
  fxMagneticCta: true,
  fxNavScrub: true,
  fxCardLift: true,
  fxCardStagger: true,
  fxStepDraw: true,
  fxRowBounce: true,
  fxTileDrift: true,
  fxScrollRail: true
};

(function(){
  const d = (typeof TWEAK_DEFAULTS === "object" && TWEAK_DEFAULTS) || {};
  const body = document.body;
  if (d.accent)  body.dataset.accent  = d.accent;
  if (d.mode)    body.dataset.mode    = d.mode;
  if (d.texture) body.dataset.texture = d.texture;
  if (d.font)    body.dataset.font    = d.font;

  // apply headline variant
  const pick = d.heroHeadline || "own";
  document.querySelectorAll(".hl").forEach(el => {
    el.hidden = !el.classList.contains("hl-" + pick);
  });

  // apply product name style
  const nameMap = {
    caps: "GNOS3",
    cap: "Gnos3",
    low: "gnos3",
    sup: "Gnos<sup style='font-size:.65em;vertical-align:.35em;'>3</sup>"
  };
  const name = nameMap[d.nameStyle] || nameMap.caps;
  document.querySelectorAll(".product-name").forEach(el => { el.innerHTML = name; });
  // Build the document-tile backdrop
  (function buildBackdrop(){
    const el = document.getElementById("docBackdrop");
    if (!el) return;
    const COLS = 9, ROWS = 7;
    el.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
    el.style.gridTemplateRows    = `repeat(${ROWS}, 1fr)`;
    const cx = (COLS - 1) / 2, cy = (ROWS - 1) / 2;
    const maxDist = Math.hypot(cx, cy);
    // pick ~4 tiles to glow, scattered and not in the center row
    const glowCount = 4;
    const candidates = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const dist = Math.hypot(c - cx, r - cy) / maxDist;
        if (dist > 0.45 && dist < 0.95) candidates.push({r, c, dist});
      }
    }
    // shuffle
    candidates.sort(() => Math.random() - 0.5);
    const glowSet = new Set(candidates.slice(0, glowCount).map(t => t.r + "," + t.c));

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = document.createElement("div");
        tile.className = "doc-tile";
        const dist = Math.hypot(c - cx, r - cy) / maxDist;
        // smooth distance-driven opacity; CSS consumes --d
        tile.style.setProperty("--d", dist.toFixed(3));
        if (glowSet.has(r + "," + c)) {
          tile.classList.add("on");
          tile.style.animationDelay = (-Math.random() * 4.8).toFixed(2) + "s";
        }
        el.appendChild(tile);
      }
    }
  })();

  // =========================================================
  // FX MODULE — toggleable animations with in-page panel + host edit-mode wiring
  // =========================================================
  const FX = [
    { key: "fxDeviceParallax", label: "DEVICE PARALLAX",  hint: "Mini-PC tilts with cursor" },
    { key: "fxTileRipple",     label: "TILE RIPPLE",      hint: "Hover hero → tiles glow near cursor" },
    { key: "fxMagneticCta",    label: "MAGNETIC CTA",     hint: "Primary buttons drift toward cursor" },
    { key: "fxNavScrub",       label: "NAV UNDERLINE",    hint: "Wipe-in underline on nav hover" },
    { key: "fxCardLift",       label: "CARD LIFT",        hint: "Cards rise + glow on hover" },
    { key: "fxCardStagger",    label: "SCROLL STAGGER",   hint: "Cards fade up on scroll-in" },
    { key: "fxStepDraw",       label: "STEP CONNECTOR",   hint: "Line draws between steps" },
    { key: "fxRowBounce",      label: "ROW ICONS BOUNCE", hint: "Compare icons pop in" },
    { key: "fxTileDrift",      label: "BACKDROP DRIFT",   hint: "Hero tiles drift on scroll" },
    { key: "fxScrollRail",     label: "SCROLL RAIL",      hint: "Progress line on left edge" },
  ];

  // Live state — init from tweak defaults
  const fxState = {};
  FX.forEach(f => { fxState[f.key] = d[f.key] !== false && d[f.key] !== undefined ? !!d[f.key] : false; });

  const fxClassMap = {
    fxDeviceParallax: "fx-device-parallax",
    fxTileRipple:     "fx-tile-ripple",
    fxMagneticCta:    "fx-magnetic-cta",
    fxNavScrub:       "fx-nav-scrub",
    fxCardLift:       "fx-card-lift",
    fxCardStagger:    "fx-card-stagger",
    fxStepDraw:       "fx-step-draw",
    fxRowBounce:      "fx-row-bounce",
    fxTileDrift:      "fx-tile-drift",
    fxScrollRail:     "fx-scroll-rail",
  };

  function applyFx() {
    FX.forEach(f => {
      body.classList.toggle(fxClassMap[f.key], !!fxState[f.key]);
    });
  }
  applyFx();

  // ---------- Effect wiring ----------

  // 1. Device parallax — track cursor, lerp target values each frame for smoothness
  const stage = document.querySelector(".stage");
  if (stage) {
    let tx = 0, ty = 0, cx = 0, cy = 0, active = false;
    stage.addEventListener("mousemove", (ev) => {
      const r = stage.getBoundingClientRect();
      tx = ((ev.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((ev.clientY - r.top) / r.height - 0.5) * 2;
      active = true;
      const root = document.documentElement.style;
      root.setProperty("--mx", (ev.clientX - r.left) + "px");
      root.setProperty("--my", (ev.clientY - r.top) + "px");
      const bg = document.getElementById("docBackdrop");
      if (bg) { bg.style.setProperty("--mx", (ev.clientX - r.left) + "px"); bg.style.setProperty("--my", (ev.clientY - r.top) + "px"); }
    });
    stage.addEventListener("mouseleave", () => { tx = 0; ty = 0; });
    function tick() {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      const root = document.documentElement.style;
      root.setProperty("--pxDeg", (cx * 12).toFixed(2) + "deg");
      root.setProperty("--pyDeg", (cy * -8).toFixed(2) + "deg");
      root.setProperty("--pxPx", (cx * -12).toFixed(2) + "px");
      root.setProperty("--pyPx", (cy * -12).toFixed(2) + "px");
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // 3. Magnetic CTAs
  document.querySelectorAll(".btn.primary, .nav-cta").forEach(el => {
    el.addEventListener("mousemove", (ev) => {
      if (!body.classList.contains("fx-magnetic-cta")) return;
      const r = el.getBoundingClientRect();
      const x = (ev.clientX - r.left - r.width/2) / (r.width/2);
      const y = (ev.clientY - r.top - r.height/2) / (r.height/2);
      el.style.transform = `translate(${(x*4).toFixed(2)}px, ${(y*3).toFixed(2)}px)`;
    });
    el.addEventListener("mouseleave", () => { el.style.transform = ""; });
  });

  // 6/7/8. Scroll-in reveals — using scroll listener (IO unreliable in preview iframe)
  const revealTargets = Array.from(document.querySelectorAll(".privacy-cell, .case, .step, .steps, .compare-row"));
  function checkReveal() {
    const vh = window.innerHeight;
    const trigger = vh * 0.85;
    for (const el of revealTargets) {
      if (el.classList.contains("in")) continue;
      const r = el.getBoundingClientRect();
      if (r.top < trigger && r.bottom > 0) el.classList.add("in");
    }
  }
  window.addEventListener("scroll", checkReveal, { passive: true });
  window.addEventListener("resize", checkReveal, { passive: true });
  checkReveal();
  // re-check after fonts/layout settle
  setTimeout(checkReveal, 200);
  setTimeout(checkReveal, 800);

  // 9/10. Scroll drift + rail
  function onScroll() {
    const y = window.scrollY || 0;
    const max = (document.documentElement.scrollHeight - window.innerHeight) || 1;
    const pct = Math.min(100, Math.max(0, (y / max) * 100));
    document.documentElement.style.setProperty("--scrollPx", (y * -0.06).toFixed(2) + "px");
    document.documentElement.style.setProperty("--scrollPct", pct.toFixed(2));
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---------- Contact form: async submit to contact.php ----------
  const form = document.getElementById("contactForm");
  if (form) {
    const submit  = form.querySelector("#cfSubmit");
    const label   = form.querySelector(".cf-label");
    const spinner = form.querySelector(".cf-spinner");
    const errEl   = form.querySelector("#cfError");
    const body    = form.querySelector(".form-body");
    const sent    = form.querySelector(".sent");

    function showError(msg) {
      errEl.textContent = msg;
      errEl.hidden = false;
    }

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      errEl.hidden = true;

      if (!form.reportValidity()) return;

      submit.disabled = true;
      spinner.hidden  = false;
      label.textContent = "Sending";

      try {
        const res = await fetch(form.action, {
          method:  "POST",
          body:    new FormData(form),
          headers: { "Accept": "application/json" },
        });

        let data = null;
        try { data = await res.json(); } catch { /* non-JSON response */ }

        if (!res.ok || !data || !data.ok) {
          const msg = (data && data.error) || `Submission failed (HTTP ${res.status}). Please email max@gnos3.com directly.`;
          showError(msg);
          submit.disabled = false;
          spinner.hidden  = true;
          label.textContent = "Try again →";
          return;
        }

        body.hidden = true;
        sent.hidden = false;
      } catch (err) {
        showError("Network error. Please email max@gnos3.com directly.");
        submit.disabled = false;
        spinner.hidden  = true;
        label.textContent = "Try again →";
      }
    });
  }
})();
