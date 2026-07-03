document.addEventListener('DOMContentLoaded', () => {

  // Year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // AOS animations
  try { if (window.AOS) AOS.init({ duration: 700, once: true, offset: 60 }); }
  catch (e) { console.warn('AOS init failed', e); }

  // PureCounter
  try {
    if (typeof window.PureCounter === 'function') new PureCounter();
  } catch (e) { console.warn('PureCounter init failed', e); }

  // Typed.js hero role
  try {
    const typedEl = document.querySelector('.typed');
    if (typedEl && window.Typed) {
      const items = typedEl.getAttribute('data-typed-items').split(',');
      new Typed('.typed', {
        strings: items,
        typeSpeed: 45,
        backSpeed: 25,
        backDelay: 1800,
        loop: true
      });
    }
  } catch (e) { console.warn('Typed init failed', e); }

  // Mobile nav toggle
  const navbar = document.querySelector('#navbar');
  const toggle = document.querySelector('.mobile-nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      navbar.classList.toggle('navbar-mobile');
      toggle.classList.toggle('bi-list');
      toggle.classList.toggle('bi-x');
    });
  }
  document.querySelectorAll('#navbar a').forEach(link => {
    link.addEventListener('click', () => {
      if (navbar.classList.contains('navbar-mobile')) {
        navbar.classList.remove('navbar-mobile');
        toggle.classList.add('bi-list');
        toggle.classList.remove('bi-x');
      }
    });
  });

  // Scroll spy (active nav link)
  const sections = document.querySelectorAll('main section, #hero');
  const navLinks = document.querySelectorAll('#navbar a');
  window.addEventListener('scroll', () => {
    let current = 'hero';
    sections.forEach(sec => {
      const top = sec.offsetTop - 120;
      if (window.scrollY >= top) current = sec.getAttribute('id');
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });

    // Scroll-to-top button
    const scrollTop = document.getElementById('scroll-top');
    if (scrollTop) scrollTop.classList.toggle('active', window.scrollY > 300);
  });

  // Scroll to top click
  const scrollTopBtn = document.getElementById('scroll-top');
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});
