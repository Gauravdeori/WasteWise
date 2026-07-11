// ============ ELEMENTS ============
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
const pageSections = document.querySelectorAll('.page-section');

let currentSection = 'home';

// ============ NAVBAR STYLE ============
function updateNavbar() {
  navbar.classList.toggle('scrolled', window.scrollY > 60 || currentSection !== 'home');
}
window.addEventListener('scroll', updateNavbar);

// ============ SECTION SWITCHING ============
function revealSectionContent(section) {
  section.querySelectorAll('.reveal:not(.visible)').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 90}ms`;
    setTimeout(() => el.classList.add('visible'), 60 + i * 40);
  });
  section.querySelectorAll('.counter:not([data-done])').forEach(el => {
    el.dataset.done = '1';
    animateCounter(el);
  });
}

function showSection(id) {
  const target = document.getElementById(id);
  if (!target || !target.classList.contains('page-section')) return;

  currentSection = id;
  pageSections.forEach(s => s.classList.remove('active'));
  target.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'instant' });
  history.replaceState(null, '', '#' + id);

  // highlight active nav link
  navLinks.querySelectorAll('a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + id);
  });

  updateNavbar();
  revealSectionContent(target);
}

// intercept every in-page anchor (navbar, hero buttons, footer links, scroll-down)
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (target && target.classList.contains('page-section')) {
      e.preventDefault();
      showSection(id);
    }
  });
});

// open section from URL hash on load (e.g. index.html#about)
const initial = location.hash.slice(1);
if (initial && document.getElementById(initial)?.classList.contains('page-section')) {
  showSection(initial);
} else {
  revealSectionContent(document.getElementById('home'));
}

// ============ MOBILE MENU ============
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
  });
});

// ============ REVEAL ON SCROLL / SECTION SHOW ============
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      entry.target.style.transitionDelay = `${(i % 4) * 90}ms`;
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ============ ANIMATED COUNTERS ============
function animateCounter(el) {
  const target = parseFloat(el.dataset.target);
  const decimals = parseInt(el.dataset.decimals || '0', 10);
  const duration = 1800;
  const start = performance.now();

  const format = value => decimals
    ? value.toFixed(decimals)
    : Math.round(value).toLocaleString('en-IN');

  let finished = false;
  function tick(now) {
    if (finished) return;
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = format(target * eased);
    if (progress < 1) requestAnimationFrame(tick);
    else finished = true;
  }
  requestAnimationFrame(tick);

  // guarantee the final value even if animation frames are throttled
  setTimeout(() => {
    if (!finished) {
      finished = true;
      el.textContent = format(target);
    }
  }, duration + 300);
}

const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !entry.target.dataset.done) {
      entry.target.dataset.done = '1';
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.counter').forEach(el => counterObserver.observe(el));

// ============ CONTACT FORM (DUMMY) ============
const contactForm = document.getElementById('contactForm');
const formMsg = document.getElementById('formMsg');

contactForm.addEventListener('submit', e => {
  e.preventDefault();
  formMsg.textContent = '✓ Thank you! Your message has been received. We will get back to you soon.';
  contactForm.reset();
  setTimeout(() => (formMsg.textContent = ''), 6000);
});
