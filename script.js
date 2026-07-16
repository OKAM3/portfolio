// --------- Single-page navigation ----------
const sections = ["projects", "skills", "experience", "contact"];
const titles = {
  projects: ["Projects", "Hands-on server administration projects and home lab builds."],
  skills: ["Skills", "Operating systems, virtualization, security, scripting, and networking fundamentals."],
  experience: ["Experience", "Certifications, education, and the work that supports real sysadmin workflows."],
  contact: ["Contact", "Reach out for internships, job opportunities, or collaboration."]
};

const navButtons = [...document.querySelectorAll(".nav-btn")];
const pageTitle = document.getElementById("pageTitle");
const pageDesc = document.getElementById("pageDesc");
const navIndicator = document.getElementById("navIndicator");

function moveNavIndicator(btn){
  if (!navIndicator || !btn) return;
  const navRect = btn.parentElement.getBoundingClientRect();
  const r = btn.getBoundingClientRect();
  navIndicator.style.opacity = "1";
  navIndicator.style.height = r.height + "px";
  navIndicator.style.transform = `translateY(${r.top - navRect.top}px)`;
}

function showSection(id){
  sections.forEach(s => {
    const el = document.getElementById(s);
    el.hidden = (s !== id);
  });
  navButtons.forEach(b => b.setAttribute("aria-current", b.dataset.target === id ? "page" : "false"));
  pageTitle.textContent = titles[id][0];
  pageDesc.textContent = titles[id][1];
  history.replaceState(null, "", "#" + id);

  const activeBtn = navButtons.find(b => b.dataset.target === id);
  moveNavIndicator(activeBtn);

  // Stagger-in the cards for the newly visible section
  const grid = document.querySelector(`#${id} .grid`);
  if (grid){
    grid.classList.remove("entering");
    // force reflow so the animation replays every time
    void grid.offsetWidth;
    grid.classList.add("entering");
  }

  // Animate skill meters into view the first time Skills is shown
  if (id === "skills") animateSkillMeters();
}

navButtons.forEach(btn => {
  btn.addEventListener("click", () => showSection(btn.dataset.target));
});

// On load, respect hash
const hash = (location.hash || "#projects").replace("#","");
showSection(sections.includes(hash) ? hash : "projects");
window.addEventListener("resize", () => {
  const activeBtn = navButtons.find(b => b.getAttribute("aria-current") === "page");
  moveNavIndicator(activeBtn);
});

// --------- Skill meters ----------
let skillsAnimated = false;
function animateSkillMeters(){
  if (skillsAnimated) return;
  skillsAnimated = true;
  document.querySelectorAll(".skill-meter").forEach((meter, i) => {
    const pct = Number(meter.dataset.percent || 0);
    const fill = meter.querySelector(".skill-meter-fill");
    const val = meter.querySelector(".skill-meter-val");
    setTimeout(() => {
      fill.style.width = pct + "%";
      countUp(val, 0, pct, 700, "%");
    }, i * 110);
  });
}

function countUp(el, from, to, duration, suffix=""){
  const start = performance.now();
  function frame(now){
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const current = Math.round(from + (to - from) * eased);
    el.textContent = current + suffix;
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// --------- Clock + "session" timer ----------
const clock = document.getElementById("clock");
const uptimeText = document.getElementById("uptimeText");
const start = Date.now();

function tick(){
  const now = new Date();
  clock.textContent = now.toLocaleTimeString([], {hour12:false});
  const elapsed = Math.floor((Date.now() - start)/1000);
  const h = String(Math.floor(elapsed/3600)).padStart(2,"0");
  const m = String(Math.floor((elapsed%3600)/60)).padStart(2,"0");
  const s = String(elapsed%60).padStart(2,"0");
  uptimeText.textContent = `Session: ${h}:${m}:${s}`;
  requestAnimationFrame(() => setTimeout(tick, 250));
}
tick();

// --------- Demo interactions ----------
const runCheckBtn = document.getElementById("runCheck");
const telemetryBadge = document.getElementById("telemetryBadge");

const GAUGE_CIRC = 131.9; // 2 * PI * r(21)
function setGaugeRing(ringId, pct){
  const ring = document.getElementById(ringId);
  if (!ring) return;
  ring.style.strokeDashoffset = String(GAUGE_CIRC * (1 - pct / 100));
}
function setGauge(ringId, valId, pct, suffix="%"){
  setGaugeRing(ringId, pct);
  const val = document.getElementById(valId);
  if (!val) return;
  countUp(val, Number(val.dataset.last || 0), pct, 700, suffix);
  val.dataset.last = pct;
}

function refreshTelemetry(){
  const cpu = Math.round(20 + Math.random()*55);
  const mem = Math.round(30 + Math.random()*45);
  const disk = Math.round(35 + Math.random()*40);
  const vms = Math.round(2 + Math.random()*5);
  const vmsMax = 8;
  setGauge("gaugeCpu", "valCpu", cpu);
  setGauge("gaugeMem", "valMem", mem);
  setGauge("gaugeDisk", "valDisk", disk);
  setGaugeRing("gaugeVms", Math.round(vms / vmsMax * 100));
  const vmsVal = document.getElementById("valVms");
  countUp(vmsVal, Number(vmsVal.dataset.last || 0), vms, 500, "");
  vmsVal.dataset.last = vms;

  if (telemetryBadge){
    telemetryBadge.textContent = "Updated just now";
    telemetryBadge.classList.add("good");
    clearTimeout(refreshTelemetry._t);
    refreshTelemetry._t = setTimeout(() => { telemetryBadge.textContent = "Live Snapshot"; }, 2200);
  }
}

runCheckBtn.addEventListener("click", () => {
  const original = runCheckBtn.textContent;
  runCheckBtn.disabled = true;
  runCheckBtn.textContent = "Refreshing…";
  refreshTelemetry();
  setTimeout(() => {
    runCheckBtn.disabled = false;
    runCheckBtn.textContent = original;
  }, 650);
});

// Pull an initial reading once things settle on load
setTimeout(refreshTelemetry, 400);

function fakeSubmit(){
  const status = document.getElementById("formStatus");
  const form = document.querySelector(".form");
  status.textContent = "Sending…";
  setTimeout(() => {
    status.innerHTML = `
      <span class="form-success">
        <svg width="20" height="20" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(53,208,127,.35)" stroke-width="2"></circle>
          <path class="fs-check" d="M7 12.5l3.2 3.2L17 8.5"></path>
        </svg>
        Message sent (demo) — thanks for reaching out! Wire this form up to a backend to make it real.
      </span>`;
    if (form) form.reset();
  }, 700);
}
window.fakeSubmit = fakeSubmit;

// --------- Button ripple ----------
document.querySelectorAll(".btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.6;
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = (e.clientX - rect.left - size/2) + "px";
    ripple.style.top = (e.clientY - rect.top - size/2) + "px";
    btn.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  });
});

// --------- Cursor-tracked spotlight ----------
const spotlight = document.getElementById("spotlight");
if (spotlight && window.matchMedia && !window.matchMedia("(prefers-reduced-motion: reduce)").matches){
  let spotlightRaf = null;
  window.addEventListener("pointermove", (e) => {
    if (spotlightRaf) return;
    spotlightRaf = requestAnimationFrame(() => {
      spotlight.style.setProperty("--mx", e.clientX + "px");
      spotlight.style.setProperty("--my", e.clientY + "px");
      spotlight.classList.add("active");
      spotlightRaf = null;
    });
  });
  window.addEventListener("pointerleave", () => spotlight.classList.remove("active"));
}

// --------- Card cursor-glow ----------
document.querySelectorAll(".card").forEach(card => {
  card.addEventListener("pointermove", (e) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--cx", (e.clientX - rect.left) + "px");
    card.style.setProperty("--cy", (e.clientY - rect.top) + "px");
  });
});

// --------- Shooting stars background (subtle, smooth) ----------
const canvas = document.getElementById("stars");
const ctx = canvas.getContext("2d", { alpha: true });
let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

function resize(){
  w = canvas.width = Math.floor(window.innerWidth * dpr);
  h = canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
}
window.addEventListener("resize", resize);
resize();

const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const MAX_TRAILS = 8;                 // subtle
const SPAWN_INTERVAL_MS = 900;        // cadence
const TRAIL_LEN = 180;                // px
const BASE_SPEED = 900;               // px/sec
const ANGLE = Math.PI * (210/180);    // down-left
const stars = [];
let lastSpawn = 0;
let enabled = true;

function spawnStar(){
  if (stars.length >= MAX_TRAILS) return;

  // spawn from top/right edges for diagonal travel
  const fromTop = Math.random() < 0.45;
  const x = fromTop ? randf(0.55*w, 1.05*w) : randf(0.75*w, 1.10*w);
  const y = fromTop ? randf(-0.15*h, 0.25*h) : randf(-0.10*h, 0.45*h);

  const speed = (BASE_SPEED * randf(0.65, 1.05)) * dpr;
  const len = (TRAIL_LEN * randf(0.65, 1.10)) * dpr;
  const life = randf(0.85, 1.35); // seconds
  const width = randf(1.0, 1.8) * dpr;

  // soft purple-white
  const hue = randf(255, 278);
  const sat = randf(70, 90);
  const light = randf(65, 88);

  stars.push({
    x, y,
    vx: Math.cos(ANGLE) * speed,
    vy: Math.sin(ANGLE) * speed,
    len,
    life,
    age: 0,
    width,
    hue, sat, light,
    twinkle: randf(0.7, 1.2)
  });
}

function randf(min,max){ return Math.random()*(max-min)+min; }
function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }

function draw(t){
  if (!enabled || prefersReduced){
    ctx.clearRect(0,0,w,h);
    return requestAnimationFrame(draw);
  }

  // delta time
  if (!draw.last) draw.last = t;
  const dt = Math.min((t - draw.last) / 1000, 0.033);
  draw.last = t;

  ctx.clearRect(0,0,w,h);

  // subtle vignette haze
  const grad = ctx.createRadialGradient(w*0.5, h*0.18, 0, w*0.5, h*0.18, Math.max(w,h)*0.7);
  grad.addColorStop(0, "rgba(185,140,255,0.10)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,w,h);

  // spawn logic
  if (t - lastSpawn > SPAWN_INTERVAL_MS * randf(0.7, 1.3)){
    spawnStar();
    lastSpawn = t;
  }

  // update & draw stars
  for (let i = stars.length - 1; i >= 0; i--){
    const s = stars[i];
    s.age += dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;

    const p = clamp(s.age / s.life, 0, 1);
    const fade = (1 - p) * (p < 0.12 ? (p/0.12) : 1);

    const norm = Math.hypot(s.vx, s.vy);
    const tx = s.x - (s.vx / norm) * s.len;
    const ty = s.y - (s.vy / norm) * s.len;

    const alphaHead = 0.50 * fade;

    const lg = ctx.createLinearGradient(s.x, s.y, tx, ty);
    lg.addColorStop(0, `hsla(${s.hue}, ${s.sat}%, ${s.light}%, ${alphaHead})`);
    lg.addColorStop(1, `hsla(${s.hue}, ${s.sat}%, ${Math.max(30, s.light-25)}%, 0)`);

    ctx.strokeStyle = lg;
    ctx.lineWidth = s.width;
    ctx.lineCap = "round";

    ctx.shadowColor = `hsla(${s.hue}, ${s.sat}%, ${s.light}%, ${0.35 * fade})`;
    ctx.shadowBlur = 12 * dpr;

    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(tx, ty);
    ctx.stroke();

    // tiny sparkle at head
    const sparkle = (0.6 + 0.4*Math.sin((t/120) * s.twinkle)) * fade;
    ctx.fillStyle = `hsla(${s.hue}, ${s.sat}%, ${Math.min(96, s.light+10)}%, ${0.25 * sparkle})`;
    ctx.shadowBlur = 10 * dpr;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 2.2*dpr, 0, Math.PI*2);
    ctx.fill();

    if (s.age >= s.life || s.x < -0.25*w || s.y > 1.35*h){
      stars.splice(i, 1);
    }
  }

  ctx.shadowBlur = 0;
  requestAnimationFrame(draw);
}

// Toggle background FX
const toggle = document.getElementById("toggleStars");
toggle.addEventListener("click", () => {
  enabled = !enabled;
  toggle.setAttribute("aria-pressed", String(enabled));
  toggle.textContent = enabled ? "Toggle Background FX" : "Enable Background FX";
  if (!enabled) ctx.clearRect(0,0,w,h);
});

requestAnimationFrame(draw);