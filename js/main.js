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
        contentType: null,
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

  // Entry overlay — the click needed to dismiss it is a real, trusted
  // user gesture, so it doubles as the browser-approved way to unlock
  // audio autoplay (this is why it exists, not just for looks).
  const entryOverlay = document.getElementById('entry-overlay');
  if (entryOverlay) {
    entryOverlay.addEventListener('click', () => {
      entryOverlay.classList.add('dismissed');
      const bgMusic = document.getElementById('bg-music');
      if (bgMusic) bgMusic.play().catch(() => {});
      setTimeout(() => entryOverlay.remove(), 1200);
    }, { once: true });
  }

  // Background music toggle
  const musicBtn = document.getElementById('music-toggle');
  const musicEl = document.getElementById('bg-music');
  if (musicBtn && musicEl) {
    musicEl.volume = 0.25;

    // Drive the UI from the audio element's own events, not from assumptions
    // made at click time — avoids desync from play()/pause() race conditions.
    musicEl.addEventListener('play', () => {
      musicBtn.classList.add('playing');
      musicBtn.querySelector('i').className = 'bi bi-pause-fill';
      musicBtn.setAttribute('aria-pressed', 'true');
      musicBtn.setAttribute('aria-label', 'Pause background music');
    });
    musicEl.addEventListener('pause', () => {
      musicBtn.classList.remove('playing');
      musicBtn.querySelector('i').className = 'bi bi-music-note';
      musicBtn.setAttribute('aria-pressed', 'false');
      musicBtn.setAttribute('aria-label', 'Play background music');
    });

    musicBtn.addEventListener('click', () => {
      if (musicEl.paused) {
        musicEl.play().catch((e) => console.warn('Playback blocked', e));
      } else {
        musicEl.pause();
      }
    });

    // Try to play as soon as the page loads. Browsers block audible
    // autoplay without a prior user gesture, so this will likely be
    // rejected (or simply never settle, observed under file://) — the
    // fallback listeners below are registered unconditionally rather
    // than inside a .catch(), since relying on the promise settling
    // proved unreliable. Calling play() again once already playing is
    // a harmless no-op, so there's no risk of double-starting it.
    // Note: 'scroll' is intentionally excluded — browsers don't treat
    // it as a user gesture capable of unlocking audio autoplay.
    musicEl.play().catch(() => {});
    const startOnFirstInteraction = () => {
      musicEl.play().catch(() => {});
    };
    ['click', 'keydown', 'touchstart'].forEach((evt) => {
      document.addEventListener(evt, startOnFirstInteraction, { once: true, passive: true });
    });
  }
});
