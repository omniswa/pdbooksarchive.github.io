// ─── URL PARAMS ─────────────────────────────────────────────
const params = new URLSearchParams(window.location.search);
const bookId = params.get('id');
if (!bookId) {
  window.location.replace('index.html');
}

// ─── STORAGE KEYS ───────────────────────────────────────────
const PREFS_KEY = 'reader_prefs';
const PROGRESS_KEY = `reader_progress_${bookId}`;

// ─── STATE ──────────────────────────────────────────────────
let prefs = {
  theme: 'light',
  font: 'garamond',
  fontSize: 18,
  alignment: 'left',
  ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')
};

let progress = {
  chapter: parseInt(params.get('chapter')) || 1,
  scrollRatio: 0,
  ...JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}')
};

if (params.has('chapter')) progress.chapter = parseInt(params.get('chapter'));

let currentChapter = progress.chapter;
let totalChapters = 1;

// ─── DOM REFS ────────────────────────────────────────────────
const html = document.documentElement;
const toolbar = document.getElementById('toolbar');
const bookTitleEl = document.getElementById('bookTitle');
const chapterSelect = document.getElementById('chapterSelect');
const settingsToggle = document.getElementById('settingsToggle');
const settingsClose = document.getElementById('settingsClose');
const settingsPanel = document.getElementById('settingsPanel');
const settingsOverlay = document.getElementById('settingsOverlay');
const chapterContent = document.getElementById('chapterContent');
const prevChBtn = document.getElementById('prevChBtn');
const nextChBtn = document.getElementById('nextChBtn');
const navChapterInfo = document.getElementById('navChapterInfo');
const progressBar = document.getElementById('progressBar');
const scrollTopBtn = document.getElementById('scrollTopBtn');
const fontSizeDisplay = document.getElementById('fontSizeDisplay');

// ─── FETCH BOOK DATA ─────────────────────────────────────────
fetch('book-data/books.json')
  .then(res => res.json())
  .then(data => {
    const bookMeta = data.find(b => b.id === bookId);
    init(bookMeta);
  })
  .catch(() => {
    bookTitleEl.textContent = 'Could not load book data';
  });

// ─── APPLY PREFS ────────────────────────────────────────────
function applyPrefs(save = true) {
  html.setAttribute('data-theme', prefs.theme);
  html.setAttribute('data-font', prefs.font);
  chapterContent.style.fontSize = prefs.fontSize + 'px';
  chapterContent.style.textAlign = prefs.alignment;
  fontSizeDisplay.textContent = prefs.fontSize + 'px';

  document.querySelectorAll('.theme-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.t === prefs.theme));
  document.querySelectorAll('.font-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.f === prefs.font));
  document.querySelectorAll('.align-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.a === prefs.alignment));

  if (save) localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

// ─── SAVE PROGRESS ──────────────────────────────────────────
function saveProgress() {
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  progress = {
    chapter: currentChapter,
    scrollRatio: maxScroll > 0 ? window.scrollY / maxScroll : 0
  };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

// ─── CHAPTER SELECT ─────────────────────────────────────────
function populateChapterSelect() {
  chapterSelect.innerHTML = '';
  for (let i = 1; i <= totalChapters; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `Chapter ${i}`;
    if (i === currentChapter) opt.selected = true;
    chapterSelect.appendChild(opt);
  }
}

// ─── RENDER TEXT ─────────────────────────────────────────────
function renderText(raw) {
  const paras = raw.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  return paras.map(p => `<p>${p.replace(/\n/g, ' ')}</p>`).join('');
}

// ─── LOAD CHAPTER ────────────────────────────────────────────
async function loadChapter(bookMeta, num, restoreScroll = false) {
  currentChapter = Math.max(1, Math.min(num, totalChapters));

  chapterContent.innerHTML = '<p class="state-msg">Loading…</p>';
  updateNavButtons();
  populateChapterSelect();

  const url = new URL(window.location);
  url.searchParams.set('id', bookId);
  url.searchParams.set('chapter', currentChapter);
  history.replaceState(null, '', url);

  try {
    const res = await fetch(`books/${bookId}/${currentChapter}.txt`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // When a .txt file doesn't exist, Cloudflare Pages (and similar hosts)
    // return index.html with a 200 OK instead of a 404. We detect this by
    // checking the Content-Type header and the response body start tag.
    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();
    if (contentType.includes('text/html') || text.trimStart().startsWith('<')) {
      throw new Error('Got HTML fallback instead of chapter text');
    }
    chapterContent.innerHTML = renderText(text);
  } catch (err) {
    chapterContent.innerHTML = `
          <p class="state-msg" style="font-style:normal; color: var(--text)">
            Chapter hasn't been added yet.
          </p>
        `;
  }

  // AFTER — snapshot ratio before it gets wiped
  const savedRatio = (restoreScroll && progress.chapter === currentChapter) ?
    progress.scrollRatio :
    0;

  progress.chapter = currentChapter;
  progress.scrollRatio = 0;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));

  if (savedRatio > 0) {
    setTimeout(() => {
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      window.scrollTo({ top: savedRatio * maxScroll });
    }, 80);
  } else {
    window.scrollTo({ top: 0 });
  }
}

function updateNavButtons() {
  prevChBtn.disabled = currentChapter <= 1;
  nextChBtn.disabled = currentChapter >= totalChapters;
  navChapterInfo.textContent = `${currentChapter} / ${totalChapters}`;
}

// ─── SETTINGS PANEL ──────────────────────────────────────────
function openSettings() {
  settingsPanel.classList.add('open');
  settingsOverlay.classList.add('open');
}

function closeSettings() {
  settingsPanel.classList.remove('open');
  settingsOverlay.classList.remove('open');
}

// ─── TOOLBAR HIDE ON SCROLL ───────────────────────────────────
let lastScrollY = 0;
let ticking = false;

function onScroll() {
  if (!ticking) {
    requestAnimationFrame(() => {
      const current = window.scrollY;
      if (current > 100 && current > lastScrollY) {
        toolbar.classList.add('hidden');
      } else {
        toolbar.classList.remove('hidden');
      }
      lastScrollY = current;

      const maxScroll = document.body.scrollHeight - window.innerHeight;
      const pct = maxScroll > 0 ? (current / maxScroll) * 100 : 0;
      progressBar.style.width = pct + '%';

      scrollTopBtn.classList.toggle('visible', current > 400);
      saveProgress();
      ticking = false;
    });
    ticking = true;
  }
}

// ─── INIT ─────────────────────────────────────────────────────
function init(bookMeta) {
  // Set totalChapters from book data
  totalChapters = bookMeta?.chapters || 1;

  if (!bookMeta) {
    bookTitleEl.textContent = 'Book not found';
    chapterContent.innerHTML = `
            <p class="state-msg">This book doesn't exist in the library.</p>
          `;
    return; // stop here, don't set up listeners
  }

  document.title = `${bookMeta.title} · Reader`;
  bookTitleEl.textContent = bookMeta.title;

  applyPrefs(false);
  populateChapterSelect();
  loadChapter(bookMeta, currentChapter, true);

  settingsToggle.addEventListener('click', openSettings);
  settingsClose.addEventListener('click', closeSettings);
  settingsOverlay.addEventListener('click', closeSettings);

  document.querySelectorAll('.theme-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      prefs.theme = btn.dataset.t;
      applyPrefs();
    }));

  document.querySelectorAll('.font-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      prefs.font = btn.dataset.f;
      applyPrefs();
    }));

  document.getElementById('sizeDown').addEventListener('click', () => {
    if (prefs.fontSize > 12) {
      prefs.fontSize -= 1;
      applyPrefs();
    }
  });
  document.getElementById('sizeUp').addEventListener('click', () => {
    if (prefs.fontSize < 32) {
      prefs.fontSize += 1;
      applyPrefs();
    }
  });

  document.querySelectorAll('.align-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      prefs.alignment = btn.dataset.a;
      applyPrefs();
    }));

  chapterSelect.addEventListener('change', () =>
    loadChapter(bookMeta, parseInt(chapterSelect.value)));

  prevChBtn.addEventListener('click', () => loadChapter(bookMeta, currentChapter - 1));
  nextChBtn.addEventListener('click', () => loadChapter(bookMeta, currentChapter + 1));

  window.addEventListener('scroll', onScroll, { passive: true });

  scrollTopBtn.addEventListener('click', () =>
    window.scrollTo({ top: 0, behavior: 'smooth' }));

  window.addEventListener('beforeunload', saveProgress);

  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      if (currentChapter < totalChapters) loadChapter(bookMeta, currentChapter + 1);
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      if (currentChapter > 1) loadChapter(bookMeta, currentChapter - 1);
    }
    if (e.key === 's' || e.key === 'S') {
      settingsPanel.classList.contains('open') ? closeSettings() : openSettings();
    }
    if (e.key === 'Escape') closeSettings();
  });
}