// --- Table of Contents & Bottom Navigation Logic ---
document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const btnBackToTop = document.getElementById('btnBackToTop');
  const btnShowToc = document.getElementById('btnShowToc');
  const btnShare = document.getElementById('btnShare');
  const tocModal = document.getElementById('tocModal');
  const closeToc = document.getElementById('closeToc');
  const tocList = document.getElementById('tocList');

  // 1. Auto-Generate Table of Contents
  const articleContent = document.querySelector('.article-content');
  if (articleContent) {
    const headings = articleContent.querySelectorAll('h2, h3');

    if (headings.length === 0) {
      btnShowToc.style.display = 'none'; // Hide ToC button if no headings exist
    } else {
      headings.forEach((heading, index) => {
        // Auto-generate an ID if the heading doesn't have one
        if (!heading.id) {
          const slug = heading.textContent.toLowerCase().trim()
            .replace(/[\s\W-]+/g, '-') // Replace spaces and non-words with hyphens
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
          heading.id = `${slug}-${index}`; // Append index to guarantee uniqueness
        }

        // Create List Item
        const li = document.createElement('li');
        li.className = heading.tagName.toLowerCase() === 'h3' ? 'toc-h3' : 'toc-h2';

        // Create Anchor Link
        const a = document.createElement('a');
        a.href = `#${heading.id}`;
        a.textContent = heading.textContent;

        // Smooth Scroll & Close Modal on Click
        a.addEventListener('click', (e) => {
          e.preventDefault();
          tocModal.classList.remove('active');

          // Automatically get the header height (fallback to 80px if no header is found)
          const headerElement = document.querySelector('header');
          const headerHeight = headerElement ? headerElement.offsetHeight : 80;

          // Header height + 24px of extra breathing room
          const yOffset = -(headerHeight + 24);

          const y = heading.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        });

        li.appendChild(a);
        tocList.appendChild(li);
      });
    }
  }

  // 2. Back to Top Logic
  btnBackToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // 3. ToC Modal Show/Hide Logic
  btnShowToc.addEventListener('click', () => {
    tocModal.classList.add('active');
  });

  closeToc.addEventListener('click', () => {
    tocModal.classList.remove('active');
  });

  // Close modal when clicking on the dark background overlay
  tocModal.addEventListener('click', (e) => {
    if (e.target === tocModal) {
      tocModal.classList.remove('active');
    }
  });

  // 4. Share Article Logic
  btnShare.addEventListener('click', async () => {
    const shareData = {
      title: document.title,
      text: document.querySelector('meta[name="description"]')?.content || 'Check out this article!',
      url: window.location.href
    };

    // Check if the native Web Share API is supported (Mobile/Safari/Edge)
    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: Copy to clipboard for unsupported browsers (like desktop Chrome)
      navigator.clipboard.writeText(window.location.href).then(() => {
        // Temporary feedback on the button
        const originalIcon = btnShare.innerHTML;
        btnShare.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00C851" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        setTimeout(() => {
          btnShare.innerHTML = originalIcon;
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    }
  });
});

// Set Current Year
document.getElementById("year").innerHTML = new Date().getFullYear();

// Theme Toggle Logic
const themeToggleBtn = document.getElementById('themeToggle');
const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

function updateThemeUI() {
  const isLight = document.documentElement.classList.contains('light-theme');
  if (isLight) {
    themeToggleBtn.innerHTML = `${moonIcon} Dark Mode`;
  } else {
    themeToggleBtn.innerHTML = `${sunIcon} Light Mode`;
  }
}

updateThemeUI();

themeToggleBtn.addEventListener('click', () => {
  document.documentElement.classList.toggle('light-theme');
  const isLight = document.documentElement.classList.contains('light-theme');
  localStorage.setItem('3nding_theme', isLight ? 'light' : 'dark');
  updateThemeUI();
});