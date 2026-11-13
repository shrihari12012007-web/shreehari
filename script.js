/* ============================================================
   SHREE HARI S B — OFFICIAL PORTFOLIO SCRIPT
   • Premium 2D Canvas ambient particles + dynamic section color palettes
   • Silky mouse & scroll parallax with fluid inertia
   • Zero-jank IntersectionObserver scroll reveals & card staggering
   • Category filter tabs for verified projects
   • Case study project detail modals (Priority 2)
   • Live GitHub API sync & repository cards (Priority 3)
   • FormSubmit delivery verification with spam honeypot (Priority 5)
   • WebGL graceful fallback & Drive loading coordination (Priority 1)
   ============================================================ */

// ── 1. CANVAS AMBIENT BACKGROUND ──────────────────────────────
const canvas = document.getElementById('bg-canvas');
const ctx    = canvas ? canvas.getContext('2d') : null;

function resizeCanvas() {
  if (!canvas) return;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
if (canvas) {
  resizeCanvas();
  window.addEventListener('resize', () => { resizeCanvas(); initParticles(); });
}

// ── 2. MOUSE TRACKING (Fluid Inertia) ─────────────────────────
let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let smoothMouse = { x: mouse.x, y: mouse.y };

window.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

window.addEventListener('touchmove', e => {
  if (e.touches.length > 0) {
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
  }
}, { passive: true });

// ── 3. SCROLL TRACKING ─────────────────────────────────────────
let scrollY        = window.scrollY;
let scrollDir      = 0;
let lastScrollY    = scrollY;

window.addEventListener('scroll', () => {
  scrollY   = window.scrollY;
  scrollDir = scrollY > lastScrollY ? 1 : -1;
  lastScrollY = scrollY;
}, { passive: true });

// ── 4. SECTION PALETTES ────────────────────────────────────────
const PALETTES = {
  home:      { bg: [6,   8,  14], a: [0,   240, 255] },
  about:     { bg: [7,  10,  20], a: [56,  189, 248] },
  skills:    { bg: [6,  12,  22], a: [0,   210, 185] },
  projects:  { bg: [8,   9,  18], a: [96,  165, 250] },
  education: { bg: [6,  12,  16], a: [52,  211, 153] },
  contact:   { bg: [10,  8,  18], a: [0,   240, 255] },
};

let curBg     = [...PALETTES.home.bg];
let curAccent = [...PALETTES.home.a];
let tgtBg     = [...PALETTES.home.bg];
let tgtAccent = [...PALETTES.home.a];
let palLerp   = 1;
const PAL_SPEED = 0.024;
let lastSection = 'home';

function lerp(a, b, t) { return a + (b - a) * t; }
function lerpArr(a, b, t) { return a.map((v, i) => lerp(v, b[i], t)); }
function ease(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

// ── 5. PARTICLES ENGINE ────────────────────────────────────────
const PARTICLE_COUNT = 34;
const particles = [];

class Particle {
  constructor(randomY = false) {
    this.spawn(randomY);
  }
  spawn(randomY = false) {
    if (!canvas) return;
    this.x      = Math.random() * canvas.width;
    this.y      = randomY ? Math.random() * canvas.height : canvas.height + 20;
    this.baseVx = (Math.random() - 0.5) * 0.28;
    this.baseVy = -(Math.random() * 0.32 + 0.08);
    this.r      = Math.random() * 1.5 + 0.35;
    this.alpha  = Math.random() * 0.42 + 0.12;
    this.depth  = Math.random() * 0.7 + 0.3;
    this.pulse  = Math.random() * Math.PI * 2;
    this.pSpeed = Math.random() * 0.016 + 0.007;
  }
  update(mouseOffX, mouseOffY, scrollOffY) {
    if (!canvas) return;
    const mFactor = (1 - this.depth) * 0.038;
    const vx = this.baseVx + mouseOffX * mFactor;
    const vy = this.baseVy + mouseOffY * mFactor + scrollOffY * (1 - this.depth) * 0.005;

    this.x += vx + Math.sin(this.pulse) * 0.26;
    this.y += vy;
    this.pulse += this.pSpeed;

    if (this.y < -20 || this.x < -30 || this.x > canvas.width + 30) {
      this.spawn(false);
    }
  }
}

function initParticles() {
  if (!canvas) return;
  particles.length = 0;
  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle(true));
}
if (canvas) initParticles();

// ── 6. DRAW FRAME ──────────────────────────────────────────────
function drawFrame() {
  if (!canvas || !ctx) return;
  const bg = curBg, ac = curAccent;
  const W  = canvas.width, H = canvas.height;

  // Background fill
  ctx.fillStyle = `rgb(${bg[0]|0},${bg[1]|0},${bg[2]|0})`;
  ctx.fillRect(0, 0, W, H);

  // Soft cursor follow aura
  const g1x = smoothMouse.x;
  const g1y = smoothMouse.y;
  const grd1 = ctx.createRadialGradient(g1x, g1y, 0, g1x, g1y, Math.max(W, H) * 0.55);
  grd1.addColorStop(0, `rgba(${ac[0]},${ac[1]},${ac[2]},0.09)`);
  grd1.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grd1;
  ctx.fillRect(0, 0, W, H);

  // Optimized batched particle mesh lines
  ctx.beginPath();
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    for (let j = i + 1; j < particles.length; j++) {
      const q  = particles[j];
      const dx = p.x - q.x, dy = p.y - q.y;
      const d2 = dx*dx + dy*dy;
      if (d2 < 14400) { // 120px limit
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
      }
    }
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.032)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Particle dots
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const pa = p.alpha * (0.68 + 0.32 * Math.sin(p.pulse));
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${ac[0]},${ac[1]},${ac[2]},${pa})`;
    ctx.fill();
  }
}

// ── 7. ANIMATION LOOP ──────────────────────────────────────────
let prevScrollY = 0;
let scrollVelocity = 0;

function animateBg() {
  requestAnimationFrame(animateBg);

  if (document.body.classList.contains('drive-mode-active')) return;

  const time = performance.now() * 0.001;

  const idleDriftX = Math.sin(time * 0.36) * 32 + Math.cos(time * 0.2) * 18;
  const idleDriftY = Math.cos(time * 0.3) * 22 + Math.sin(time * 0.15) * 14;

  smoothMouse.x = lerp(smoothMouse.x, mouse.x + idleDriftX, 0.042);
  smoothMouse.y = lerp(smoothMouse.y, mouse.y + idleDriftY, 0.042);

  const rawScrollDelta = scrollY - prevScrollY;
  scrollVelocity = lerp(scrollVelocity, rawScrollDelta, 0.08);
  prevScrollY = lerp(prevScrollY, scrollY, 0.08);

  const mouseOffX = (mouse.x - (canvas ? canvas.width  / 2 : 0)) * 0.72;
  const mouseOffY = (mouse.y - (canvas ? canvas.height / 2 : 0)) * 0.72;

  if (palLerp < 1) {
    palLerp   = Math.min(1, palLerp + PAL_SPEED);
    const t   = ease(palLerp);
    curBg     = lerpArr(curBg,     tgtBg,     t);
    curAccent = lerpArr(curAccent, tgtAccent, t);
  }

  particles.forEach(p => p.update(mouseOffX, mouseOffY, scrollVelocity));
  drawFrame();
}
if (canvas) animateBg();

// ── 8. SECTION SCROLL PALETTE SPY ──────────────────────────────
const sectionIds = Object.keys(PALETTES);
let scrollTicking = false;

window.addEventListener('scroll', () => {
  if (!scrollTicking) {
    requestAnimationFrame(() => {
      const mid = window.scrollY + window.innerHeight * 0.38;
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
      scrollTicking = false;
    });
    scrollTicking = true;
  }
}, { passive: true });

// ── 9. INTERSECTION OBSERVER SCROLL REVEALS ────────────────────
const REVEAL_SELECTORS = '.reveal, .reveal-left, .reveal-right, .reveal-scale';
const reveals = document.querySelectorAll(REVEAL_SELECTORS);

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    rootMargin: '0px 0px -40px 0px',
    threshold: 0.08
  });

  reveals.forEach(el => revealObserver.observe(el));
} else {
  reveals.forEach(el => el.classList.add('visible'));
}

// ── 10. TYPING ANIMATION ───────────────────────────────────────
const typingEl = document.getElementById('typing');
const words    = [
  'CSE Undergraduate',
  'AI & ML Developer',
  'Computer Vision Explorer',
  'Python Engineer',
  'Full-Stack Developer'
];
let wordIdx = 0, charIdx = 0, deleting = false;

function typeLoop() {
  if (!typingEl) return;
  const word = words[wordIdx];
  typingEl.textContent = deleting
    ? word.substring(0, charIdx - 1)
    : word.substring(0, charIdx + 1);
  deleting ? charIdx-- : charIdx++;

  if (!deleting && charIdx === word.length) {
    deleting = true;
    return setTimeout(typeLoop, 2200);
  }
  if (deleting && charIdx === 0) {
    deleting = false;
    wordIdx = (wordIdx + 1) % words.length;
  }
  setTimeout(typeLoop, deleting ? 45 : 85);
}
typeLoop();

// ── 11. NAVBAR SCROLL & ACTIVE TRACKING ────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (navbar) {
    navbar.classList.toggle('scrolled', window.scrollY > 30);
  }
}, { passive: true });

const navLinks    = document.querySelectorAll('.nav-link');
const allSections = document.querySelectorAll('section[id]');
if ('IntersectionObserver' in window && navLinks.length > 0) {
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
        if (activeLink) activeLink.classList.add('active');
      }
    });
  }, { threshold: 0.35 });
  allSections.forEach(s => navObserver.observe(s));
}

// ── 12. MOBILE MENU DRAWER ─────────────────────────────────────
const menuBtn = document.getElementById('menuBtn');
const navMenu = document.getElementById('navMenu');

function closeMobileMenu() {
  if (menuBtn) {
    menuBtn.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }
  if (navMenu) {
    navMenu.classList.remove('open');
  }
}

if (menuBtn && navMenu) {
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = navMenu.classList.toggle('open');
    menuBtn.classList.toggle('open', isOpen);
    menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => closeMobileMenu());
  });

  document.addEventListener('click', (e) => {
    if (navMenu.classList.contains('open') && !navMenu.contains(e.target) && e.target !== menuBtn) {
      closeMobileMenu();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('open')) {
      closeMobileMenu();
    }
  });
}

// ── 13. STAGGERED CARD REVEAL ──────────────────────────────────
const STAGGER_MS = 120;

function setupCardStagger(gridSelector, cardSelector) {
  const grids = document.querySelectorAll(gridSelector);
  grids.forEach(grid => {
    const cards = Array.from(grid.querySelectorAll(cardSelector));
    let triggered = false;

    if ('IntersectionObserver' in window) {
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
          if (!entry.isIntersecting && entry.boundingClientRect.top > 0) {
            triggered = false;
            cards.forEach(card => card.classList.remove('card-visible'));
          }
        });
      }, { threshold: 0.08 });
      gridObserver.observe(grid);
    } else {
      cards.forEach(card => card.classList.add('card-visible'));
    }
  });
}

setupCardStagger('.skills-grid',   '.skill-group');
setupCardStagger('.projects-grid', '.project-card');

// ── 14. PROJECT FILTER TABS ────────────────────────────────────
const filterTabs = document.querySelectorAll('.filter-tab');
const projectCards = document.querySelectorAll('.projects-grid .project-card');

if (filterTabs.length > 0 && projectCards.length > 0) {
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filterValue = tab.getAttribute('data-filter') || 'all';

      projectCards.forEach((card, index) => {
        const category = card.getAttribute('data-category') || '';
        if (filterValue === 'all' || category === filterValue || category.includes(filterValue)) {
          card.style.display = 'flex';
          setTimeout(() => card.classList.add('card-visible'), index * 60);
        } else {
          card.style.display = 'none';
          card.classList.remove('card-visible');
        }
      });
    });
  });
}

// ── 15. PROJECT DETAIL CASE STUDY MODAL (Priority 2) ───────────
const PROJECT_DETAILS = {
  'nova-cuts': {
    title: 'Nova Cuts — Luxury Salon & Barbershop',
    category: 'Full-Stack Web Platform',
    badge: 'LIVE ON RENDER',
    img: 'img/projects/nova-cuts.svg',
    liveUrl: 'https://nova-cuts.onrender.com/',
    githubUrl: 'https://github.com/shrihari12012007-web/nova-cuts',
    problem: 'Traditional barbershops and luxury styling salons struggle with manual telephone scheduling, peak-hour bottlenecks, and fragmented service pricing menus that leave clients uncertain about service duration and costs.',
    solution: 'Designed and engineered an end-to-end luxury grooming web portal with an interactive real-time service selection matrix, dynamic booking time slots, transparent price calculation, and instant confirmation summaries.',
    features: [
      'Interactive service catalogue covering hair grooming, beard sculpting, and facial treatments.',
      'Real-time date and time-slot selection with automatic validation to prevent double-booking.',
      'Responsive dark-mode aesthetic with fluid transitions built for both mobile and desktop clients.',
      'Zero-downtime deployment pipeline hosted live on Render.'
    ],
    contribution: 'Architected the frontend booking interface from scratch using vanilla HTML5, CSS3, and JavaScript, engineered scheduling state logic, and configured production deployment on Render.',
    technologies: ['HTML5', 'CSS3', 'JavaScript (ES6+)', 'Node.js', 'Render Cloud']
  },
  'panda-ai': {
    title: 'Panda — AI Voice Assistant',
    category: 'Artificial Intelligence & Speech',
    badge: 'AI & SPEECH RECOGNITION',
    img: 'img/projects/panda-ai.svg',
    liveUrl: null,
    githubUrl: 'https://github.com/shrihari12012007-web',
    problem: 'Modern desktop workflows require seamless hands-free productivity, yet conventional assistants often lack contextual reasoning, offline command fallback, and flexible multimodal LLM intelligence.',
    solution: 'Engineered an autonomous conversational desktop agent powered by the Google Gemini API for intelligent contextual reasoning, coupled with real-time speech-to-text and edge text-to-speech synthesis.',
    features: [
      'Live microphone audio streaming with noise-filtering speech recognition.',
      'Context-aware responses powered by Google Gemini API endpoints.',
      'Natural voice output synthesis via pyttsx3 / edge-tts audio drivers.',
      'System automation capabilities for desktop multitasking and command execution.'
    ],
    contribution: 'Designed the complete Python audio capture pipeline, integrated Google Gemini API inference endpoints, implemented conversational error recovery, and optimized speech synthesis response latency.',
    technologies: ['Python 3', 'Google Gemini API', 'SpeechRecognition', 'pyttsx3', 'PyAudio']
  },
  'hand-gesture': {
    title: 'Hand Gesture Camera Controller',
    category: 'Computer Vision & HCI',
    badge: 'COMPUTER VISION',
    img: 'img/projects/hand-gesture.svg',
    liveUrl: null,
    githubUrl: 'https://github.com/shrihari12012007-web/Hand_Gesture_Camera.',
    problem: 'Capturing photographs or operating camera hardware hands-free typically requires awkward timer delays, secondary Bluetooth remotes, or physical button presses that disrupt framing.',
    solution: 'Developed a touchless computer vision control system that tracks 21 distinct 3D hand landmarks in real time through standard webcam feeds and triggers photo capture via custom gesture recognition algorithms.',
    features: [
      'Sub-millisecond 21-landmark 3D hand skeleton detection via Google MediaPipe.',
      'Geometric finger angle math in OpenCV for gesture classification (V-sign, palm, fist).',
      'Anti-jitter temporal smoothing to prevent false trigger activations.',
      'Visual on-screen HUD with real-time gesture feedback and auto-saving photo gallery.'
    ],
    contribution: 'Engineered the OpenCV video stream processing pipeline, implemented mathematical vector checks for finger states using MediaPipe landmarks, and crafted the responsive visual feedback overlay.',
    technologies: ['Python', 'OpenCV (cv2)', 'Google MediaPipe', 'NumPy', 'Android Studio Integration']
  },
  'srinidhi-eye-care': {
    title: 'Srinidhi Eye Care — Healthcare Web Portal',
    category: 'Healthcare & Medical Informatics',
    badge: 'LIVE ON GITHUB PAGES',
    img: 'img/projects/srinidhi-eye-care.svg',
    liveUrl: 'https://shrihari12012007-web.github.io/srinidhi-eye-care/',
    githubUrl: 'https://github.com/shrihari12012007-web/srinidhi-eye-care',
    problem: 'Patients needing clinical eye care, cataract evaluations, and optical services often encounter outdated hospital websites that lack clear doctor availability, optical catalogs, and intuitive mobile reachout.',
    solution: 'Built a patient-centric, high-accessibility web portal presenting ophthalmology specialties, doctor credentials, diagnostic procedures, optical retail information, and direct inquiry channels.',
    features: [
      'Accessible clinical specialty directory covering cataract, retina, glaucoma, and optical services.',
      'Doctor credentials, visiting hours, and clinic location roadmap.',
      'High-contrast, large-typography layouts compliant with medical accessibility standards.',
      'Instant direct appointment inquiry buttons wired to phone and WhatsApp.'
    ],
    contribution: 'Designed the accessibility-focused medical interface, structured the treatment hierarchy, built the responsive frontend layout, and deployed to GitHub Pages.',
    technologies: ['HTML5', 'CSS3', 'JavaScript', 'React & Vite', 'GitHub Pages']
  },
  'strategy-tracker': {
    title: 'Strategy Tracker — Sprint Velocity System',
    category: 'Productivity & Workflow Engineering',
    badge: 'LIVE ON VERCEL',
    img: 'img/projects/strategy-tracker.svg',
    liveUrl: 'https://strategy-tracker-nine.vercel.app/',
    githubUrl: 'https://github.com/shrihari12012007-web/Strategy-Tracker',
    problem: 'Engineering students and software developers frequently juggle coursework, open-source projects, and personal goals without a lightweight, real-time visualization of their daily execution velocity.',
    solution: 'Created an agile goal and sprint productivity web application with animated SVG velocity progress rings, priority-based task matrices, and zero-latency local persistence.',
    features: [
      'Dynamic SVG circular velocity indicator updating in real time as milestones are completed.',
      'Priority categorization (High, Medium, Normal) with instant status toggling.',
      'Persistent client-side state via LocalStorage — works seamlessly offline.',
      'Fast-loading responsive glassmorphism UI deployed on Vercel.'
    ],
    contribution: 'Conceptualized and built the productivity application, developed the SVG circular trigonometry math for progress visualization, implemented persistent state storage, and deployed on Vercel.',
    technologies: ['JavaScript', 'HTML5', 'CSS3', 'SVG Trigonometry', 'Vercel']
  },
  'study-hub': {
    title: 'STUDY Resource Hub (Panda Vault)',
    category: 'Education & Academic Architecture',
    badge: 'LIVE ON GITHUB PAGES',
    img: 'img/projects/study-hub.svg',
    liveUrl: 'https://shrihari12012007-web.github.io/STUDY/',
    githubUrl: 'https://github.com/shrihari12012007-web/STUDY',
    problem: 'Undergraduate Computer Science students navigate fragmented university portals, scattered PDF lecture slides, and unorganized question banks when preparing for semester examinations.',
    solution: 'Architected a centralized, structured academic hub organizing VTU Computer Science syllabus modules, reference textbooks, practical lab code solutions, and model question banks in one unified portal.',
    features: [
      'Semester-by-semester course taxonomy covering core CS topics (DSA, DBMS, OS, Networks).',
      'Rapid filtering and instant search across subjects and downloadable academic material.',
      'Minimalist dark UI optimized for long reading sessions and late-night study workflows.',
      'Zero-bandwidth static architecture deployed on GitHub Pages.'
    ],
    contribution: 'Organized and curated the Computer Science academic repository taxonomy, designed the fast, clean reading interface, and optimized static asset delivery on GitHub Pages.',
    technologies: ['HTML5', 'CSS3', 'JavaScript', 'GitHub Pages', 'Markdown']
  }
};

const projectModal         = document.getElementById('projectModal');
const projectModalBackdrop = document.getElementById('projectModalBackdrop');
const projectModalCloseBtn = document.getElementById('projectModalCloseBtn');

function openProjectModal(projectId) {
  const data = PROJECT_DETAILS[projectId];
  if (!data || !projectModal) return;

  const modalCategory     = document.getElementById('modalCategory');
  const modalBadge        = document.getElementById('modalBadge');
  const modalTitle        = document.getElementById('modalTitle');
  const modalImg          = document.getElementById('modalImg');
  const modalProblem      = document.getElementById('modalProblem');
  const modalSolution     = document.getElementById('modalSolution');
  const modalFeatures     = document.getElementById('modalFeatures');
  const modalContribution = document.getElementById('modalContribution');
  const modalTechStack    = document.getElementById('modalTechStack');
  const modalLiveBtn      = document.getElementById('modalLiveBtn');
  const modalRepoBtn      = document.getElementById('modalRepoBtn');

  if (modalCategory) modalCategory.textContent = data.category;
  if (modalBadge) modalBadge.textContent = data.badge;
  if (modalTitle) modalTitle.textContent = data.title;
  if (modalImg) {
    modalImg.src = data.img;
    modalImg.alt = data.title + ' Architecture Preview';
  }
  if (modalProblem) modalProblem.textContent = data.problem;
  if (modalSolution) modalSolution.textContent = data.solution;
  if (modalContribution) modalContribution.textContent = data.contribution;

  if (modalFeatures) {
    modalFeatures.innerHTML = data.features.map(f => `<li>${f}</li>`).join('');
  }

  if (modalTechStack) {
    modalTechStack.innerHTML = data.technologies.map(t => `<span>${t}</span>`).join('');
  }

  if (modalLiveBtn) {
    if (data.liveUrl) {
      modalLiveBtn.href = data.liveUrl;
      modalLiveBtn.style.display = 'inline-flex';
    } else {
      modalLiveBtn.style.display = 'none';
    }
  }

  if (modalRepoBtn) {
    modalRepoBtn.href = data.githubUrl;
  }

  projectModal.classList.add('visible', 'open');
  projectModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeProjectModal() {
  if (!projectModal) return;
  projectModal.classList.remove('visible', 'open');
  projectModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

if (projectModalCloseBtn) projectModalCloseBtn.addEventListener('click', closeProjectModal);
if (projectModalBackdrop) projectModalBackdrop.addEventListener('click', closeProjectModal);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && projectModal && projectModal.classList.contains('visible')) {
    closeProjectModal();
  }
});

// Wire up open clicks across all project cards
document.querySelectorAll('[data-project-id]').forEach(el => {
  el.addEventListener('click', (e) => {
    // If the clicked target was an external link on the card, let the link open normally
    if (e.target.tagName.toLowerCase() === 'a' && !e.target.classList.contains('btn-open-modal')) {
      return;
    }
    const pid = el.getAttribute('data-project-id');
    if (pid) {
      e.preventDefault();
      openProjectModal(pid);
    }
  });
});

// ── 16. LIVE GITHUB METRICS & REPOSITORIES (Priority 3) ────────
async function syncGitHubData() {
  const repoEl       = document.getElementById('ghRepoCount');
  const followersEl  = document.getElementById('ghFollowersCount');
  const langEl       = document.getElementById('ghTopLanguages');
  const reposGrid    = document.getElementById('ghRecentRepos');
  const syncStatusEl = document.getElementById('ghSyncStatus');

  // 1. Fetch User Profile Metrics
  try {
    const res = await fetch('https://api.github.com/users/shrihari12012007-web');
    if (res.ok) {
      const data = await res.json();
      if (repoEl && data.public_repos !== undefined) repoEl.textContent = data.public_repos;
      if (followersEl && data.followers !== undefined) followersEl.textContent = data.followers;
    }
  } catch (err) {
    // Retain verified static numbers in HTML (16 repos, 2 followers)
  }

  // 2. Fetch Live Public Repositories
  try {
    const reposRes = await fetch('https://api.github.com/users/shrihari12012007-web/repos?sort=updated&per_page=6');
    if (reposRes.ok && reposGrid) {
      const repos = await reposRes.json();
      if (Array.isArray(repos) && repos.length > 0) {
        const langDots = {
          'JavaScript': 'dot-js',
          'TypeScript': 'dot-ts',
          'HTML': 'dot-html',
          'Python': 'dot-python',
          'CSS': 'dot-css'
        };

        reposGrid.innerHTML = repos.map(r => {
          const lang = r.language || 'Code';
          const dotClass = langDots[lang] || 'dot-js';
          const desc = r.description || 'Public engineering repository by Shree Hari S B.';
          return `
            <div class="gh-repo-item">
              <div class="gh-repo-top">
                <a href="${r.html_url}" target="_blank" rel="noopener" class="gh-repo-name">${r.name}</a>
                <span class="gh-repo-star">★ ${r.stargazers_count || 0}</span>
              </div>
              <p class="gh-repo-desc">${desc}</p>
              <div class="gh-repo-meta">
                <span class="gh-repo-lang"><span class="lang-color-dot ${dotClass}"></span> ${lang}</span>
                <span class="gh-repo-vis">Public</span>
              </div>
            </div>
          `;
        }).join('');

        if (syncStatusEl) {
          syncStatusEl.innerHTML = '<span class="sync-dot"></span> Live GitHub Sync (Verified)';
        }
      }
    }
  } catch (err) {
    // Keep verified static cards in HTML if API is rate-limited
    if (syncStatusEl) {
      syncStatusEl.innerHTML = '<span class="sync-dot" style="background:#38bdf8"></span> Verified Archive';
    }
  }
}
syncGitHubData();

// ── 17. CONTACT FORM (VALIDATION + HONEYPOT + FORMSUBMIT) ──────
const contactForm = document.getElementById('contactForm');
const formStatus  = document.getElementById('formStatus');
const submitBtn   = document.getElementById('submitBtn');
const btnText     = document.getElementById('btnText');

['name', 'email', 'subject', 'message'].forEach(id => {
  const el = document.getElementById(id);
  const errEl = document.getElementById(id + 'Error');
  if (el) {
    el.addEventListener('input', () => {
      el.style.borderColor = '';
      if (errEl) errEl.textContent = '';
      if (formStatus) formStatus.innerHTML = '';
    });
  }
});

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. Anti-spam honeypot detection
    const honey = document.getElementById('gotchaHoney');
    if (honey && honey.value.trim().length > 0) {
      if (formStatus) formStatus.innerHTML = '<span class="status-error">Automated submission blocked by spam filter.</span>';
      return;
    }

    const nameEl    = document.getElementById('name');
    const emailEl   = document.getElementById('email');
    const phoneEl   = document.getElementById('phone');
    const subjectEl = document.getElementById('subject');
    const messageEl = document.getElementById('message');

    const name    = nameEl ? nameEl.value.trim() : '';
    const email   = emailEl ? emailEl.value.trim() : '';
    const phone   = phoneEl ? phoneEl.value.trim() || 'Not specified' : 'Not specified';
    const subject = subjectEl ? subjectEl.value.trim() : '';
    const message = messageEl ? messageEl.value.trim() : '';

    let hasError = false;

    if (name.length < 2) {
      const err = document.getElementById('nameError');
      if (err) err.textContent = 'Please enter your full name (at least 2 characters).';
      if (nameEl) nameEl.style.borderColor = '#ef4444';
      hasError = true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const err = document.getElementById('emailError');
      if (err) err.textContent = 'Please enter a valid email address (e.g. name@company.com).';
      if (emailEl) emailEl.style.borderColor = '#ef4444';
      hasError = true;
    }

    if (subject.length < 3) {
      const err = document.getElementById('subjectError');
      if (err) err.textContent = 'Please specify a concise subject for your inquiry.';
      if (subjectEl) subjectEl.style.borderColor = '#ef4444';
      hasError = true;
    }

    if (message.length < 10) {
      const err = document.getElementById('messageError');
      if (err) err.textContent = 'Please provide message details (at least 10 characters).';
      if (messageEl) messageEl.style.borderColor = '#ef4444';
      hasError = true;
    }

    if (hasError) {
      if (formStatus) formStatus.innerHTML = '<span class="status-error">Please review and correct the highlighted fields above.</span>';
      return;
    }

    // Set UI to loading state
    if (submitBtn) submitBtn.disabled = true;
    if (btnText) btnText.textContent = 'Dispatching to Inbox...';
    if (formStatus) formStatus.innerHTML = '<span class="status-sending">Connecting to FormSubmit gateway &amp; sending to shrihari12012007@gmail.com...</span>';

    const cleanSubject = `[Portfolio Inquiry] ${subject} from ${name}`;
    const smsMessage = encodeURIComponent(`Hi Shree Hari, this is ${name} (${email}, ${phone}): ${message}`);
    const waMessage  = encodeURIComponent(`Hi Shree Hari,\n\n*Name:* ${name}\n*Email:* ${email}\n*Phone:* ${phone}\n*Subject:* ${subject}\n\n*Message:*\n${message}`);

    try {
      const response = await fetch('https://formsubmit.co/ajax/shrihari12012007@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: name,
          email: email,
          phone: phone,
          subject: cleanSubject,
          message: message,
          _subject: `[Portfolio Alert] ${cleanSubject}`,
          _template: 'table',
          _captcha: 'false'
        })
      });

      const result = await response.json().catch(() => ({}));

      // Strictly verify actual delivery success
      if (result.success === 'true' || result.success === true) {
        if (formStatus) {
          formStatus.innerHTML = `
            <div class="dispatch-success-box">
              <div class="dispatch-check">✓</div>
              <div class="dispatch-info">
                <h4 class="dispatch-title">Message Delivered Successfully</h4>
                <p class="dispatch-desc">
                  Your message was sent directly to Shree Hari's primary inbox (<code>shrihari12012007@gmail.com</code>).
                  Expect a prompt response within 24 hours.
                </p>
                <div class="mobile-ping-panel">
                  <span class="mobile-ping-badge"><span class="radar-dot"></span> DIRECT REACHOUT</span>
                  <p class="mobile-ping-text">Need an immediate answer? Reach Shree Hari directly via WhatsApp or SMS:</p>
                  <div class="mobile-ping-buttons">
                    <a href="https://wa.me/918105403378?text=${waMessage}" target="_blank" rel="noopener" class="ping-btn wa-ping-btn">
                      <span>WhatsApp (+91 8105403378)</span>
                    </a>
                    <a href="sms:+918105403378?body=${smsMessage}" class="ping-btn sms-ping-btn">
                      <span>Send SMS (+91 8105403378)</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          `;
        }
        contactForm.reset();
        if (submitBtn) submitBtn.disabled = false;
        if (btnText) btnText.textContent = 'Message Sent! Send Another';
      } else if (result.message && result.message.includes('Activation')) {
        // Truthful activation state feedback
        if (formStatus) {
          formStatus.innerHTML = `
            <div class="dispatch-success-box" style="border-color: rgba(56, 189, 248, 0.4);">
              <div class="dispatch-check" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border-color: rgba(56, 189, 248, 0.3);">ℹ</div>
              <div class="dispatch-info">
                <h4 class="dispatch-title">Form Pending Initial Activation</h4>
                <p class="dispatch-desc">
                  FormSubmit has sent a one-time activation link to <code>shrihari12012007@gmail.com</code>.
                  To ensure instant reachout, you can connect directly with Shree Hari right now via WhatsApp, SMS, or direct email:
                </p>
                <div class="mobile-ping-buttons" style="margin-top: 12px;">
                  <a href="https://wa.me/918105403378?text=${waMessage}" target="_blank" rel="noopener" class="ping-btn wa-ping-btn">
                    <span>WhatsApp (+91 8105403378)</span>
                  </a>
                  <a href="sms:+918105403378?body=${smsMessage}" class="ping-btn sms-ping-btn">
                    <span>Send SMS (+91 8105403378)</span>
                  </a>
                  <a href="mailto:shrihari12012007@gmail.com?subject=${encodeURIComponent(cleanSubject)}&body=${encodeURIComponent(message)}" class="ping-btn sms-ping-btn">
                    <span>Direct Email Client</span>
                  </a>
                </div>
              </div>
            </div>
          `;
        }
        if (submitBtn) submitBtn.disabled = false;
        if (btnText) btnText.textContent = 'Send Message';
      } else {
        throw new Error(result.message || 'Delivery confirmation failed');
      }

    } catch (err) {
      console.warn('FormSubmit AJAX fallback:', err);
      if (formStatus) {
        formStatus.innerHTML = `
          <div class="dispatch-success-box">
            <div class="dispatch-check" style="background:rgba(239,68,68,0.15);color:#f87171;border-color:rgba(239,68,68,0.3);">!</div>
            <div class="dispatch-info">
              <h4 class="dispatch-title">Network Notice — Reach Shree Hari Directly</h4>
              <p class="dispatch-desc">The direct form API had a connectivity hiccup. Please dispatch your drafted inquiry instantly via any channel below:</p>
              <div class="mobile-ping-buttons" style="margin-top: 10px;">
                <a href="https://wa.me/918105403378?text=${waMessage}" target="_blank" rel="noopener" class="ping-btn wa-ping-btn">
                  <span>WhatsApp (+91 8105403378)</span>
                </a>
                <a href="sms:+918105403378?body=${smsMessage}" class="ping-btn sms-ping-btn">
                  <span>Send SMS (+91 8105403378)</span>
                </a>
                <a href="mailto:shrihari12012007@gmail.com?subject=${encodeURIComponent(cleanSubject)}&body=${encodeURIComponent(message)}" class="ping-btn sms-ping-btn">
                  <span>Direct Email Client</span>
                </a>
              </div>
            </div>
          </div>
        `;
      }
      if (submitBtn) submitBtn.disabled = false;
      if (btnText) btnText.textContent = 'Send Message';
    }
  });
}

// ── 18. BACK TO TOP BUTTON WITH SCROLL PROGRESS ────────────────
const backToTopBtn    = document.getElementById('backToTop');
const progressCircle  = document.getElementById('progressCircle');
const CIRCLE_LENGTH   = 125.66; // 2 * PI * 20

function updateBackToTop() {
  if (!backToTopBtn || !progressCircle) return;
  const currentY   = window.scrollY;
  const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
  const scrollRatio = docHeight > 0 ? Math.min(1, Math.max(0, currentY / docHeight)) : 0;

  backToTopBtn.classList.toggle('show', currentY > 280);
  const offset = CIRCLE_LENGTH - (scrollRatio * CIRCLE_LENGTH);
  progressCircle.style.strokeDashoffset = offset;
}

window.addEventListener('scroll', updateBackToTop, { passive: true });
updateBackToTop();

if (backToTopBtn) {
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ── 19. WEBGL MODAL DISMISS WIREUP ────────────────────────────
const fallbackModal    = document.getElementById('webglFallbackModal');
const closeFallbackBtn = document.getElementById('closeFallbackBtn');

if (closeFallbackBtn && fallbackModal) {
  closeFallbackBtn.addEventListener('click', () => {
    fallbackModal.classList.remove('visible', 'open');
    fallbackModal.setAttribute('aria-hidden', 'true');
  });
}
