// Re-assert top scroll after full load / bfcache restore — mobile browsers
// sometimes settle a few pixels down once the address bar collapses.
window.addEventListener('pageshow', () => {
  if (!location.hash && window.scrollY > 0 && window.scrollY < 80) {
    window.scrollTo(0, 0);
  }
});

document.addEventListener('DOMContentLoaded', () => {

  // Year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // AOS animations
  try { if (window.AOS) AOS.init({ duration: 700, once: true, offset: 60 }); }
  catch (e) { console.warn('AOS init failed', e); }

  // Typed.js hero role — exposed so the version switch can restart it
  window.initTyped = () => {
    try {
      const typedEl = document.querySelector('.typed');
      if (!typedEl || !window.Typed) return;
      if (window.__typed) window.__typed.destroy();
      typedEl.textContent = '';
      window.__typed = new Typed('.typed', {
        strings: typedEl.getAttribute('data-typed-items').split(',').map(s => s.trim()),
        contentType: null,
        typeSpeed: 45,
        backSpeed: 25,
        backDelay: 1800,
        loop: true
      });
    } catch (e) { console.warn('Typed init failed', e); }
  };
  window.initTyped();

  // Mobile nav toggle (button + icon, keyboard accessible)
  const navbar = document.querySelector('#navbar');
  const toggle = document.querySelector('.mobile-nav-toggle');
  const toggleIcon = toggle ? toggle.querySelector('i') : null;

  const setNav = (open) => {
    if (!navbar || !toggle) return;
    navbar.classList.toggle('navbar-mobile', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    if (toggleIcon) {
      toggleIcon.classList.toggle('bi-list', !open);
      toggleIcon.classList.toggle('bi-x', open);
    }
  };

  if (toggle) {
    toggle.addEventListener('click', () => setNav(!navbar.classList.contains('navbar-mobile')));
  }
  document.querySelectorAll('#navbar a').forEach(link => {
    link.addEventListener('click', () => setNav(false));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navbar && navbar.classList.contains('navbar-mobile')) setNav(false);
  });

  // Scroll spy (active nav link) + scroll-to-top button, throttled with rAF
  const sections = document.querySelectorAll('main section, #hero');
  const navLinks = document.querySelectorAll('#navbar a');
  const scrollTopEl = document.getElementById('scroll-top');
  let ticking = false;

  const onScroll = () => {
    let current = 'hero';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 120) current = sec.getAttribute('id');
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
    if (scrollTopEl) scrollTopEl.classList.toggle('active', window.scrollY > 300);
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  // Scroll to top click
  const scrollTopBtn = document.getElementById('scroll-top');
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

});
