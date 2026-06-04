// --- DOM Elements ---
const blogGrid = document.getElementById('blogGrid');
const searchInput = document.getElementById('searchInput');
const topicFilter = document.getElementById('topicFilter');
const paginationContainer = document.getElementById('pagination');
document.getElementById("year").innerHTML = new Date().getFullYear();
const arrowIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
const dateIcon = `<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;

// --- Global State ---
let currentPage = 1;
const itemsPerPage = 6;
let filteredDataGlobal = [];
let currentBlogs = [];

// --- Dynamic Data Loader ---
async function loadBlogData() {
  blogGrid.classList.add('loading');
  try {
    const module = await import(`/blog-data/blogs.js`);
    currentBlogs = module.default;
    handleFilters();
  } catch (error) {
    console.error("Error loading library data:", error);
    blogGrid.classList.remove('loading');
    blogGrid.innerHTML = `
          <div class="no-results">
            <h3>Failed to load database</h3>
            <p style="margin-top: 8px;">Could not load blog data.</p>
          </div>`;
  }
}

// --- Render Function ---
function renderBlogs(data) {
  blogGrid.classList.remove('loading');
  blogGrid.innerHTML = '';

  if (data.length === 0) {
    blogGrid.innerHTML = `
          <div class="no-results">
            <h3>No entries found</h3>
            <p style="margin-top: 8px;">Try adjusting your search query or selected filter.</p>
          </div>
        `;
    return;
  }

  data.forEach(blog => {
    const card = document.createElement('a');
    card.href = blog.link;
    card.className = 'card';

    card.innerHTML = `
          <div class="card-header">
            <span class="category-tag">${blog.category}</span>
          </div>
          
          <h2 class="card-title">${blog.title}</h2>
          
          <p class="card-excerpt">${blog.excerpt}</p>

          <div class="card-footer">
            <span class="published-tag">${dateIcon} ${blog.published}</span>
            <span class="view-btn">Read ${arrowIcon}</span>
          </div>
        `;
    blogGrid.appendChild(card);
  });
}

// --- Filter Logic ---
function handleFilters() {
  const searchTerm = searchInput.value.toLowerCase();
  const selectedTopic = topicFilter.value.toLowerCase();

  const filtered = currentBlogs.filter(blog => {
    const matchesSearch =
      blog.title.toLowerCase().includes(searchTerm) ||
      blog.excerpt.toLowerCase().includes(searchTerm) ||
      blog.category.toLowerCase().includes(searchTerm);

    const matchesTopic = selectedTopic === 'all' || blog.category.toLowerCase().includes(selectedTopic);
    return matchesSearch && matchesTopic;
  });

  filteredDataGlobal = filtered.reverse();
  currentPage = 1;
  updateDisplay();
}

function updateDisplay() {
  const totalPages = Math.ceil(filteredDataGlobal.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredDataGlobal.slice(startIndex, startIndex + itemsPerPage);

  renderBlogs(paginatedData);
  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  const currentPageSpan = document.getElementById('currentPageNum');
  const totalPageSpan = document.getElementById('totalPageNum');

  currentPageSpan.textContent = currentPage;
  totalPageSpan.textContent = totalPages;

  if (totalPages <= 1) {
    paginationContainer.classList.add('hidden');
    return;
  }

  paginationContainer.classList.remove('hidden');
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === totalPages;

  prevBtn.onclick = () => {
    currentPage--;
    updateDisplay();
    window.scrollTo({ top: 0 });
  };

  nextBtn.onclick = () => {
    currentPage++;
    updateDisplay();
    window.scrollTo({ top: 0 });
  };
}

// --- Event Listeners ---
searchInput.addEventListener('input', handleFilters);
topicFilter.addEventListener('change', handleFilters);

// Initial Render
loadBlogData();

/* ─── THEME DOTS ─── */
const PREFS_KEY = 'reader_prefs';
const htmlEl = document.documentElement;

function applyTheme(theme) {
  htmlEl.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-dot').forEach(d =>
    d.classList.toggle('active', d.dataset.t === theme));
}

function loadTheme() {
  const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
  applyTheme(saved.theme || 'light');
}

document.querySelectorAll('.theme-dot').forEach(btn => {
  btn.addEventListener('click', () => {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
    saved.theme = btn.dataset.t;
    localStorage.setItem(PREFS_KEY, JSON.stringify(saved));
    applyTheme(btn.dataset.t);
  });
});

loadTheme();

// --- Modal Logic ---
const filterModal = document.getElementById('filterModal');
const filterFab = document.getElementById('filterFab');
const closeModal = document.getElementById('closeModal');

// Function to toggle modal visibility
function toggleModal() {
  filterModal.classList.toggle('hidden');

  // Focus the search input automatically when opening
  if (!filterModal.classList.contains('hidden')) {
    setTimeout(() => {
      document.getElementById('searchInput').focus();
    }, 100);
  }
}

// Open modal via FAB
filterFab.addEventListener('click', toggleModal);

// Close modal via close button
closeModal.addEventListener('click', toggleModal);

// Close modal when clicking outside the content box
filterModal.addEventListener('click', (e) => {
  if (e.target === filterModal) {
    toggleModal();
  }
});

// Close modal on Escape key press
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !filterModal.classList.contains('hidden')) {
    toggleModal();
  }
});

// Apply button click
const applyBtn = document.getElementById('applyFilters');
applyBtn.addEventListener('click', () => {
  handleFilters(); // Run the search logic
  toggleModal(); // Close the modal
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && searchInput.value.trim() !== "") {
    handleFilters();
    toggleModal();
  }
});