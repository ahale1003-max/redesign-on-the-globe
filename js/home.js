/* Home page: services stack details + project browser */
(function () {
  "use strict";
  const { data, livePreview, tabsFor, pad, projectsIn, reduceMotion } = window.OTG;

  /* ---------- Social calendar visual ---------- */
  const cal = document.querySelector("[data-cal]");
  if (cal) {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    // a believable posting rhythm: 3–4 posts a week, never every day
    const plan = [
      ["t-reel", "Shop tour"], [], ["t-photo", "Team pic"], [], ["t-story", "Hours"], ["t-photo", "Before / after"], [],
      [], ["t-reel", "Quick tip"], [], ["t-photo", "Customer car"], [], ["t-story", "Poll"], [],
      ["t-photo", "New service"], [], ["t-story", "Behind the counter"], ["t-reel", "Time-lapse"], [], [], ["t-photo", "Weekend"],
      [], ["t-reel", "FAQ"], [], ["t-photo", "Review"], ["t-story", "Promo"], [], []
    ];
    cal.innerHTML =
      days.map((d) => `<span class="cal__d">${d}</span>`).join("") +
      plan.map((c, i) =>
        c.length
          ? `<span class="cal__c ${c[0]}" style="--d:${i}"><span>${pad(i + 1)}</span><span>${c[1]}</span><b></b></span>`
          : `<span class="cal__c is-empty" style="--d:${i}"><span>${pad(i + 1)}</span></span>`
      ).join("");
  }

  /* ---------- Strategy route length ---------- */
  document.querySelectorAll("[data-route]").forEach((p) => {
    const len = Math.ceil(p.getTotalLength());
    p.style.setProperty("--len", len);
    p.setAttribute("stroke-dasharray", len);
  });

  /* ---------- Fit long service words on small screens ---------- */
  const words = Array.from(document.querySelectorAll(".svc__word"));
  function fitWords() {
    words.forEach((w) => {
      w.style.fontSize = "";
      const avail = w.clientWidth;
      if (w.scrollWidth > avail) {
        const fs = parseFloat(getComputedStyle(w).fontSize);
        w.style.fontSize = Math.floor(fs * (avail / w.scrollWidth) * 0.98) + "px";
      }
    });
  }
  fitWords();
  if (document.fonts) document.fonts.ready.then(fitWords);
  window.addEventListener("resize", fitWords);

  /* ---------- Stack: covered cards recede slightly ---------- */
  const cards = Array.from(document.querySelectorAll("[data-stack] .svc"));
  cards.forEach((c) => {
    c.querySelector(".svc__head").addEventListener("click", () => {
      // scrolling to a sticky element needs its "natural" position
      const stack = c.parentElement;
      const idx = cards.indexOf(c);
      let y = stack.getBoundingClientRect().top + window.scrollY;
      for (let i = 0; i < idx; i++) y += cards[i].offsetHeight + 28;
      const peek = parseFloat(getComputedStyle(c).getPropertyValue("--peek")) || 90;
      window.scrollTo({ top: y - 84 - idx * peek, behavior: reduceMotion ? "auto" : "smooth" });
    });
  });
  // A sticky card taller than the screen would be covered before its bottom
  // half is seen. For those, stick by the bottom edge instead of the top.
  function fitSticky() {
    const vh = window.innerHeight;
    cards.forEach((c, i) => {
      c.style.top = "";
      const natural = parseFloat(getComputedStyle(c).top);
      const h = c.offsetHeight;
      if (natural + h > vh - 8) c.style.top = Math.round(Math.min(natural, vh - h - 16)) + "px";
    });
  }
  fitSticky();
  if (document.fonts) document.fonts.ready.then(fitSticky);
  window.addEventListener("resize", fitSticky);

  if (!reduceMotion && cards.length) {
    let tick = false;
    const onScroll = () => {
      tick = false;
      for (let i = 0; i < cards.length - 1; i++) {
        const cur = cards[i], next = cards[i + 1];
        const a = cur.getBoundingClientRect(), b = next.getBoundingClientRect();
        // how far the next card has travelled over this one (0..1)
        const covered = Math.min(1, Math.max(0, (a.bottom - b.top) / Math.max(1, a.height)));
        cur.style.transform = covered > 0 ? `scale(${(1 - covered * 0.03).toFixed(4)})` : "";
        cur.style.filter = covered > 0 ? `brightness(${(1 - covered * 0.06).toFixed(3)})` : "";
      }
    };
    window.addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
  }

  /* ---------- Project browser ---------- */
  const list = document.querySelector("[data-plist]");
  const detail = document.querySelector("[data-detail]");
  if (!list || !detail) return;

  document.querySelector("[data-plist-count]").textContent = pad(data.projects.length);
  document.querySelector("[data-region-links]").innerHTML = data.regions
    .map((r) => `<li><a class="text-link" href="work.html#${r.id}"><span class="n">${pad(projectsIn(r.id).length)}</span>${r.name}</a></li>`)
    .join("");

  const items = data.projects.map(
    (p, i) => `
    <button class="plist__item" role="tab" type="button" aria-selected="${i === 0}" data-i="${i}">
      <span class="dot" aria-hidden="true"></span>
      <span class="plist__name">${p.short || p.client}</span>
      <span class="plist__cat">${p.category}</span>
    </button>`
  );
  // an honest open slot: there's room on the list
  items.push(`
    <button class="plist__item plist__item--open" role="tab" type="button" aria-selected="false" data-i="open">
      <span class="dot" aria-hidden="true"></span>
      <span class="plist__name">Your business?</span>
      <span class="plist__cat">Open</span>
    </button>`);
  list.innerHTML = items.join("");

  function showProject(i) {
    const p = data.projects[i];
    detail.innerHTML = `
      <div class="detail-swap">
        <p class="col-title label"><span>Project detail</span><span class="coord">${p.city}</span></p>
        <div class="detail__frame" data-view></div>
        <div class="detail__bar">
          <div class="tabs" data-tabs aria-label="Pages"></div>
          <div class="detail__actions">
            <a class="text-link" href="case.html?p=${p.slug}">Case study →</a>
            <a class="text-link" href="${p.live}" target="_blank" rel="noopener">Full screen ↗</a>
          </div>
        </div>
        <div class="detail__info">
          <div>
            <h3 class="detail__title">${p.client}</h3>
            <p class="detail__summary">${p.summary}</p>
          </div>
          <dl class="facts">
            <div><dt>Location</dt><dd>${p.city}</dd></div>
            <div><dt>Year</dt><dd>${p.year}</dd></div>
            <div><dt>Industry</dt><dd>${p.category}</dd></div>
            <div><dt>Work</dt><dd>${p.services.slice(0, 2).join(", ")}</dd></div>
          </dl>
        </div>
      </div>`;
    const preview = livePreview(detail.querySelector("[data-view]"), p);
    tabsFor(detail.querySelector("[data-tabs]"), preview);
  }

  function showOpen() {
    detail.innerHTML = `
      <div class="detail-swap">
        <p class="col-title label"><span>Project detail</span><span>—</span></p>
        <div class="detail__frame">
          <div class="slot">
            <div>
              <h3>This spot's open.</h3>
              <p>We're taking on a small number of new clients. Your business could be the next pin on the map.</p>
              <a class="btn btn--brick" href="#contact">Start a project <span class="arrow">→</span></a>
            </div>
          </div>
        </div>
      </div>`;
  }

  const buttons = Array.from(list.querySelectorAll(".plist__item"));
  function select(btn) {
    buttons.forEach((b) => b.setAttribute("aria-selected", String(b === btn)));
    const i = btn.dataset.i;
    if (i === "open") showOpen(); else showProject(Number(i));
  }
  buttons.forEach((b, idx) => {
    b.addEventListener("click", () => select(b));
    b.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      const n = buttons[(idx + (e.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length];
      n.focus(); select(n);
    });
  });
  if (data.projects.length) showProject(0); else showOpen();
})();
