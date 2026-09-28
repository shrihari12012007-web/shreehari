/* ============================================================
   SHREE HARI S B — PORTFOLIO SCRIPT
   • Canvas background — particles + dual glow orbs
   • Mouse parallax   — glow orbs smoothly follow cursor
   • Scroll parallax  — particle layers shift on scroll
   • Section palette  — bg color shifts per section on scroll
   • Bidirectional reveal — slides UP on scroll-down, DOWN on scroll-up
   • Typing animation, active nav, mobile menu
   ============================================================ */

// ── 1. CANVAS SETUP ──────────────────────────────────────────
const canvas = document.getElementById('bg-canvas');
const ctx    = canvas.getContext('2d');

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', () => { resize(); initParticles(); });

// ── 2. MOUSE TRACKING (with smooth lag) ──────────────────────
let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let smoothMouse = { x: mouse.x, y: mouse.y };

window.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

// Touch support
window.addEventListener('touchmove', e => {
  mouse.x = e.touches[0].clientX;
  mouse.y = e.touches[0].clientY;
}, { passive: true });

// ── 3. SCROLL TRACKING ───────────────────────────────────────
let scrollY        = window.scrollY;
let smoothScrollY  = scrollY;
let scrollDir      = 0;          // +1 = down, -1 = up
let lastScrollY    = scrollY;

window.addEventListener('scroll', () => {
  scrollY   = window.scrollY;
  scrollDir = scrollY > lastScrollY ? 1 : -1;
  lastScrollY = scrollY;
}, { passive: true });

// ── 4. SECTION PALETTES ──────────────────────────────────────
const PALETTES = {
  home:      { bg: [5,  5,  8],  a: [80,  160, 255] },
  about:     { bg: [5,  5,  12], a: [110, 70,  255] },
  skills:    { bg: [4,  8,  10], a: [0,   210, 185] },
  projects:  { bg: [8,  5,  12], a: [160, 70,  255] },
  education: { bg: [5,  9,  5],  a: [70,  210, 120] },
  contact:   { bg: [10, 5,  5],  a: [255, 90,  70]  },
};

let curBg     = [...PALETTES.home.bg];
let curAccent = [...PALETTES.home.a];
let tgtBg     = [...PALETTES.home.bg];
let tgtAccent = [...PALETTES.home.a];
let palLerp   = 1;
const PAL_SPEED = 0.022;
let lastSection = 'home';

function lerp(a, b, t) { return a + (b - a) * t; }
function lerpArr(a, b, t) { return a.map((v, i) => lerp(v, b[i], t)); }
function ease(t) { return t < .5 ? 2*t*t : -1 + (4 - 2*t)*t; }

// ── 5. PARTICLES ─────────────────────────────────────────────
const PARTICLE_COUNT = 72;
const particles = [];

class Particle {
  constructor(randomY = false) {
    this.spawn(randomY);
  }
  spawn(randomY = false) {
    this.x      = Math.random() * canvas.width;
    this.y      = randomY ? Math.random() * canvas.height : canvas.height + 20;
    this.baseVx = (Math.random() - 0.5) * 0.3;
    this.baseVy = -(Math.random() * 0.35 + 0.08);
    this.r      = Math.random() * 1.6 + 0.3;
    this.alpha  = Math.random() * 0.45 + 0.1;
    this.depth  = Math.random() * 0.7 + 0.3;  // 0.3–1.0 (parallax layer)
    this.pulse  = Math.random() * Math.PI * 2;
    this.pSpeed = Math.random() * 0.018 + 0.007;
  }
  update(mouseOffX, mouseOffY, scrollOffY) {
    // Mouse parallax — closer particles (lower depth) shift more
    const mFactor = (1 - this.depth) * 0.04;
    const vx = this.baseVx + mouseOffX * mFactor;
    const vy = this.baseVy + mouseOffY * mFactor + scrollOffY * (1 - this.depth) * 0.006;

    this.x += vx;
    this.y += vy;
    this.pulse += this.pSpeed;

    if (this.y < -20 || this.x < -30 || this.x > canvas.width + 30) {
      this.spawn(false);
    }
  }
}

function initParticles() {
  particles.length = 0;
  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle(true));
}
initParticles();

// ── 6. DRAW ──────────────────────────────────────────────────
function drawFrame() {
  const bg = curBg, ac = curAccent;
  const W  = canvas.width, H = canvas.height;

  // Base fill
  ctx.fillStyle = `rgb(${bg[0]|0},${bg[1]|0},${bg[2]|0})`;
  ctx.fillRect(0, 0, W, H);

  // Glow orb 1 — follows mouse (top area)
  const g1x = smoothMouse.x;
  const g1y = smoothMouse.y;
  const grd1 = ctx.createRadialGradient(g1x, g1y, 0, g1x, g1y, Math.max(W, H) * 0.55);
  grd1.addColorStop(0, `rgba(${ac[0]},${ac[1]},${ac[2]},0.1)`);
  grd1.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grd1;
  ctx.fillRect(0, 0, W, H);

  // Glow orb 2 — opposite of mouse (bottom-right area)
  const g2x = W - smoothMouse.x * 0.5;
  const g2y = H - smoothMouse.y * 0.5;
  const grd2 = ctx.createRadialGradient(g2x, g2y, 0, g2x, g2y, W * 0.4);
  grd2.addColorStop(0, `rgba(${ac[0]},${ac[1]},${ac[2]},0.055)`);
  grd2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grd2;
  ctx.fillRect(0, 0, W, H);

  // Particle connections + dots
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const pa = p.alpha * (0.65 + 0.35 * Math.sin(p.pulse));

    for (let j = i + 1; j < particles.length; j++) {
      const q  = particles[j];
      const dx = p.x - q.x, dy = p.y - q.y;
      const d  = Math.sqrt(dx*dx + dy*dy);
      if (d < 130) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${ac[0]},${ac[1]},${ac[2]},${(1 - d/130) * 0.13})`;
        ctx.lineWidth = 0.5;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${ac[0]},${ac[1]},${ac[2]},${pa})`;
    ctx.fill();
  }
}

// ── 7. ANIMATION LOOP ────────────────────────────────────────
let prevScrollY = 0;

function animate() {
  requestAnimationFrame(animate);

  // Smooth mouse
  smoothMouse.x = lerp(smoothMouse.x, mouse.x, 0.055);
  smoothMouse.y = lerp(smoothMouse.y, mouse.y, 0.055);

  // Smooth scroll
  const scrollDelta = scrollY - prevScrollY;
  prevScrollY = lerp(prevScrollY, scrollY, 0.08);

  // Mouse offset relative to center (for particle parallax)
  const mouseOffX = mouse.x - canvas.width  / 2;
  const mouseOffY = mouse.y - canvas.height / 2;

  // Section palette transition
  if (palLerp < 1) {
    palLerp   = Math.min(1, palLerp + PAL_SPEED);
    const t   = ease(palLerp);
    curBg     = lerpArr(curBg,     tgtBg,     t);
    curAccent = lerpArr(curAccent, tgtAccent, t);
  }

  // Update particles with mouse + scroll parallax
  particles.forEach(p => p.update(mouseOffX, mouseOffY, scrollDelta));

  drawFrame();
}
animate();

// ── 8. SECTION SCROLL → PALETTE CHANGE ──────────────────────
const sectionIds = Object.keys(PALETTES);

window.addEventListener('scroll', () => {
  const mid = window.scrollY + window.innerHeight * 0.4;
  let active = sectionIds[0];
  for (const id of sectionIds) {
    const el = document.getElementById(id);
    if (el && el.offsetTop <= mid) active = id;
  }
  if (active !== lastSection) {
    lastSection = active;
    tgtBg     = [...PALETTES[active].bg];
    tgtAccent = [...PALETTES[active].a];
    palLerp   = 0;
  }
}, { passive: true });

// ── 9. MULTI-DIRECTION SCROLL REVEAL ─────────────────────────
// ↑ .reveal      = slides up   (scroll down entrance)
// ← .reveal-left = slides from left
// → .reveal-right= slides from right
// ⊙ .reveal-scale= zooms in (front-to-back)
// Each reverses direction when scrolling back up

const REVEAL_SELECTORS = '.reveal, .reveal-left, .reveal-right, .reveal-scale';
const reveals = document.querySelectorAll(REVEAL_SELECTORS);

function checkReveals() {
  reveals.forEach(el => {
    const rect   = el.getBoundingClientRect();
    const inView = rect.top < window.innerHeight - 50 && rect.bottom > 50;

    if (inView) {
      el.classList.remove('reveal-from-above');
      el.classList.add('visible');
    } else {
      el.classList.remove('visible');
      // Tag direction for re-entrance animation
      if (rect.top < 0) {
        // Element scrolled above viewport — will re-enter from top when scrolling up
        el.classList.add('reveal-from-above');
      } else {
        el.classList.remove('reveal-from-above');
      }
    }
  });
}

window.addEventListener('scroll', checkReveals, { passive: true });
checkReveals();

// ── 10. TYPING ANIMATION ─────────────────────────────────────
const typingEl = document.getElementById('typing');
const words    = ['CSE Student', 'AI Enthusiast', 'Python Developer', 'Problem Solver', 'Future Software Engineer'];
let wordIdx = 0, charIdx = 0, deleting = false;

function type() {
  const word = words[wordIdx];
  typingEl.textContent = deleting
    ? word.substring(0, charIdx - 1)
    : word.substring(0, charIdx + 1);
  deleting ? charIdx-- : charIdx++;

  if (!deleting && charIdx === word.length) { deleting = true; return setTimeout(type, 2000); }
  if (deleting && charIdx === 0) { deleting = false; wordIdx = (wordIdx + 1) % words.length; }
  setTimeout(type, deleting ? 45 : 85);
}
type();

// ── 11. NAVBAR SCROLL ────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });

// ── 12. MOBILE MENU ──────────────────────────────────────────
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

// ── 13. ACTIVE NAV LINK ──────────────────────────────────────
const navLinks    = document.querySelectorAll('.nav-link');
const allSections = document.querySelectorAll('section[id]');
const navObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(l => l.classList.remove('active'));
      const a = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
      if (a) a.classList.add('active');
    }
  });
}, { threshold: 0.35 });
allSections.forEach(s => navObserver.observe(s));

// ── 14. ONE-BY-ONE GLASS CARD STAGGER ────────────────────────
// When .skills-grid or .projects-grid scrolls into view,
// reveal each child card one by one with a 140ms gap.
const STAGGER_MS = 140;  // delay between each card appearing

function setupCardStagger(gridSelector, cardSelector) {
  const grids = document.querySelectorAll(gridSelector);
  grids.forEach(grid => {
    const cards = Array.from(grid.querySelectorAll(cardSelector));
    let triggered = false;

    const gridObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !triggered) {
          triggered = true;
          cards.forEach((card, i) => {
            setTimeout(() => {
              card.classList.add('card-visible');
            }, i * STAGGER_MS);
          });
        }

        // Reset when fully out of view (scroll back up)
        if (!entry.isIntersecting && entry.boundingClientRect.top > 0) {
          triggered = false;
          cards.forEach(card => card.classList.remove('card-visible'));
        }
      });
    }, { threshold: 0.08 });

    gridObserver.observe(grid);
  });
}

setupCardStagger('.skills-grid',   '.skill-group');
setupCardStagger('.projects-grid', '.project-card');
