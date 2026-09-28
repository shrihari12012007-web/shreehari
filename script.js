/* ============================================================
   SHREE HARI S B — PORTFOLIO SCRIPT
   Features:
   • Scroll-reactive canvas background (particles + glow)
   • Background color mood shifts per section on scroll
   • Typing animation
   • Scroll reveal (medium speed)
   • Active nav tracking
   • Mobile menu
   ============================================================ */

// ── 1. CANVAS BACKGROUND ─────────────────────────────────────
const canvas = document.getElementById('bg-canvas');
const ctx    = canvas.getContext('2d');

// Section color palettes — [r, g, b] for the accent glow
const SECTION_PALETTES = {
  home:      { bg: [6,  6,  8],  accent: [80, 160, 255], name: 'home' },
  about:     { bg: [6,  6,  10], accent: [120, 80, 255],  name: 'about' },
  skills:    { bg: [4,  8,  10], accent: [0,  200, 180],  name: 'skills' },
  projects:  { bg: [8,  6,  10], accent: [160, 80, 255],  name: 'projects' },
  education: { bg: [6,  8,  6],  accent: [80, 200, 120],  name: 'education' },
  contact:   { bg: [8,  6,  6],  accent: [255, 100, 80],  name: 'contact' },
};

// Current and target palette (for smooth interpolation)
let currentPalette  = { ...SECTION_PALETTES.home };
let targetPalette   = { ...SECTION_PALETTES.home };
let lerpProgress    = 1; // 0 → 1 (transition progress)
const LERP_SPEED    = 0.025; // controls transition smoothness (medium)

function lerp(a, b, t) { return a + (b - a) * t; }
function lerpColor(a, b, t) {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

// ── Particle System ──
const PARTICLE_COUNT = 70;
const particles = [];

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', () => { resize(); initParticles(); });

class Particle {
  constructor() { this.reset(true); }
  reset(randomY = false) {
    this.x  = Math.random() * canvas.width;
    this.y  = randomY ? Math.random() * canvas.height : canvas.height + 10;
    this.r  = Math.random() * 1.5 + 0.3;
    this.vx = (Math.random() - 0.5) * 0.35;
    this.vy = -(Math.random() * 0.4 + 0.1);
    this.alpha = Math.random() * 0.5 + 0.1;
    this.pulse = Math.random() * Math.PI * 2;
    this.pulseSpeed = Math.random() * 0.02 + 0.008;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.pulse += this.pulseSpeed;
    if (this.y < -10 || this.x < -20 || this.x > canvas.width + 20) this.reset();
  }
}

function initParticles() {
  particles.length = 0;
  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());
}
initParticles();

// ── Draw ──
function drawBackground(bg, accent) {
  // Base fill
  ctx.fillStyle = `rgb(${bg[0]},${bg[1]},${bg[2]})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle radial gradient glow in the top-left area
  const g1 = ctx.createRadialGradient(
    canvas.width * 0.2, canvas.height * 0.2, 0,
    canvas.width * 0.2, canvas.height * 0.2, canvas.width * 0.55
  );
  g1.addColorStop(0, `rgba(${accent[0]},${accent[1]},${accent[2]},0.07)`);
  g1.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Second glow bottom-right
  const g2 = ctx.createRadialGradient(
    canvas.width * 0.85, canvas.height * 0.75, 0,
    canvas.width * 0.85, canvas.height * 0.75, canvas.width * 0.4
  );
  g2.addColorStop(0, `rgba(${accent[0]},${accent[1]},${accent[2]},0.05)`);
  g2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawParticles(accent) {
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const pulsedAlpha = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));

    // Draw connection lines between close particles
    for (let j = i + 1; j < particles.length; j++) {
      const q = particles[j];
      const dx = p.x - q.x, dy = p.y - q.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 130) {
        const lineAlpha = (1 - dist / 130) * 0.12;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${accent[0]},${accent[1]},${accent[2]},${lineAlpha})`;
        ctx.lineWidth = 0.6;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
    }

    // Draw particle dot
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${accent[0]},${accent[1]},${accent[2]},${pulsedAlpha})`;
    ctx.fill();
  }
}

// ── Animation Loop ──
function animate() {
  requestAnimationFrame(animate);

  // Smoothly lerp toward target palette
  if (lerpProgress < 1) {
    lerpProgress = Math.min(1, lerpProgress + LERP_SPEED);
    const t = easeInOut(lerpProgress);
    currentPalette = {
      bg:     lerpColor(currentPalette._fromBg     || currentPalette.bg,     targetPalette.bg,     t),
      accent: lerpColor(currentPalette._fromAccent || currentPalette.accent, targetPalette.accent, t),
    };
  }

  const { bg, accent } = currentPalette;
  drawBackground(bg, accent);

  particles.forEach(p => p.update());
  drawParticles(accent);
}

function easeInOut(t) {
  return t < 0.5 ? 2*t*t : -1 + (4-2*t)*t;
}

animate();

// ── 2. SCROLL → CHANGE BACKGROUND PER SECTION ────────────────
const sectionIds = Object.keys(SECTION_PALETTES);
let lastSection  = 'home';

function detectActiveSection() {
  const scrollY      = window.scrollY;
  const viewportMid  = scrollY + window.innerHeight * 0.4;

  let active = sectionIds[0];
  for (const id of sectionIds) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (el.offsetTop <= viewportMid) active = id;
  }
  return active;
}

window.addEventListener('scroll', () => {
  const section = detectActiveSection();
  if (section !== lastSection) {
    lastSection = section;
    const pal = SECTION_PALETTES[section];
    // Save current interpolated values as the "from"
    currentPalette._fromBg     = [...currentPalette.bg];
    currentPalette._fromAccent = [...currentPalette.accent];
    targetPalette  = pal;
    lerpProgress   = 0;
  }
}, { passive: true });

// ── 3. TYPING ANIMATION ───────────────────────────────────────
const typingEl = document.getElementById('typing');
const words    = ['CSE Student', 'AI Enthusiast', 'Python Developer', 'Problem Solver', 'Future Software Engineer'];
let wordIdx = 0, charIdx = 0, deleting = false;

function type() {
  const word = words[wordIdx];
  typingEl.textContent = deleting
    ? word.substring(0, charIdx - 1)
    : word.substring(0, charIdx + 1);
  deleting ? charIdx-- : charIdx++;

  if (!deleting && charIdx === word.length) {
    deleting = true;
    return setTimeout(type, 2000);
  }
  if (deleting && charIdx === 0) {
    deleting = false;
    wordIdx = (wordIdx + 1) % words.length;
  }
  setTimeout(type, deleting ? 45 : 85);
}
type();

// ── 4. NAVBAR SCROLL ──────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });

// ── 5. MOBILE MENU ────────────────────────────────────────────
const menuBtn = document.getElementById('menuBtn');
const navMenu = document.getElementById('navMenu');
menuBtn.addEventListener('click', () => {
  menuBtn.classList.toggle('open');
  navMenu.classList.toggle('open');
});
navMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    menuBtn.classList.remove('open');
    navMenu.classList.remove('open');
  });
});

// ── 6. ACTIVE NAV LINK ────────────────────────────────────────
const navLinks = document.querySelectorAll('.nav-link');
const allSections = document.querySelectorAll('section[id]');

const navObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(l => l.classList.remove('active'));
      const active = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, { threshold: 0.35 });
allSections.forEach(s => navObserver.observe(s));

// ── 7. SCROLL REVEAL ─────────────────────────────────────────
const reveals = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
reveals.forEach(el => revealObserver.observe(el));
