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

function showSection(id){
  sections.forEach(s => {
    const el = document.getElementById(s);
    el.hidden = (s !== id);
  });
  navButtons.forEach(b => b.setAttribute("aria-current", b.dataset.target === id ? "page" : "false"));
  pageTitle.textContent = titles[id][0];
  pageDesc.textContent = titles[id][1];
  history.replaceState(null, "", "#" + id);
}

navButtons.forEach(btn => {
  btn.addEventListener("click", () => showSection(btn.dataset.target));
});

// On load, respect hash
const hash = (location.hash || "#projects").replace("#","");
showSection(sections.includes(hash) ? hash : "projects");

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

runCheckBtn.addEventListener("click", () => {
  const original = runCheckBtn.textContent;
  runCheckBtn.disabled = true;
  runCheckBtn.textContent = "Refreshing…";
  setTimeout(() => {
    runCheckBtn.disabled = false;
    runCheckBtn.textContent = original;
  }, 650);
});

function fakeSubmit(){
  const status = document.getElementById("formStatus");
  status.textContent = "Sending…";
  setTimeout(() => status.textContent = "Message sent (demo). Connect this form to a backend to enable real contact requests.", 700);
}
window.fakeSubmit = fakeSubmit;

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