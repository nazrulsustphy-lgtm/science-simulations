// ── FREEMIUM.JS v2 ──

const DAILY_LIMIT = 5;

async function getAccessLevel() {
  const user = await getCurrentUser();
  if (!user) return 'guest';
  const profile = await getUserProfile(user.id);
  if (!profile) return 'free';
  if (profile.plan === 'premium') {
    if (profile.plan_expires_at && new Date(profile.plan_expires_at) < new Date()) return 'free';
    return 'premium';
  }
  return 'free';
}

async function applyFreemiumGate(simId, isFree) {
  const access = await getAccessLevel();
  const gate = document.getElementById('freemiumGate');
  const simFrame = document.getElementById('simFrame');
  if (!gate || !simFrame) return;

  if (access === 'premium' || isFree) { showSim(simFrame, gate); return; }

  if (access === 'free') {
    const canView = await checkDailyLimit();
    if (canView) { showSim(simFrame, gate); await incrementDailyViews(); }
    else { showGate(gate, simFrame, 'daily'); }
    return;
  }
  showGate(gate, simFrame, 'guest');
}

function showSim(frame, gate) { frame.style.display = 'block'; if (gate) gate.style.display = 'none'; }

function showGate(gate, frame, type) {
  if (frame) {
    frame.style.display = 'block';
    frame.style.maxHeight = '300px';
    frame.style.overflow = 'hidden';
    frame.style.WebkitMaskImage = 'linear-gradient(to bottom, black 40%, transparent 100%)';
    frame.style.maskImage = 'linear-gradient(to bottom, black 40%, transparent 100%)';
  }
  if (gate) {
    gate.style.display = 'flex';
    gate.innerHTML = type === 'guest' ? guestGateHTML() : dailyLimitHTML();
  }
}

function guestGateHTML() {
  return `
  <div class="gate-box">
    <div class="gate-icon">🔒</div>
    <h3 class="gate-title">Create a free account to continue</h3>
    <p class="gate-desc">Sign up free — 5 simulations per day, quiz access, join discussions. No credit card required.</p>
    <a href="auth.html?redirect=${encodeURIComponent(location.href)}" class="gate-btn-primary">Sign up free →</a>
    <a href="auth.html?redirect=${encodeURIComponent(location.href)}" class="gate-btn-ghost">Already have an account? Sign in</a>
  </div>`;
}

function dailyLimitHTML() {
  return `
  <div class="gate-box">
    <div class="gate-icon">⚡</div>
    <h3 class="gate-title">Daily limit reached</h3>
    <p class="gate-desc">You've viewed 5 simulations today. Upgrade to Premium for unlimited access.</p>
    <a href="pricing.html" class="gate-btn-primary">Upgrade to Premium →</a>
    <p class="gate-note">From $4.99/month · 7-day free trial · Cancel anytime</p>
  </div>`;
}

async function checkDailyLimit() {
  const user = await getCurrentUser();
  if (!user) return false;
  const today = new Date().toISOString().split('T')[0];
  const key = `scisim_views_${today}`;
  const views = parseInt(localStorage.getItem(key) || '0');
  return views < DAILY_LIMIT;
}

async function incrementDailyViews() {
  const today = new Date().toISOString().split('T')[0];
  const key = `scisim_views_${today}`;
  const views = parseInt(localStorage.getItem(key) || '0');
  localStorage.setItem(key, views + 1);
}

async function canMakeRequest() {
  const access = await getAccessLevel();
  if (access !== 'premium') return { allowed:false, reason:'not_premium' };
  const user = await getCurrentUser();
  const profile = await getUserProfile(user.id);
  if (profile.monthly_requests_used < 5) return { allowed:true, type:'free', remaining:5 - profile.monthly_requests_used };
  if (profile.credits > 0) return { allowed:true, type:'credits', remaining:profile.credits };
  return { allowed:false, reason:'no_credits' };
}
