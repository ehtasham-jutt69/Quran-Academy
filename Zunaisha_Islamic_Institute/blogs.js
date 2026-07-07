/**
 * blogs.js — Frontend blog engine for Zunaisha Islamic Institute
 * Handles: blog listing, category filter, search, pagination,
 *          featured spotlight, popular posts sidebar, newsletter subscription,
 *          and blog-detail page rendering (comments, likes, TOC, share).
 */

'use strict';

// ─── Utility: resolve API base URL ───────────────────────────────────────────
function getApiBase() {
  if (window.location.protocol === 'file:') return 'http://localhost:5000';
  if (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  ) {
    return '';           // same-origin when served by Express
  }
  return '';             // same-origin in production
}

const API = getApiBase();

// ─── Utility: format date ─────────────────────────────────────────────────────
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Utility: truncate plain text ────────────────────────────────────────────
function truncate(html, maxLen) {
  const plain = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return plain.length > maxLen ? plain.slice(0, maxLen) + '…' : plain;
}

// ─── Utility: show floating alert ────────────────────────────────────────────
function showAlert(type, message) {
  const existing = document.querySelectorAll('.blogs-alert');
  existing.forEach((el) => el.remove());

  const wrap = document.createElement('div');
  wrap.className = 'blogs-alert';
  const bgMap = { success: 'alert-success', danger: 'alert-danger', warning: 'alert-warning' };
  const bg = bgMap[type] || 'alert-info';
  wrap.innerHTML = `
    <div class="alert ${bg} alert-dismissible d-flex align-items-center shadow-lg"
         style="position:fixed;top:20px;left:50%;transform:translateX(-50%) translateY(-20px);
                z-index:9999;width:90%;max-width:420px;border-radius:10px;
                opacity:0;transition:all 0.3s ease;">
      <div class="flex-grow-1" style="font-size:14px;line-height:1.4;">${message}</div>
      <button type="button" class="btn-close btn-close-sm" onclick="this.closest('.blogs-alert').remove()"></button>
    </div>`;
  document.body.appendChild(wrap);
  const alertEl = wrap.querySelector('.alert');
  setTimeout(() => {
    alertEl.style.opacity = '1';
    alertEl.style.transform = 'translateX(-50%) translateY(0)';
  }, 10);
  setTimeout(() => {
    alertEl.style.opacity = '0';
    alertEl.style.transform = 'translateX(-50%) translateY(-20px)';
    setTimeout(() => wrap.remove(), 300);
  }, 4500);
}

// ─── Blog Listing Page State ──────────────────────────────────────────────────
const blogState = {
  currentPage: 1,
  totalPages: 1,
  currentCategory: '',
  currentSearch: '',
  perPage: 6,
};

// ─── Render a single blog card ────────────────────────────────────────────────
function renderBlogCard(blog) {
  const slug = blog.slug;
  const detailUrl = `/blog-detail/${slug}`;
  const img = blog.imageUrl
    ? `<img src="${blog.imageUrl}" alt="${blog.title}" loading="lazy">`
    : `<img src="./images/card1.webp" alt="${blog.title}" loading="lazy">`;

  return `
    <div class="col-md-6 col-lg-4">
      <div class="premium-blog-card" onclick="window.location.href='${detailUrl}'">
        <div class="card-img-wrapper">
          ${img}
          <span class="card-category-badge">${blog.category || 'General'}</span>
        </div>
        <div class="card-body-content">
          <h5 class="card-title-text text-truncate-2">${blog.title}</h5>
          <p class="text-muted mb-3" style="font-size:13.5px;line-height:1.55;">
            ${truncate(blog.description || blog.content || '', 110)}
          </p>
          <div class="d-flex align-items-center justify-content-between mt-auto" style="font-size:12px;color:#64748b;font-weight:600;">
            <span><i class="fa-regular fa-calendar me-1"></i>${formatDate(blog.date)}</span>
            <span>
              <i class="fa-regular fa-eye me-1"></i>${blog.views || 0}
              <i class="fa-regular fa-heart ms-2 me-1"></i>${blog.likes || 0}
              <i class="fa-solid fa-clock ms-2 me-1"></i>${blog.readingTime || '3 min read'}
            </span>
          </div>
        </div>
      </div>
    </div>`;
}

// ─── Render featured spotlight card ──────────────────────────────────────────
function renderSpotlight(blog) {
  const detailUrl = `/blog-detail/${blog.slug}`;
  const img = blog.imageUrl || './images/banner.webp';
  return `
    <div class="featured-spotlight-card">
      <div class="row g-0">
        <div class="col-lg-6">
          <img src="${img}" class="img-fluid featured-img-col w-100" alt="${blog.title}" loading="lazy"
               style="height:100%;object-fit:cover;">
        </div>
        <div class="col-lg-6 p-4 d-flex flex-column justify-content-center">
          <span class="badge bg-warning text-dark px-3 py-2 rounded-pill mb-3"
                style="font-size:11px;font-weight:700;width:fit-content;">
            ${blog.category || 'Featured'}
          </span>
          <h3 class="fw-bold mb-3" style="color:var(--title-color);line-height:1.3;">${blog.title}</h3>
          <p class="text-muted mb-4" style="font-size:14.5px;line-height:1.6;">
            ${truncate(blog.description || blog.content || '', 160)}
          </p>
          <div class="d-flex align-items-center gap-3 mb-4" style="font-size:13px;color:#64748b;font-weight:600;">
            <span><i class="fa-regular fa-user me-1 text-primary"></i>${blog.author || 'Admin'}</span>
            <span><i class="fa-regular fa-calendar me-1 text-primary"></i>${formatDate(blog.date)}</span>
            <span><i class="fa-solid fa-clock me-1 text-primary"></i>${blog.readingTime || '3 min read'}</span>
          </div>
          <a href="${detailUrl}" class="btn btn-primary rounded-pill px-4 py-2 fw-bold"
             style="width:fit-content;">
            Read Article <i class="fa-solid fa-arrow-right ms-2"></i>
          </a>
        </div>
      </div>
    </div>`;
}

// ─── Fetch & render blog grid ─────────────────────────────────────────────────
async function fetchBlogs(page = 1, category = '', search = '') {
  const grid = document.getElementById('blogGrid');
  const spotlightContainer = document.getElementById('spotlightPostContainer');
  const spotlightEl = document.getElementById('spotlightPost');
  const headerTitle = document.getElementById('gridHeaderTitle');
  const paginationWrapper = document.getElementById('paginationWrapper');

  if (!grid) return;

  // Loading state
  grid.innerHTML = `
    <div class="col-12 text-center py-5">
      <i class="fa-solid fa-circle-notch fa-spin fs-2 text-primary"></i>
      <p class="text-muted mt-2">Loading articles…</p>
    </div>`;

  const params = new URLSearchParams({
    page,
    limit: blogState.perPage,
  });
  if (category) params.set('category', category);
  if (search)   params.set('search', search);

  try {
    const res  = await fetch(`${API}/api/blogs/extended?${params.toString()}`);
    const data = await res.json();
    const blogs = data.blogs || [];

    blogState.currentPage = data.page || 1;
    blogState.totalPages  = data.pages || 1;

    // Update header
    if (headerTitle) {
      headerTitle.textContent = search
        ? `Results for "${search}"`
        : category
        ? `${category} Articles`
        : 'Latest Articles';
    }

    if (blogs.length === 0) {
      grid.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="fa-solid fa-magnifying-glass fs-2 text-muted mb-3"></i>
          <p class="text-muted">No articles found. Try a different search or category.</p>
        </div>`;
      if (spotlightContainer) spotlightContainer.style.display = 'none';
      if (paginationWrapper)  paginationWrapper.innerHTML = '';
      return;
    }

    // First blog on page 1 with no filters → spotlight
    let blogsToRender = [...blogs];
    if (page === 1 && !category && !search && blogs.length > 0) {
      const featured = blogsToRender.shift();
      if (spotlightContainer && spotlightEl) {
        spotlightEl.innerHTML = renderSpotlight(featured);
        spotlightContainer.style.display = 'block';
      }
    } else {
      if (spotlightContainer) spotlightContainer.style.display = 'none';
    }

    grid.innerHTML = blogsToRender.map(renderBlogCard).join('');
    renderPagination(blogState.currentPage, blogState.totalPages);
  } catch (err) {
    console.error('Error fetching blogs:', err);
    grid.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="fa-solid fa-triangle-exclamation fs-2 text-danger mb-3"></i>
        <p class="text-muted">Failed to load articles. Please refresh and try again.</p>
      </div>`;
  }
}

// ─── Pagination renderer ──────────────────────────────────────────────────────
function renderPagination(current, total) {
  const wrapper = document.getElementById('paginationWrapper');
  if (!wrapper || total <= 1) {
    if (wrapper) wrapper.innerHTML = '';
    return;
  }

  let html = '';
  // Prev
  html += `<button class="pagination-btn ${current === 1 ? 'disabled' : ''}"
    onclick="changePage(${current - 1})" ${current === 1 ? 'disabled' : ''}>
    <i class="fa-solid fa-chevron-left"></i></button>`;

  const delta = 2;
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      html += `<button class="pagination-btn ${i === current ? 'active' : ''}"
        onclick="changePage(${i})">${i}</button>`;
    } else if (i === current - delta - 1 || i === current + delta + 1) {
      html += `<span class="pagination-btn" style="border:none;background:transparent;">…</span>`;
    }
  }

  // Next
  html += `<button class="pagination-btn ${current === total ? 'disabled' : ''}"
    onclick="changePage(${current + 1})" ${current === total ? 'disabled' : ''}>
    <i class="fa-solid fa-chevron-right"></i></button>`;

  wrapper.innerHTML = html;
}

function changePage(page) {
  if (page < 1 || page > blogState.totalPages) return;
  blogState.currentPage = page;
  fetchBlogs(page, blogState.currentCategory, blogState.currentSearch);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Popular posts sidebar ────────────────────────────────────────────────────
async function fetchPopularPosts() {
  const container = document.getElementById('popularPostsWidgetContainer');
  if (!container) return;

  try {
    const res  = await fetch(`${API}/api/blogs/extended?popular=true&limit=5`);
    const data = await res.json();
    const blogs = data.blogs || [];

    if (blogs.length === 0) {
      container.innerHTML = '<p class="text-muted" style="font-size:13px;">No articles yet.</p>';
      return;
    }

    container.innerHTML = blogs
      .map((b) => {
        const img = b.imageUrl || './images/card1.webp';
        return `
          <div class="bookmark-widget-item">
            <img src="${img}" alt="${b.title}"
                 style="width:54px;height:54px;object-fit:cover;border-radius:8px;flex-shrink:0;">
            <div>
              <a href="/blog-detail/${b.slug}" class="d-block text-truncate-2"
                 style="font-size:13px;font-weight:600;color:var(--text-dark);line-height:1.4;">
                ${b.title}
              </a>
              <span style="font-size:11px;color:#64748b;">
                <i class="fa-regular fa-eye me-1"></i>${b.views || 0} views
              </span>
            </div>
          </div>`;
      })
      .join('');
  } catch (err) {
    console.error('Popular posts error:', err);
    container.innerHTML = '<p class="text-muted" style="font-size:13px;">Unable to load articles.</p>';
  }
}

// ─── Category badge click handlers ───────────────────────────────────────────
function initCategoryBadges() {
  const badges = document.querySelectorAll('.category-badge');
  badges.forEach((badge) => {
    badge.addEventListener('click', () => {
      badges.forEach((b) => b.classList.remove('active'));
      badge.classList.add('active');
      blogState.currentCategory = badge.dataset.category || '';
      blogState.currentPage     = 1;
      blogState.currentSearch   = '';
      const searchInput = document.getElementById('searchInput');
      if (searchInput) searchInput.value = '';
      fetchBlogs(1, blogState.currentCategory, '');
    });
  });
}

// ─── Search ───────────────────────────────────────────────────────────────────
function triggerSearch() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;
  const query = searchInput.value.trim();
  blogState.currentSearch   = query;
  blogState.currentPage     = 1;
  blogState.currentCategory = '';
  document.querySelectorAll('.category-badge').forEach((b) => b.classList.remove('active'));
  const allBadge = document.querySelector('.category-badge[data-category=""]');
  if (allBadge) allBadge.classList.add('active');
  fetchBlogs(1, '', query);
}

// ─── Newsletter subscription (blog.html form) ─────────────────────────────────
async function subscribeNewsletter() {
  const emailInput = document.getElementById('newsletterEmail');
  const btn        = document.getElementById('newsletterBtn');
  if (!emailInput) return;

  const email = emailInput.value.trim();
  if (!email || !email.includes('@')) {
    showAlert('warning', 'Please enter a valid email address.');
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = 'Subscribing…'; }

  try {
    const res  = await fetch(`${API}/api/subscribe-newsletter`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email }),
    });
    const data = await res.json();
    if (data.success) {
      showAlert('success', data.message);
      emailInput.value = '';
    } else {
      showAlert('danger', data.message || 'Subscription failed. Please try again.');
    }
  } catch (err) {
    console.error('Newsletter error:', err);
    showAlert('danger', 'Network error. Please try again later.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Subscribe'; }
  }
}

// ─── Dark / Light mode toggle ─────────────────────────────────────────────────
function initDarkMode() {
  const btn  = document.getElementById('darkModeBtn');
  if (!btn) return;
  const icon = btn.querySelector('i');

  const saved = localStorage.getItem('zunaisha-theme');
  if (saved === 'dark') {
    document.body.classList.add('dark-mode');
    if (icon) icon.classList.replace('fa-moon', 'fa-sun');
  }

  btn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('zunaisha-theme', isDark ? 'dark' : 'light');
    if (icon) {
      icon.classList.toggle('fa-moon', !isDark);
      icon.classList.toggle('fa-sun', isDark);
    }
  });
}

// ─── Bookmarks (localStorage) ─────────────────────────────────────────────────
function getBookmarks() {
  try {
    return JSON.parse(localStorage.getItem('zunaisha-bookmarks') || '[]');
  } catch (_) {
    return [];
  }
}

function renderBookmarksSidebar() {
  const container = document.getElementById('bookmarksWidgetList');
  if (!container) return;
  const bookmarks = getBookmarks();
  if (bookmarks.length === 0) {
    container.innerHTML =
      '<p class="text-muted" style="font-size:13px;">No bookmarked articles yet.</p>';
    return;
  }
  container.innerHTML = bookmarks
    .map(
      (bm) => `
      <div class="bookmark-widget-item">
        <i class="fa-solid fa-bookmark text-warning" style="font-size:16px;flex-shrink:0;"></i>
        <a href="/blog-detail/${bm.slug}" style="font-size:13px;font-weight:600;color:var(--text-dark);">
          ${bm.title}
        </a>
      </div>`
    )
    .join('');
}

// ─── Blog listing page init ───────────────────────────────────────────────────
function initBlogListingPage() {
  // Only run on blog.html (has #blogGrid)
  if (!document.getElementById('blogGrid')) return;

  initDarkMode();
  initCategoryBadges();
  fetchBlogs(1, '', '');
  fetchPopularPosts();
  renderBookmarksSidebar();

  // Search on Enter key
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') triggerSearch();
    });
  }

  // Newsletter form (blog.html section)
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      subscribeNewsletter();
    });
  }
}

// ─── Blog Detail Page ─────────────────────────────────────────────────────────

// Reading progress bar
function initReadingProgress() {
  const bar = document.getElementById('readingProgressBar');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const docH   = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = docH > 0 ? (window.scrollY / docH) * 100 : 0;
    bar.style.width = scrolled + '%';
  });
}

// Build table of contents from blog content headings
function buildTOC() {
  const tocList   = document.getElementById('tocList');
  const blogContent = document.querySelector('.blog-content');
  if (!tocList || !blogContent) return;

  const headings = blogContent.querySelectorAll('h2, h3');
  if (headings.length === 0) return;

  tocList.innerHTML = '';
  headings.forEach((h, i) => {
    if (!h.id) h.id = 'section-' + i;
    const li = document.createElement('li');
    li.className = 'toc-item' + (h.tagName === 'H3' ? ' toc-item-h3' : '');
    li.innerHTML = `<a href="#${h.id}" class="toc-link">${h.textContent}</a>`;
    tocList.appendChild(li);
  });

  // Highlight active TOC link on scroll
  const tocLinks = tocList.querySelectorAll('.toc-link');
  window.addEventListener('scroll', () => {
    let current = '';
    headings.forEach((h) => {
      if (window.scrollY >= h.offsetTop - 140) current = h.id;
    });
    tocLinks.forEach((a) => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  });
}

// Social share helpers
function shareSocial(platform) {
  const url   = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(document.title);
  const links = {
    whatsapp: `https://wa.me/?text=${title}%20${url}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    twitter:  `https://twitter.com/intent/tweet?text=${title}&url=${url}`,
  };
  if (links[platform]) window.open(links[platform], '_blank', 'noopener,noreferrer');
}

function copyLink() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    showAlert('success', 'Link copied to clipboard!');
  });
}

// Like article
async function initLikeButton(slug) {
  const btn      = document.getElementById('likeArticleBtn');
  const countEl  = document.getElementById('likesCountText');
  if (!btn || !slug) return;

  const likedKey = 'liked-' + slug;
  if (localStorage.getItem(likedKey)) {
    btn.classList.add('text-danger');
    btn.querySelector('i').classList.replace('fa-regular', 'fa-solid');
  }

  btn.addEventListener('click', async () => {
    if (localStorage.getItem(likedKey)) {
      showAlert('warning', 'You have already liked this article.');
      return;
    }
    try {
      const res  = await fetch(`${API}/api/blogs/${slug}/like`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (countEl) countEl.textContent = data.likes;
        localStorage.setItem(likedKey, '1');
        btn.classList.add('text-danger');
        btn.querySelector('i').classList.replace('fa-regular', 'fa-solid');
        showAlert('success', 'JazakAllah! Thank you for your like.');
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  });
}

// Bookmark article
function initBookmarkButton(slug, title) {
  const btn = document.getElementById('bookmarkArticleBtn');
  if (!btn || !slug) return;

  const bookmarks = getBookmarks();
  const isBookmarked = bookmarks.some((b) => b.slug === slug);
  if (isBookmarked) btn.classList.add('bookmark-btn-active');

  btn.addEventListener('click', () => {
    const list = getBookmarks();
    const idx  = list.findIndex((b) => b.slug === slug);
    if (idx === -1) {
      list.push({ slug, title });
      localStorage.setItem('zunaisha-bookmarks', JSON.stringify(list));
      btn.classList.add('bookmark-btn-active');
      showAlert('success', 'Article saved to bookmarks!');
    } else {
      list.splice(idx, 1);
      localStorage.setItem('zunaisha-bookmarks', JSON.stringify(list));
      btn.classList.remove('bookmark-btn-active');
      showAlert('warning', 'Removed from bookmarks.');
    }
  });
}

// ─── Comments ─────────────────────────────────────────────────────────────────
function renderComments(comments) {
  const stream = document.getElementById('commentsStream');
  const countEl = document.getElementById('commentsCountValue');
  if (!stream) return;

  if (countEl) countEl.textContent = comments.length;

  if (comments.length === 0) {
    stream.innerHTML =
      '<p class="text-muted" style="font-size:14px;">No comments yet. Be the first to share your thoughts!</p>';
    return;
  }

  stream.innerHTML = comments
    .map(
      (c) => `
      <div class="comment-card">
        <div class="d-flex align-items-center gap-3 mb-2">
          <div style="width:40px;height:40px;border-radius:50%;background:var(--main);
                      display:flex;align-items:center;justify-content:center;
                      color:#fff;font-weight:700;font-size:16px;flex-shrink:0;">
            ${(c.name || 'A')[0].toUpperCase()}
          </div>
          <div>
            <strong style="font-size:14px;">${c.name}</strong>
            <br>
            <span style="font-size:12px;color:#64748b;">${formatDate(c.date)}</span>
          </div>
        </div>
        <p style="font-size:14.5px;line-height:1.65;color:var(--content-text-color,#334155);margin:0;">
          ${c.comment}
        </p>
      </div>`
    )
    .join('');
}

async function initCommentForm(slug) {
  const form    = document.getElementById('commentSubmissionForm');
  const feedbackEl = document.getElementById('commentFeedbackMsg');
  const submitBtn  = document.getElementById('commentSubmitBtn');
  if (!form || !slug) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name    = document.getElementById('commenterName')?.value.trim();
    const email   = document.getElementById('commenterEmail')?.value.trim();
    const comment = document.getElementById('commenterText')?.value.trim();

    if (!name || !comment) {
      showAlert('warning', 'Please enter your name and comment.');
      return;
    }

    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Submitting…'; }

    try {
      const res  = await fetch(`${API}/api/blogs/${slug}/comments`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, comment }),
      });
      const data = await res.json();
      if (data.success) {
        renderComments(data.comments || []);
        form.reset();
        if (feedbackEl) {
          feedbackEl.textContent = 'Comment submitted! JazakAllah Khair.';
          feedbackEl.style.display = 'inline';
          setTimeout(() => { feedbackEl.style.display = 'none'; }, 4000);
        }
        showAlert('success', 'Your comment has been posted!');
      } else {
        showAlert('danger', data.message || 'Failed to submit comment.');
      }
    } catch (err) {
      console.error('Comment error:', err);
      showAlert('danger', 'Network error. Please try again.');
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit Comment'; }
    }
  });
}

// ─── Blog detail page init ────────────────────────────────────────────────────
function initBlogDetailPage() {
  if (!document.getElementById('articleBody')) return;

  initDarkMode();
  initReadingProgress();
  buildTOC();

  // Retrieve slug from meta tag injected by SSR
  const slugMeta = document.querySelector('meta[name="blog-slug"]');
  const titleMeta = document.querySelector('meta[name="blog-title"]');
  const slug  = slugMeta ? slugMeta.content : null;
  const title = titleMeta ? titleMeta.content : document.title;

  if (slug) {
    initLikeButton(slug);
    initBookmarkButton(slug, title);
    initCommentForm(slug);
  }
}

// ─── Footer quick-contact form (shared across all pages) ─────────────────────
function initFooterQuickContactForm() {
  const form = document.getElementById('quickContactForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameEl  = form.querySelector('[name="footerName"], #footerName');
    const phoneEl = form.querySelector('[name="footerPhone"], #footerPhone');
    const btn     = form.querySelector('button[type="submit"]');

    const name  = nameEl?.value.trim();
    const phone = phoneEl?.value.trim();

    if (!name || !phone) {
      showAlert('warning', 'Please enter your name and phone number.');
      return;
    }

    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

    try {
      const res  = await fetch(`${API}/api/submit-quick-contact`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      if (data.success) {
        showAlert('success', data.message);
        form.reset();
      } else {
        showAlert('danger', data.message || 'Failed to send. Please try again.');
      }
    } catch (err) {
      console.error('Quick contact error:', err);
      showAlert('danger', 'Network error. Please try again.');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Submit'; }
    }
  });
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initBlogListingPage();
  initBlogDetailPage();
  initFooterQuickContactForm();
});
