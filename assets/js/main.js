/* ==========================================================================
   WATERWALL BOREHOLE DRILLING — main.js
   Vanilla JS only. No dependencies.
   ========================================================================== */
(function () {
  "use strict";

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const WA_NUMBER = "254705901445";

  /* ------------------------------------------------------------------
     PRELOADER
  ------------------------------------------------------------------ */
  const hidePreloader = () => {
    const p = $("#preloader");
    if (p && !p.classList.contains("is-done")) p.classList.add("is-done");
  };
  window.addEventListener("load", () => {
    setTimeout(hidePreloader, 200);
  });
  if (document.readyState === "complete") {
    hidePreloader();
  }
  // Safety: never trap the user behind the preloader
  setTimeout(hidePreloader, 2000);

  /* ------------------------------------------------------------------
     YEAR
  ------------------------------------------------------------------ */
  const yr = $("#year");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ------------------------------------------------------------------
     HEADER: sticky, hide-on-scroll, scroll progress
  ------------------------------------------------------------------ */
  const header = $("#header");
  const progress = $("#scrollProgress");
  const toTop = $("#toTop");
  let lastY = window.scrollY;

  function onScroll() {
    const y = window.scrollY;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";

    if (header) {
      header.classList.toggle("is-stuck", y > 60);
      // hide on scroll-down (but never while a dialog is open)
      if (!document.body.classList.contains("is-locked")) {
        header.classList.toggle("is-hidden", y > 420 && y > lastY);
      }
    }
    if (toTop) toTop.classList.toggle("is-show", y > 700);
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toTop) toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ------------------------------------------------------------------
     FLOATING DASHBOARD — native modal provides focus trapping and Escape
  ------------------------------------------------------------------ */
  const dashboard = $("#dashboard");
  const dashboardToggle = $("#dashboardToggle");
  const dashboardClose = $("#dashboardClose");

  function closeDashboard() {
    if (dashboard && dashboard.open) dashboard.close();
  }
  if (dashboard && dashboardToggle) {
    dashboardToggle.addEventListener("click", () => {
      if (dashboard.open) { closeDashboard(); return; }
      dashboard.showModal();
      dashboardToggle.setAttribute("aria-expanded", "true");
      dashboardToggle.setAttribute("aria-label", "Close dashboard");
      document.body.classList.add("is-locked");
    });
    // Also runs when the browser closes the dialog with Escape.
    dashboard.addEventListener("close", () => {
      dashboardToggle.setAttribute("aria-expanded", "false");
      dashboardToggle.setAttribute("aria-label", "Open dashboard");
      if (!$("#lightbox.is-open")) document.body.classList.remove("is-locked");
    });
    dashboard.addEventListener("click", e => {
      if (e.target !== dashboard) return;
      const rect = dashboard.getBoundingClientRect();
      const outside = e.clientX < rect.left || e.clientX >= rect.right || e.clientY < rect.top || e.clientY >= rect.bottom;
      if (outside) closeDashboard();
    });
  }
  if (dashboardClose) dashboardClose.addEventListener("click", closeDashboard);
  $$(".nav__link").forEach(a => a.addEventListener("click", closeDashboard));

  /* ------------------------------------------------------------------
     SMOOTH ANCHOR SCROLL (offset for fixed header)
  ------------------------------------------------------------------ */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener("click", e => {
      const id = a.getAttribute("href");
      if (!id || id === "#" || id.length < 2) return;
      const target = document.getElementById(id.slice(1));
      if (!target) return;
      e.preventDefault();
      const offset = (header ? header.querySelector(".navbar").offsetHeight : 70) + 12;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
      history.replaceState(null, "", id);
    });
  });

  /* ------------------------------------------------------------------
     SCROLLSPY
  ------------------------------------------------------------------ */
  const navLinks = $$(".nav__link");
  const sections = navLinks
    .map(l => document.getElementById(l.getAttribute("href").slice(1)))
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        navLinks.forEach(l => {
          const active = l.getAttribute("href") === "#" + en.target.id;
          l.classList.toggle("is-active", active);
          if (active) l.setAttribute("aria-current", "location");
          else l.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    sections.forEach(s => spy.observe(s));
  }

  /* ------------------------------------------------------------------
     REVEAL ON SCROLL
  ------------------------------------------------------------------ */
  const revealables = () => $$(".reveal:not(.is-in)");
  let revealObserver = null;
  if ("IntersectionObserver" in window) {
    revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add("is-in"); obs.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
    revealables().forEach(el => revealObserver.observe(el));
  } else {
    revealables().forEach(el => el.classList.add("is-in"));
  }
  const observeReveal = el => revealObserver ? revealObserver.observe(el) : el.classList.add("is-in");

  /* ------------------------------------------------------------------
     COUNTERS
  ------------------------------------------------------------------ */
  function runCounter(el) {
    const target = parseFloat(el.dataset.count) || 0;
    const suffix = el.dataset.suffix || "";
    const dur = 1900;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString("en-KE") + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ("IntersectionObserver" in window) {
    const co = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => { if (en.isIntersecting) { runCounter(en.target); obs.unobserve(en.target); } });
    }, { threshold: 0.5 });
    $$(".stat__num").forEach(el => co.observe(el));

    // review bars
    const bo = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("is-in"); obs.unobserve(en.target); } });
    }, { threshold: 0.4 });
    $$(".rev-bar").forEach(el => bo.observe(el));
  } else {
    $$(".stat__num").forEach(el => { el.textContent = el.dataset.count + (el.dataset.suffix || ""); });
    $$(".rev-bar").forEach(el => el.classList.add("is-in"));
  }

  /* ------------------------------------------------------------------
     COVERAGE TABS
  ------------------------------------------------------------------ */
  const REGIONS = {
    nairobi: ["Nairobi", "Karen", "Runda", "Kiambu", "Ruiru", "Thika", "Limuru", "Ongata Rongai", "Kitengela", "Athi River", "Ruaka", "Juja", "Machakos"],
    central: ["Nyeri", "Murang'a", "Kirinyaga", "Nyandarua", "Karatina", "Othaya", "Kerugoya", "Ol Kalou", "Kangema"],
    rift:    ["Nakuru", "Naivasha", "Gilgil", "Eldoret", "Kericho", "Bomet", "Narok", "Nandi", "Baringo", "Laikipia", "Nanyuki", "Kitale", "Elgeyo Marakwet", "West Pokot", "Kajiado"],
    eastern: ["Machakos", "Makueni", "Kitui", "Embu", "Meru", "Tharaka Nithi", "Isiolo", "Mwingi", "Wote", "Chuka"],
    coast:   ["Mombasa", "Kilifi", "Malindi", "Watamu", "Kwale", "Diani", "Lamu", "Taita Taveta", "Voi", "Tana River"],
    western: ["Kisumu", "Kakamega", "Bungoma", "Busia", "Vihiga", "Siaya", "Homa Bay", "Migori", "Kisii", "Nyamira", "Ahero"],
    north:   ["Garissa", "Wajir", "Mandera", "Marsabit", "Samburu", "Turkana", "Lodwar", "Moyale", "Maralal"]
  };
  const covPanel = $("#coveragePanel");
  function renderRegion(key) {
    if (!covPanel) return;
    const list = REGIONS[key] || [];
    covPanel.innerHTML = list.map((c, i) =>
      `<span class="cpin" style="animation-delay:${i * 32}ms"><svg class="ico" aria-hidden="true"><use href="#i-pin"></use></svg>${c}</span>`
    ).join("");
  }
  const regionTabs = $$(".ctab");
  function selectRegion(tab) {
    regionTabs.forEach(t => {
      const active = t === tab;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", String(active));
      t.tabIndex = active ? 0 : -1;
    });
    renderRegion(tab.dataset.region);
    if (covPanel) covPanel.setAttribute("aria-labelledby", tab.id);
  }
  regionTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectRegion(tab));
    tab.addEventListener("keydown", e => {
      let next;
      if (e.key === "ArrowRight") next = (index + 1) % regionTabs.length;
      else if (e.key === "ArrowLeft") next = (index - 1 + regionTabs.length) % regionTabs.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = regionTabs.length - 1;
      else return;
      e.preventDefault();
      selectRegion(regionTabs[next]);
      regionTabs[next].focus();
    });
  });
  renderRegion("nairobi");

  /* ------------------------------------------------------------------
     COUNTY DATALIST (quote form)
  ------------------------------------------------------------------ */
  const COUNTIES = ["Baringo","Bomet","Bungoma","Busia","Elgeyo Marakwet","Embu","Garissa","Homa Bay","Isiolo","Kajiado","Kakamega","Kericho","Kiambu","Kilifi","Kirinyaga","Kisii","Kisumu","Kitui","Kwale","Laikipia","Lamu","Machakos","Makueni","Mandera","Marsabit","Meru","Migori","Mombasa","Murang'a","Nairobi","Nakuru","Nandi","Narok","Nyamira","Nyandarua","Nyeri","Samburu","Siaya","Taita Taveta","Tana River","Tharaka Nithi","Trans Nzoia","Turkana","Uasin Gishu","Vihiga","Wajir","West Pokot"];
  const dl = $("#countyList");
  if (dl) dl.innerHTML = COUNTIES.map(c => `<option value="${c}"></option>`).join("");

  /* ------------------------------------------------------------------
     GALLERY
  ------------------------------------------------------------------ */
  const GALLERY = [
    { img: "assets/img/hero-rig.jpg",            cat: "drilling", tag: "Drilling", t: "Truck-mounted rotary rig on site", s: "Kajiado County • 190m borehole",  cls: "gitem--wide gitem--tall" },
    { img: "assets/img/service-testpumping.jpg", cat: "drilling", tag: "Water Strike", t: "First water — test pumping day",  s: "Makueni County • 240m",           cls: "gitem--wide" },
    { img: "assets/img/service-survey.jpg",      cat: "survey",   tag: "Survey",   t: "Geophysical resistivity survey",     s: "Nakuru County • VES profiling",   cls: "" },
    { img: "assets/img/service-drilling.jpg",    cat: "drilling", tag: "Drilling", t: "DTH hammer through basement rock",   s: "Kisii County • 155m",             cls: "" },
    { img: "assets/img/service-pump.jpg",        cat: "pump",     tag: "Pumps",    t: "Submersible pump installation",      s: "Kiambu County • Grundfos 4in",    cls: "gitem--tall" },
    { img: "assets/img/service-solar.jpg",       cat: "solar",    tag: "Solar",    t: "Solar-powered pumping array",        s: "Laikipia County • 3.2kW array",   cls: "gitem--wide" },
    { img: "assets/img/gallery-1.jpg",           cat: "pump",     tag: "Headworks",t: "Completed wellhead & control box",   s: "Murang'a County • Farm supply",   cls: "" },
    { img: "assets/img/gallery-2.jpg",           cat: "solar",    tag: "Community",t: "School water point & solar tank",    s: "Kakamega County • 600 pupils",    cls: "" },
    { img: "assets/img/about-team.jpg",          cat: "drilling", tag: "Our Team", t: "The Waterwall field crew",           s: "Countrywide operations",          cls: "" }
  ];
  const gal = $("#gallery");
  if (gal) {
    gal.innerHTML = GALLERY.map((g, i) => `
      <figure class="gitem ${g.cls}" data-cat="${g.cat}" data-i="${i}" tabindex="0" role="button" aria-label="View: ${g.t}" style="animation-delay:${i * 60}ms">
        <img src="${g.img}" alt="${g.t} — ${g.s}" loading="lazy">
        <figcaption class="gitem__ov">
          <span class="gitem__tag">${g.tag}</span>
          <h4>${g.t}</h4>
          <p>${g.s}</p>
        </figcaption>
      </figure>`).join("");
  }

  $$(".gal-filter .chip").forEach(chip => {
    chip.addEventListener("click", () => {
      $$(".gal-filter .chip").forEach(c => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      const f = chip.dataset.filter;
      $$(".gitem").forEach((item, i) => {
        const show = f === "all" || item.dataset.cat === f;
        item.classList.toggle("is-hidden", !show);
        if (show) { item.style.animation = "none"; void item.offsetWidth; item.style.animation = `fadeUp .45s var(--ease-out) ${i * 45}ms backwards`; }
      });
    });
  });

  /* ------------------------------------------------------------------
     LIGHTBOX
  ------------------------------------------------------------------ */
  const lb = $("#lightbox"), lbImg = $("#lbImg"), lbCap = $("#lbCap");
  let lbIndex = 0;
  const visibleItems = () => $$(".gitem:not(.is-hidden)");

  function openLb(el) {
    const items = visibleItems();
    lbIndex = items.indexOf(el);
    showLb();
    lb.hidden = false;
    lb.classList.add("is-open");
    document.body.classList.add("is-locked");
  }
  function showLb() {
    const items = visibleItems();
    if (!items.length) return;
    if (lbIndex < 0) lbIndex = items.length - 1;
    if (lbIndex >= items.length) lbIndex = 0;
    const g = GALLERY[parseInt(items[lbIndex].dataset.i, 10)];
    lbImg.src = g.img;
    lbImg.alt = g.t;
    lbCap.textContent = g.t + " — " + g.s;
  }
  function closeLb() {
    lb.hidden = true;
    lb.classList.remove("is-open");
    document.body.classList.remove("is-locked");
  }

  if (gal) {
    gal.addEventListener("click", e => { const it = e.target.closest(".gitem"); if (it) openLb(it); });
    gal.addEventListener("keydown", e => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const it = e.target.closest(".gitem");
      if (it) { e.preventDefault(); openLb(it); }
    });
  }
  const lbClose = $("#lbClose"), lbPrev = $("#lbPrev"), lbNext = $("#lbNext");
  if (lbClose) lbClose.addEventListener("click", closeLb);
  if (lbPrev) lbPrev.addEventListener("click", () => { lbIndex--; showLb(); });
  if (lbNext) lbNext.addEventListener("click", () => { lbIndex++; showLb(); });
  if (lb) lb.addEventListener("click", e => { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", e => {
    if (!lb || lb.hidden) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowLeft") { lbIndex--; showLb(); }
    if (e.key === "ArrowRight") { lbIndex++; showLb(); }
  });

  /* ------------------------------------------------------------------
     REVIEWS
  ------------------------------------------------------------------ */
  const AV_COLORS = [
    "linear-gradient(135deg,#0077b6,#48cae4)", "linear-gradient(135deg,#f6a821,#ffd166)",
    "linear-gradient(135deg,#1b4f7e,#0096c7)", "linear-gradient(135deg,#2a9d8f,#8ecae6)",
    "linear-gradient(135deg,#d98a06,#f6a821)", "linear-gradient(135deg,#123a63,#48cae4)"
  ];
  const initials = n => n.replace(/^(Dr\.|Rev\.|Mr\.|Mrs\.|Ms\.)\s*/i, "").split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const starRow = s => `<div class="stars" aria-label="${s} out of 5 stars">` +
    Array.from({ length: 5 }, (_, i) => `<svg class="ico" style="${i < s ? "" : "opacity:.22"}" aria-hidden="true"><use href="#i-star"></use></svg>`).join("") + `</div>`;

  const REVIEWS = window.WATERWALL_REVIEWS || [];
  const revGrid = $("#revGrid");
  const revMore = $("#revMore");
  const revLess = $("#revLess");
  const revCount = $("#revCount");
  const BATCH = 5;
  let shown = BATCH;
  let filter = "all";

  const filtered = () => filter === "all" ? REVIEWS : REVIEWS.filter(r => r.v === filter);

  function cardHTML(r, i, delayIndex) {
    return `
      <article class="rcard" style="animation-delay:${delayIndex * 55}ms">
        <div class="rcard__head">
          <span class="rcard__av" style="background:${AV_COLORS[i % AV_COLORS.length]}">${initials(r.n)}</span>
          <div class="rcard__who">
            <div class="rcard__name">${r.n}<svg class="ico rcard__ver" aria-hidden="true" title="Verified client"><use href="#i-badge"></use></svg></div>
            <div class="rcard__loc">${r.l}</div>
          </div>
        </div>
        ${starRow(r.s)}
        <p class="rcard__text" data-clamp="4">${r.t}</p>
        <div class="rcard__foot">
          <span class="rcard__svc">${r.v}</span>
          <span class="rcard__date">${r.d}</span>
        </div>
      </article>`;
  }

  // `append` = only add the newly revealed batch so existing cards don't re-animate
  function renderReviews(append) {
    if (!revGrid) return;
    const list = filtered();
    const slice = list.slice(0, shown);
    const from = append ? revGrid.children.length : 0;

    const html = slice.slice(from).map((r, k) => cardHTML(r, from + k, k)).join("");
    if (append) revGrid.insertAdjacentHTML("beforeend", html);
    else revGrid.innerHTML = html;

    if (revCount) revCount.textContent = `Showing ${slice.length} of ${list.length} review${list.length === 1 ? "" : "s"}`;
    if (revMore) revMore.style.display = slice.length >= list.length ? "none" : "";
    // "Show less" appears once the visitor has expanded past the first batch
    if (revLess) revLess.hidden = shown <= BATCH;
  }

  if (revMore) revMore.addEventListener("click", () => { shown += BATCH; renderReviews(true); setupClamps(); });
  if (revLess) revLess.addEventListener("click", () => {
    shown = BATCH;
    renderReviews();
    setupClamps();
    const y = ($("#reviews") || revGrid).getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top: y, behavior: "smooth" });
  });

  $$(".rev-filter .chip").forEach(chip => {
    chip.addEventListener("click", () => {
      $$(".rev-filter .chip").forEach(c => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      filter = chip.dataset.rev;
      shown = BATCH;
      renderReviews();
      setupClamps();
    });
  });

  // review counts per chip
  $$(".rev-filter .chip").forEach(chip => {
    const key = chip.dataset.rev;
    if (key === "all") return;
    const n = REVIEWS.filter(r => r.v === key).length;
    chip.insertAdjacentHTML("beforeend", ` <span>${n}</span>`);
  });
  renderReviews();

  /* ------------------------------------------------------------------
     TOAST
  ------------------------------------------------------------------ */
  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("is-show"), 4200);
  }

  /* ------------------------------------------------------------------
     VALIDATION HELPERS
  ------------------------------------------------------------------ */
  const KE_PHONE = /^(?:\+?254|0)?7\d{8}$|^(?:\+?254|0)?1\d{8}$/;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

  function setError(field, msg) {
    field.classList.add("has-error");
    const err = $("[data-err]", field);
    if (err) err.textContent = msg;
  }
  function clearError(field) {
    field.classList.remove("has-error");
    const err = $("[data-err]", field);
    if (err) err.textContent = "";
  }
  function validateInput(input) {
    const field = input.closest(".field");
    if (!field) return true;
    const v = (input.value || "").trim();

    if (input.hasAttribute("required") && !v) { setError(field, "This field is required"); return false; }
    if (input.type === "tel" && v && !KE_PHONE.test(v.replace(/[\s-]/g, ""))) {
      setError(field, "Enter a valid Kenyan number, e.g. 0705 901 445"); return false;
    }
    if (input.type === "email" && v && !EMAIL_RE.test(v)) { setError(field, "Enter a valid email address"); return false; }
    if (input.id === "qf-name" || input.id === "q-name") {
      if (v && v.length < 3) { setError(field, "Please enter your full name"); return false; }
    }
    clearError(field);
    return true;
  }

  // live clearing
  $$(".field input, .field select, .field textarea").forEach(inp => {
    inp.addEventListener("input", () => { const f = inp.closest(".field"); if (f && f.classList.contains("has-error")) validateInput(inp); });
    inp.addEventListener("blur", () => { if ((inp.value || "").trim()) validateInput(inp); });
  });

  function waLink(text) { return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`; }

  /* ------------------------------------------------------------------
     HERO QUICK FORM
  ------------------------------------------------------------------ */
  const quickForm = $("#quickForm");
  if (quickForm) {
    quickForm.addEventListener("submit", e => {
      e.preventDefault();
      const inputs = $$("input, select", quickForm);
      let ok = true;
      inputs.forEach(i => { if (!validateInput(i)) ok = false; });
      if (!ok) { toast("Please fix the highlighted fields."); return; }

      const d = Object.fromEntries(new FormData(quickForm).entries());
      const msg =
        `Hello Waterwall Borehole Drilling, I would like a callback.\n\n` +
        `Name: ${d.name}\nPhone: ${d.phone}\nService: ${d.service}\nLocation: ${d.location}`;

      const status = $("#quickStatus");
      if (status) status.textContent = "✔ Request sent — opening WhatsApp so we can reply instantly…";
      toast("Thank you " + String(d.name).split(" ")[0] + "! We'll call you shortly.");
      window.open(waLink(msg), "_blank", "noopener");
      quickForm.reset();
      setTimeout(() => { if (status) status.textContent = ""; }, 9000);
    });
  }

  /* ------------------------------------------------------------------
     MULTI-STEP QUOTE FORM
  ------------------------------------------------------------------ */
  const msForm = $("#quoteForm");
  if (msForm) {
    const steps = $$(".step", msForm);
    const bar = $("#msBar");
    const labels = $$(".msform__steps span", msForm);
    let current = 1;

    function paint(shouldScroll = false) {
      steps.forEach(s => s.classList.toggle("is-active", +s.dataset.step === current));
      if (bar) bar.style.width = (current / steps.length) * 100 + "%";
      labels.forEach(l => {
        const n = +l.dataset.s;
        l.classList.toggle("is-active", n === current);
        l.classList.toggle("is-done", n < current);
      });
      if (shouldScroll) {
        const y = msForm.getBoundingClientRect().top + window.scrollY - 110;
        if (window.scrollY > y + 220 || window.scrollY < y - 220) window.scrollTo({ top: y, behavior: "smooth" });
      }
    }

    function validateStep(n) {
      const step = steps.find(s => +s.dataset.step === n);
      let ok = true;

      if (n === 1) {
        const picked = $('input[name="service"]:checked', step);
        const err = $(".field__err", step);
        if (!picked) {
          ok = false;
          if (err) { err.textContent = "Please choose a service"; err.classList.add("is-show"); }
        } else if (err) { err.textContent = ""; err.classList.remove("is-show"); }
      }
      $$("input[required], select[required], textarea[required]", step).forEach(i => {
        if (i.type === "radio") return;
        if (!validateInput(i)) ok = false;
      });
      return ok;
    }

    $$("[data-next]", msForm).forEach(b => b.addEventListener("click", () => {
      if (!validateStep(current)) { toast("Please complete this step first."); return; }
      if (current < steps.length) { current++; paint(true); }
    }));
    $$("[data-prev]", msForm).forEach(b => b.addEventListener("click", () => {
      if (current > 1) { current--; paint(true); }
    }));

    msForm.addEventListener("submit", e => {
      e.preventDefault();
      if (!validateStep(3)) { toast("Please complete the highlighted fields."); return; }

      const d = Object.fromEntries(new FormData(msForm).entries());
      const first = String(d.name || "").split(" ")[0];

      const msg =
        `Hello Waterwall Borehole Drilling, I would like a free quote.\n\n` +
        `Service: ${d.service}\n` +
        `Purpose: ${d.purpose || "-"}\n` +
        `County: ${d.county}\n` +
        `Area: ${d.area}\n` +
        `Timeline: ${d.timeline || "-"}\n` +
        `Power on site: ${d.power || "-"}\n\n` +
        `Name: ${d.name}\nPhone: ${d.phone}\n` +
        (d.email ? `Email: ${d.email}\n` : "") +
        (d.message ? `\nNotes: ${d.message}` : "");

      steps.forEach(s => s.classList.remove("is-active"));
      const done = $('[data-step="done"]', msForm);
      const doneMsg = $("#doneMsg");
      const waBtn = $("#waSend");
      if (doneMsg) doneMsg.textContent = `Thank you ${first}! Our team has your details for a ${d.service.toLowerCase()} in ${d.area}, ${d.county}. We'll call ${d.phone} shortly. For an instant reply, send the same details on WhatsApp.`;
      if (waBtn) waBtn.href = waLink(msg);
      if (done) done.hidden = false;
      if (bar) bar.style.width = "100%";
      labels.forEach(l => { l.classList.remove("is-active"); l.classList.add("is-done"); });

      toast("Request received — we'll be in touch shortly!");
      const y = msForm.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top: y, behavior: "smooth" });
    });

    paint(false);
  }

  /* ------------------------------------------------------------------
     PREFILL QUOTE SERVICE FROM SERVICE-CARD LINKS
  ------------------------------------------------------------------ */
  const SERVICE_HINTS = [
    { match: "survey",   value: "Hydrogeological Survey" },
    { match: "drilling", value: "Borehole Drilling" },
    { match: "pricing",  value: "Pump Installation" },
    { match: "test",     value: "Test Pumping" },
    { match: "solar",    value: "Solar Installation" },
    { match: "engineer", value: "Repair / Maintenance" }
  ];
  $$('a.link-arrow[href="#quote"], .services__extra a[href="#quote"]').forEach(a => {
    a.addEventListener("click", () => {
      const txt = a.textContent.toLowerCase();
      const hit = SERVICE_HINTS.find(h => txt.includes(h.match));
      if (!hit) return;
      const radio = $(`input[name="service"][value="${hit.value}"]`);
      if (radio) { radio.checked = true; radio.dispatchEvent(new Event("change", { bubbles: true })); }
    });
  });

  /* ------------------------------------------------------------------
     FAQ — single-open accordion
  ------------------------------------------------------------------ */
  const accs = $$(".acc");
  accs.forEach(a => a.addEventListener("toggle", () => {
    if (a.open) accs.forEach(o => { if (o !== a) o.open = false; });
  }));

  /* ------------------------------------------------------------------
     FAQ — show only 3 on mobile, with view more / view less
  ------------------------------------------------------------------ */
  const faqToggle = $("#faqToggle");
  const FAQ_VISIBLE = 3;
  const mqMobile = window.matchMedia("(max-width:820px)");
  let faqExpanded = false;

  function applyFaqCollapse() {
    if (!faqToggle) return;
    if (mqMobile.matches) {
      faqToggle.hidden = accs.length <= FAQ_VISIBLE;
      accs.forEach((a, i) => {
        const hide = !faqExpanded && i >= FAQ_VISIBLE;
        a.classList.toggle("acc--hidden", hide);
        if (hide) a.open = false;
      });
      faqToggle.classList.toggle("is-open", faqExpanded);
      faqToggle.firstChild.textContent = faqExpanded ? "Show fewer questions " : "Show all questions ";
    } else {
      faqToggle.hidden = true;
      accs.forEach(a => a.classList.remove("acc--hidden"));
    }
  }
  if (faqToggle) {
    faqToggle.addEventListener("click", () => {
      faqExpanded = !faqExpanded;
      applyFaqCollapse();
      if (!faqExpanded) {
        const y = ($("#faq") || faqToggle).getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    });
    applyFaqCollapse();
    (mqMobile.addEventListener ? mqMobile.addEventListener("change", applyFaqCollapse) : mqMobile.addListener(applyFaqCollapse));
  }

  /* ------------------------------------------------------------------
     READ MORE / VIEW LESS  — long paragraphs on mobile
  ------------------------------------------------------------------ */
  function setupClamps() {
    const targets = $$("[data-clamp]");
    targets.forEach(el => {
      if (el.dataset.clampReady) return;
      el.dataset.clampReady = "1";
      el.style.setProperty("--clamp", el.dataset.clamp || 4);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "readmore-btn";
      btn.textContent = "Read more";
      el.classList.add("js-clamp");
      el.insertAdjacentElement("afterend", btn);

      let open = false;
      const sync = () => {
        // Only clamp on mobile widths; only if the text actually overflows
        if (!mqMobile.matches) { el.classList.remove("is-clamped"); btn.style.display = "none"; return; }
        btn.style.display = "";
        if (!open) {
          el.classList.add("is-clamped");
          // hide the button if content fits anyway
          requestAnimationFrame(() => {
            const overflow = el.scrollHeight - el.clientHeight > 4;
            btn.style.display = overflow ? "inline-flex" : "none";
          });
        }
      };
      btn.addEventListener("click", () => {
        open = !open;
        el.classList.toggle("is-clamped", !open);
        btn.classList.toggle("is-open", open);
        btn.textContent = open ? "View less" : "Read more";
        if (!open) {
          const y = el.getBoundingClientRect().top + window.scrollY - 100;
          if (window.scrollY > y) window.scrollTo({ top: y, behavior: "smooth" });
        }
      });
      el.__clampSync = () => { if (!open) sync(); };
      sync();
    });
  }
  setupClamps();
  (mqMobile.addEventListener ? mqMobile.addEventListener("change", () => $$("[data-clamp]").forEach(el => el.__clampSync && el.__clampSync())) : mqMobile.addListener(() => $$("[data-clamp]").forEach(el => el.__clampSync && el.__clampSync())));

  /* ------------------------------------------------------------------
     RE-OBSERVE dynamically added reveals (safety)
  ------------------------------------------------------------------ */
  revealables().forEach(observeReveal);

})();
