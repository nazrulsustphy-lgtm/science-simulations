// ── SHARED NAV COMPONENT ──
// Auto-injects nav with hamburger menu on all pages

function renderNav(activeLink = '') {
  const navHTML = `
  <nav>
    <a class="nav-logo" href="index.html">⚛ SciSim</a>
    <div class="nav-links">
      <a class="nav-link ${activeLink==='home'?'active':''}" href="index.html">Home</a>
      <a class="nav-link ${activeLink==='browse'?'active':''}" href="browse.html">Browse</a>
      <a class="nav-link" href="browse.html?subject=physics">Physics</a>
      <a class="nav-link" href="browse.html?subject=math">Math</a>
      <a class="nav-link" href="browse.html?subject=chemistry">Chemistry</a>
      <a class="nav-link" href="browse.html?trending=true">🔥 Trending</a>
      <a class="nav-link ${activeLink==='pricing'?'active':''}" href="pricing.html">Pricing</a>
    </div>
    <div class="nav-actions">
      <div id="authBtn">
        <a class="btn-nav btn-ghost" href="auth.html">Sign in</a>
        <a class="btn-nav btn-primary" href="auth.html?mode=signup">Get Started</a>
      </div>
      <div id="userBtn" style="display:none" class="user-menu-wrap">
        <div class="user-avatar" id="userAvatar" onclick="toggleUserMenu()">U</div>
        <div class="user-dropdown" id="userDropdown">
          <div class="ud-item" id="userEmailDisplay" style="color:var(--dim);font-size:0.72rem;cursor:default"></div>
          <div class="ud-divider"></div>
          <a class="ud-item" href="dashboard.html">📊 Dashboard</a>
          <a class="ud-item" href="request.html">✉️ Request Simulation</a>
          <a class="ud-item" href="pricing.html">⭐ Upgrade</a>
          <a class="ud-item" id="adminLink" href="admin/queue.html" style="display:none;color:var(--red)">🛡️ Admin Panel</a>
          <div class="ud-divider"></div>
          <div class="ud-item" onclick="signOut()" style="color:var(--dim)">🚪 Sign out</div>
        </div>
      </div>
      <button class="hamburger-btn" onclick="toggleMobileMenu()">☰</button>
    </div>
  </nav>
  <div class="mobile-menu" id="mobileMenu">
    <a href="index.html">🏠 Home</a>
    <a href="browse.html">🗂️ Browse All</a>
    <a href="browse.html?subject=physics">⚛️ Physics</a>
    <a href="browse.html?subject=math">📐 Math</a>
    <a href="browse.html?subject=chemistry">🧪 Chemistry</a>
    <a href="browse.html?subject=biology">🧬 Biology</a>
    <a href="browse.html?trending=true">🔥 Trending</a>
    <a href="pricing.html">💎 Pricing</a>
    <a href="dashboard.html" id="mm-dashboard" style="display:none">📊 Dashboard</a>
    <a href="request.html" id="mm-request" style="display:none">✉️ Request Simulation</a>
  </div>`;

  // Insert nav at beginning of body
  const existing = document.querySelector('nav');
  if (existing) existing.outerHTML = navHTML;
  else document.body.insertAdjacentHTML('afterbegin', navHTML);
}

function toggleMobileMenu() {
  document.getElementById('mobileMenu').classList.toggle('show');
}

// Close mobile menu on link click
document.addEventListener('click', (e) => {
  if (e.target.closest('.mobile-menu a')) {
    document.getElementById('mobileMenu')?.classList.remove('show');
  }
});

// Show dashboard/request in mobile menu if logged in
async function updateMobileMenu() {
  const user = await getCurrentUser();
  if (user) {
    document.getElementById('mm-dashboard')?.style && (document.getElementById('mm-dashboard').style.display = 'block');
    document.getElementById('mm-request')?.style && (document.getElementById('mm-request').style.display = 'block');
  }
}

// ── COOKIE CONSENT BANNER ──
function initCookieBanner() {
  if (localStorage.getItem('cookie_consent')) return;

  const banner = document.createElement('div');
  banner.className = 'cookie-banner show';
  banner.innerHTML = `
    <p>🍪 We use cookies for authentication, analytics, and improving your experience. <a href="privacy.html">Learn more</a></p>
    <div class="cookie-actions">
      <button class="cookie-reject" onclick="setCookieConsent(false)">Essential Only</button>
      <button class="cookie-accept" onclick="setCookieConsent(true)">Accept All</button>
    </div>`;
  document.body.appendChild(banner);
}

function setCookieConsent(accepted) {
  localStorage.setItem('cookie_consent', accepted ? 'all' : 'essential');
  document.querySelector('.cookie-banner')?.remove();
}

// ── SHARE FUNCTIONS ──
function shareOnTwitter(title, url) {
  const text = `Check out this science simulation: ${title}`;
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
}

function shareOnFacebook(url) {
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
}

function shareOnLinkedIn(url) {
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
}

function shareOnWhatsApp(title, url) {
  window.open(`https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`, '_blank');
}

async function copyLink(url) {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch(e) { return false; }
}
