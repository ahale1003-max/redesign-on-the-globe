/* On The Globe Marketing — shared site behaviour
   Header + footer are rendered here so they only need editing in one place. */
(function () {
  "use strict";

  const CONTACT = {
    email: "ontheglobemarketing@gmail.com",
    instagram: { handle: "@ontheglobemarketing", url: "https://instagram.com/ontheglobemarketing" },
    tiktok: { handle: "@ontheglobe", url: "https://www.tiktok.com/@ontheglobe" },
    linkedin: { handle: "On The Globe Marketing", url: "https://www.linkedin.com/company/on-the-globe-marketing" }
  };

  // FormSubmit (formsubmit.co) delivers the contact form to our inbox.
  const FORM_ENDPOINT = "https://formsubmit.co/" + CONTACT.email;
  const FORM_AJAX = "https://formsubmit.co/ajax/" + CONTACT.email;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const page = document.body.dataset.page || "home";
  const data = window.OTG_DATA || { regions: [], projects: [] };

  /* ---------- Brand mark: a globe with one meridian and a pin ---------- */
  const MARK = `
    <svg class="brand__mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle class="globe-line" cx="16" cy="16" r="13" stroke-width="1.6"/>
      <ellipse class="globe-line" cx="16" cy="16" rx="5.6" ry="13" stroke-width="1.2"/>
      <path class="globe-line" d="M3.5 12h25M3.5 20h25" stroke-width="1.2"/>
      <circle cx="21.6" cy="10.4" r="3.4" fill="#C84B4B"/>
    </svg>`;

  /* ---------- Header ---------- */
  function renderNav() {
    const el = document.querySelector("[data-nav]");
    if (!el) return;
    const link = (href, label, key) =>
      `<a class="nav__link" href="${href}" ${page === key ? 'aria-current="page"' : ""}>${label}</a>`;
    el.className = "nav";
    el.innerHTML = `
      <div class="wrap nav__inner">
        <a class="brand" href="index.html" aria-label="On The Globe Marketing — home">
          ${MARK}
          <span class="brand__name">On The Globe<small>Marketing</small></span>
        </a>
        <button class="nav__toggle" aria-label="Menu" aria-expanded="false" aria-controls="nav-links"><span></span><span></span></button>
        <nav class="nav__links" id="nav-links" aria-label="Main">
          ${link("work.html", "Work", "work")}
          ${link("index.html#services", "Services", "services")}
          ${link("about.html", "About", "about")}
          <a class="btn btn--brick nav__cta" href="#contact">Let's talk <span class="arrow">→</span></a>
        </nav>
      </div>`;

    const toggle = el.querySelector(".nav__toggle");
    toggle.addEventListener("click", () => {
      const open = el.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    el.querySelectorAll(".nav__links a").forEach((a) =>
      a.addEventListener("click", () => {
        el.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );

    // Solid background after leaving the very top, and swap ink colour
    // depending on whether a light or dark section sits under the bar.
    const themed = Array.from(document.querySelectorAll("[data-theme]"));
    let ticking = false;
    function update() {
      ticking = false;
      el.classList.toggle("is-solid", window.scrollY > 24);
      const probe = (parseFloat(getComputedStyle(el).height) || 72) - 1;
      let theme = "dark";
      for (const s of themed) {
        const r = s.getBoundingClientRect();
        if (r.top <= probe && r.bottom > probe) { theme = s.dataset.theme; break; }
      }
      el.classList.toggle("on-light", theme === "light");
    }
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------- Footer / contact ---------- */
  function renderFooter() {
    const el = document.querySelector("[data-footer]");
    if (!el) return;
    const regions = data.regions.map((r) => `<li><a href="work.html#${r.id}">${r.name}</a></li>`).join("");
    el.id = "contact";
    el.className = "contact";
    el.setAttribute("data-theme", "dark");
    el.innerHTML = `
      <svg class="contact__dots" viewBox="0 0 400 400" aria-hidden="true">${dotGlobe()}</svg>
      <div class="wrap">
        <div class="contact__grid">
          <h2 class="contact__title reveal">Let's put you <em>on the map.</em></h2>
          <div class="reveal" style="--delay:120ms">
            <p class="contact__lede">Tell us who you are and how to reach you. We'll get back to you within a day — no pitch deck, just a conversation.</p>
            <form class="cform" action="${FORM_ENDPOINT}" method="POST" novalidate data-contact-form>
              <input type="hidden" name="_subject" value="New inquiry from ontheglobemarketing.com">
              <input type="hidden" name="_template" value="table">
              <!-- honeypot: real people never see or fill this -->
              <input type="text" name="_honey" class="cform__honey" tabindex="-1" autocomplete="off" aria-hidden="true">
              <div class="cform__row">
                <label class="cform__field"><span class="label">First name</span>
                  <input type="text" name="First name" autocomplete="given-name" maxlength="60" required></label>
                <label class="cform__field"><span class="label">Last name</span>
                  <input type="text" name="Last name" autocomplete="family-name" maxlength="60" required></label>
              </div>
              <div class="cform__row">
                <label class="cform__field"><span class="label">Email</span>
                  <input type="email" name="email" autocomplete="email" maxlength="120" inputmode="email"></label>
                <label class="cform__field"><span class="label">Phone</span>
                  <input type="tel" name="Phone" autocomplete="tel" maxlength="30" inputmode="tel"></label>
              </div>
              <p class="cform__hint label">Email or phone — either one works.</p>
              <label class="cform__field"><span class="label">Anything you'd like us to know? <i>Optional</i></span>
                <textarea name="Message" rows="3" maxlength="1000"></textarea></label>
              <p class="cform__error" role="alert" data-form-error hidden></p>
              <button class="btn btn--brick" type="submit">Put me on the map <span class="arrow">→</span></button>
              <p class="cform__legal">We only use this to reply to you. <a href="privacy.html">Privacy policy</a></p>
            </form>
            <div class="cform__done" role="status" data-form-done hidden>
              <p class="label" style="color:var(--brick)">Got it</p>
              <h3>Thanks — we'll be in touch within a day.</h3>
            </div>
          </div>
        </div>
        <div class="contact__cols">
          <div><h4>Pages</h4><ul>
            <li><a href="work.html">Work</a></li>
            <li><a href="index.html#services">Services</a></li>
            <li><a href="about.html">About</a></li>
          </ul></div>
          <div><h4>Services</h4><ul>
            <li><a href="index.html#svc-websites">Websites</a></li>
            <li><a href="index.html#svc-advertising">Advertising</a></li>
            <li><a href="index.html#svc-social">Social media</a></li>
            <li><a href="index.html#svc-strategy">Digital strategy</a></li>
          </ul></div>
          <div><h4>Where we've worked</h4><ul>${regions}</ul></div>
          <div><h4>Follow along</h4><ul>
            <li><a href="${CONTACT.instagram.url}" target="_blank" rel="noopener">Instagram</a></li>
            <li><a href="${CONTACT.tiktok.url}" target="_blank" rel="noopener">TikTok</a></li>
            <li><a href="${CONTACT.linkedin.url}" target="_blank" rel="noopener">LinkedIn</a></li>
          </ul></div>
        </div>
        <div class="contact__base label">
          <span>© ${new Date().getFullYear()} On The Globe Marketing · <a class="contact__legal" href="privacy.html">Privacy</a></span>
          <span class="coord" data-clock>—</span>
        </div>
      </div>`;

    initContactForm(el);

    // small live clock in the footer (local time) — a "you are here" detail
    const clock = el.querySelector("[data-clock]");
    const fmt = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", timeZoneName: "short" });
    const tick = () => (clock.textContent = "Local time " + fmt.format(new Date()));
    tick();
    setInterval(tick, 30000);
  }

  /* ---------- Contact form ----------
     Needs a first + last name and EITHER an email or a phone number.
     Sends in the background so the visitor stays on the page; if that fails
     it falls back to a normal form post. */
  function initContactForm(root) {
    const form = root.querySelector("[data-contact-form]");
    if (!form) return;
    const err = root.querySelector("[data-form-error]");
    const done = root.querySelector("[data-form-done]");
    const btn = form.querySelector('button[type="submit"]');
    const f = (name) => form.elements[name];
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function fail(msg, field) {
      err.textContent = msg;
      err.hidden = false;
      form.querySelectorAll(".is-invalid").forEach((x) => x.classList.remove("is-invalid"));
      if (field) { field.classList.add("is-invalid"); field.focus(); }
    }

    function validate() {
      const first = f("First name"), last = f("Last name"), email = f("email"), phone = f("Phone");
      if (!first.value.trim()) return fail("Please add your first name.", first), false;
      if (!last.value.trim()) return fail("Please add your last name.", last), false;
      const e = email.value.trim(), p = phone.value.trim();
      if (!e && !p) return fail("Add an email or a phone number so we can reach you.", email), false;
      if (e && !EMAIL_RE.test(e)) return fail("That email doesn't look right.", email), false;
      if (p && p.replace(/\D/g, "").length < 7) return fail("That phone number looks too short.", phone), false;
      err.hidden = true;
      form.querySelectorAll(".is-invalid").forEach((x) => x.classList.remove("is-invalid"));
      return true;
    }

    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      if (!validate()) return;
      if (f("_honey").value) return; // bot

      const payload = {};
      new FormData(form).forEach((v, k) => { if (k !== "_honey" && String(v).trim()) payload[k] = String(v).trim(); });

      btn.disabled = true;
      const label = btn.innerHTML;
      btn.textContent = "Sending…";
      fetch(FORM_AJAX, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad status"))))
        .then((res) => {
          if (String(res.success) !== "true") throw new Error("not accepted");
          form.hidden = true;
          done.hidden = false;
        })
        .catch(() => {
          btn.disabled = false;
          btn.innerHTML = label;
          fail("Something went wrong sending that. Please try again, or email us at " + CONTACT.email + ".");
        });
    });
  }

  // A tiny dotted globe for the footer, generated so it's not an image file.
  function dotGlobe() {
    let out = "";
    const cx = 200, cy = 200, R = 180;
    for (let lat = -80; lat <= 80; lat += 10) {
      const y = cy - R * Math.sin((lat * Math.PI) / 180);
      const rr = R * Math.cos((lat * Math.PI) / 180);
      const n = Math.max(4, Math.round(rr / 9));
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const x = cx + rr * Math.cos(a);
        const depth = (Math.sin(a) + 1) / 2;
        out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.8 + depth * 1.6).toFixed(2)}" fill="#EAECEE" opacity="${(0.08 + depth * 0.4).toFixed(2)}"/>`;
      }
    }
    return out;
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveals() {
    const els = document.querySelectorAll(".reveal, .line-mask, [data-inview]");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("is-inview"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-inview"); io.unobserve(e.target); }
      }),
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 }
    );
    els.forEach((e) => io.observe(e));
  }

  /* ---------- Live site preview (home + case study) ----------
     Shows a screenshot first (fast, no autoplaying video), then loads the
     real site in an iframe when the visitor chooses to explore it. The iframe
     renders at desktop width and is scaled down to fit the frame. */
  function livePreview(view, project, opts = {}) {
    const pages = project.pages && project.pages.length ? project.pages : [{ label: "Home", src: project.live, shot: project.cover }];
    let current = 0;
    let live = false;
    const DESKTOP_W = 1440;

    view.innerHTML = `
      <img class="shot" src="${pages[0].shot}" alt="Screenshot of the ${project.client} website, ${pages[0].label} page">
      <div class="iframe-scaler" hidden></div>
      <button class="detail__play" type="button" aria-label="Explore the live ${project.client} site here">
        <span>Explore the live site <span aria-hidden="true">→</span></span>
      </button>`;
    const shot = view.querySelector("img.shot");
    const scaler = view.querySelector(".iframe-scaler");
    const play = view.querySelector(".detail__play");

    function fit() {
      if (!live) return;
      const w = view.clientWidth, h = view.clientHeight;
      const s = w / DESKTOP_W;
      const iframe = scaler.querySelector("iframe");
      iframe.style.width = DESKTOP_W + "px";
      iframe.style.height = Math.ceil(h / s) + "px";
      scaler.style.transform = `scale(${s})`;
    }

    function goLive() {
      live = true;
      scaler.hidden = false;
      scaler.innerHTML = `<iframe title="${project.client} — live site" src="${pages[current].src}" loading="lazy"></iframe>`;
      view.classList.add("is-live");
      fit();
      if (opts.onLive) opts.onLive();
    }
    play.addEventListener("click", goLive);
    window.addEventListener("resize", fit);
    if ("ResizeObserver" in window) new ResizeObserver(fit).observe(view);

    function setPage(i) {
      current = i;
      shot.src = pages[i].shot;
      shot.alt = `Screenshot of the ${project.client} website, ${pages[i].label} page`;
      if (live) scaler.querySelector("iframe").src = pages[i].src;
    }

    return { pages, setPage, goLive, get current() { return current; } };
  }

  function tabsFor(container, preview) {
    container.innerHTML = preview.pages
      .map((p, i) => `<button class="tab" type="button" aria-pressed="${i === 0}">${p.label}</button>`)
      .join("");
    const tabs = Array.from(container.querySelectorAll(".tab"));
    tabs.forEach((t, i) =>
      t.addEventListener("click", () => {
        tabs.forEach((x) => x.setAttribute("aria-pressed", "false"));
        t.setAttribute("aria-pressed", "true");
        preview.setPage(i);
      })
    );
  }

  /* ---------- helpers shared with other scripts ---------- */
  function fmtCoord([lon, lat]) {
    const ns = lat >= 0 ? "N" : "S", ew = lon >= 0 ? "E" : "W";
    return `${Math.abs(lat).toFixed(2)}° ${ns}, ${Math.abs(lon).toFixed(2)}° ${ew}`;
  }
  const projectsIn = (regionId) => data.projects.filter((p) => p.region === regionId);
  const region = (id) => data.regions.find((r) => r.id === id);
  const pad = (n) => String(n).padStart(2, "0");

  window.OTG = { data, reduceMotion, livePreview, tabsFor, fmtCoord, projectsIn, region, pad, CONTACT };

  renderNav();
  renderFooter();
  // run after page scripts had a chance to add markup
  window.addEventListener("DOMContentLoaded", initReveals);
  if (document.readyState !== "loading") initReveals();
})();
