const loader = document.getElementById("page-loader");
let loaderStartTime = 0;
let loaderHideTimer = null;
const loaderBarDuration = 2400;
const minimumLoaderHold = 900;
const siteImages = [
  "images/pub.gif",
  "images/Don't just play, OVERDOSE.png",
  "images/multi-emulator.png",
  "images/low-latency.png",
  "images/Stealth-core.png",
  "images/cloud-update.png",
  "images/apkpure.jpg",
  "images/bgmi.png",
  "images/pubg.png",
  "images/pubgkr.png"
];

function showLoader() {
  if (!loader) return;
  loader.classList.remove("is-hidden");
  document.body.style.overflow = "hidden";
  loaderStartTime = performance.now();

  const fill = loader.querySelector(".loader-fill");
  if (fill) {
    fill.style.transition = `width ${loaderBarDuration}ms cubic-bezier(0.22, 1, 0.36, 1)`;
    fill.style.width = "0%";
    window.requestAnimationFrame(() => {
      fill.style.width = "100%";
    });
  }
}

function hideLoader() {
  if (!loader) return;
  if (loaderHideTimer) {
    window.clearTimeout(loaderHideTimer);
    loaderHideTimer = null;
  }

  const fill = loader.querySelector(".loader-fill");
  if (fill) {
    fill.style.transition = `width ${loaderBarDuration}ms cubic-bezier(0.22, 1, 0.36, 1)`;
    fill.style.width = "100%";
  }

  const elapsed = performance.now() - loaderStartTime;
  const holdTime = Math.max(minimumLoaderHold, loaderBarDuration - elapsed);

  loaderHideTimer = window.setTimeout(() => {
    loader.classList.add("is-hidden");
    document.body.style.overflow = "";
    loaderHideTimer = null;
  }, holdTime);
}

function preloadImages(sources = []) {
  const uniqueSources = [...new Set((sources || []).filter(Boolean))];
  return Promise.all(
    uniqueSources.map(
      (src) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = src;
        })
    )
  );
}

async function waitForPageAssets() {
  showLoader();

  try {
    await preloadImages(siteImages);
  } catch (error) {
    // Ignore preload errors and continue to the page load fallback.
  }

  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (error) {
      // Ignore font loading issues and continue.
    }
  }

  hideLoader();
}

waitForPageAssets();

const nav = [
  { path: "/", label: "Home", title: "OVERDOSE — Next Gen", hash: "#/" },
  { path: "/download", label: "PUBG", title: "PUBG — OVERDOSE", hash: "#/download" },
  { path: "/overdose", label: "Overdose", title: "Overdose — OVERDOSE", hash: "#/overdose" },
  { path: "/status", label: "Status", title: "Status — OVERDOSE", hash: "#/status" },
  { path: "/logs", label: "Logs", title: "Logs — OVERDOSE", hash: "#/logs" },
  { path: "/credits", label: "Credits", title: "Credits — OVERDOSE", hash: "#/credits" },
];

const app = document.querySelector("#app");
const menu = document.querySelector("#site-menu");
const menuBtn = document.querySelector(".menu-btn");
const scrim = document.querySelector(".scrim");
const pageTitle = document.querySelector("#page-title");
const themeSwitch = document.querySelector(".theme-switch");
const links = [...document.querySelectorAll("[data-link]")];
let statusAnimationTimer = null;
let statusCounterTimer = null;
let statusPulseTimers = [];

function getRandomUserCount(counter, label, isInitial = false) {
  const min = 800;
  const max = label.includes("PUBG Taiwan") ? 2000 : 3000;
  const current = Number(counter?.dataset.current || 0);

  if (isInitial || current < min) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  const maxChange = label.includes("PUBG Taiwan") ? 120 : 120;
  const delta = Math.floor(Math.random() * (maxChange * 2 + 1)) - maxChange;
  const next = current + delta;
  return Math.max(min, Math.min(max, next));
}

function animateCounter(counter, targetValue, duration = 1100) {
  if (!counter) return;
  const startValue = Number(counter.dataset.current || 0) || 0;
  const startTime = performance.now();

  const step = () => {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(1, elapsed / duration);
    const currentValue = Math.round(startValue + (targetValue - startValue) * progress);
    counter.textContent = currentValue.toLocaleString();
    counter.dataset.current = currentValue;
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
}

function animateListCounters(isInitial = false) {
  document.querySelectorAll(".list-row").forEach((row, index) => {
    const counter = row.querySelector(".count");
    const label = row.querySelector(".lbl")?.textContent || "";
    const targetValue = getRandomUserCount(counter, label, isInitial);
    const duration = 1100 + index * 180;
    animateCounter(counter, targetValue, duration);
  });
}

function applyTheme(isLight) {
  document.body.classList.toggle("light-mode", isLight);
  if (!themeSwitch) return;

  themeSwitch.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
  themeSwitch.innerHTML = isLight
    ? `<svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" /></svg>`
    : `<svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><circle cx="12" cy="12" r="5" /><path d="M12 1v2" /><path d="M12 21v2" /><path d="M4.22 4.22l1.42 1.42" /><path d="M18.36 18.36l1.42 1.42" /><path d="M1 12h2" /><path d="M21 12h2" /><path d="M4.22 19.78l1.42-1.42" /><path d="M18.36 5.64l1.42-1.42" /></svg>`;
}

function loadTheme() {
  const stored = window.localStorage.getItem("overdose-theme");
  const isLight = stored !== "dark";
  applyTheme(isLight);
}

function toggleTheme() {
  const isLight = !document.body.classList.contains("light-mode");
  applyTheme(isLight);
  window.localStorage.setItem("overdose-theme", isLight ? "light" : "dark");
}

function startPulseDots() {
  statusPulseTimers.forEach((timer) => clearInterval(timer));
  statusPulseTimers = [];

  document.querySelectorAll(".list-row").forEach((row, index) => {
    const dot = row.querySelector(".dot");
    if (!dot) return;

    const startDelay = index * 1100;
    const timer = window.setInterval(() => {
      const current = dot.dataset.state === "red" ? "green" : "red";
      dot.dataset.state = current;
      dot.style.background = current === "red" ? "#ff5a5a" : "#2ecc71";
      dot.style.boxShadow = current === "red"
        ? "0 0 0 0 rgba(255, 90, 90, 0.4)"
        : "0 0 0 0 rgba(46, 204, 113, 0.4)";
    }, 1800);

    statusPulseTimers.push(timer);
    window.setTimeout(() => {
      dot.dataset.state = "green";
      dot.style.background = "#2ecc71";
      dot.style.boxShadow = "0 0 0 0 rgba(46, 204, 113, 0.4)";
    }, startDelay);
  });
}

function normalize(path = "/") {
  const value = typeof path === "string" ? path : "/";
  const withoutHash = value.startsWith("#") ? value.slice(1) : value;
  const clean = withoutHash.replace(/\/$/, "") || "/";
  return nav.some((item) => item.path === clean) ? clean : "/";
}

function routeHash(path = "/") {
  const currentPath = normalize(path);
  const item = nav.find((entry) => entry.path === currentPath);
  return item ? item.hash : "#/";
}

function getCurrentRoute() {
  if (location.hash) {
    return normalize(location.hash);
  }
  return normalize(location.pathname);
}

function openMenu() {
  menu.classList.add("open");
  scrim.classList.add("open");
  menuBtn.classList.add("open");
  menuBtn.setAttribute("aria-expanded", "true");
  menuBtn.setAttribute("aria-label", "Close menu");
  menu.setAttribute("aria-hidden", "false");
  document.body.classList.add("menu-open");
}

function closeMenu() {
  menu.classList.remove("open");
  scrim.classList.remove("open");
  menuBtn.classList.remove("open");
  menuBtn.setAttribute("aria-expanded", "false");
  menuBtn.setAttribute("aria-label", "Open menu");
  menu.setAttribute("aria-hidden", "true");
  document.body.classList.remove("menu-open");
}

function resetMenuState() {
  if (!menu || !scrim || !menuBtn) return;
  menu.classList.remove("open");
  scrim.classList.remove("open");
  menuBtn.classList.remove("open");
  menuBtn.setAttribute("aria-expanded", "false");
  menuBtn.setAttribute("aria-label", "Open menu");
  menu.setAttribute("aria-hidden", "true");
  document.body.classList.remove("menu-open");
}

let lastScrollY = window.scrollY || 0;
let menuAutoCloseTimer = null;

function handleScrollAutoClose() {
  const currentScrollY = window.scrollY || 0;
  const shouldClose = menu.classList.contains("open") && Math.abs(currentScrollY - lastScrollY) > 4;

  if (shouldClose) {
    closeMenu();
  }

  lastScrollY = currentScrollY;
}

function getTemplate(id) {
  const template = document.getElementById(id);
  return template ? template.innerHTML : "";
}

function homePage() {
  return getTemplate("home-template");
}

function downloadPage() {
  return getTemplate("download-template");
}

function overdosePage() {
  return getTemplate("overdose-template");
}

function statusPage() {
  return getTemplate("status-template");
}

function logsPage() {
  return getTemplate("logs-template");
}

function creditsPage() {
  return getTemplate("credits-template");
}

const pages = { "/": homePage, "/download": downloadPage, "/overdose": overdosePage, "/status": statusPage, "/logs": logsPage, "/credits": creditsPage };

function bindPageActions() {
  document.querySelectorAll(".install-btn").forEach((button) => {
    button.addEventListener("click", () => {
      button.disabled = true;
      button.innerHTML = '<span class="spinner"></span> Installing…';
      setTimeout(() => { button.disabled = false; button.textContent = "Install"; }, 1400);
    });
  });
  const rescan = document.querySelector("#rescan");
  if (rescan) {
    rescan.addEventListener("click", () => {
      rescan.disabled = true;
      rescan.innerHTML = '<span class="spinner"></span> Scanning…';
      setTimeout(() => render("/status", false), 1200);
    });
  }

  clearInterval(statusCounterTimer);
  animateListCounters(true);
  startPulseDots();
  statusCounterTimer = window.setInterval(() => {
    animateListCounters(false);
    startPulseDots();
  }, 10000);

  const latencyCard = document.querySelector(".latency-card");
  if (!latencyCard) return;

  const latencyValue = latencyCard.querySelector(".latency-value");
  const latencyBar = latencyCard.querySelector(".latency-bar");
  if (!latencyValue || !latencyBar) return;

  const activeNodesCard = Array.from(document.querySelectorAll(".dash-card")).find((card) => {
    const title = card.querySelector(".k")?.textContent?.trim() || "";
    return title.includes("Active Nodes");
  });
  const activeNodesBar = activeNodesCard?.querySelector(".bar span");
  const activeNodesValue = activeNodesCard?.querySelector(".v");
  const activeNodesTargetWidth = activeNodesBar ? Number(activeNodesBar.style.width.replace("%", "")) || 82 : 82;
  const activeNodesTargetValue = activeNodesValue ? Number((activeNodesValue.textContent || "0").replace(/,/g, "")) || 1284 : 1284;

  const progressBars = Array.from(document.querySelectorAll(".dash-card"))
    .filter((card) => {
      const title = card.querySelector(".k")?.textContent?.trim() || "";
      return title.includes("Network Matrix") || title.includes("Security");
    })
    .map((card) => ({
      card,
      bar: card.querySelector(".bar span"),
      targetWidth: Number(card.querySelector(".bar span")?.style.width.replace("%", "")) || 0,
    }));

  progressBars.forEach(({ bar, targetWidth }) => {
    if (!bar) return;
    bar.style.transition = "width 1400ms ease";
    bar.style.width = "0%";
    requestAnimationFrame(() => {
      bar.style.width = `${targetWidth}%`;
    });
  });

  let latency = 18;
  const breathe = () => {
    latencyCard.classList.remove("breathing");
    void latencyCard.offsetWidth;
    latencyCard.classList.add("breathing");

    const nextLatency = Math.max(18, Math.min(25, latency + (Math.random() > 0.5 ? 1 : -1)));
    latency = nextLatency;
    latencyValue.textContent = `${latency} ms`;
    latencyValue.style.color = "#7ceea3";

    const width = 18 + ((latency - 18) / 7) * 74;
    latencyBar.style.width = `${Math.max(18, Math.min(92, width))}%`;
  };

  if (activeNodesCard && activeNodesBar && activeNodesValue) {
    activeNodesValue.textContent = "0";
    activeNodesBar.style.transition = "width 2600ms ease";
    activeNodesBar.style.width = "0%";

    let activeNodesAnimated = false;
    const animateActiveNodes = () => {
      if (activeNodesAnimated) return;
      activeNodesAnimated = true;

      void activeNodesBar.offsetWidth;
      activeNodesBar.style.width = `${activeNodesTargetWidth}%`;

      const startTime = performance.now();
      const duration = 2600;
      const animateNumber = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(1, elapsed / duration);
        const currentValue = Math.round(activeNodesTargetValue * progress);
        activeNodesValue.textContent = currentValue.toLocaleString();
        if (progress < 1) {
          requestAnimationFrame(animateNumber);
        }
      };

      requestAnimationFrame(animateNumber);
    };

    const activeNodesObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateActiveNodes();
          observer.disconnect();
        }
      });
    }, { threshold: 0.25 });

    activeNodesObserver.observe(activeNodesCard);
  }

  breathe();
  window.clearInterval(statusAnimationTimer);
  statusAnimationTimer = window.setInterval(breathe, 1100);
}

function updateLinks(path) {
  const currentPath = normalize(path);
  links.forEach((link) => {
    const hrefPath = normalize(link.getAttribute("href") || "/");
    link.classList.toggle("active", hrefPath === currentPath);
  });
  document.querySelectorAll("main [data-link]").forEach((link) => {
    link.addEventListener("click", navigate);
  });
}

let revealObserver;
function initReveals() {
  if (revealObserver) revealObserver.disconnect();
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) { els.forEach(el => el.classList.add("in")); return; }
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); revealObserver.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  els.forEach((el) => revealObserver.observe(el));
}

let parallaxRAF = 0;
function onScroll() {
  if (parallaxRAF) return;
  parallaxRAF = requestAnimationFrame(() => {
    parallaxRAF = 0;
    const y = window.scrollY || 0;
    document.documentElement.style.setProperty("--pY", (y * 0.35) + "px");
    const hero = document.querySelector(".hero");
    if (hero) {
      const scale = Math.min(1.18, 1 + y / 1200);
      const lift = Math.max(-40, -y * 0.08);
      hero.style.setProperty("--heroScale", scale.toFixed(3));
      hero.style.setProperty("--heroLift", lift.toFixed(1) + "px");
    }
  });
}

async function render(path = getCurrentRoute(), push = true) {
  const currentPath = normalize(path);
  const current = nav.find((item) => item.path === currentPath) || nav[0];
  const nextHash = routeHash(currentPath);

  if (push) {
    if (location.hash !== nextHash) {
      history.pushState({}, "", nextHash);
    }
  } else if (location.hash !== nextHash) {
    history.replaceState({}, "", nextHash);
  }

  document.title = current.title;
  pageTitle.textContent = current.label;
  app.style.opacity = "0";
  app.style.transform = "translateY(8px)";

  requestAnimationFrame(() => {
    app.innerHTML = pages[currentPath]();
    updateLinks(currentPath);
    bindPageActions();
    closeMenu();
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    app.style.transition = "opacity .35s ease, transform .35s cubic-bezier(.2,.7,.2,1)";
    app.style.opacity = "1";
    app.style.transform = "none";
    initReveals();
    onScroll();
    app.focus({ preventScroll: true });
  });
}

function navigate(event) {
  const href = event.currentTarget.getAttribute("href");
  if (!href || href.startsWith("http")) return;
  event.preventDefault();
  render(normalize(href));
}

if (menuBtn) {
  menuBtn.addEventListener("click", () => menu?.classList.contains("open") ? closeMenu() : openMenu());
}
if (scrim) {
  scrim.addEventListener("click", closeMenu);
}
links.forEach((link) => link.addEventListener("click", navigate));
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeMenu(); });
if (themeSwitch) {
  themeSwitch.addEventListener("click", toggleTheme);
}
window.addEventListener("popstate", () => render(getCurrentRoute(), false));
window.addEventListener("hashchange", () => render(getCurrentRoute(), false));
window.addEventListener("scroll", () => {
  onScroll();
  handleScrollAutoClose();
}, { passive: true });

resetMenuState();
loadTheme();
render(getCurrentRoute(), false);