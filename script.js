document.documentElement.classList.add("js");

// =====================================================================
//  YOUR LINKS: fill these in
//  Any link left as "" is hidden automatically, so nothing broken shows.
// =====================================================================
const LINKS = {
  linkedin: "https://www.linkedin.com/in/lance-nelson-578a84368/",
  github:   "https://github.com/OKAM3",
  resume:   "",   // e.g. "resume.pdf" (put the PDF in this folder)
  email:    "nlance225026@gmail.com"
};

document.querySelectorAll("[data-link]").forEach(el => {
  const key = el.dataset.link;
  const value = LINKS[key];
  if (!value) { el.hidden = true; return; }
  el.href = key === "email" ? "mailto:" + value : value;
});
document.querySelectorAll(".links").forEach(box => {
  if (![...box.children].some(c => !c.hidden)) box.hidden = true;
});

// ---------- Contact form: opens the visitor's email app, pre-filled ----------
const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");
if (!LINKS.email) contactForm.hidden = true; // no form that goes nowhere

contactForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(contactForm);
  const subject = `Portfolio contact from ${data.get("name")}`;
  const body = `${data.get("message")}\n\n— ${data.get("name")} (${data.get("email")})`;
  window.location.href =
    `mailto:${LINKS.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  formStatus.textContent = "Opening your email app… if nothing happens, email me at " + LINKS.email;
});

document.getElementById("year").textContent = new Date().getFullYear();

// ---------- Scroll reveal ----------
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(en => {
    if (en.isIntersecting){ en.target.classList.add("in"); revealObs.unobserve(en.target); }
  });
}, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
document.querySelectorAll(".reveal").forEach(el => revealObs.observe(el));

// ---------- Active nav link ----------
const navLinks = [...document.querySelectorAll(".nav nav a")];
const navObs = new IntersectionObserver((entries) => {
  entries.forEach(en => {
    if (en.isIntersecting){
      navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
    }
  });
}, { rootMargin: "-45% 0px -50% 0px" });
document.querySelectorAll("main section[id]").forEach(s => navObs.observe(s));

// ---------- Screenshot lightbox ----------
const lightbox = document.getElementById("lightbox");
const lbImg = lightbox.querySelector("img");
const lbCap = lightbox.querySelector(".lightbox-caption");
document.querySelectorAll(".shot img").forEach(img => {
  img.closest(".shot").addEventListener("click", () => {
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = img.closest(".shot").querySelector("figcaption")?.textContent || img.alt;
    lightbox.showModal();
  });
});
lightbox.querySelector(".lightbox-close").addEventListener("click", () => lightbox.close());
lightbox.addEventListener("click", (e) => { if (e.target === lightbox) lightbox.close(); });

// ---------- Project card glow follows the mouse ----------
document.querySelectorAll(".project").forEach(card => {
  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", (e.clientX - r.left) + "px");
    card.style.setProperty("--my", (e.clientY - r.top) + "px");
  });
});

// =====================================================================
//  PURPLE BLACK HOLE
//  Layers (back to front): starfield → far side of the accretion disk →
//  lensed halo (far disk bent over the top) → event horizon (shadow) →
//  photon ring → near side of the disk crossing in front.
// =====================================================================
const starCanvas = document.getElementById("starfield");
const sctx = starCanvas.getContext("2d");
const canvas = document.getElementById("blackhole");
const ctx = canvas.getContext("2d");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let W = 0, H = 0, DPR = 1;
let cx = 0, cy = 0, rh = 0;          // center + event-horizon radius
let mouseX = 0, mouseY = 0, offX = 0, offY = 0;
let running = !reduceMotion;
let particles = [];

const TILT = 0.2;                    // how edge-on the disk is (0 = edge-on)
const R_IN = 1.55, R_OUT = 4.6;      // disk radii, in units of horizon radius

// Colour bands from hot inner edge (near white-pink) to cool outer edge (deep violet)
const BANDS = 10;
const bandColors = Array.from({ length: BANDS }, (_, i) => {
  const t = i / (BANDS - 1);
  const hue = 300 - t * 42;          // 300 (pink-violet) → 258 (deep purple)
  const sat = 100 - t * 15;
  const light = 93 - t * 40;
  return `hsl(${hue}, ${sat}%, ${light}%)`;
});

function makeParticles(){
  const count = W > 900 ? 3200 : 2000;
  particles = Array.from({ length: count }, () => {
    const u = Math.pow(Math.random(), 1.7);      // denser near the inner edge
    const rn = R_IN + (R_OUT - R_IN) * u;
    return {
      rn,
      a: Math.random() * Math.PI * 2,
      w: 0.85 * Math.pow(R_IN / rn, 1.5),        // Kepler-ish: inner orbits faster
      size: (Math.random() * 1.3 + 0.7),
      alpha: (0.5 + Math.random() * 0.5) * (1 - u * 0.5),
      band: Math.min(BANDS - 1, Math.floor(u * BANDS)),
      wobble: (Math.random() - 0.5) * 0.06       // slight disk thickness
    };
  });
}

function layout(){
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  for (const c of [starCanvas, canvas]){
    c.width = Math.floor(W * DPR);
    c.height = Math.floor(H * DPR);
  }
  sctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  if (W > 900){
    cx = W * 0.7; cy = H * 0.5; rh = Math.min(W, H) * 0.095;
  } else {
    cx = W * 0.5; cy = H * 0.27; rh = Math.min(W, H) * 0.12;
  }
  drawStars();
  makeParticles();
  if (!running) drawFrame(0, true);
}

function drawStars(){
  sctx.clearRect(0, 0, W, H);
  // faint nebula glow around the black hole
  const neb = sctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.7);
  neb.addColorStop(0, "rgba(120, 60, 255, 0.16)");
  neb.addColorStop(0.35, "rgba(80, 30, 160, 0.07)");
  neb.addColorStop(1, "rgba(0, 0, 0, 0)");
  sctx.fillStyle = neb;
  sctx.fillRect(0, 0, W, H);

  const n = Math.floor((W * H) / 2600);
  for (let i = 0; i < n; i++){
    const x = Math.random() * W, y = Math.random() * H;
    const r = Math.random() < 0.06 ? Math.random() * 1.2 + 0.8 : Math.random() * 0.8 + 0.2;
    const tint = Math.random();
    sctx.fillStyle = tint < 0.25 ? `rgba(200,170,255,${Math.random() * 0.7 + 0.2})`
                                 : `rgba(255,255,255,${Math.random() * 0.6 + 0.15})`;
    sctx.beginPath();
    sctx.arc(x, y, r, 0, Math.PI * 2);
    sctx.fill();
  }
}

function drawParticle(x, y, size, alpha){
  ctx.globalAlpha = alpha;
  ctx.fillRect(x - size / 2, y - size / 2, size, size);
}

function drawFrame(dt, still){
  const X = cx + offX, Y = cy + offY;

  // Fade the previous frame instead of clearing: gives motion-blur trails
  ctx.globalCompositeOperation = "destination-out";
  ctx.globalAlpha = 1;
  ctx.fillStyle = still ? "rgba(0,0,0,1)" : "rgba(0,0,0,0.2)";
  ctx.fillRect(0, 0, W, H);

  ctx.globalCompositeOperation = "lighter";

  // soft glow around the hole
  const glow = ctx.createRadialGradient(X, Y, rh * 0.9, X, Y, rh * 5);
  glow.addColorStop(0, "rgba(190, 120, 255, 0.07)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.globalAlpha = 1;
  ctx.fillStyle = glow;
  ctx.fillRect(X - rh * 5, Y - rh * 5, rh * 10, rh * 10);

  for (const p of particles) p.a += p.w * dt;

  // 1) far side of the disk + 2) its lensed image bent over the top
  for (let b = BANDS - 1; b >= 0; b--){
    ctx.fillStyle = bandColors[b];
    for (const p of particles){
      if (p.band !== b) continue;
      const s = Math.sin(p.a), c = Math.cos(p.a);
      if (s >= 0) continue;
      const r = p.rn * rh;
      const doppler = Math.max(0.25, 1 - 0.75 * c); // left side approaches → brighter
      drawParticle(X + r * c, Y + r * s * TILT + p.wobble * rh, p.size, p.alpha * doppler * 0.9);

      // lensed halo: far disk light curving over the top of the shadow
      const R = rh * (1.1 + (p.rn - R_IN) * 0.3);
      drawParticle(X + R * c, Y + R * s, p.size * 0.9, p.alpha * doppler * 0.8);
    }
  }

  // faint lensed image under the hole (light from the near side bent underneath)
  ctx.fillStyle = bandColors[1];
  for (const p of particles){
    const s = Math.sin(p.a);
    if (s <= 0 || p.rn > 2.6) continue;
    const c = Math.cos(p.a);
    const R = rh * (1.06 + (p.rn - R_IN) * 0.12);
    drawParticle(X + R * c, Y + R * s, p.size * 0.8, p.alpha * 0.22);
  }

  // 3) event horizon: pure black shadow with a soft edge
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  const shadow = ctx.createRadialGradient(X, Y, rh * 0.94, X, Y, rh * 1.08);
  shadow.addColorStop(0, "rgba(0,0,0,1)");
  shadow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.arc(X, Y, rh * 1.08, 0, Math.PI * 2);
  ctx.fill();

  // 4) photon ring
  ctx.globalCompositeOperation = "lighter";
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = "rgba(255, 220, 255, 0.55)";
  ctx.shadowColor = "rgba(190, 120, 255, 0.9)";
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(X, Y, rh * 1.03, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 5) near side of the disk, crossing in front of the shadow
  for (let b = BANDS - 1; b >= 0; b--){
    ctx.fillStyle = bandColors[b];
    for (const p of particles){
      if (p.band !== b) continue;
      const s = Math.sin(p.a);
      if (s < 0) continue;
      const c = Math.cos(p.a);
      const r = p.rn * rh;
      const doppler = Math.max(0.25, 1 - 0.75 * c);
      drawParticle(X + r * c, Y + r * s * TILT + p.wobble * rh, p.size * 1.2, Math.min(1, p.alpha * doppler * 1.3));
    }
  }

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

let last = 0;
function loop(t){
  if (!running){ last = 0; return; }
  const dt = last ? Math.min((t - last) / 1000, 0.05) : 0.016;
  last = t;
  // gentle parallax toward the mouse
  offX += (mouseX - offX) * 0.04;
  offY += (mouseY - offY) * 0.04;
  drawFrame(dt, false);
  requestAnimationFrame(loop);
}

function start(){
  if (running) return;
  running = true;
  requestAnimationFrame(loop);
}
function stop(){ running = false; }

window.addEventListener("resize", layout);
window.addEventListener("pointermove", (e) => {
  mouseX = (e.clientX / W - 0.5) * -24;
  mouseY = (e.clientY / H - 0.5) * -16;
});

// Fade the black hole down as you scroll so the content stays readable
function onScroll(){
  const p = Math.min(window.scrollY / (H * 0.8), 1);
  canvas.style.opacity = String(1 - p * 0.6);
}
window.addEventListener("scroll", onScroll, { passive: true });

// Pause when the tab is hidden (saves battery)
let userPaused = false;
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stop();
  else if (!userPaused && !reduceMotion) start();
});

// Footer pause/play button
const fxBtn = document.getElementById("toggleFx");
fxBtn.addEventListener("click", () => {
  userPaused = running;
  if (running) stop(); else start();
  fxBtn.textContent = running ? "Pause black hole" : "Play black hole";
  fxBtn.setAttribute("aria-pressed", String(running));
});
if (reduceMotion){
  fxBtn.textContent = "Play black hole";
  fxBtn.setAttribute("aria-pressed", "false");
}

layout();
onScroll();
if (running){ running = false; start(); }
