/* ===================================================
   Personal Site — script.js
   =================================================== */

/* ---------- Navbar: scroll state ---------- */
const navbar = document.getElementById('navbar');

const onScroll = () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
};

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();


/* ---------- Mobile nav toggle ---------- */
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(open));
});

/* Close on link click */
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});


/* ---------- Scroll reveal ---------- */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 80}ms`;
  revealObserver.observe(el);
});


/* ---------- Contact form: graceful fallback ---------- */
const contactForm = document.getElementById('contactForm');

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    const name    = document.getElementById('name').value.trim();
    const email   = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!name || !email || !message) return; // let browser handle required

    /* If action still points at TODO placeholder, prevent sending */
    if (contactForm.action.includes('TODO')) {
      e.preventDefault();
      alert('Bitte trage zuerst deine E-Mail-Adresse in das Formular (action-Attribut) ein.');
    }
    /* Otherwise: mailto opens naturally */
  });
}


/* ---------- Smooth active nav highlight ---------- */
const sections = document.querySelectorAll('section[id]');
const navItems = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navItems.forEach((a) => {
          a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
        });
      }
    });
  },
  { threshold: 0.4 }
);

sections.forEach((s) => sectionObserver.observe(s));


/* ---------- Terminal typing effect (optional) ---------- */
const terminal = document.querySelector('.terminal');

if (terminal && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
  const lines = terminal.querySelectorAll('div');
  lines.forEach((line, i) => {
    line.style.opacity = '0';
    line.style.transition = 'opacity 0.3s ease';
    setTimeout(() => { line.style.opacity = '1'; }, 300 + i * 120);
  });
}
