// Site version switch.
//
// index.html only holds the swappable zones (empty shells). All content comes from JSON,
// one file per CV in "Curriculum claude" (para ATS / normales × Resume_q, _i, _qi):
//   "<family>_<variant>" -> content/<family>_<variant>.json + assets/resumes/<family>_<variant>.pdf
//
// Firebase Realtime Database stores which one is live, at `siteVersion`.
// Anyone can READ that value; only the signed-in owner can WRITE it (database rules).
// The hidden control in the footer (the © dot) opens the password prompt and the radio buttons.
// The radio buttons are the only way to change the version: there is no URL override.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  setPersistence, browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import { getDatabase, ref, onValue, set } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js';

const ADMIN_EMAIL = 'geotarsis@gmail.com';

const VERSIONS = {
  ats_q: { file: 'content/ats_q.json', label: 'ATS · Resume_q' },
  ats_i: { file: 'content/ats_i.json', label: 'ATS · Resume_i' },
  ats_qi: { file: 'content/ats_qi.json', label: 'ATS · Resume_qi' },
  normal_q: { file: 'content/normal_q.json', label: 'Normal · Resume_q' },
  normal_i: { file: 'content/normal_i.json', label: 'Normal · Resume_i' },
  normal_qi: { file: 'content/normal_qi.json', label: 'Normal · Resume_qi' }
};
// Values written by the old two-position switch, still possibly stored in Firebase.
const LEGACY = { original: 'normal_q', copia: 'ats_q' };
const DEFAULT_VERSION = 'ats_q';

const firebaseConfig = {
  apiKey: 'AIzaSyDmsiRqfliZyvKGerolmY0TFg9LqV7SI_0',
  authDomain: 'portfolioq-switch.firebaseapp.com',
  databaseURL: 'https://portfolioq-switch-default-rtdb.firebaseio.com',
  projectId: 'portfolioq-switch',
  storageBucket: 'portfolioq-switch.firebasestorage.app',
  messagingSenderId: '1051673543348',
  appId: '1:1051673543348:web:c6ec5b2ed50f63f4cb4de1'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const versionRef = ref(db, 'siteVersion');

/* ------------------------------------------------------------------ content */

const $ = (sel) => document.querySelector(sel);

const cache = {};
const loadContent = async (version) => {
  if (!cache[version]) {
    const res = await fetch(VERSIONS[version].file, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`${VERSIONS[version].file}: ${res.status}`);
    cache[version] = await res.json();
  }
  return cache[version];
};

const renderLeadership = (cards) => cards.map((c, i) => `
  <div class="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="${i * 80}">
    <div class="spotlight-card">
      <i class="bi ${c.icon} spotlight-bg-icon"></i>
      <span class="spotlight-eyebrow">${c.eyebrow}</span>
      <h3>${c.title}</h3>
      <p>${c.text}</p>
      <div class="spotlight-chips">${c.chips.map(ch => `<span>${ch}</span>`).join('')}</div>
    </div>
  </div>`).join('');

const renderExperience = (jobs) => jobs.map(j => `
  <div class="resume-item">
    <h4>${j.role}</h4>
    <h5>${j.period}</h5>
    <p><em>${j.company}</em></p>
    <ul>${j.bullets.map(b => `<li>${b}</li>`).join('')}</ul>
    <p class="resume-tools">${j.tools}</p>
  </div>`).join('');

const renderSkillCard = (c) => `
  <div class="skill-card">
    <h3><i class="bi ${c.icon}"></i> ${c.title}</h3>
    <div class="tag-cloud">${c.tags.map(t => `<span>${t}</span>`).join('')}</div>
  </div>`;

const renderSkills = (skills) => `
  <div class="row gy-4">
    <div class="col-lg-6">${skills.left.map(renderSkillCard).join('')}</div>
    <div class="col-lg-6">${skills.right.map(renderSkillCard).join('')}</div>
  </div>
  <div class="row gy-4 mt-2">
    ${skills.wide.map(c => `<div class="col-lg-6">${renderSkillCard(c)}</div>`).join('')}
  </div>`;

let rendered = null;

const applyVersion = async (version) => {
  if (!VERSIONS[version] || rendered === version) return;
  const c = await loadContent(version);
  // A newer value may have arrived while this one was loading (e.g. a rejected write rolled back).
  if (version !== currentVersion) return;

  $('.hero-summary').textContent = c.heroSummary;
  $('.about-text').textContent = c.aboutText;
  $('#leadership-grid').innerHTML = renderLeadership(c.leadership);
  $('#work-experience').innerHTML = renderExperience(c.experience);
  $('#skills-content').innerHTML = renderSkills(c.skills);

  const dl = $('#resume-download');
  if (dl) {
    dl.setAttribute('href', c.resume.href);
    dl.setAttribute('download', 'Johnny_Chacon_Gairaud_Resume.pdf');
    dl.innerHTML = `<i class="bi bi-download"></i> ${c.resume.label}`;
  }

  const typedEl = $('.typed');
  if (typedEl) {
    typedEl.setAttribute('data-typed-items', c.typedItems.join(', '));
    if (typeof window.initTyped === 'function') window.initTyped();
  }

  rendered = version;
  document.documentElement.setAttribute('data-site-version', version);
  if (window.AOS) window.AOS.refreshHard();
};

/* -------------------------------------------------------------------- state */

let currentVersion = DEFAULT_VERSION;

// Paint the default immediately so the page is never empty while Firebase answers.
applyVersion(DEFAULT_VERSION).catch(err => console.warn('default render failed', err));

/* -------------------------------------------------------------------- admin */

const dot = $('#admin-dot');
const panel = $('#admin-panel');
const form = $('#admin-login');
const input = $('#admin-password');
const msg = $('#admin-msg');
const controls = $('#admin-controls');
const options = $('#admin-options');
const stateLabel = $('#admin-state');
const logout = $('#admin-logout');

const openPanel = () => {
  panel.hidden = false;
  if (!form.hidden) input.focus();
};
const closePanel = () => {
  panel.hidden = true;
  msg.textContent = '';
};

// function declaration: hoisted, so the Firebase listener can call it on first paint
function syncPanel() {
  const radio = document.querySelector(`input[name="site-version"][value="${currentVersion}"]`);
  const label = document.querySelector('#admin-state');
  if (radio) radio.checked = true;
  if (label) label.textContent = `Live: ${VERSIONS[currentVersion].label}`;
}

if (dot) {
  dot.addEventListener('click', () => (panel.hidden ? openPanel() : closePanel()));
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && panel && !panel.hidden) closePanel();
});

onAuthStateChanged(auth, (user) => {
  const signedIn = Boolean(user);
  if (form) form.hidden = signedIn;
  if (controls) controls.hidden = !signedIn;
  if (signedIn) {
    msg.textContent = '';
    syncPanel();
  }
});

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = 'Checking…';
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, ADMIN_EMAIL, input.value);
      input.value = '';
    } catch (err) {
      msg.textContent = 'Incorrect password';
      panel.classList.remove('shake');
      void panel.offsetWidth;
      panel.classList.add('shake');
      console.warn('sign-in failed', err.code || err);
    }
  });
}

if (options) {
  options.addEventListener('change', async (e) => {
    const value = e.target.value;
    if (!VERSIONS[value]) return;
    stateLabel.textContent = 'Saving…';
    options.disabled = true;
    try {
      await set(versionRef, value);
      msg.textContent = '';
    } catch (err) {
      msg.textContent = 'Could not save (permission denied)';
      syncPanel();
      console.warn('write failed', err.code || err);
    } finally {
      options.disabled = false;
    }
  });
}

if (logout) {
  logout.addEventListener('click', () => signOut(auth).then(closePanel));
}

/* ------------------------------------------------- live subscription (last) */
// Registered at the end so every helper above is already defined when the first
// Firebase snapshot arrives (it fires synchronously from cache).
onValue(versionRef, (snap) => {
  const stored = LEGACY[snap.val()] || snap.val();
  const value = VERSIONS[stored] ? stored : DEFAULT_VERSION;
  currentVersion = value;
  applyVersion(value).catch(err => console.warn('version apply failed', err));
  syncPanel();
}, (err) => console.warn('version read failed', err));
