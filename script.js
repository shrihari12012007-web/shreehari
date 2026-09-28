// ── TYPING ANIMATION ──
const typingEl = document.getElementById('typing');
const words = ['CSE Student', 'AI Enthusiast', 'Python Developer', 'Problem Solver', 'Future Software Engineer'];
let wordIdx = 0, charIdx = 0, deleting = false;

function type() {
  const word = words[wordIdx];
  typingEl.textContent = deleting
    ? word.substring(0, charIdx - 1)
    : word.substring(0, charIdx + 1);
  deleting ? charIdx-- : charIdx++;
  if (!deleting && charIdx === word.length) {
    deleting = true;
    return setTimeout(type, 1800);
  }
  if (deleting && charIdx === 0) {
    deleting = false;
    wordIdx = (wordIdx + 1) % words.length;
  }
  setTimeout(type, deleting ? 45 : 85);
}
type();

// ── NAVBAR SCROLL ──
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});

// ── MOBILE MENU ──
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

// ── ACTIVE NAV LINK ON SCROLL ──
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(l => l.classList.remove('active'));
      const active = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, { threshold: 0.4 });
sections.forEach(s => observer.observe(s));

// ── SCROLL REVEAL ──
const reveals = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
reveals.forEach(el => revealObserver.observe(el));
