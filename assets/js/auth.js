// ── AUTH.JS v2 — Shared across all pages ──

// ── GET CURRENT USER ──
async function getCurrentUser() {
  if (!sb) sb = getSupabase();
  if (!sb) return null;
  try {
    const { data: { session } } = await sb.auth.getSession();
    return session?.user || null;
  } catch(e) {
    console.error('getCurrentUser error:', e);
    return null;
  }
}

// ── GET USER PROFILE (cached) ──
async function getUserProfile(userId) {
  if (!userId) return null;
  const cacheKey = 'profile_' + userId;
  const cached = CACHE.get(cacheKey);
  if (cached) return cached;

  if (!sb) sb = getSupabase();
  const { data, error } = await sb.from('users').select('*').eq('id', userId).single();
  if (error) return null;
  CACHE.set(cacheKey, data, 5);
  return data;
}

// ── CHECK IF PREMIUM (server-side validated) ──
async function isPremium() {
  const user = await getCurrentUser();
  if (!user) return false;
  const profile = await getUserProfile(user.id);
  if (!profile) return false;
  if (profile.plan !== 'premium') return false;
  if (profile.plan_expires_at && new Date(profile.plan_expires_at) < new Date()) return false;
  return true;
}

// ── CHECK IF ADMIN (server-side via is_admin column) ──
async function isAdmin() {
  const user = await getCurrentUser();
  if (!user) return false;
  const profile = await getUserProfile(user.id);
  return profile?.is_admin === true;
}

// ── SIGN IN WITH GOOGLE ──
async function signInWithGoogle() {
  if (!sb) sb = getSupabase();
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: SITE_URL + '/dashboard.html' }
  });
  if (error) console.error('Auth error:', error);
}

// ── SIGN OUT ──
async function signOut() {
  if (!sb) sb = getSupabase();
  // Clear cache
  localStorage.clear();
  await sb.auth.signOut();
  window.location.href = 'index.html';
}

// ── ONBOARDING — CREATE PROFILE ON FIRST LOGIN ──
function setupAuthListener() {
  if (_authListenerAttached) return;
  if (!sb) sb = getSupabase();
  if (!sb) return;
  _authListenerAttached = true;
  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      const user = session.user;
      // Check if profile exists
      const { data } = await sb.from('users').select('id').eq('id', user.id).single();
      if (!data) {
        await sb.from('users').insert({
          id: user.id,
          email: user.email,
          username: user.user_metadata?.full_name || user.email?.split('@')[0],
          plan: 'free',
          credits: 0,
          monthly_requests_used: 0,
          monthly_reset_at: new Date().toISOString()
        });
      } else {
        // Check monthly reset
        await checkMonthlyReset(user.id);
      }
    }
  });
}

// ── MONTHLY REQUEST COUNTER RESET ──
async function checkMonthlyReset(userId) {
  if (!sb) sb = getSupabase();
  const profile = await getUserProfile(userId);
  if (!profile) return;

  const now = new Date();
  const resetAt = profile.monthly_reset_at ? new Date(profile.monthly_reset_at) : null;

  // Reset if new month started
  if (!resetAt || (now.getMonth() !== resetAt.getMonth() || now.getFullYear() !== resetAt.getFullYear())) {
    await sb.from('users').update({
      monthly_requests_used: 0,
      monthly_reset_at: now.toISOString()
    }).eq('id', userId);
    CACHE.clear('profile_' + userId);
  }
}

// ── RENDER NAV AUTH BUTTONS ──
async function renderNavAuth() {
  const user = await getCurrentUser();
  const authBtn = document.getElementById('authBtn');
  const userBtn = document.getElementById('userBtn');
  if (!authBtn || !userBtn) return;

  if (user) {
    const profile = await getUserProfile(user.id);
    authBtn.style.display = 'none';
    userBtn.style.display = 'flex';
    const avatar = document.getElementById('userAvatar');
    if (avatar) avatar.textContent = (user.email || 'U')[0].toUpperCase();
    const emailDisplay = document.getElementById('userEmailDisplay');
    if (emailDisplay) emailDisplay.textContent = user.email;
    // Show admin link if admin
    if (profile?.is_admin) {
      const adminLink = document.getElementById('adminLink');
      if (adminLink) adminLink.style.display = 'flex';
    }
  } else {
    authBtn.style.display = 'flex';
    userBtn.style.display = 'none';
  }
}

// ── LOG SIMULATION VIEW ──
async function logSimView(simId) {
  try {
    if (!sb) sb = getSupabase();
    const user = await getCurrentUser();
    await sb.from('simulation_views').insert({
      simulation_id: simId,
      user_id: user?.id || null,
      country: null
    });
  } catch(e) {}
}

// ── USER DROPDOWN ──
function toggleUserMenu() {
  const dd = document.getElementById('userDropdown');
  if (dd) dd.classList.toggle('show');
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.user-menu-wrap')) {
    document.getElementById('userDropdown')?.classList.remove('show');
  }
});

// ── GDPR: EXPORT USER DATA ──
async function exportUserData() {
  const user = await getCurrentUser();
  if (!user) return alert('Please sign in');

  if (!sb) sb = getSupabase();
  const [profile, views, comments, quizzes, requests, notifs] = await Promise.all([
    sb.from('users').select('*').eq('id', user.id).single(),
    sb.from('simulation_views').select('*').eq('user_id', user.id),
    sb.from('comments').select('*').eq('user_id', user.id),
    sb.from('quiz_results').select('*').eq('user_id', user.id),
    sb.from('request_queue').select('*').eq('user_id', user.id),
    sb.from('notifications').select('*').eq('user_id', user.id)
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    profile: profile.data,
    simulation_views: views.data,
    comments: comments.data,
    quiz_results: quizzes.data,
    request_queue: requests.data,
    notifications: notifs.data
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `scisim-data-${user.email}-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── GDPR: DELETE ACCOUNT ──
async function deleteAccount() {
  const user = await getCurrentUser();
  if (!user) return;

  const confirmText = prompt('This will permanently delete your account, comments, quiz history, and all data. This cannot be undone.\n\nType DELETE to confirm:');
  if (confirmText !== 'DELETE') return;

  if (!sb) sb = getSupabase();

  // Delete from all tables (RLS will enforce)
  await Promise.all([
    sb.from('comments').delete().eq('user_id', user.id),
    sb.from('simulation_views').delete().eq('user_id', user.id),
    sb.from('quiz_results').delete().eq('user_id', user.id),
    sb.from('request_queue').delete().eq('user_id', user.id),
    sb.from('notifications').delete().eq('user_id', user.id),
    sb.from('users').delete().eq('id', user.id)
  ]);

  // Sign out + clear all data
  localStorage.clear();
  await sb.auth.signOut();
  alert('Your account has been deleted. Thank you for using SciSim.');
  window.location.href = 'index.html';
}

// ── FAVORITES SYSTEM ──
async function toggleFavorite(simId) {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'auth.html?redirect=' + encodeURIComponent(location.href);
    return;
  }
  const favs = JSON.parse(localStorage.getItem('favorites_' + user.id) || '[]');
  const idx = favs.indexOf(simId);
  if (idx === -1) favs.push(simId); else favs.splice(idx, 1);
  localStorage.setItem('favorites_' + user.id, JSON.stringify(favs));
  return idx === -1;
}

async function getFavorites() {
  const user = await getCurrentUser();
  if (!user) return [];
  return JSON.parse(localStorage.getItem('favorites_' + user.id) || '[]');
}

async function isFavorited(simId) {
  const favs = await getFavorites();
  return favs.includes(simId);
}

// Initialize on load
if (window.supabase) {
  sb = getSupabase();
  setupAuthListener();
}
