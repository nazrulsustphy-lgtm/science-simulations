// ── SCISIM CONFIG v2 ──
const SUPABASE_URL = 'https://oufdahkeygqyjocdkzbp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91ZmRhaGtleWdxeWpvY2RremJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MTI1ODcsImV4cCI6MjA5MjM4ODU4N30.XsG-Qc295xm9h_WyvEDB3wcZUsUIA3A8K5qk8iTJM0E';
const SITE_URL = 'https://nazrulsustphy-lgtm.github.io/science-simulations';

const SUBJECTS = {
  physics:         { icon:'⚛️',  color:'#00cfff', label:'Physics' },
  math:            { icon:'📐',  color:'#ffd740', label:'Mathematics' },
  chemistry:       { icon:'🧪',  color:'#00e676', label:'Chemistry' },
  biology:         { icon:'🧬',  color:'#f50057', label:'Biology' },
  geography:       { icon:'🌍',  color:'#1de9b6', label:'Geography' },
  astronomy:       { icon:'🔭',  color:'#651fff', label:'Astronomy' },
  cs:              { icon:'💻',  color:'#76ff03', label:'Computer Science' },
  engineering:     { icon:'⚙️',  color:'#ff6d00', label:'Engineering' },
  neuroscience:    { icon:'🧠',  color:'#ff4081', label:'Neuroscience' },
  economics:       { icon:'💰',  color:'#ffab00', label:'Economics' },
  environmental:   { icon:'🌱',  color:'#00e5ff', label:'Environmental' },
  interdisciplinary:{ icon:'🔗', color:'#aa00ff', label:'Interdisciplinary' },
  trending:        { icon:'🔥',  color:'#ff1744', label:'Trending' }
};

const LEMON_SQUEEZY = {
  monthly_url: 'REPLACE_WITH_LEMON_SQUEEZY_MONTHLY_URL',
  yearly_url:  'REPLACE_WITH_LEMON_SQUEEZY_YEARLY_URL',
  credits_url: 'REPLACE_WITH_LEMON_SQUEEZY_CREDITS_URL'
};

// ── SINGLE SUPABASE CLIENT INSTANCE (strict singleton) ──
let _sb = null;
let _authListenerAttached = false;

function getSupabase() {
  if (_sb) return _sb;
  if (!window.supabase) return null;
  const { createClient } = window.supabase;
  _sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'sb-scisim-auth'
    }
  });
  return _sb;
}

// Global reference (set once, lazily)
let sb = null;
function initSupabase() {
  if (!sb) sb = getSupabase();
  return sb;
}

// Try init immediately, fallback to DOMContentLoaded
if (window.supabase) {
  initSupabase();
} else {
  document.addEventListener('DOMContentLoaded', initSupabase);
}

// ── LOCAL STORAGE CACHE ──
const CACHE = {
  set(key, data, ttlMinutes = 60) {
    try {
      localStorage.setItem('scisim_' + key, JSON.stringify({
        data, expires: Date.now() + ttlMinutes * 60000
      }));
    } catch(e) {}
  },
  get(key) {
    try {
      const raw = localStorage.getItem('scisim_' + key);
      if (!raw) return null;
      const { data, expires } = JSON.parse(raw);
      if (Date.now() > expires) { localStorage.removeItem('scisim_' + key); return null; }
      return data;
    } catch(e) { return null; }
  },
  clear(key) { try { localStorage.removeItem('scisim_' + key); } catch(e) {} }
};

// ── SIMULATIONS DATA (cached) ──
async function loadSimulationsData() {
  const cached = CACHE.get('sims_data');
  if (cached) return cached;
  try {
    const res = await fetch('data/index.json');
    if (!res.ok) return [];
    const data = await res.json();
    CACHE.set('sims_data', data, 30);
    return data;
  } catch(e) { return []; }
}

// ── GLOBAL ERROR HANDLERS ──
window.addEventListener('error', (e) => console.error('Error:', e.error));
window.addEventListener('unhandledrejection', (e) => console.error('Promise:', e.reason));

// ── CURRENCY DETECTION ──
async function detectCurrency() {
  const cached = CACHE.get('currency');
  if (cached) return cached;
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    const currency = { code: data.currency || 'USD', country: data.country_code || 'US' };
    CACHE.set('currency', currency, 1440);
    return currency;
  } catch(e) { return { code:'USD', country:'US' }; }
}

// ── RATE LIMITING (client-side) ──
const RATE_LIMIT = {
  check(key, maxActions, windowMinutes) {
    const now = Date.now();
    const data = JSON.parse(localStorage.getItem('ratelim_' + key) || '[]');
    const recent = data.filter(t => now - t < windowMinutes * 60000);
    if (recent.length >= maxActions) return false;
    recent.push(now);
    localStorage.setItem('ratelim_' + key, JSON.stringify(recent));
    return true;
  }
};
