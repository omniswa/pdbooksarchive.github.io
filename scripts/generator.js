document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("generatorForm");
  const btnClear = document.getElementById("btnClear");
  const btnCopyJson = document.getElementById("btnCopyJson");
  const jsonPreview = document.getElementById("jsonPreview");
  const categoryInput = document.getElementById("postCategory");
  const wordCountDisplay = document.getElementById("wordCountDisplay");
  const postContent = document.getElementById("postContent");
  const affiliateToggle = document.getElementById("affiliateToggle");
  const affiliateFields = document.getElementById("affiliateFields");

  // Set Display Date
  const today = new Date();
  const isoDate = today.toISOString();
  const displayDate = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // ─── Theme Management (synced with index via reader_prefs) ───────────────
  const PREFS_KEY = 'reader_prefs';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-dot').forEach(dot =>
      dot.classList.toggle('active', dot.dataset.t === theme)
    );
  }

  function loadTheme() {
    const prefs = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
    applyTheme(prefs.theme || 'light');
  }

  document.querySelectorAll('.theme-dot').forEach(btn => {
    btn.addEventListener('click', () => {
      const prefs = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
      prefs.theme = btn.dataset.t;
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      applyTheme(prefs.theme);
    });
  });

  loadTheme();
  // ─────────────────────────────────────────────────────────────────────────

  // --- Affiliate Toggle: Show / Hide Fields ---
  affiliateToggle.addEventListener("change", () => {
    affiliateFields.classList.toggle("visible", affiliateToggle.checked);
  });

  // --- Utility: Live JSON Preview ---
  function updateJsonPreview() {
    const title = document.getElementById("postTitle").value.trim() || "Article Title";
    const meta = document.getElementById("postMeta").value.trim() || "Meta description...";
    const category = categoryInput.value;
    const markdown = document.getElementById("postContent").value.trim();

    // Generate Slug (Strip apostrophes first to attach letters natively, e.g., "It's" -> "Its")
    const slug = title.toLowerCase()
      .replace(/['\u2018\u2019]/g, '') // Removes standard and curly apostrophes
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const currentOrigin = window.location.origin !== "null" ? window.location.origin : "https://publicdomainbooksarchive.pages.dev";

    // Process Content
    const processedContentHtml = processHtmlContent(markdown);

    // Calculate Word Count
    const wordCount = markdown ? markdown.split(/\s+/).length : 0;
    wordCountDisplay.textContent = `${wordCount} Words`;

    // Calculate Reading Time (for the JSON)
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    const jsonOutput = `{
  title: "${title}",
  category: "${category}",
  published: "${displayDate}",
  excerpt: "${meta}",
  link: "blogs/${slug}.html"
}`;
    jsonPreview.textContent = jsonOutput;
  }

  // Attach listeners for real-time update
  form.querySelectorAll('input, select, textarea').forEach(input => {
    input.addEventListener('input', updateJsonPreview);
  });

  // Initialize preview on load
  updateJsonPreview();

  // Apply Smart Quotes ONLY to text nodes
  function applySmartQuotes(node) {
    if (node.nodeType === 3) { // Text node
      let text = node.nodeValue;
      // Opening/Closing double quotes
      text = text.replace(/(^|[\s(\[{<>\-\/\u2013\u2014\u2018\u201c:=])"/g, "$1\u201c");
      text = text.replace(/"/g, "\u201d");
      // Opening/Closing single quotes (apostrophes)
      text = text.replace(/(^|[\s(\[{<>\-\/\u2013\u2014\u2018\u201c:=])'/g, "$1\u2018");
      text = text.replace(/'/g, "\u2019");
      node.nodeValue = text;
    } else if (node.nodeType === 1) { // Element node
      if (!['CODE', 'PRE', 'SCRIPT', 'STYLE'].includes(node.nodeName)) {
        for (let child of node.childNodes) {
          applySmartQuotes(child);
        }
      }
    }
  }

  function processHtmlContent(markdownText) {
    // 1. Render Markdown to Raw HTML
    const rawHtml = marked.parse(markdownText);

    // 2. Parse into DOM to manipulate safely
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = rawHtml;

    // 3. Auto-Wrap Tables
    tempDiv.querySelectorAll("table").forEach(table => {
      const wrapper = document.createElement("div");
      wrapper.className = "table-responsive";
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });

    // 4. Handle External Links
    const currentOrigin = window.location.origin !== "null" ? window.location.origin : "https://publicdomainbooksarchive.pages.dev";
    tempDiv.querySelectorAll("a").forEach(a => {
      if (a.href.startsWith("http") && !a.href.startsWith(currentOrigin)) {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "nofollow noopener");
        a.textContent = `[${a.textContent}]`;
      }
    });

    // 5. Apply Smart Quotes
    applySmartQuotes(tempDiv);

    return tempDiv.innerHTML;
  }

  // ─────────────────────────────────────────
  // Build the affiliate modal code to inject
  // into the generated HTML file
  // ─────────────────────────────────────────
  function buildAffiliateCode(slug) {
    if (!affiliateToggle.checked) return { css: '', html: '', script: '' };

    const affUrl = document.getElementById("affiliateUrl").value.trim();
    const affHeadline = document.getElementById("affiliateHeadline").value.trim() || "Our Best Pick";
    const affDesc = document.getElementById("affiliateDesc").value.trim();
    const affBtn = document.getElementById("affiliateBtnText").value.trim() || "Check It Out";
    const affDelay = parseInt(document.getElementById("affiliateDelay").value, 10) || 5;

    // Silently skip if no URL was provided
    if (!affUrl) return { css: '', html: '', script: '' };

    const css = `
  <!-- Affiliate Modal Styles -->
  <style>
    .aff-modal {
      position: fixed;
      bottom: -360px;
      right: 24px;
      width: 292px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-top: 3px solid var(--accent);
      border-radius: 14px;
      padding: 0;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.15);
      z-index: 150;
      transition: bottom 0.65s cubic-bezier(0.34, 1.56, 0.64, 1);
      overflow: hidden;
    }
    .aff-modal.aff-visible {
      bottom: 90px;
    }
    .aff-modal-body {
      padding: 20px 20px 22px;
      position: relative;
    }
    .aff-close {
      position: absolute;
      top: 14px;
      right: 14px;
      width: 26px;
      height: 26px;
      background: var(--bg-card-hover);
      border: 1px solid var(--border);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text-muted);
      padding: 0;
      line-height: 1;
      transition: color 0.2s, background 0.2s;
      flex-shrink: 0;
    }
    .aff-close:hover {
      color: var(--text-main);
      background: var(--border);
    }
    .aff-badge {
      display: inline-block;
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--accent);
      background: var(--accent-dim);
      padding: 3px 10px;
      border-radius: 20px;
      margin-bottom: 14px;
    }
    .aff-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-main);
      margin: 0 0 8px;
      line-height: 1.35;
      padding-right: 24px;
    }
    .aff-desc {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin: 0 0 18px;
      line-height: 1.55;
    }
    .aff-cta {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: var(--accent);
      color: #000 !important;
      text-align: center;
      padding: 11px 16px;
      border-radius: 8px;
      text-decoration: none !important;
      font-weight: 700;
      font-size: 0.9rem;
      letter-spacing: 0.01em;
      transition: opacity 0.2s, transform 0.2s;
      border-bottom: none !important;
    }
    .aff-cta:hover {
      opacity: 0.88;
      transform: translateY(-1px);
    }
    .aff-cta svg {
      transition: transform 0.2s;
    }
    .aff-cta:hover svg {
      transform: translateX(3px);
    }
    @media (max-width: 640px) {
      .aff-modal {
        right: 12px;
        left: 12px;
        width: auto;
        bottom: -360px;
      }
      .aff-modal.aff-visible {
        bottom: 96px;
      }
    }
  </style>`;

    const descHtml = affDesc ?
      `<p class="aff-desc">${affDesc}</p>` :
      '';

    const html = `
  <!-- Affiliate Modal -->
  <div id="affModal" class="aff-modal" role="complementary" aria-label="Sponsored recommendation">
    <div class="aff-modal-body">
      <button class="aff-close" id="affClose" aria-label="Dismiss recommendation">
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
      <span class="aff-badge">Sponsored</span>
      <h3 class="aff-title">${affHeadline}</h3>
      ${descHtml}
      <a href="${affUrl}" class="aff-cta" target="_blank" rel="noopener sponsored">
        ${affBtn}
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
      </a>
    </div>
  </div>`;

    // Use a session-scoped dismissal key so it doesn't re-appear on same visit
    const storageKey = `aff_dismissed_${slug}`;
    const script = `
  <script>
    (function () {
      var modal   = document.getElementById('affModal');
      var closeBtn = document.getElementById('affClose');
      if (!modal) return;

      // Already dismissed this session — stay hidden
      if (sessionStorage.getItem('${storageKey}')) return;

      var timer = setTimeout(function () {
        modal.classList.add('aff-visible');
      }, ${affDelay * 1000});

      closeBtn.addEventListener('click', function () {
        modal.classList.remove('aff-visible');
        sessionStorage.setItem('${storageKey}', '1');
        clearTimeout(timer);
      });

      // Also dismiss if user clicks the CTA (they're going to the link)
      var cta = modal.querySelector('.aff-cta');
      if (cta) {
        cta.addEventListener('click', function () {
          sessionStorage.setItem('${storageKey}', '1');
        });
      }
    })();
  <\/script>`;

    return { css, html, script };
  }

  // ─────────────────────────────────────────
  // Form Submit → Generate & Download HTML
  // ─────────────────────────────────────────
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Validate affiliate URL if the toggle is on
    if (affiliateToggle.checked) {
      const affUrl = document.getElementById("affiliateUrl").value.trim();
      if (!affUrl) {
        const urlInput = document.getElementById("affiliateUrl");
        urlInput.focus();
        urlInput.style.borderColor = "var(--danger)";
        urlInput.placeholder = "A URL is required when the affiliate link is enabled";
        urlInput.addEventListener("input", () => {
          urlInput.style.borderColor = "";
        }, { once: true });
        return;
      }
    }

    const title = document.getElementById("postTitle").value.trim() || "Article Title";
    const meta = document.getElementById("postMeta").value.trim() || "Meta description...";
    const category = categoryInput.value;
    const markdown = document.getElementById("postContent").value.trim();

    // Generate Slug
    const slug = title.toLowerCase()
      .replace(/['\u2018\u2019]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const currentOrigin = window.location.origin !== "null" ? window.location.origin : "https://publicdomainbooksarchive.pages.dev";

    // Process Content
    const processedContentHtml = processHtmlContent(markdown);

    // Calculate Word Count / Reading Time
    const wordCount = markdown ? markdown.split(/\s+/).length : 0;
    wordCountDisplay.textContent = `${wordCount} Words`;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    // Build affiliate code (empty strings if toggle is off / URL missing)
    const aff = buildAffiliateCode(slug);

    // Generate Final HTML
    let finalHtml = `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index, follow">

  <title>${title} | PDBA Blog</title>
  <meta name="description" content="${meta}">

  <!-- Canonical URL (Prevents duplicate content issues) -->
  <link rel="canonical" href="${currentOrigin}/blogs/${slug}">

  <!-- Open Graph / Facebook (For rich social sharing) -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${currentOrigin}/blogs/${slug}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${meta}">
  <meta property="og:image" content="https://publicdomainbooksarchive.pages.dev/og-image.webp">
  <meta property="og:site_name" content="PDBA Blog">
  <meta property="article:published_time" content="${isoDate}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${currentOrigin}/blogs/${slug}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${meta}">
  <meta name="twitter:image" content="https://publicdomainbooksarchive.pages.dev/og-image.webp">

  <link rel="icon" href="../apple-touch-icon.png" type="image/png">
  <link rel="preload" href="../fonts/outfit.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="../styles/blog-index.css">
  <link rel="stylesheet" href="../styles/blog.css">

  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "${currentOrigin}/blogs/${slug}"
      },
      "headline": "${title}",
      "description": "${meta}",
      "image": "https://publicdomainbooksarchive.pages.dev/og-image.webp",
      "author": {
        "@type": "Organization",
        "name": "PDBA Blog",
        "url": "${currentOrigin}"
      },
      "publisher": {
        "@type": "Organization",
        "name": "PDBA Blog",
        "logo": {
          "@type": "ImageObject",
          "url": "${currentOrigin}/apple-touch-icon.png"
        }
      },
      "datePublished": "${isoDate}",
      "dateModified": "${isoDate}"
    }
  <\/script>

  <script>
    const savedTheme = localStorage.getItem('3nding_theme');
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    if (savedTheme === 'light' || (!savedTheme && prefersLight)) {
      document.documentElement.classList.add('light-theme');
    }
  <\/script>${aff.css}
</head>

<body>
  <header>
    <nav>
      <a href="../blog-index.html" class="logo">PDBA BLOG</a>
      <div class="nav-links">
        <a href="../index.html" id="archive">Archive</a>
      </div>
    </nav>
  </header>

  <main class="blog-container">
    <article class="blog-content">
      <section class="blog-header">
        <span class="blog-category">${category}</span>
        <h1>${title}</h1>
        <div class="blog-meta">
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            ${displayDate}
          </span>
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            ${readingTime}-Minute Read
          </span>
        </div>
      </section>

      <article class="article-content">
        ${processedContentHtml}
      </article>
    </article>
  </main>

  <footer>
    <div class="f-links">
      <a href="../pages/about.html">About</a>
      <a href="../pages/contact.html">Contact</a>
      <a href="../pages/privacy.html">Privacy</a>
      <a href="../pages/terms.html">Terms</a>
    </div>
    <p class="copy">&copy; <span id="year"></span> PDBA BLOG. ALL RIGHTS RESERVED.</p>
    <div class="theme-toggle-wrapper">
      <button id="themeToggle" class="theme-toggle" aria-label="Toggle Theme"></button>
    </div>
  </footer>

  <!-- Bottom Pills & ToC Modal Code -->
  <div id="tocModal" class="toc-modal">
    <div class="toc-modal-content">
      <div class="toc-header">
        <h3>Table of Contents</h3>
        <button id="closeToc" aria-label="Close Modal">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <ul id="tocList" class="toc-list"></ul>
    </div>
  </div>

  <nav class="bottom-pill-nav">
    <button id="btnBackToTop" aria-label="Back to Top"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg></button>
    <div class="pill-divider"></div>
    <button id="btnShowToc" aria-label="Table of Contents"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg></button>
    <div class="pill-divider"></div>
    <button id="btnShare" aria-label="Share Article"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg></button>
  </nav>

  <aside class="code-block"></aside>
  <script src="../scripts/blog.js" defer><\/script>${aff.html}${aff.script}
</body>
</html>`;

    // Create and trigger Download Blob
    const blob = new Blob([finalHtml], { type: 'text/html' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${slug}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  });

  // Clear Form functionality
  btnClear.addEventListener("click", () => {
    const hasContent = Array.from(form.querySelectorAll('input, textarea'))
      .some(el => el.value.trim() !== "");

    if (hasContent) {
      const confirmClear = confirm("Are you sure you want to clear the form? Your progress will be lost.");
      if (!confirmClear) return;
    }

    form.reset();
    // Reset affiliate fields visibility
    affiliateFields.classList.remove("visible");
    updateJsonPreview();
  });

  // Copy JSON functionality
  btnCopyJson.addEventListener("click", () => {
    const jsonText = jsonPreview.textContent;
    navigator.clipboard.writeText(jsonText).then(() => {
      const originalText = btnCopyJson.textContent;
      btnCopyJson.textContent = "Copied!";
      setTimeout(() => {
        btnCopyJson.textContent = originalText;
      }, 2000);
    });
  });

});