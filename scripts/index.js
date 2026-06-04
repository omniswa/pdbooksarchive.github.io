// ─── THEME (shared with reader.html via same localStorage key) ───────────
const PREFS_KEY = 'reader_prefs';
const html = document.documentElement;

function loadTheme() {
  const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
  const theme = saved.theme || 'light';
  html.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-dot').forEach(d =>
    d.classList.toggle('active', d.dataset.t === theme));
}

document.querySelectorAll('.theme-dot').forEach(btn => {
  btn.addEventListener('click', () => {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
    saved.theme = btn.dataset.t;
    localStorage.setItem(PREFS_KEY, JSON.stringify(saved));
    loadTheme();
  });
});

loadTheme();

// ─── BOOKS DATA ──────────────────────────────────────────────────────────
fetch('book-data/books.json')
  .then(res => res.json())
  .then(booksData => {
    filteredBooks = [...booksData];
    attachEventListeners(booksData);
    render();
  })
  .catch(() => {
    document.getElementById('bookList').innerHTML =
      '<p class="empty-state">Could not load books.</p>';
  });

let filteredBooks = [];
let currentPage = 1;
const itemsPerPage = 10;
let showOnlyFavorites = false;
let favorites = JSON.parse(localStorage.getItem('libraryFavorites')) || [];

const bookListEl = document.getElementById('bookList');
const searchInput = document.getElementById('searchInput');
const toggleFavBtn = document.getElementById('toggleFavoritesBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');

function getFavoritesSortedByDate() {
  return [...favorites]
    .sort((a, b) => b.addedAt - a.addedAt)
    .map(fav => filteredBooks.find(book => book.id === fav.id))
    .filter(Boolean);
}

function isFavorited(id) {
  return favorites.some(f => f.id === id);
}

function render() {
  const dataToRender = showOnlyFavorites ? getFavoritesSortedByDate() : filteredBooks;
  const totalPages = Math.max(1, Math.ceil(dataToRender.length / itemsPerPage));
  if (currentPage > totalPages) currentPage = totalPages;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentBooks = dataToRender.slice(startIndex, startIndex + itemsPerPage);

  if (currentBooks.length === 0) {
    bookListEl.innerHTML = '<p class="empty-state">No books found.</p>';
  } else {
    bookListEl.innerHTML = currentBooks.map(book => {
      const isFav = isFavorited(book.id);
      return `
            <article class="book-card">
              <h2 class="book-title">${book.title}</h2>
              <div class="book-author">By ${book.author}</div>
              <p class="book-excerpt">"${book.excerpt}"</p>
              <div class="book-actions">
                <a href="reader.html?id=${book.id}" class="link-read">Read Full Text</a>
                <button class="btn-fav ${isFav ? 'favorited' : ''}" onclick="toggleFavorite('${book.id}')">
                  ${isFav ? '♥ Favorited' : '♡ Add to Favorites'}
                </button>
              </div>
            </article>
          `;
    }).join('');
  }

  pageInfo.textContent = `${currentPage} of ${totalPages}`;
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}

window.toggleFavorite = function(id) {
  if (isFavorited(id)) {
    favorites = favorites.filter(f => f.id !== id);
  } else {
    favorites.push({ id, addedAt: Date.now() });
  }
  localStorage.setItem('libraryFavorites', JSON.stringify(favorites));
  render();
};

function attachEventListeners(booksData) {
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    filteredBooks = booksData.filter(book =>
      book.title.toLowerCase().includes(term) ||
      book.author.toLowerCase().includes(term)
    );
    currentPage = 1;
    render();
  });

  toggleFavBtn.addEventListener('click', () => {
    showOnlyFavorites = !showOnlyFavorites;
    toggleFavBtn.classList.toggle('active', showOnlyFavorites);
    toggleFavBtn.textContent = showOnlyFavorites ? 'Show All Books' : 'View Favorites';
    currentPage = 1;
    render();
  });

  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  nextBtn.addEventListener('click', () => {
    const dataToRender = showOnlyFavorites ? getFavoritesSortedByDate() : filteredBooks;
    const totalPages = Math.ceil(dataToRender.length / itemsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}