// RG Civil Engineering & Surveying Ltd
// Confirmed business details for Ryan Johnston — Engineer / Director

const siteConfig = {
  contactName: "Ryan Johnston",
  contactRole: "Engineer / Director",
  phone: "07956 996 424",
  phoneInternational: "+447956996424",
  email: "ryan@rgcivilengineering.co.uk"
};

// Sync locked contact details to all matching DOM nodes
document.querySelectorAll("[data-config]").forEach((element) => {
  const key = element.dataset.config;
  if (siteConfig[key]) {
    element.textContent = siteConfig[key];
  }
});

document.querySelectorAll("[data-contact-link]").forEach((element) => {
  const isPhone = element.dataset.contactLink === "phone";
  element.href = isPhone ? `tel:${siteConfig.phoneInternational}` : `mailto:${siteConfig.email}`;
});

const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ==========================================================================
// Navigation & Mobile Drawer
// ==========================================================================
const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");

const setNavigation = (open) => {
  if (!nav || !navToggle) return;
  nav.classList.toggle("is-open", open);
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
};

navToggle?.addEventListener("click", () => {
  setNavigation(!nav.classList.contains("is-open"));
});

nav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setNavigation(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && nav?.classList.contains("is-open")) {
    setNavigation(false);
    navToggle?.focus();
  }
});

// ScrollSpy — Active Nav Item Tracking
const navLinks = document.querySelectorAll(".site-nav .nav-link");
const sections = document.querySelectorAll("main section[id]");

if ("IntersectionObserver" in window && sections.length > 0) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute("id");
        navLinks.forEach((link) => {
          const href = link.getAttribute("href");
          if (href === `#${id}`) {
            link.classList.add("is-active");
          } else {
            link.classList.remove("is-active");
          }
        });
      }
    });
  }, { threshold: 0.3, rootMargin: "-80px 0px -40% 0px" });

  sections.forEach((sec) => observer.observe(sec));
}

// ==========================================================================
// Scroll Reveal Animations
// ==========================================================================
const revealItems = document.querySelectorAll("[data-reveal]");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

// ==========================================================================
// Enquiry: one question at a time (home page, #contact)
// The steps are written in index.html; this shows one at a time, remembers the
// answers on this device, and on the last step writes an email to Ryan that
// opens in the visitor's own email app. Nothing is sent or stored by the site.
// To change the options on the "Which work" step, edit ENQ_PHASES below.
// ==========================================================================
const ENQ_PHASES = {
  "01": {
    name: "Land & Utility Surveying",
    work: ["Topographical surveys", "Land & boundary surveys", "Overhead cable height surveys", "Drainage & utility surveying", "GPR surveys"]
  },
  "02": {
    name: "Site Engineering & Earthworks",
    work: ["Site engineering & setting out", "Foundations, piling & concrete", "Structural steelwork & holding-down bolts", "Earthworks & machine control", "Quality assurance & monitoring"]
  },
  "03": {
    name: "Highways & Infrastructure",
    work: ["Highways & infrastructure engineering", "Road alignments & junctions", "Highway drainage, embankments & QA"]
  },
  "04": {
    name: "Bridges & Structural Engineering",
    work: ["Bridge & structural engineering", "Bridge abutments, piers, bearings & decks", "Dimensional checks & deformation monitoring"]
  },
  "05": {
    name: "Survey Control & Construction Verification",
    work: ["Survey control networks & levelling", "Construction QA & as-built surveys", "Anchor & bolt pull-out testing", "Structural, settlement & rail monitoring"]
  },
  "06": {
    name: "CAD & Digital Survey Services",
    work: ["CAD & machine control models", "2D / 3D AutoCAD & DTMs", "Sections, volumes & digital survey reports"]
  }
};
const ENQ_OTHER = "Something else";

const initEnquiry = () => {
  const root = document.querySelector("[data-enq]");
  if (!root) return;

  const form = root.querySelector(".enq-form");
  const steps = {};
  root.querySelectorAll(".enq-step").forEach((el) => { steps[el.dataset.step] = el; });
  const countEl = root.querySelector("[data-enq-count]");
  const railEl = root.querySelector("[data-enq-rail]");
  const backBtn = root.querySelector("[data-enq-back]");
  const nextBtn = root.querySelector("[data-enq-next]");
  const stepError = root.querySelector("[data-enq-step-error]");
  const restartBtn = root.querySelector("[data-enq-restart]");
  const workBox = root.querySelector("[data-enq-work]");
  const phaseNameEl = root.querySelector("[data-enq-phase-name]");
  const summaryEl = root.querySelector("[data-enq-summary]");
  const mailLink = root.querySelector("[data-enq-mail]");
  const copyBtn = root.querySelector("[data-enq-copy]");
  const previewEl = root.querySelector("[data-enq-preview]");
  const sendStatus = root.querySelector("[data-enq-send-status]");
  const needle = root.querySelector("[data-enq-needle]");
  const compass = root.querySelector(".enq-compass");

  const STORE = "rg_enquiry_v4";
  const TEXT_FIELDS = ["town", "notes", "name", "contact", "company"];
  const STEP_LABELS = {
    need: "what you need", work: "which work", where: "where the site is", when: "when you need it",
    notes: "about the job", you: "your details", review: "check and send"
  };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const blank = () => ({ need: "", work: [], area: "", town: "", when: "", notes: "", name: "", contact: "", company: "" });
  let state = blank();
  let current = "need";
  let returnToReview = false;
  let advanceTimer = 0;

  const stepIds = () => (state.need === "unsure"
    ? ["need", "where", "when", "notes", "you", "review"]
    : ["need", "work", "where", "when", "notes", "you", "review"]);

  const hasAnswers = () => Boolean(state.need || state.area || state.when || TEXT_FIELDS.some((key) => state[key]));

  // ---- remember answers on this device -----------------------------------
  const save = () => {
    try { localStorage.setItem(STORE, JSON.stringify({ state, current })); } catch {}
    if (restartBtn) restartBtn.hidden = !hasAnswers();
  };

  const restore = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || "null");
      if (!saved || typeof saved.state !== "object" || !saved.state) return "";
      const fresh = blank();
      Object.keys(fresh).forEach((key) => {
        const value = saved.state[key];
        if (key === "work") {
          if (Array.isArray(value)) fresh.work = value.filter((item) => typeof item === "string").slice(0, 12);
        } else if (typeof value === "string") {
          fresh[key] = value.slice(0, 2000);
        }
      });
      if (fresh.need && fresh.need !== "unsure" && !ENQ_PHASES[fresh.need]) { fresh.need = ""; fresh.work = []; }
      state = fresh;
      return typeof saved.current === "string" ? saved.current : "";
    } catch {
      return "";
    }
  };

  // ---- checks --------------------------------------------------------------
  const contactValid = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || /^\+?[\d\s().-]{9,16}$/.test(value);

  const validate = (id) => {
    if (id === "need" && !state.need) return "Pick one to carry on.";
    if (id === "work" && !state.work.length) return "Pick at least one, or choose “Something else”.";
    if (id === "when" && !state.when) return "Pick one to carry on.";
    if (id === "you") {
      if (!state.name.trim()) return "name";
      if (!contactValid(state.contact.trim())) return "contact";
    }
    return "";
  };

  const setFieldError = (name, message) => {
    const input = form.elements[name];
    const error = root.querySelector(`[data-enq-error="${name}"]`);
    if (input) input.setAttribute("aria-invalid", String(Boolean(message)));
    if (error) { error.textContent = message; error.hidden = !message; }
  };

  const showStepError = (message) => {
    if (!stepError) return;
    stepError.textContent = message;
    stepError.hidden = !message;
  };

  // ---- drawing the current state -------------------------------------------
  const paintPressed = (selector, attr, isOn) => {
    root.querySelectorAll(selector).forEach((tile) => {
      tile.setAttribute("aria-pressed", String(isOn(tile.dataset[attr])));
    });
  };

  const paint = () => {
    paintPressed("[data-enq-need]", "enqNeed", (value) => value === state.need);
    paintPressed("[data-enq-area]", "enqArea", (value) => value === state.area);
    paintPressed("[data-enq-when]", "enqWhen", (value) => value === state.when);
    paintPressed("[data-enq-work-option]", "enqWorkOption", (value) => state.work.includes(value));
    aimAtChoice();
  };

  const renderWork = () => {
    if (!workBox) return;
    const phase = ENQ_PHASES[state.need];
    workBox.textContent = "";
    if (!phase) return;
    if (phaseNameEl) phaseNameEl.textContent = `These are part of ${phase.name}.`;
    [...phase.work, ENQ_OTHER].forEach((label) => {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "enq-tile";
      tile.dataset.enqWorkOption = label;
      tile.setAttribute("aria-pressed", String(state.work.includes(label)));
      const title = document.createElement("span");
      title.className = "enq-tile-title";
      title.textContent = label;
      const tick = document.createElement("span");
      tick.className = "enq-tick";
      tick.setAttribute("aria-hidden", "true");
      tile.append(title, tick);
      workBox.append(tile);
    });
  };

  const needLabel = () => (state.need === "unsure" ? "Not sure yet" : (ENQ_PHASES[state.need]?.name || ""));
  const siteLabel = () => [state.area, state.town.trim()].filter(Boolean).join(", ");

  const emailParts = () => {
    const name = state.name.trim();
    const lines = [
      "Hello Ryan,",
      "",
      "I'd like to talk to you about a job.",
      "",
      `What I need: ${needLabel()}`,
      state.need !== "unsure" && state.work.length ? `Work: ${state.work.join("; ")}` : null,
      `Site: ${siteLabel() || "Not given"}`,
      `Timing: ${state.when}`,
      "",
      `Name: ${name}`,
      state.company.trim() ? `Company: ${state.company.trim()}` : null,
      `Contact: ${state.contact.trim()}`,
      "",
      "About the job:",
      state.notes.trim() || "(Nothing added)",
      "",
      "Sent using the enquiry form on the RG Civil Engineering & Surveying website (preview)."
    ].filter((line) => line !== null);
    return {
      subject: `Site enquiry: ${needLabel()}${name ? ` (${name})` : ""}`,
      body: lines.join("\n")
    };
  };

  const fullEmailText = () => {
    const { subject, body } = emailParts();
    return `To: ${siteConfig.email}\nSubject: ${subject}\n\n${body}`;
  };

  const renderReview = () => {
    if (!summaryEl) return;
    summaryEl.textContent = "";
    const rows = [
      ["need", "What you need", needLabel()],
      state.need !== "unsure" ? ["work", "Work", state.work.join(", ")] : null,
      ["where", "Site", siteLabel() || "Not given"],
      ["when", "Timing", state.when],
      ["notes", "About the job", state.notes.trim() || "Nothing added"],
      ["you", "Your details", [state.name.trim(), state.company.trim(), state.contact.trim()].filter(Boolean).join(", ")]
    ].filter(Boolean);

    rows.forEach(([id, label, value]) => {
      const row = document.createElement("div");
      row.className = "enq-row";
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      dd.className = "enq-row-value";
      dd.textContent = value;
      const action = document.createElement("dd");
      action.className = "enq-row-action";
      const change = document.createElement("button");
      change.type = "button";
      change.className = "enq-change";
      change.dataset.enqEdit = id;
      change.textContent = "Change";
      change.setAttribute("aria-label", `Change ${STEP_LABELS[id]}`);
      action.append(change);
      row.append(dt, dd, action);
      summaryEl.append(row);
    });

    const { subject, body } = emailParts();
    if (mailLink) mailLink.href = `mailto:${siteConfig.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    if (previewEl) previewEl.textContent = fullEmailText();
    if (sendStatus) sendStatus.textContent = "";
  };

  const renderRail = () => {
    if (!railEl) return;
    const ids = stepIds();
    const at = ids.indexOf(current);
    railEl.textContent = "";
    ids.forEach((id, index) => {
      const li = document.createElement("li");
      let seg;
      if (index < at) {
        seg = document.createElement("button");
        seg.type = "button";
        seg.dataset.enqJump = id;
        seg.setAttribute("aria-label", `Go back to step ${index + 1}: ${STEP_LABELS[id]}`);
        seg.className = "enq-seg is-done";
      } else {
        seg = document.createElement("span");
        seg.className = index === at ? "enq-seg is-current" : "enq-seg";
        if (index === at) seg.setAttribute("aria-current", "step");
      }
      li.append(seg);
      railEl.append(li);
    });
  };

  const updateNextLabel = () => {
    if (!nextBtn) return;
    nextBtn.hidden = current === "review";
    let label = "Continue";
    if (current === "you") label = "Check and send";
    else if (returnToReview) label = "Back to the summary";
    else if (current === "where" && !state.area && !state.town.trim()) label = "Skip this";
    else if (current === "notes" && !state.notes.trim()) label = "Skip this";
    nextBtn.textContent = label;
  };

  // ---- moving between steps --------------------------------------------------
  const show = (id, options = {}) => {
    const { focus = true, direction = 1 } = options;
    const ids = stepIds();
    if (!ids.includes(id)) id = ids[0];
    current = id;
    window.clearTimeout(advanceTimer);

    if (id === "work") renderWork();
    if (id === "review") { returnToReview = false; renderReview(); }

    Object.entries(steps).forEach(([stepId, el]) => {
      el.hidden = stepId !== id;
      el.classList.remove("is-in");
    });
    const active = steps[id];
    if (active && focus && !reducedMotion) {
      active.style.setProperty("--enq-from", direction < 0 ? "-18px" : "18px");
      void active.offsetWidth;
      active.classList.add("is-in");
    }

    const at = ids.indexOf(id);
    if (countEl) countEl.textContent = id === "review" ? "Check and send" : `Question ${at + 1} of ${ids.length - 1}`;
    if (backBtn) backBtn.hidden = at === 0 || id === "review"; // the last step has its own Back beside the send buttons
    showStepError("");
    renderRail();
    updateNextLabel();
    paint();
    save();

    if (focus && active) {
      active.querySelector(".enq-q")?.focus({ preventScroll: true });
      const top = root.getBoundingClientRect().top;
      if (top < 80 || top > window.innerHeight * 0.55) {
        window.scrollTo({ top: Math.max(0, top + window.scrollY - 110) });
      }
    }
  };

  const next = () => {
    const problem = validate(current);
    if (current === "you") {
      setFieldError("name", problem === "name" ? "Enter your name." : "");
      setFieldError("contact", problem === "contact" ? "Enter a phone number or an email address." : "");
      if (problem) { form.elements[problem]?.focus(); return; }
    } else if (problem) {
      showStepError(problem);
      return;
    }
    const ids = stepIds();
    let target = ids[ids.indexOf(current) + 1] || "review";
    const workStillNeeded = state.need !== "unsure" && !state.work.length;
    if (returnToReview && !workStillNeeded) target = "review";
    show(target, { direction: 1 });
  };

  const back = () => {
    const ids = stepIds();
    const at = ids.indexOf(current);
    if (at <= 0) return;
    returnToReview = false;
    show(ids[at - 1], { direction: -1 });
  };

  const advanceSoon = () => {
    window.clearTimeout(advanceTimer);
    advanceTimer = window.setTimeout(next, reducedMotion ? 120 : 360);
  };

  // ---- compass needle on the first step -------------------------------------
  let needleAngle = 0;
  const aim = (bearing) => {
    if (!needle) return;
    const delta = ((((bearing - needleAngle) % 360) + 540) % 360) - 180;
    needleAngle += delta;
    needle.style.transform = `rotate(${needleAngle}deg)`;
  };
  function aimAtChoice() {
    const chosen = root.querySelector('.enq-plate[aria-pressed="true"]');
    aim(chosen ? Number(chosen.dataset.bearing) : 0);
  }
  root.querySelectorAll(".enq-plate").forEach((plate) => {
    const point = () => aim(Number(plate.dataset.bearing));
    plate.addEventListener("pointerenter", point);
    plate.addEventListener("focus", point);
    plate.addEventListener("blur", aimAtChoice);
  });
  compass?.addEventListener("pointerleave", aimAtChoice);

  // ---- choosing options -------------------------------------------------------
  root.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const needTile = target.closest("[data-enq-need]");
    if (needTile) {
      const value = needTile.dataset.enqNeed;
      if (state.need !== value) { state.need = value; state.work = []; }
      showStepError("");
      paint();
      renderRail();
      save();
      advanceSoon();
      return;
    }

    const workTile = target.closest("[data-enq-work-option]");
    if (workTile) {
      const value = workTile.dataset.enqWorkOption;
      state.work = state.work.includes(value) ? state.work.filter((item) => item !== value) : [...state.work, value];
      showStepError("");
      paint();
      save();
      return;
    }

    const areaTile = target.closest("[data-enq-area]");
    if (areaTile) {
      const value = areaTile.dataset.enqArea;
      state.area = state.area === value ? "" : value;
      paint();
      updateNextLabel();
      save();
      return;
    }

    const whenTile = target.closest("[data-enq-when]");
    if (whenTile) {
      state.when = whenTile.dataset.enqWhen;
      showStepError("");
      paint();
      save();
      advanceSoon();
      return;
    }

    const jump = target.closest("[data-enq-jump]");
    if (jump) { returnToReview = false; show(jump.dataset.enqJump, { direction: -1 }); return; }

    const edit = target.closest("[data-enq-edit]");
    if (edit) { returnToReview = true; show(edit.dataset.enqEdit, { direction: -1 }); return; }
  });

  nextBtn?.addEventListener("click", next);
  backBtn?.addEventListener("click", back);
  root.querySelector("[data-enq-back-inline]")?.addEventListener("click", back);

  // ---- typing ---------------------------------------------------------------
  form.addEventListener("input", (event) => {
    const field = event.target;
    if (!field.name || !TEXT_FIELDS.includes(field.name)) return;
    state[field.name] = field.value;
    if (field.getAttribute("aria-invalid") === "true") setFieldError(field.name, "");
    updateNextLabel();
    save();
  });

  form.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.target.tagName !== "INPUT") return;
    event.preventDefault();
    next();
  });

  form.addEventListener("submit", (event) => event.preventDefault());

  // ---- sending --------------------------------------------------------------
  mailLink?.addEventListener("click", () => {
    if (sendStatus) {
      sendStatus.textContent = `Your email app should now be open with the enquiry filled in. Press send there. If nothing opened, copy the text instead and email it to ${siteConfig.email}.`;
    }
  });

  copyBtn?.addEventListener("click", async () => {
    const text = fullEmailText();
    try {
      await navigator.clipboard.writeText(text);
      if (sendStatus) sendStatus.textContent = `Copied. Paste it into an email to ${siteConfig.email}.`;
    } catch {
      const details = previewEl?.closest("details");
      if (details) details.open = true;
      if (previewEl) {
        const range = document.createRange();
        range.selectNodeContents(previewEl);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      if (sendStatus) sendStatus.textContent = "Could not copy automatically. The text is selected below: press Ctrl+C (or Cmd+C on a Mac) to copy it.";
    }
  });

  // ---- start again (asks once before clearing) ------------------------------
  let restartArmed = 0;
  restartBtn?.addEventListener("click", () => {
    if (!restartArmed) {
      restartBtn.textContent = "Clear all answers? Press again to confirm";
      restartArmed = window.setTimeout(() => {
        restartArmed = 0;
        restartBtn.textContent = "Start again";
      }, 5000);
      return;
    }
    window.clearTimeout(restartArmed);
    restartArmed = 0;
    restartBtn.textContent = "Start again";
    state = blank();
    returnToReview = false;
    form.reset();
    ["name", "contact"].forEach((name) => setFieldError(name, ""));
    try { localStorage.removeItem(STORE); } catch {}
    show("need", { direction: -1 });
  });

  // ---- arriving from a service page or a "Enquire" link ----------------------
  const applyService = (serviceName) => {
    const wanted = String(serviceName || "").trim().toLowerCase();
    if (!wanted) return false;
    for (const [phaseId, phase] of Object.entries(ENQ_PHASES)) {
      const match = phase.work.find((label) => label.toLowerCase() === wanted);
      if (!match) continue;
      if (state.need !== phaseId) { state.need = phaseId; state.work = []; }
      if (!state.work.includes(match)) state.work = [...state.work, match];
      return true;
    }
    return false;
  };

  document.querySelectorAll("[data-service]").forEach((link) => {
    link.addEventListener("click", () => {
      if (applyService(link.dataset.service)) show("work", { focus: false });
    });
  });

  // ---- first paint ----------------------------------------------------------
  const savedStep = restore();
  TEXT_FIELDS.forEach((name) => { if (form.elements[name]) form.elements[name].value = state[name]; });

  let startAt = "need";
  if (hasAnswers()) {
    // Resume where they left off, but never past a step that still needs an answer
    for (const id of stepIds()) {
      startAt = id;
      if (id === savedStep || validate(id)) break;
    }
  }
  try {
    const requested = new URLSearchParams(window.location.search).get("service");
    if (requested && applyService(requested.slice(0, 120))) startAt = "work";
  } catch {}

  root.classList.add("is-ready");
  show(startAt, { focus: false });
};

// ==========================================================================
// Fieldwork Gallery Lightbox Carousel
// ==========================================================================
const lightbox = document.querySelector(".lightbox");
const lightboxImg = document.querySelector(".lightbox-img");
const lightboxTitle = document.querySelector(".lightbox-title");
const lightboxCounter = document.querySelector(".lightbox-counter");
const lightboxClose = document.querySelector(".lightbox-close");
const lightboxPrev = document.querySelector(".lightbox-prev");
const lightboxNext = document.querySelector(".lightbox-next");
const galleryTiles = Array.from(document.querySelectorAll(".gallery-tile, .site-photo-btn"));

let currentTileIndex = 0;
let lastFocusedTile = null;

const galleryItems = galleryTiles.map((tile) => ({
  image: tile.dataset.image || "assets/river-works-survey.jpg",
  title: tile.dataset.project || "Field work"
}));

const updateLightbox = (index) => {
  if (!galleryItems[index]) return;
  currentTileIndex = index;
  const item = galleryItems[index];

  if (lightboxImg) {
    lightboxImg.src = item.image;
    lightboxImg.alt = item.title;
  }
  if (lightboxTitle) lightboxTitle.textContent = item.title;
  if (lightboxCounter) lightboxCounter.textContent = `[0${index + 1} / 0${galleryItems.length}]`;
};

const openLightbox = (index) => {
  if (!lightbox) return;
  lastFocusedTile = document.activeElement;
  updateLightbox(index);
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
  lightboxClose?.focus();
};

const closeLightbox = () => {
  if (!lightbox || lightbox.hidden) return;
  lightbox.hidden = true;
  document.body.style.overflow = "";
  if (lastFocusedTile && typeof lastFocusedTile.focus === "function") {
    lastFocusedTile.focus({ preventScroll: true });
  }
};

const nextTile = () => {
  const nextIdx = (currentTileIndex + 1) % galleryItems.length;
  updateLightbox(nextIdx);
};

const prevTile = () => {
  const prevIdx = (currentTileIndex - 1 + galleryItems.length) % galleryItems.length;
  updateLightbox(prevIdx);
};

galleryTiles.forEach((tile, index) => {
  tile.addEventListener("click", () => openLightbox(index));
});

lightboxClose?.addEventListener("click", closeLightbox);
lightboxPrev?.addEventListener("click", prevTile);
lightboxNext?.addEventListener("click", nextTile);

lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox || event.target.classList.contains("lightbox-backdrop")) {
    closeLightbox();
  }
});

document.addEventListener("keydown", (event) => {
  if (!lightbox || lightbox.hidden) return;
  if (event.key === "Escape") {
    closeLightbox();
  } else if (event.key === "ArrowRight") {
    nextTile();
  } else if (event.key === "ArrowLeft") {
    prevTile();
  } else if (event.key === "Tab") {
    const focusable = lightbox.querySelectorAll("button:not([disabled])");
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
});

// ==========================================================================
// 1. Interactive Hero Total Station Optical Reticle & Telemetry Tracking
// ==========================================================================
const initHeroReticle = () => {
  const bezelViewport = document.querySelector(".bezel-viewport");
  const crosshairV = document.querySelector(".crosshair-v");
  const crosshairH = document.querySelector(".crosshair-h");
  const crosshairCenter = document.querySelector(".crosshair-center");
  const crosshairRing = document.querySelector(".crosshair-ring-outer");

  if (!bezelViewport || !crosshairV || !crosshairH) return;

  bezelViewport.addEventListener("mousemove", (e) => {
    const rect = bezelViewport.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    const xPct = (x / rect.width) * 100;
    const yPct = (y / rect.height) * 100;

    crosshairV.style.left = `${xPct}%`;
    crosshairH.style.top = `${yPct}%`;

    if (crosshairCenter) {
      crosshairCenter.style.left = `calc(${xPct}% - 6px)`;
      crosshairCenter.style.top = `calc(${yPct}% - 6px)`;
    }
    if (crosshairRing) {
      crosshairRing.style.left = `calc(${xPct}% - 24px)`;
      crosshairRing.style.top = `calc(${yPct}% - 24px)`;
    }

  });

  bezelViewport.addEventListener("mouseleave", () => {
    crosshairV.style.left = "50%";
    crosshairH.style.top = "50%";
    if (crosshairCenter) {
      crosshairCenter.style.left = "calc(50% - 6px)";
      crosshairCenter.style.top = "calc(50% - 6px)";
    }
    if (crosshairRing) {
      crosshairRing.style.left = "calc(50% - 24px)";
      crosshairRing.style.top = "calc(50% - 24px)";
    }
  });
};

// ==========================================================================
// 2. Service pages (services/*.html): drawings that draw themselves in, and the copy button
// ==========================================================================
// Service page hero photos: when a page has more than one photo in its hero
// (picture.sv-slide inside [data-sv-reel]), they cross-fade one at a time every
// 6 seconds. Small dots let people pick a photo; it pauses while the mouse is over
// it or a dot has focus, and does not move on its own for reduced-motion users.
// To add a photo to a page, copy a <picture class="sv-slide"> block in its hero.
const initServiceReel = () => {
  document.querySelectorAll("[data-sv-reel]").forEach((reel) => {
    const slides = Array.from(reel.querySelectorAll(".sv-slide"));
    if (slides.length < 2) return;
    reel.classList.add("has-reel");
    const cap = document.createElement("p");
    cap.className = "sv-reel-cap";
    cap.setAttribute("aria-live", "polite");
    const dots = document.createElement("div");
    dots.className = "sv-reel-dots";
    let current = 0;
    const show = (i) => {
      current = (i + slides.length) % slides.length;
      slides.forEach((s, n) => s.classList.toggle("is-active", n === current));
      dots.querySelectorAll("button").forEach((b, n) => b.setAttribute("aria-current", n === current ? "true" : "false"));
      const text = slides[current].dataset.caption || "";
      cap.textContent = text;
      cap.hidden = !text;
    };
    slides.forEach((s, n) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", `Show photo ${n + 1} of ${slides.length}`);
      b.addEventListener("click", () => { show(n); restart(); });
      dots.appendChild(b);
    });
    reel.append(cap, dots);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer = null, paused = false;
    const restart = () => {
      clearInterval(timer);
      if (still) return;
      timer = setInterval(() => { if (!paused && !document.hidden) show(current + 1); }, 6000);
    };
    reel.addEventListener("mouseenter", () => { paused = true; });
    reel.addEventListener("mouseleave", () => { paused = false; });
    dots.addEventListener("focusin", () => { paused = true; });
    dots.addEventListener("focusout", () => { paused = false; });
    show(0);
    restart();
  });
};

const initServicePage = () => {
  const page = document.querySelector(".service-page");
  if (!page) return;

  // The drawing on each page draws itself in when it scrolls into view.
  // Without JavaScript, or with reduced motion turned on, it simply shows complete.
  const sheets = page.querySelectorAll(".draw-on-view");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (sheets.length && !reduceMotion && "IntersectionObserver" in window) {
    sheets.forEach((sheet) => sheet.classList.add("is-pending"));
    const sheetObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove("is-pending");
        entry.target.classList.add("is-drawn");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.2 });
    sheets.forEach((sheet) => sheetObserver.observe(sheet));
  }

  // "Copy the details" button: copies this service's title, summary and lists
  const copyButton = page.querySelector(".svc-copy-btn");
  if (!copyButton) return;

  copyButton.addEventListener("click", () => {
    const title = page.querySelector("h1")?.textContent.trim() || "";
    const lead = page.querySelector(".svc-lead")?.textContent.trim() || "";
    const pods = Array.from(page.querySelectorAll(".matrix-pod")).map((pod) => {
      const podTitle = pod.querySelector("h3, h4")?.textContent.replace("⌖", "").trim() || "";
      const items = Array.from(pod.querySelectorAll("li")).map((li) => `  • ${li.textContent.trim()}`).join("\n");
      return `[${podTitle}]\n${items}`;
    }).join("\n\n");

    const textToCopy = `RG CIVIL ENGINEERING & SURVEYING - SERVICE DETAILS\n` +
      `==================================================\n` +
      `${title}\n\n${lead}\n\n${pods}\n\n` +
      `Direct Contact: ${siteConfig.contactName} | ${siteConfig.phone} | ${siteConfig.email}\n` +
      `Coverage: Cumbria · Northumberland · SW Scotland`;

    const label = copyButton.querySelector("span");
    const original = label ? label.textContent : "";
    const flash = (message) => {
      if (!label) return;
      label.textContent = message;
      setTimeout(() => { label.textContent = original; }, 2200);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => flash("Copied"), () => flash("Copy not available"));
    } else {
      flash("Copy not available");
    }
  });
};

// ==========================================================================
// 3. Interactive Capability & Scope Finder Console (6-Discipline Indexed)
// ==========================================================================
const initUmbrellaFinder = () => {
  const searchInput = document.getElementById("scope-search");
  const clearBtn = document.getElementById("finder-clear");
  const filterTags = document.querySelectorAll(".finder-tag");
  const countEl = document.getElementById("finder-count");
  const emptyEl = document.getElementById("finder-empty");
  const querySpan = document.getElementById("finder-query");
  const resetBtn = document.getElementById("finder-reset-btn");
  const tiles = Array.from(document.querySelectorAll(".umbrella-tile"));
  const panels = Array.from(document.querySelectorAll(".umbrella-panel"));

  if (!searchInput || tiles.length === 0) return;

  // Index each discipline: tile text + panel text
  const disciplineData = tiles.map((tile) => {
    const id = tile.dataset.umbrella;
    const category = tile.dataset.category || "";
    const panel = panels.find((p) => p.dataset.umbrella === id);
    const textNodes = [];

    if (panel) {
      panel.querySelectorAll(".matrix-list li, h4, .drawer-lead, h3, .meta-pill").forEach((el) => {
        textNodes.push({ el, original: el.textContent.trim() });
      });
    }

    tile.querySelectorAll(".umbrella-summary, .umbrella-title, .umbrella-chips span").forEach((el) => {
      textNodes.push({ el, original: el.textContent.trim() });
    });

    return {
      id,
      category,
      tile,
      panel,
      textNodes
    };
  });

  let activeCategory = "all";
  let activeQuery = "";

  const runFilter = () => {
    const q = activeQuery.toLowerCase().trim();
    let totalMatches = 0;
    let matchingDisciplines = 0;
    let firstMatchingId = null;

    if (clearBtn) clearBtn.hidden = !q;

    disciplineData.forEach(({ id, category, tile, textNodes }) => {
      const matchesCategory = activeCategory === "all" || category === activeCategory;
      let disciplineMatches = 0;

      textNodes.forEach(({ el, original }) => {
        if (!q) {
          el.innerHTML = original;
          return;
        }

        const matchIdx = original.toLowerCase().indexOf(q);
        if (matchIdx !== -1) {
          disciplineMatches++;
          const before = original.slice(0, matchIdx);
          const matched = original.slice(matchIdx, matchIdx + q.length);
          const after = original.slice(matchIdx + q.length);
          el.innerHTML = `${before}<mark class="bento-hl">${matched}</mark>${after}`;
        } else {
          el.innerHTML = original;
        }
      });

      // Update match pill on tile
      const existingPill = tile.querySelector(".tile-match-pill");
      if (q && disciplineMatches > 0) {
        if (existingPill) {
          existingPill.textContent = `${disciplineMatches} match${disciplineMatches === 1 ? "" : "es"}`;
        } else {
          const header = tile.querySelector(".umbrella-tile-header");
          if (header) {
            const pill = document.createElement("span");
            pill.className = "tile-match-pill";
            pill.textContent = `${disciplineMatches} match${disciplineMatches === 1 ? "" : "es"}`;
            header.appendChild(pill);
          }
        }
      } else if (existingPill) {
        existingPill.remove();
      }

      const shouldShow = matchesCategory && (!q || disciplineMatches > 0);
      tile.style.display = matchesCategory ? "" : "none";
      tile.classList.toggle("is-dimmed", q ? disciplineMatches === 0 : false);

      if (shouldShow) {
        totalMatches += disciplineMatches;
        matchingDisciplines++;
        if (!firstMatchingId) firstMatchingId = id;
      }
    });

    if (emptyEl) {
      emptyEl.hidden = matchingDisciplines > 0;
      if (querySpan) querySpan.textContent = activeQuery;
    }

    // Auto-open first matching discipline if current active has 0 matches
    if (q && firstMatchingId) {
      const currentActiveTile = tiles.find((t) => t.classList.contains("is-active"));
      const currentActiveHasMatches = currentActiveTile && !currentActiveTile.classList.contains("is-dimmed");
      if (!currentActiveHasMatches && window.activateDiscipline) {
        window.activateDiscipline(firstMatchingId, false);
      }
    }

    if (countEl) {
      if (activeCategory === "all" && !q) {
        countEl.textContent = "Showing all 87 verified field capabilities across 6 core disciplines";
      } else if (matchingDisciplines === 0) {
        countEl.textContent = "0 matching capabilities found";
      } else if (!q) {
        countEl.textContent = `Filtered to 1 discipline (${matchingDisciplines} discipline active)`;
      } else {
        countEl.textContent = `Showing ${totalMatches} matching capabilit${totalMatches === 1 ? "y" : "ies"} across ${matchingDisciplines} discipline${matchingDisciplines === 1 ? "" : "s"}`;
      }
    }
  };

  searchInput.addEventListener("input", (e) => {
    activeQuery = e.target.value;
    runFilter();
  });

  clearBtn?.addEventListener("click", () => {
    searchInput.value = "";
    activeQuery = "";
    runFilter();
    searchInput.focus();
  });

  resetBtn?.addEventListener("click", () => {
    searchInput.value = "";
    activeQuery = "";
    activeCategory = "all";
    filterTags.forEach((t) => {
      const isAll = t.dataset.filter === "all";
      t.classList.toggle("is-active", isAll);
      t.setAttribute("aria-selected", String(isAll));
    });
    runFilter();
    searchInput.focus();
  });

  filterTags.forEach((tag) => {
    tag.addEventListener("click", () => {
      filterTags.forEach((t) => {
        t.classList.remove("is-active");
        t.setAttribute("aria-selected", "false");
      });
      tag.classList.add("is-active");
      tag.setAttribute("aria-selected", "true");
      activeCategory = tag.dataset.filter || "all";

      // If a specific discipline tag is clicked, automatically open its tile and panel!
      if (activeCategory !== "all") {
        const matchingTile = tiles.find((t) => t.dataset.category === activeCategory);
        if (matchingTile && window.activateDiscipline) {
          window.activateDiscipline(matchingTile.dataset.umbrella, true);
        }
      }

      runFilter();
    });
  });
};

// ==========================================================================
// 3. Site Readiness Checklist Copy
// ==========================================================================
const initChecklist = () => {
  const btn = document.getElementById("copy-checklist-btn");
  const status = document.getElementById("checklist-status");
  if (!btn) return;

  const checklist = `RG Civil Engineering & Surveying — What to send
Director: Ryan Johnston (07956 996 424 | ryan@rgcivilengineering.co.uk)

[ ] Site location, postcode or OS grid reference
[ ] Scope needed (Land & Utility Surveying, Site Engineering & Earthworks, Highways, Bridges & Structures, Survey Control & QA, or CAD & Digital Services)
[ ] Latest drawings (2D/3D AutoCAD DWG, DXF, LandXML or PDF plans)
[ ] Existing control stations or design grid coordinates (if held)
[ ] Site access notes and on-site contact details
[ ] Target start date and programme milestones`;

  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(checklist);
      if (status) {
        status.textContent = "Checklist copied to clipboard";
        setTimeout(() => { status.textContent = ""; }, 2800);
      }
    } catch {
      if (status) {
        status.textContent = "Could not copy automatically. Call Ryan and he will talk you through it.";
        setTimeout(() => { status.textContent = ""; }, 2800);
      }
    }
  });
};

// ==========================================================================
// 4. Contact One-Click Copy & Specification Draft Auto-Save
// ==========================================================================
const initContactAndDraft = () => {
  // Direct contact copying
  const copyButtons = document.querySelectorAll("[data-copy-contact]");
  const copyToast = document.getElementById("contact-copy-status");

  copyButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const type = btn.dataset.copyContact;
      const textToCopy = type === "phone" ? siteConfig.phone : siteConfig.email;
      try {
        await navigator.clipboard.writeText(textToCopy);
        if (copyToast) {
          copyToast.textContent = `Copied ${textToCopy}`;
          setTimeout(() => { copyToast.textContent = ""; }, 2500);
        }
      } catch {
        if (copyToast) {
          copyToast.textContent = `Could not copy. It is ${textToCopy}`;
          setTimeout(() => { copyToast.textContent = ""; }, 2500);
        }
      }
    });
  });
};

// ==========================================================================
// 5. Regional Mobilisation Radar (Feature 3)
// ==========================================================================
const initMobilisationRadar = () => {
  const hubButtons = document.querySelectorAll(".radar-hub-btn");
  const hubTitle = document.getElementById("radar-hub-title");
  const hubDispatch = document.getElementById("radar-hub-dispatch");
  const hubScope = document.getElementById("radar-hub-scope");
  const setLocationBtn = document.getElementById("radar-set-location-btn");
  const locationInput = document.querySelector("input[name='location']");

  if (hubButtons.length === 0) return;

  const hubData = {
    carlisle: {
      name: "Carlisle Base & Cumbria",
      dispatch: "CARLISLE REGISTERED BASE · CUMBRIA COVER",
      scope: "Cumbria site engineering, setting out and surveying coverage.",
      locationText: "Carlisle, Cumbria"
    },
    penrith: {
      name: "Cumbria Coverage",
      dispatch: "COUNTY-WIDE SITE ATTENDANCE",
      scope: "Site engineering, setting out, topographical surveys and monitoring across Cumbria.",
      locationText: "Cumbria"
    },
    "west-cumbria": {
      name: "Cumbria Coverage",
      dispatch: "CUMBRIA INFRASTRUCTURE & CIVILS",
      scope: "Civil engineering setting out, drainage, GPR and surveying across Cumbria.",
      locationText: "Cumbria"
    },
    scotland: {
      name: "South-West Scotland",
      dispatch: "REGIONAL COVERAGE · SW SCOTLAND",
      scope: "Site engineering, setting out, land surveys and monitoring across south-west Scotland.",
      locationText: "South-West Scotland"
    },
    northumberland: {
      name: "Northumberland Coverage",
      dispatch: "REGIONAL COVERAGE · NORTHUMBERLAND",
      scope: "Site engineering, setting out and surveying work across Northumberland.",
      locationText: "Northumberland"
    }
  };

  let activeHubKey = "carlisle";

  hubButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      hubButtons.forEach((b) => {
        b.classList.remove("is-active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");

      const key = btn.dataset.hub;
      activeHubKey = key;
      const data = hubData[key];
      if (data) {
        if (hubTitle) hubTitle.textContent = data.name;
        if (hubDispatch) hubDispatch.textContent = data.dispatch;
        if (hubScope) hubScope.textContent = data.scope;
      }
    });
  });

  setLocationBtn?.addEventListener("click", () => {
    const data = hubData[activeHubKey];
    if (data && locationInput) {
      locationInput.value = data.locationText;
      const contactSection = document.getElementById("contact");
      contactSection?.scrollIntoView({ behavior: "smooth" });
      locationInput.focus();
      locationInput.style.borderColor = "var(--yellow)";
      setTimeout(() => { locationInput.style.borderColor = ""; }, 1800);
    }
  });
};


// ==========================================================================
// 7. Site Readiness & Pre-Start Calculator (Feature 2)
// ==========================================================================
const initReadinessCalculator = () => {
  const chips = document.querySelectorAll(".calc-chip");
  const scoreVal = document.getElementById("calc-score-val");
  const meterFill = document.getElementById("calc-meter-fill");
  const gradeLabel = document.getElementById("calc-grade-label");
  const instrumentOut = document.getElementById("calc-instrument-out");
  const turnaroundOut = document.getElementById("calc-turnaround-out");
  const adviceOut = document.getElementById("calc-advice-out");
  const transferBtn = document.getElementById("calc-transfer-btn");
  const copyBtn = document.getElementById("calc-copy-btn");
  const toast = document.getElementById("calc-status-toast");

  if (chips.length === 0) return;

  const calculate = () => {
    const dwgChip = document.querySelector("[data-calc-group='drawings'] .is-selected");
    const groundChip = document.querySelector("[data-calc-group='ground'] .is-selected");
    const controlChip = document.querySelector("[data-calc-group='control'] .is-selected");
    const timingChip = document.querySelector("[data-calc-group='timing'] .is-selected");

    const score = Number(dwgChip?.dataset.score || 25) +
      Number(groundChip?.dataset.score || 25) +
      Number(controlChip?.dataset.score || 25) +
      Number(timingChip?.dataset.score || 25);

    const dwgVal = dwgChip?.dataset.val;
    const timingVal = timingChip?.dataset.val;

    if (scoreVal) scoreVal.textContent = `${score}%`;
    if (meterFill) meterFill.style.width = `${score}%`;

    if (score >= 90) {
      if (gradeLabel) gradeLabel.textContent = "READY FOR SETTING OUT";
      if (meterFill) meterFill.style.background = "linear-gradient(90deg, #f5cf25 0%, #2bd980 100%)";
      if (turnaroundOut) turnaroundOut.textContent = "Subject to agreed schedule";
      if (instrumentOut) instrumentOut.textContent = "Total Station & GNSS Control";
      if (adviceOut) adviceOut.textContent = "Site information is ready. Send CAD/LandXML files ahead of attendance so Ryan can review coordinates and control.";
    } else if (score >= 70) {
      if (gradeLabel) gradeLabel.textContent = "MINOR CHECKS NEEDED";
      if (meterFill) meterFill.style.background = "linear-gradient(90deg, #e6a71e 0%, #f5cf25 100%)";
      if (turnaroundOut) turnaroundOut.textContent = "Subject to agreed schedule";
      if (instrumentOut) instrumentOut.textContent = dwgVal === "pdf" ? "CAD Processing + Total Station" : "GNSS & Total Station";
      if (adviceOut) adviceOut.textContent = dwgVal === "pdf"
        ? "Drawings currently in PDF format. Discuss CAD or setting-out data options with Ryan before attendance."
        : "Site control may need an initial traverse check on attendance.";
    } else {
      if (gradeLabel) gradeLabel.textContent = "PRE-PLANNING RECOMMENDED — CONTACT RYAN";
      if (meterFill) meterFill.style.background = "linear-gradient(90deg, #e05d44 0%, #e6a71e 100%)";
      if (turnaroundOut) turnaroundOut.textContent = "Call Ryan to plan attendance";
      if (instrumentOut) instrumentOut.textContent = "Site Control & Survey Preparation";
      if (adviceOut) adviceOut.textContent = "Contact Ryan on 07956 996 424 to review drawings and site conditions before attendance.";
    }
  };

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const group = chip.closest("[data-calc-group]");
      group?.querySelectorAll(".calc-chip").forEach((c) => c.classList.remove("is-selected"));
      chip.classList.add("is-selected");
      calculate();
    });
  });

  transferBtn?.addEventListener("click", () => {
    const dwgText = document.querySelector("[data-calc-group='drawings'] .is-selected")?.textContent.trim();
    const groundText = document.querySelector("[data-calc-group='ground'] .is-selected")?.textContent.trim();
    const controlText = document.querySelector("[data-calc-group='control'] .is-selected")?.textContent.trim();
    const timingText = document.querySelector("[data-calc-group='timing'] .is-selected")?.textContent.trim();
    const score = scoreVal?.textContent || "100%";
    const grade = gradeLabel?.textContent || "";

    const briefField = document.querySelector("textarea[name='brief']");
    if (briefField) {
      const auditSummary = `[SITE READINESS AUDIT: ${score} - ${grade}]\n` +
        `• Drawing Package: ${dwgText}\n` +
        `• Ground Status: ${groundText}\n` +
        `• Site Datums: ${controlText}\n` +
        `• Target Attendance: ${timingText}\n\n` +
        `Notes for Ryan: `;
      briefField.value = auditSummary;
      const contactSection = document.getElementById("contact");
      contactSection?.scrollIntoView({ behavior: "smooth" });
      briefField.focus();
    }
  });

  copyBtn?.addEventListener("click", async () => {
    const dwgText = document.querySelector("[data-calc-group='drawings'] .is-selected")?.textContent.trim();
    const groundText = document.querySelector("[data-calc-group='ground'] .is-selected")?.textContent.trim();
    const controlText = document.querySelector("[data-calc-group='control'] .is-selected")?.textContent.trim();
    const timingText = document.querySelector("[data-calc-group='timing'] .is-selected")?.textContent.trim();
    const score = scoreVal?.textContent || "100%";
    const grade = gradeLabel?.textContent || "";
    const advice = adviceOut?.textContent || "";

    const textToCopy = `RG CIVIL ENGINEERING & SURVEYING - SITE READINESS AUDIT\n` +
      `Score: ${score} (${grade})\n` +
      `-----------------------------------------------------\n` +
      `Drawings: ${dwgText}\n` +
      `Ground Conditions: ${groundText}\n` +
      `Control Datums: ${controlText}\n` +
      `Timing: ${timingText}\n\n` +
      `Pre-Start Advice:\n${advice}\n\n` +
      `Ryan Johnston | 07956 996 424 | ryan@rgcivilengineering.co.uk`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      if (toast) {
        toast.textContent = "Readiness audit copied to clipboard ✓";
        setTimeout(() => { toast.textContent = ""; }, 2500);
      }
    } catch {
      alert("Audit summary:\n\n" + textToCopy);
    }
  });
};

// ==========================================================================
// 8. Tender Brief Printer & Global Keyboard Shortcuts (Features 4 & 5)
// ==========================================================================
const initBriefPrinterAndShortcuts = () => {
  const printBtn = document.getElementById("print-brief-btn");
  printBtn?.addEventListener("click", () => {
    window.print();
  });

  // Single-key shortcuts (/, C, R) removed 14 Nov 2026: they hijacked ordinary key presses for keyboard
  // and screen-reader users, and the footer bar advertising them has gone.
};


// ==========================================================================
// Compass field (home page services): four quarters, one per phase, around a
// compass. The needle follows the mouse; the quarter it points at lights up;
// clicking the compass opens it. Smaller screens: the quarters stack and the
// needle points at whichever one is in the middle of the screen.
// ==========================================================================
const initCompassField = () => {
  const field = document.querySelector("[data-compass-field]");
  const compass = field?.querySelector(".cd-compass");
  const dial = compass?.querySelector(".cd-dial");
  const needle = compass?.querySelector(".cd-needle");
  if (!field || !dial || !needle) return;

  const quads = Array.from(field.querySelectorAll(".quad"));
  const markers = Array.from(dial.querySelectorAll(".cd-marker"));
  const section = field.closest("section") || field;
  const bearingEls = section.querySelectorAll("[data-compass-bearing]");
  const targetEls = section.querySelectorAll("[data-compass-target]");
  const hintEls = section.querySelectorAll("[data-compass-hint]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mousePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const quarters = window.matchMedia("(min-width: 1100px)");
  const FIXED = { "01": 0, "02": 60, "03": 120, "04": 180, "05": 240, "06": 300 };
  if (!quads.length) return;

  let angle = 0;
  let velocity = 0;
  let target = 0;
  let frame = 0;
  let aimed = null;

  const shortest = (from, to) => ((to - from + 540) % 360) - 180;
  const centre = () => {
    const r = dial.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, size: r.width };
  };
  const bearingTo = (x, y) => {
    const c = centre();
    return (Math.atan2(x - c.x, c.y - y) * 180 / Math.PI + 360) % 360;
  };
  const bearingOf = (quad) => {
    // Six wedges: each one has a fixed direction (01 straight up, then every 60 degrees clockwise)
    if (!quarters.matches) return FIXED[quad.dataset.umbrella] ?? 0;
    if (field.classList.contains("compass-six")) {
      // The slanted lines meet the top and bottom edges a sixth of the way in (a quarter on smaller laptops, see --six-div in styles.css), so the
      // direction of each wedge depends on the section's shape. Point at the middle of each wedge.
      const f = field.getBoundingClientRect();
      const div = parseFloat(getComputedStyle(field).getPropertyValue("--six-div")) || 3;
      const edge = Math.atan2(f.width / div, f.height / 2) * 180 / Math.PI;
      const side = (edge + 90) / 2;
      return { "01": 0, "02": side, "03": 180 - side, "04": 180, "05": 180 + side, "06": 360 - side }[quad.dataset.umbrella] ?? 0;
    }
    const r = quad.getBoundingClientRect();
    return bearingTo(r.left + r.width / 2, r.top + r.height / 2);
  };
  const nearest = (bearing) => quads.reduce((best, q) =>
    (Math.abs(shortest(bearing, bearingOf(q))) < Math.abs(shortest(bearing, bearingOf(best))) ? q : best), quads[0]);

  const placeMarkers = () => {
    markers.forEach((marker) => {
      const quad = quads.find((q) => q.dataset.umbrella === marker.dataset.phase);
      if (!quad) return;
      const b = bearingOf(quad);
      marker.setAttribute("transform", `rotate(${b.toFixed(1)} 200 200)`);
      marker.querySelector("text")?.setAttribute("transform", `rotate(${(-b).toFixed(1)} 200 -20)`);
    });
  };

  const setAimed = (quad) => {
    if (quad === aimed) return;
    aimed = quad;
    quads.forEach((q) => q.classList.toggle("is-aimed", q === quad));
    markers.forEach((m) => m.classList.toggle("is-aimed", m.dataset.phase === quad?.dataset.umbrella));
    if (quad) {
      const title = quad.querySelector(".quad-title")?.textContent.trim() || "";
      targetEls.forEach((el) => { el.textContent = `Service ${quad.dataset.umbrella} · ${title}`; });
    }
  };

  const render = () => {
    needle.setAttribute("transform", `rotate(${angle.toFixed(2)} 200 200)`);
    const text = `${String(Math.round(angle) % 360).padStart(3, "0")}°`;
    bearingEls.forEach((el) => { el.textContent = text; });
  };

  // A little spring, so the needle swings slightly past and settles like a real one
  const step = () => {
    const delta = shortest(angle, target);
    velocity = (velocity + delta * 0.08) * 0.78;
    angle = (angle + velocity + 360) % 360;
    render();
    frame = (Math.abs(delta) > 0.05 || Math.abs(velocity) > 0.05) ? requestAnimationFrame(step) : 0;
  };

  const aim = (bearing, quad) => {
    target = bearing;
    setAimed(quad || nearest(bearing));
    if (reduceMotion) {
      angle = target;
      velocity = 0;
      render();
      return;
    }
    if (!frame) frame = requestAnimationFrame(step);
  };

  let calibrationComplete = reduceMotion || !("IntersectionObserver" in window);

  // Mouse: the needle stays locked on the one-by-one intro until the last service (06) is pointed at
  section.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse" || !calibrationComplete) return;
    const quad = event.target.closest ? event.target.closest(".quad") : null;
    if (quarters.matches) {
      const c = centre();
      if (!quad && Math.hypot(event.clientX - c.x, event.clientY - c.y) < c.size * 0.06) return;
      field.classList.add("has-aim");
      aim(bearingTo(event.clientX, event.clientY), quad);
    } else if (quad) {
      field.classList.add("has-aim");
      aim(bearingOf(quad), quad);
    }
  });
  section.addEventListener("pointerleave", () => {
    if (!calibrationComplete) return;
    if (quarters.matches) field.classList.remove("has-aim");
  });

  // Click the compass to open the phase it points at
  dial.addEventListener("click", () => {
    if (aimed) window.location.href = aimed.getAttribute("href");
  });

  // Keyboard: tabbing onto a quarter swings the needle to it
  quads.forEach((quad) => quad.addEventListener("focus", () => {
    if (!calibrationComplete) return;
    field.classList.add("has-aim");
    aim(bearingOf(quad), quad);
  }));
  field.addEventListener("focusout", (event) => {
    if (!calibrationComplete) return;
    if (quarters.matches && !field.contains(event.relatedTarget)) field.classList.remove("has-aim");
  });

  hintEls.forEach((el) => { el.textContent = mousePointer.matches ? "Aim with your mouse, click to open" : "Tap a phase to open it"; });

  placeMarkers();
  render();
  window.addEventListener("resize", () => {
    placeMarkers();
    if (aimed && calibrationComplete) aim(bearingOf(aimed), aimed);
    if (quarters.matches) field.classList.remove("has-aim");
  });

  if (!reduceMotion) {
    field.classList.add("is-motion-armed");
  }

  if ("IntersectionObserver" in window) {
    if (reduceMotion) {
      aim(bearingOf(quads[0]), quads[0]);
    } else {
      // One fluid 360° clockwise glide: starts at Service 01 (000°), sweeps smoothly
      // through 02 -> 03 -> 04 -> 05 -> 06 opening each wedge at its exact bearing,
      // and cushions cleanly back to finish pointing at Service 01 (000°).
      // Mouse tracking unlocks right after the sweep settles back onto Service 01.
      const runCalibrationSweep = () => {
        const stops = quads.map((q, idx) => ({
          quad: q,
          arcAt: idx === 0 ? 0 : bearingOf(q),
          lit: false,
        }));
        const totalArc = 360;

        angle = 0;
        render();
        field.classList.add("is-motion-live");

        const duration = 2150;
        const startTime = performance.now() + 80;

        const tickGlide = (now) => {
          const raw = (now - startTime) / duration;
          if (raw < 0) {
            requestAnimationFrame(tickGlide);
            return;
          }
          const t = Math.min(1, raw);
          // Even sinusoidal ease-in-out for a silky, continuous mechanical sweep
          const eased = -(Math.cos(Math.PI * t) - 1) / 2;
          const traveled = eased * totalArc;

          angle = traveled % 360;
          render();

          stops.forEach((item) => {
            if (!item.lit && traveled >= item.arcAt) {
              item.lit = true;
              setAimed(item.quad);
              item.quad.classList.add("is-wedge-live", "is-calibrating");
              window.setTimeout(() => item.quad.classList.remove("is-calibrating"), 360);
            }
          });

          if (t < 1) {
            requestAnimationFrame(tickGlide);
          } else {
            angle = bearingOf(quads[0]);
            render();
            setAimed(quads[0]);
            calibrationComplete = true;
            field.classList.add("is-motion-settled");
          }
        };

        requestAnimationFrame(tickGlide);
      };

      // Observe the compass dial itself so the sequence only begins once the yellow needle is visibly on screen.
      // Fix 14 Nov 2026 (Claude): on phones the dial never reached 72% visible, so the six services stayed
      // invisible. Now starts at 40% visible, and as a safety net also starts once the services area itself
      // is on screen, so the panels can never stay hidden.
      let sweepStarted = false;
      const startSweepOnce = () => {
        if (sweepStarted) return;
        sweepStarted = true;
        runCalibrationSweep();
      };
      new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          startSweepOnce();
          observer.disconnect();
        });
      }, { threshold: 0.4 }).observe(dial);
      new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          window.setTimeout(startSweepOnce, 600);
          observer.disconnect();
        });
      }, { threshold: 0.05 }).observe(field);
    }

    // Smaller screens: point at the phase in the middle of the screen as you scroll
    const midScreen = new IntersectionObserver((entries) => {
      if (quarters.matches || !calibrationComplete) return;
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        field.classList.add("has-aim");
        aim(bearingOf(entry.target), entry.target);
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    quads.forEach((quad) => midScreen.observe(quad));
  } else {
    field.classList.add("is-motion-live", "is-motion-settled");
    quads.forEach((q) => q.classList.add("is-wedge-live"));
    aim(bearingOf(quads[0]), quads[0]);
  }
};

// ==========================================================================
// Site workflow: plays the entrance once, when the three steps scroll into view.
// The line draws from station to station and each card lands in turn.
// Without this script, or with reduced motion on, everything is simply visible.
// ==========================================================================
const initWorkflow = () => {
  const wf = document.querySelector("[data-wf]");
  if (!wf) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
  const head = document.querySelector("[data-wf-head]");
  const parts = [head, wf].filter(Boolean);
  parts.forEach((el) => el.classList.add("is-armed"));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      parts.forEach((el) => el.classList.add("is-live"));
      observer.disconnect();
    });
  }, { threshold: 0.25 });
  observer.observe(wf.closest(".process-layout") || wf);
};

// ==========================================================================
// Home page hero reel: cycles through the four real site photos on the right
// side of the hero every 5.2s, pauses on hover/focus, and switches on click
// or arrow keys. Disabled automatically when reduced motion is turned on.
// ==========================================================================
// ==========================================================================
// Reviews carousel (13 Nov 2026): one Google review at a time, every 7s.
// Arrows, dots and swipe; pauses on hover/focus; no auto-play with reduced motion.
// ==========================================================================
const initReviewCarousel = () => {
  const root = document.querySelector("[data-review-carousel]");
  if (!root) return;
  const slides = Array.from(root.querySelectorAll(".review-slide"));
  const dots = Array.from(root.querySelectorAll(".review-dot"));
  if (slides.length < 2) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  let current = 0;
  let timer = null;
  let paused = false;

  const show = (i) => {
    current = (i + slides.length) % slides.length;
    slides.forEach((s, n) => {
      const on = n === current;
      s.classList.toggle("is-active", on);
      if (on) { s.removeAttribute("aria-hidden"); s.inert = false; }
      else { s.setAttribute("aria-hidden", "true"); s.inert = true; }
    });
    dots.forEach((d, n) => {
      if (n === current) d.setAttribute("aria-current", "true");
      else d.removeAttribute("aria-current");
    });
  };
  const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
  const start = () => {
    stop();
    if (reduce.matches || paused || document.hidden) return;
    timer = setInterval(() => show(current + 1), 7000);
  };

  root.querySelector("[data-review-prev]")?.addEventListener("click", () => { show(current - 1); start(); });
  root.querySelector("[data-review-next]")?.addEventListener("click", () => { show(current + 1); start(); });
  dots.forEach((d, n) => d.addEventListener("click", () => { show(n); start(); }));

  let touchX = null;
  root.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  root.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 45) { show(current + (dx < 0 ? 1 : -1)); start(); }
  }, { passive: true });

  root.addEventListener("mouseenter", () => { paused = true; stop(); });
  root.addEventListener("mouseleave", () => { paused = false; start(); });
  root.addEventListener("focusin", () => { paused = true; stop(); });
  root.addEventListener("focusout", (e) => { if (!root.contains(e.relatedTarget)) { paused = false; start(); } });
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  show(0);
  start();
};

// ==========================================================================
// Recent work photo slideshows (14 Nov 2026): dots, swipe, changes every 5s;
// pauses on hover/focus; no auto-play with reduced motion.
// ==========================================================================
const initProjectReels = () => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll("[data-project-reel]").forEach((reel) => {
    const slides = Array.from(reel.querySelectorAll(".project-slide"));
    if (slides.length < 2) return;
    const dots = document.createElement("div");
    dots.className = "project-dots";
    dots.setAttribute("role", "group");
    dots.setAttribute("aria-label", "Choose a photo");
    let current = 0;
    let timer = null;
    let paused = false;
    const buttons = slides.map((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "project-dot";
      b.setAttribute("aria-label", `Show photo ${i + 1} of ${slides.length}`);
      b.addEventListener("click", () => { show(i); start(); });
      dots.appendChild(b);
      return b;
    });
    reel.appendChild(dots);
    const show = (i) => {
      current = (i + slides.length) % slides.length;
      slides.forEach((s, n) => {
        s.classList.toggle("is-active", n === current);
        if (n === current) s.removeAttribute("aria-hidden");
        else s.setAttribute("aria-hidden", "true");
      });
      buttons.forEach((b, n) => (n === current ? b.setAttribute("aria-current", "true") : b.removeAttribute("aria-current")));
      const next = slides[(current + 1) % slides.length]?.querySelector("img");
      if (next && next.loading === "lazy") next.loading = "eager";
    };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const start = () => {
      stop();
      if (reduce || paused || document.hidden) return;
      timer = setInterval(() => show(current + 1), 5000);
    };
    let touchX = null;
    reel.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    reel.addEventListener("touchend", (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) > 40) { show(current + (dx < 0 ? 1 : -1)); start(); }
    }, { passive: true });
    reel.addEventListener("mouseenter", () => { paused = true; stop(); });
    reel.addEventListener("mouseleave", () => { paused = false; start(); });
    reel.addEventListener("focusin", () => { paused = true; stop(); });
    reel.addEventListener("focusout", (e) => { if (!reel.contains(e.relatedTarget)) { paused = false; start(); } });
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries, obs) => {
        entries.forEach((en) => { if (en.isIntersecting) { start(); obs.disconnect(); } });
      }, { threshold: 0.3 }).observe(reel);
    } else { start(); }
    show(0);
  });
};

const initHeroReel = () => {
  const reel = document.querySelector("[data-hero-reel]");
  if (!reel) return;
  const slides = Array.from(reel.querySelectorAll("[data-hero-slide]"));
  const tabs = Array.from(reel.querySelectorAll("[data-hero-tab]"));
  if (slides.length < 2 || (tabs.length && tabs.length !== slides.length)) return; // tabs are optional (hero simplified 13 Nov 2026)

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const intervalMs = 5200;
  let current = 0;
  let timer = null;
  let paused = false;

  const show = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle("is-active", i === current);
    });
    tabs.forEach((tab, i) => {
      const active = i === current;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
      if (active) {
        const bar = tab.querySelector(".hero-reel-bar");
        if (bar) {
          bar.style.animation = "none";
          void bar.offsetWidth;
          bar.style.animation = "";
        }
      }
    });
  };

  const stopTimer = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const startTimer = () => {
    stopTimer();
    if (reduceMotion.matches || paused || document.hidden) return;
    timer = setInterval(() => {
      show(current + 1);
    }, intervalMs);
  };

  const setPaused = (state) => {
    paused = state;
    reel.classList.toggle("is-paused", paused);
    if (paused) stopTimer();
    else startTimer();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => {
      show(i);
      startTimer();
    });
    tab.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const next = e.key === "ArrowRight" ? (i + 1) % tabs.length : (i - 1 + tabs.length) % tabs.length;
        tabs[next].focus();
        show(next);
        startTimer();
      }
    });
  });

  // Swipe left/right on phones to move between photos.
  let touchX = null;
  reel.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  reel.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 45) {
      show(current + (dx < 0 ? 1 : -1));
      startTimer();
    }
  }, { passive: true });

  reel.addEventListener("mouseenter", () => setPaused(true));
  reel.addEventListener("mouseleave", () => setPaused(false));
  reel.addEventListener("focusin", () => setPaused(true));
  reel.addEventListener("focusout", (e) => {
    if (!reel.contains(e.relatedTarget)) setPaused(false);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopTimer();
    else startTimer();
  });

  startTimer();
};

// ==========================================================================
// ==========================================================================
// Welcome screen: full-viewport living instrument opening screen on the home page.
// Features living river water current, sweeping LiDAR scanline, pulsing reticles,
// live EDM/GPS telemetry micro-jitter, and 3D optical mouse parallax.
// Lifts smoothly into the hero when clicked, scrolled, swiped or via keyboard.
// ==========================================================================
const initWelcomeScreen = () => {
  const root = document.documentElement;
  const welcome = document.querySelector("[data-welcome]");
  if (!welcome || !root.classList.contains("has-welcome")) return;

  const enterBtn = welcome.querySelector("[data-welcome-enter]");
  const video = welcome.querySelector("#bgVideo");
  const medallion = welcome.querySelector("#compassMedallion");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let isEntering = false;

  // Respect reduced-motion preferences for background video
  const syncReducedMotion = () => {
    if (!video) return;
    if (reducedMotion.matches) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  };
  syncReducedMotion();
  if (reducedMotion.addEventListener) {
    reducedMotion.addEventListener("change", syncReducedMotion);
  }

  // Subtle 3D tilt on fine pointer movement
  if (medallion && !reducedMotion.matches && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    welcome.addEventListener("pointermove", (e) => {
      if (isEntering) return;
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      const rotY = (nx * 3.2).toFixed(2);
      const rotX = (-ny * 3.2).toFixed(2);
      medallion.style.animation = "none";
      medallion.style.transform = "translate3d(0, -1px, 0) rotateX(" + rotX + "deg) rotateY(" + rotY + "deg)";
    }, { passive: true });

    welcome.addEventListener("pointerleave", () => {
      if (isEntering) return;
      medallion.style.transform = "";
      medallion.style.animation = "";
    });
  }

  const dismiss = () => {
    if (isEntering) return;
    isEntering = true;

    if (medallion) {
      medallion.style.transform = "";
      medallion.style.animation = "";
    }

    root.classList.add("welcome-opening", "welcome-entering");
    document.body.style.overflow = "visible";

    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("touchend", onTouchEnd);

    // After the compass bearing lock and lift animation, complete entrance
    setTimeout(() => {
      welcome.classList.add("is-leaving");
      setTimeout(() => {
        root.classList.remove("has-welcome", "welcome-opening", "welcome-entering");
        document.body.style.overflow = "";
        welcome.hidden = true;
      }, 720);
    }, 380);
  };

  const onWheel = (e) => {
    if (e.deltaY > 6) dismiss();
  };

  const onKey = (e) => {
    if (e.key === "Escape" || e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      dismiss();
    }
  };

  let touchStartY = null;
  const onTouchStart = (e) => {
    if (e.touches && e.touches.length === 1) {
      touchStartY = e.touches[0].clientY;
    }
  };

  const onTouchEnd = (e) => {
    if (touchStartY === null || !e.changedTouches || !e.changedTouches.length) return;
    const dy = touchStartY - e.changedTouches[0].clientY;
    touchStartY = null;
    if (dy > 24) dismiss();
  };

  if (enterBtn) {
    enterBtn.addEventListener("click", (e) => {
      e.preventDefault();
      dismiss();
    });
  }

  window.addEventListener("wheel", onWheel, { passive: true });
  window.addEventListener("keydown", onKey);
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchend", onTouchEnd, { passive: true });
};

// Damped 360° degree bezel around the upright RG compass medallion (#about)
const initAboutCompass = () => {
  const section = document.getElementById("about");
  const pod = section?.querySelector(".about-instrument-pod");
  const dial = section?.querySelector(".compass-dial-wrap");
  const bezel = section?.querySelector("[data-about-bezel]");
  const ticksGroup = section?.querySelector("[data-bezel-ticks]");
  const aziReadout = section?.querySelector("[data-about-azi]");
  if (!section || !pod || !dial || !bezel) return;

  if (ticksGroup && !ticksGroup.childElementCount) {
    const NS = "http://www.w3.org/2000/svg";
    const cx = 170;
    const cy = 170;
    const frag = document.createDocumentFragment();
    for (let deg = 0; deg < 360; deg += 5) {
      const isMajor = deg % 90 === 0;
      const isMed = deg % 15 === 0;
      const r1 = isMajor ? 151 : isMed ? 154.5 : 158.5;
      const r2 = 163.5;
      const rad = ((deg - 90) * Math.PI) / 180;
      const line = document.createElementNS(NS, "line");
      line.setAttribute("x1", (cx + r1 * Math.cos(rad)).toFixed(2));
      line.setAttribute("y1", (cy + r1 * Math.sin(rad)).toFixed(2));
      line.setAttribute("x2", (cx + r2 * Math.cos(rad)).toFixed(2));
      line.setAttribute("y2", (cy + r2 * Math.sin(rad)).toFixed(2));
      line.setAttribute("stroke", isMajor ? "#f5cf25" : "#f4f6f0");
      line.setAttribute("stroke-opacity", isMajor ? "0.9" : isMed ? "0.45" : "0.18");
      line.setAttribute("stroke-width", isMajor ? "1.6" : isMed ? "1.1" : "0.9");
      frag.appendChild(line);
    }
    ticksGroup.appendChild(frag);
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) return;

  let currentDeg = 0;
  let targetDeg = 0;
  let velocity = 0;
  let rafId = 0;
  let lastTime = 0;

  const formatDeg = (deg) => {
    const normalized = ((Math.round(deg) % 360) + 360) % 360;
    return `${String(normalized).padStart(3, "0")}°`;
  };

  const shortestDelta = (from, to) => ((to - from + 540) % 360) - 180;

  const tick = (now) => {
    const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0.016;
    lastTime = now;

    const delta = shortestDelta(currentDeg, targetDeg);
    // Critically-damped magnetic needle feel
    const force = delta * 58;
    velocity = (velocity + force * dt) * Math.exp(-8.5 * dt);
    currentDeg += velocity * dt * 10;

    bezel.style.transform = `rotate(${currentDeg.toFixed(2)}deg)`;
    if (aziReadout) aziReadout.textContent = formatDeg(currentDeg);

    if (Math.abs(delta) < 0.05 && Math.abs(velocity) < 0.05) {
      currentDeg = targetDeg;
      velocity = 0;
      bezel.style.transform = `rotate(${currentDeg.toFixed(2)}deg)`;
      if (aziReadout) aziReadout.textContent = formatDeg(currentDeg);
      rafId = 0;
      lastTime = 0;
      return;
    }

    rafId = requestAnimationFrame(tick);
  };

  const kick = () => {
    if (!rafId) {
      lastTime = 0;
      rafId = requestAnimationFrame(tick);
    }
  };

  const onPointerMove = (e) => {
    if (e.pointerType === "touch") return;
    const rect = dial.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;

    // Bearing clockwise from North (0° up, 90° right, 180° down, 270° left)
    targetDeg = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;

    // Subtle glass specular follow inside the medallion frame
    const gx = Math.max(15, Math.min(85, 50 + (dx / Math.max(rect.width, 1)) * 28));
    const gy = Math.max(15, Math.min(85, 50 + (dy / Math.max(rect.height, 1)) * 28));
    pod.style.setProperty("--dial-gx", `${gx.toFixed(1)}%`);
    pod.style.setProperty("--dial-gy", `${gy.toFixed(1)}%`);

    kick();
  };

  const onPointerLeave = () => {
    targetDeg = 0;
    pod.style.setProperty("--dial-gx", "32%");
    pod.style.setProperty("--dial-gy", "24%");
    kick();
  };

  section.addEventListener("pointermove", onPointerMove, { passive: true });
  section.addEventListener("pointerleave", onPointerLeave);

  // Subtle magnetic North-settle sweep when scrolled into view
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        if (targetDeg === 0 && currentDeg === 0) {
          currentDeg = -22;
          velocity = 4;
          kick();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(pod);
  }
};

// ==========================================================================
// Optical & Calibrated Scroll Entrance Motions (13 Nov 2026)
// 1. Radial clockwise 6-wedge compass sweep (#services)
// 2. Laser-line datum bar + heading lift (#process, #about, #reviews, #contact)
// 3. Optical reticle bracket snap on hero slide changes (#top)
// 4. Staggered 3D plate deal on About dossier chips & Enquiry compass tiles
// 5. Live 0.0 -> 5.0 Google rating count-up & sequential 5-star ignition
// ==========================================================================
const initScrollMotions = () => {
  if (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    !("IntersectionObserver" in window)
  ) {
    return;
  }

  // (1. Service compass sweep now runs synchronized inside initCompassField)

  // 2. Laser-Line Datum Bar & Heading Reveal across Sections (Home + Service Pages)
  const headingContainers = document.querySelectorAll(
    "#process .wf-head, #about .about-copy, #reviews .reviews-head, #contact .enq-intro-copy, .sv-work header, .sv-send-head, .sv-related .shell"
  );
  headingContainers.forEach((container) => {
    const h2 = container.querySelector("h2");
    if (!h2) return;
    if (!container.querySelector(".datum-laser-bar")) {
      const bar = document.createElement("span");
      bar.className = "datum-laser-bar";
      bar.setAttribute("aria-hidden", "true");
      h2.parentNode.insertBefore(bar, h2);
    }
    container.classList.add("datum-heading-armed");
    const headIO = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          container.classList.add("is-datum-live");
          obs.disconnect();
        });
      },
      { threshold: 0.2 }
    );
    headIO.observe(container);
  });

  // 3. Optical Reticle Bracket Lock on Hero Slide Changes
  const heroVisual = document.querySelector(".hero-visual[data-hero-reel]");
  if (heroVisual) {
    const triggerReticleSnap = () => {
      heroVisual.classList.add("is-reticle-locking");
      window.setTimeout(() => {
        heroVisual.classList.remove("is-reticle-locking");
      }, 140);
    };
    triggerReticleSnap();
    const slideObserver = new MutationObserver(() => {
      triggerReticleSnap();
    });
    heroVisual.querySelectorAll(".hero-slide").forEach((slide) => {
      slideObserver.observe(slide, { attributes: true, attributeFilter: ["class"] });
    });
  }

  // 4. Slow Staggered 3D Plate Deal on About Dossier Chips & Enquiry Options
  const dealGroups = [
    {
      root: document.querySelector("#about .direct-contact-dossier"),
      items: "#about .dossier-pill, #about .chip-action",
      stepMs: 180,
    },
    {
      root: document.querySelector("#contact .enq-step[data-step='need']"),
      items: "#contact .enq-compass .enq-tile, #contact .enq-step[data-step='need'] > .enq-wide",
      stepMs: 140,
    },
    {
      root: document.querySelector(".sv-send-list"),
      items: ".sv-send-list > li",
      stepMs: 140,
    },
    {
      root: document.querySelector(".sv-rel-grid"),
      items: ".sv-rel-link",
      stepMs: 180,
    },
  ];
  document.querySelectorAll(".sv-points").forEach((listEl) => {
    dealGroups.push({
      root: listEl,
      items: Array.from(listEl.querySelectorAll(".sv-point")),
      stepMs: 140,
    });
  });
  dealGroups.forEach(({ root, items, stepMs }) => {
    if (!root) return;
    const els = Array.isArray(items) ? items : document.querySelectorAll(items);
    if (!els.length) return;
    els.forEach((el, idx) => {
      el.style.setProperty("--plate-delay", `${idx * stepMs}ms`);
      el.classList.add("plate-deal-armed");
    });
    const groupIO = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          els.forEach((el) => el.classList.add("is-plate-live"));
          obs.disconnect();
        });
      },
      { threshold: 0.25 }
    );
    groupIO.observe(root);
  });

  // 5. Reviews Section: Sequential 5-Star Ignition, 0.0 -> 5.0 Counter & 3D Card Cascade
  const reviewsSection = document.getElementById("reviews");
  if (reviewsSection) {
    const starContainers = reviewsSection.querySelectorAll(".review-stars");
    starContainers.forEach((starEl, groupIdx) => {
      const text = (starEl.textContent || "").trim();
      if (!text.includes("★")) return;
      starEl.textContent = "";
      Array.from(text).forEach((ch, i) => {
        const span = document.createElement("span");
        span.className = "star-glyph";
        span.style.setProperty("--star-delay", `${groupIdx * 180 + i * 125}ms`);
        span.textContent = ch;
        starEl.appendChild(span);
      });
    });

    const cards = reviewsSection.querySelectorAll(".review-card");
    cards.forEach((card, idx) => {
      card.style.setProperty("--plate-delay", `${idx * 210}ms`);
      card.classList.add("plate-deal-armed");
    });

    const ratingStrong = reviewsSection.querySelector(".reviews-rating strong");
    const targetVal = ratingStrong ? parseFloat(ratingStrong.textContent || "5.0") : 5.0;

    const revIO = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          reviewsSection.classList.add("is-stars-live");
          cards.forEach((card) => card.classList.add("is-plate-live"));

          if (ratingStrong && !Number.isNaN(targetVal)) {
            const duration = 1600;
            const start = performance.now();
            const tick = (now) => {
              const t = Math.min(1, (now - start) / duration);
              const eased = 1 - Math.pow(1 - t, 3);
              ratingStrong.textContent = (targetVal * eased).toFixed(1);
              if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
          obs.disconnect();
        });
      },
      { threshold: 0.28 }
    );
    revIO.observe(reviewsSection);
  }
};

const initMobileCtaScrollGate = () => {
  const mobileCta = document.querySelector(".mobile-cta");
  if (!mobileCta) return;

  const heroActions = document.querySelector(".hero-actions, .sv-hero-actions");
  if (!heroActions) {
    mobileCta.classList.add("is-visible");
    return;
  }

  const updateVisibility = () => {
    const rect = heroActions.getBoundingClientRect();
    const scrolledPast = rect.bottom < 72;
    mobileCta.classList.toggle("is-visible", scrolledPast);
  };

  updateVisibility();

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(() => updateVisibility(), {
      threshold: [0, 0.25, 1],
      rootMargin: "-72px 0px 0px 0px",
    });
    io.observe(heroActions);
  }
  window.addEventListener("scroll", updateVisibility, { passive: true });
};

// Initialize interactive enhancements
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initWelcomeScreen();
    initHeroReticle();
    initHeroReel();
    initReviewCarousel();
    initProjectReels();
    initMobilisationRadar();
    initServicePage();
    initServiceReel();
    initCompassField();
    initAboutCompass();
    initUmbrellaFinder();
    initReadinessCalculator();
    initChecklist();
    initContactAndDraft();
    initEnquiry();
    initWorkflow();
    initBriefPrinterAndShortcuts();
    initMobileCtaScrollGate();
    initScrollMotions();
  });
} else {
  initWelcomeScreen();
  initHeroReticle();
  initHeroReel();
  initReviewCarousel();
  initProjectReels();
  initMobilisationRadar();
  initServicePage();
  initServiceReel();
  initCompassField();
  initAboutCompass();
  initUmbrellaFinder();
  initReadinessCalculator();
  initChecklist();
  initContactAndDraft();
  initEnquiry();
  initWorkflow();
  initBriefPrinterAndShortcuts();
  initMobileCtaScrollGate();
  initScrollMotions();
}
