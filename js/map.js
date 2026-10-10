/* On The Globe Marketing — hero map
   A dotted world map drawn on canvas. Every region in data/projects.js gets a
   pin; clicking one flies the map into that state/country and opens a panel
   with the work done there.

   How the dots work: each frame the land shapes are drawn into a tiny
   off-screen canvas where 1 pixel = 1 dot. Reading those pixels back tells
   us which grid cells are land (white) or one of our regions (red). That keeps
   the dot spacing constant while zooming, so the map "resolves" into more
   detail instead of the dots just getting bigger. */
(function () {
  "use strict";

  const host = document.querySelector("[data-map]");
  if (!host || !window.d3 || !window.topojson) return;

  const { data, fmtCoord, projectsIn, pad, reduceMotion } = window.OTG;
  const hero = host.closest(".hero");
  const canvas = host.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const pinLayer = hero.querySelector(".pins");
  const panel = hero.querySelector(".region-panel");
  const readout = hero.querySelector("[data-readout]");
  const viewLabel = hero.querySelector("[data-viewlabel]");

  const off = document.createElement("canvas");
  const offCtx = off.getContext("2d", { willReadFrequently: true });

  const COLORS = {
    land: [234, 236, 238],
    region: [200, 75, 75],
    sage: [122, 139, 123]
  };

  let W = 0, H = 0, DPR = 1, GAP = 7, isMobile = false;
  let land, countries, states, stateMesh, countryMesh, graticule;
  const regionShapes = new Map(); // region id -> GeoJSON feature

  // current camera: centre lon/lat and absolute projection scale
  let cam = { lon: 0, lat: 0, s: 100 };
  let zoomT = 0;          // 0 = world, 1 = zoomed into a region (used for fades)
  let activeRegion = null;
  let anim = null;
  let mouse = null;       // {x, y} in CSS px
  let introStart = null;
  let dirty = true;
  let raf = 0;

  const proj = d3.geoEquirectangular().precision(0.5);
  const offPath = d3.geoPath(proj, offCtx);
  const mainPath = d3.geoPath(proj, ctx);

  /* ---------------- data ---------------- */
  const WORLD = "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json";
  const US = "https://cdn.jsdelivr.net/npm/us-atlas@3.0.1/states-10m.json";

  Promise.all([d3.json(WORLD), d3.json(US)])
    .then(([world, us]) => {
      land = topojson.feature(world, world.objects.land);
      countries = topojson.feature(world, world.objects.countries);
      countryMesh = topojson.mesh(world, world.objects.countries, (a, b) => a !== b);
      states = topojson.feature(us, us.objects.states);
      stateMesh = topojson.mesh(us, us.objects.states, (a, b) => a !== b);
      graticule = d3.geoGraticule().step([30, 30])();

      data.regions.forEach((r) => {
        let f = null;
        if (r.fips) f = states.features.find((s) => String(s.id).padStart(2, "0") === r.fips);
        else if (r.iso) f = countries.features.find((c) => String(c.id) === String(r.iso));
        if (f) regionShapes.set(r.id, f);
      });

      buildPins();
      resize();
      introStart = performance.now();
      requestFrame();

      // deep link: index.html#map-wisconsin opens straight into a region
      const m = location.hash.match(/^#map-(.+)$/);
      if (m && data.regions.some((r) => r.id === m[1])) setTimeout(() => openRegion(m[1]), 400);
    })
    .catch(() => {
      host.insertAdjacentHTML("beforeend", '<div class="map-fallback label">Map unavailable offline — <a class="text-link" href="work.html">&nbsp;see our work →</a></div>');
    });

  /* ---------------- camera ---------------- */
  function worldCam() {
    // fill the width; on tall/narrow screens fill more height and lean on the Americas
    const sW = W / (2 * Math.PI);
    const sH = H / 2.5;
    const s = Math.max(sW, sH);
    const lon = s > sW * 1.15 ? -72 : 8;
    return { lon, lat: 16, s };
  }

  function regionCam(id) {
    const r = data.regions.find((x) => x.id === id);
    const f = regionShapes.get(id);
    let lonSpan = 8, latSpan = 6;
    if (f) {
      const [[x0, y0], [x1, y1]] = d3.geoBounds(f);
      lonSpan = Math.max(2, x1 - x0);
      latSpan = Math.max(2, y1 - y0);
    }
    // free area not covered by the panel
    const panelW = isMobile ? 0 : Math.min(420, W * 0.4) + 48;
    const freeW = W - panelW;
    const freeH = isMobile ? H * 0.36 : H;
    const freeCx = freeW / 2;
    const freeCy = isMobile ? H * 0.22 + 20 : H / 2 + 10;
    const ctxFactor = 4.2; // how much surrounding context to show
    const sx = freeW / ((lonSpan * ctxFactor * Math.PI) / 180);
    const sy = freeH / ((latSpan * ctxFactor * 1.4 * Math.PI) / 180);
    const s = Math.min(sx, sy);
    const [plon, plat] = f ? d3.geoCentroid(f) : r.pin;
    const deg = 180 / Math.PI;
    return {
      lon: plon + ((W / 2 - freeCx) / s) * deg,
      lat: plat - ((H / 2 - freeCy) / s) * deg,
      s
    };
  }

  function applyCam(c) {
    proj.scale(c.s).center([c.lon, c.lat]).translate([W / 2, H / 2]);
  }

  function flyTo(target, toZoom, done) {
    const from = { ...cam };
    const z0 = zoomT;
    const dur = reduceMotion ? 1 : 1500;
    const start = performance.now();
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    anim = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const e = ease(t);
      cam = {
        lon: from.lon + (target.lon - from.lon) * e,
        lat: from.lat + (target.lat - from.lat) * e,
        // interpolate scale geometrically so the zoom feels even
        s: Math.exp(Math.log(from.s) + (Math.log(target.s) - Math.log(from.s)) * e)
      };
      zoomT = z0 + (toZoom - z0) * e;
      if (t >= 1) { anim = null; if (done) done(); }
    };
    requestFrame();
  }

  /* ---------------- drawing ---------------- */
  function rasterize() {
    const cols = Math.ceil(W / GAP);
    const rows = Math.ceil(H / GAP);
    if (off.width !== cols || off.height !== rows) { off.width = cols; off.height = rows; }
    offCtx.setTransform(1, 0, 0, 1, 0, 0);
    offCtx.clearRect(0, 0, cols, rows);
    offCtx.setTransform(1 / GAP, 0, 0, 1 / GAP, 0, 0);
    offCtx.fillStyle = "#fff";
    offCtx.beginPath(); offPath(land); offCtx.fill();
    offCtx.fillStyle = "#f00";
    regionShapes.forEach((f) => { offCtx.beginPath(); offPath(f); offCtx.fill(); });
    return { cols, rows, px: offCtx.getImageData(0, 0, cols, rows).data };
  }

  function draw(now) {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    applyCam(cam);

    // graticule — faint survey lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(234,236,238,${0.045 + zoomT * 0.02})`;
    ctx.beginPath(); mainPath(graticule); ctx.stroke();

    const { cols, rows, px } = rasterize();
    const intro = reduceMotion || introStart === null ? 1 : Math.min(1, (now - introStart) / 1300);
    const sweepX = intro * (W + 300) - 150;
    const LIGHT_R = isMobile ? 0 : 150;

    // bucket dots by alpha so we only issue a few fills per frame
    const BUCKETS = 10;
    const landB = Array.from({ length: BUCKETS }, () => []);
    const regB = [];
    const r0 = GAP * 0.27;

    for (let j = 0; j < rows; j++) {
      const y = j * GAP + GAP / 2;
      for (let i = 0; i < cols; i++) {
        const k = (j * cols + i) * 4;
        const R = px[k], G = px[k + 1], A = px[k + 3];
        if (A < 110 || R < 110) continue;
        const x = i * GAP + GAP / 2;
        // intro: dots appear as a soft scan from left to right
        let a = 1;
        if (intro < 1) {
          const d = (sweepX - x) / 220;
          if (d <= 0) continue;
          a = Math.min(1, d);
        }
        if (G < 90) { regB.push(x, y, a); continue; }
        let base = 0.2 + zoomT * 0.08;
        if (LIGHT_R && mouse) {
          const dx = x - mouse.x, dy = y - mouse.y;
          const dd = dx * dx + dy * dy;
          if (dd < LIGHT_R * LIGHT_R) base += (1 - Math.sqrt(dd) / LIGHT_R) * 0.45;
        }
        const b = Math.min(BUCKETS - 1, Math.floor(base * a * BUCKETS));
        landB[b].push(x, y);
      }
    }

    const [lr, lg, lb] = COLORS.land;
    for (let b = 1; b < BUCKETS; b++) {
      const arr = landB[b];
      if (!arr.length) continue;
      ctx.fillStyle = `rgba(${lr},${lg},${lb},${(b + 0.5) / BUCKETS})`;
      ctx.beginPath();
      for (let n = 0; n < arr.length; n += 2) { ctx.moveTo(arr[n] + r0, arr[n + 1]); ctx.arc(arr[n], arr[n + 1], r0, 0, 6.2832); }
      ctx.fill();
    }

    // region dots: brick, a touch larger
    if (regB.length) {
      const [rr, rg, rb] = COLORS.region;
      const r1 = GAP * 0.33;
      ctx.fillStyle = `rgba(${rr},${rg},${rb},${0.85})`;
      ctx.beginPath();
      for (let n = 0; n < regB.length; n += 3) {
        if (regB[n + 2] < 1) continue;
        ctx.moveTo(regB[n] + r1, regB[n + 1]); ctx.arc(regB[n], regB[n + 1], r1, 0, 6.2832);
      }
      ctx.fill();
    }

    // borders fade in as we zoom
    if (zoomT > 0.02) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(234,236,238,${0.16 * zoomT})`;
      ctx.beginPath(); mainPath(stateMesh); ctx.stroke();
      ctx.strokeStyle = `rgba(234,236,238,${0.22 * zoomT})`;
      ctx.beginPath(); mainPath(countryMesh); ctx.stroke();
      if (activeRegion && regionShapes.get(activeRegion)) {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = `rgba(200,75,75,${0.9 * zoomT})`;
        ctx.beginPath(); mainPath(regionShapes.get(activeRegion)); ctx.stroke();
      }
      drawStateLabels();
    }

    positionPins(intro);
    return intro < 1;
  }

  // abbreviations for states near the active region, mono like a survey map
  const STATE_ABBR = { "01":"AL","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT","10":"DE","12":"FL","13":"GA","16":"ID","17":"IL","18":"IN","19":"IA","20":"KS","21":"KY","22":"LA","23":"ME","24":"MD","25":"MA","26":"MI","27":"MN","28":"MS","29":"MO","30":"MT","31":"NE","32":"NV","33":"NH","34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND","39":"OH","40":"OK","41":"OR","42":"PA","44":"RI","45":"SC","46":"SD","47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV","55":"WI","56":"WY" };
  function drawStateLabels() {
    if (zoomT < 0.6) return;
    const a = (zoomT - 0.6) / 0.4;
    ctx.font = '500 10px "IBM Plex Mono", monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const activeFips = (data.regions.find((r) => r.id === activeRegion) || {}).fips;
    for (const f of states.features) {
      const id = String(f.id).padStart(2, "0");
      const abbr = STATE_ABBR[id];
      if (!abbr || id === activeFips) continue;
      const [x, y] = proj(d3.geoCentroid(f));
      if (x < 20 || y < 80 || x > W - 20 || y > H - 20) continue;
      ctx.fillStyle = `rgba(154,163,173,${0.75 * a})`;
      ctx.fillText(abbr, x, y);
    }
  }

  function frame(now) {
    raf = 0;
    if (anim) anim(now);
    const stillIntro = draw(now);
    if (anim || stillIntro) requestFrame();
  }
  function requestFrame() { if (!raf) raf = requestAnimationFrame(frame); }

  /* ---------------- pins ---------------- */
  let pins = [];
  function buildPins() {
    pinLayer.innerHTML = "";
    pins = data.regions.map((r) => {
      const count = projectsIn(r.id).length;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "pin";
      b.setAttribute("aria-label", `${r.name}: ${count} project${count === 1 ? "" : "s"}. Open.`);
      b.innerHTML = `<span class="pin__inner is-intro"><span class="pin__dot"></span><span class="pin__label">${r.name} · ${pad(count)}</span></span>`;
      b.addEventListener("click", () => (activeRegion === r.id ? null : openRegion(r.id)));
      pinLayer.appendChild(b);
      return { r, el: b, inner: b.firstChild, dropped: false };
    });
  }
  function positionPins(intro) {
    for (const p of pins) {
      const [x, y] = proj(p.r.pin);
      p.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      // drop the pin once the scan has passed it
      if (!p.dropped && (intro >= 1 || x < intro * (W + 300) - 150)) {
        p.dropped = true;
        p.inner.classList.remove("is-intro");
        p.inner.classList.add("is-dropped");
      }
    }
  }

  /* ---------------- region panel ---------------- */
  function openRegion(id) {
    const r = data.regions.find((x) => x.id === id);
    if (!r) return;
    activeRegion = id;
    pins.forEach((p) => p.el.classList.toggle("is-active", p.r.id === id));
    const list = projectsIn(id);
    panel.querySelector("[data-panel-kicker]").textContent = `${r.abbr || ""} · ${r.country}`.replace(/^ · /, "");
    panel.querySelector("[data-panel-name]").textContent = r.name;
    panel.querySelector("[data-panel-meta]").textContent = `${fmtCoord(r.pin)} — ${pad(list.length)} project${list.length === 1 ? "" : "s"}`;
    panel.querySelector("[data-panel-list]").innerHTML = list
      .map(
        (p) => `
        <a class="mini-project" href="case.html?p=${p.slug}">
          <div class="mini-project__img"><img src="${p.cover}" alt="" loading="lazy"></div>
          <div class="mini-project__body">
            <div class="mini-project__title">${p.client}</div>
            <div class="mini-project__meta label"><span>${p.city}</span><span>${p.category}</span></div>
            <div class="mini-project__go text-link">Read the case study <span aria-hidden="true">→</span></div>
          </div>
        </a>`
      )
      .join("");
    panel.querySelector("[data-panel-all]").href = `work.html#${id}`;
    panel.querySelector("[data-panel-all]").textContent = `All ${r.name} work →`;

    hero.classList.add("is-zoomed");
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    if (viewLabel) viewLabel.textContent = r.name;
    flyTo(regionCam(id), 1, () => panel.querySelector(".region-panel__close").focus({ preventScroll: true }));
  }

  function closeRegion() {
    if (!activeRegion) return;
    const last = pins.find((p) => p.r.id === activeRegion);
    activeRegion = null;
    pins.forEach((p) => p.el.classList.remove("is-active"));
    hero.classList.remove("is-zoomed");
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    if (viewLabel) viewLabel.textContent = "World";
    flyTo(worldCam(), 0);
    if (last) last.el.focus({ preventScroll: true });
  }

  panel.querySelector(".region-panel__close").addEventListener("click", closeRegion);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeRegion(); });
  // clicking empty map while zoomed goes back out
  host.addEventListener("click", (e) => { if (activeRegion && e.target === canvas) closeRegion(); });

  /* ---------------- pointer: flashlight + coordinates ---------------- */
  host.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const rect = canvas.getBoundingClientRect();
    mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    if (readout) {
      const ll = proj.invert([mouse.x, mouse.y]);
      if (ll && Math.abs(ll[1]) <= 90) readout.textContent = fmtCoord(ll);
    }
    requestFrame();
  });
  host.addEventListener("pointerleave", () => { mouse = null; requestFrame(); });
  // the hero text sits above the canvas; keep the flashlight following there too
  hero.addEventListener("pointermove", (e) => {
    if (e.target === canvas || e.pointerType !== "mouse") return;
    const rect = canvas.getBoundingClientRect();
    mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    requestFrame();
  });

  /* ---------------- size ---------------- */
  function resize() {
    const rect = host.getBoundingClientRect();
    W = Math.max(320, rect.width);
    H = Math.max(400, rect.height);
    isMobile = W < 760;
    GAP = W < 500 ? 6 : W > 1700 ? 8 : 7;
    DPR = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    cam = activeRegion ? regionCam(activeRegion) : worldCam();
    requestFrame();
  }
  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => land && resize(), 120); });

  /* ---------------- scroll: map drifts slower than the page ---------------- */
  if (!reduceMotion) {
    let sTick = false;
    window.addEventListener("scroll", () => {
      if (sTick) return;
      sTick = true;
      requestAnimationFrame(() => {
        sTick = false;
        const y = window.scrollY;
        if (y > H * 1.2) return;
        const t = `translate3d(0, ${(y * 0.35).toFixed(1)}px, 0)`;
        const o = String(Math.max(0, 1 - y / (H * 0.95)));
        host.style.transform = pinLayer.style.transform = t;
        host.style.opacity = pinLayer.style.opacity = o;
      });
    }, { passive: true });
  }
})();
