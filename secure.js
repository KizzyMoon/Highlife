const HIGHLIFE_API = 'https://highlife.chelseacaitline.workers.dev';

window.HighlifeAPI = {
  base: HIGHLIFE_API,
  get token() { return localStorage.getItem('hl_api_token') || ''; },
  set token(value) { value ? localStorage.setItem('hl_api_token', value) : localStorage.removeItem('hl_api_token'); },
  async request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json');
    if (this.token) headers.set('Authorization', `Bearer ${this.token}`);
    const response = await fetch(`${HIGHLIFE_API}${path}`, { ...options, headers });
    let data = null;
    try { data = await response.json(); } catch { data = {}; }
    if (response.status === 401 && path !== '/auth/login') {
      this.token = '';
      showLogin('Your session has expired. Sign in again.');
    }
    if (!response.ok) throw new Error(data?.error || `Request failed (${response.status})`);
    return data;
  }
};

function buildLogin() {
  const overlay = document.createElement('div');
  overlay.id = 'secureGate';
  overlay.innerHTML = `
    <div class="secure-card">
      <div class="secure-mark">H</div>
      <p class="eyebrow">PRIVATE STAFF WORKSPACE</p>
      <h1>Highlife Staff Toolkit</h1>
      <p class="secure-copy">Sign in to unlock your private player records, compensation data and punishment guidance.</p>
      <form id="secureLoginForm">
        <label>Password<input id="securePassword" type="password" autocomplete="current-password" required placeholder="Enter your toolkit password" /></label>
        <button class="primary full" id="secureLoginButton" type="submit">Unlock toolkit</button>
        <p id="secureError" class="secure-error" aria-live="polite"></p>
      </form>
      <div class="secure-status"><span></span> Protected by your Cloudflare Worker</div>
    </div>`;
  document.body.appendChild(overlay);
  document.querySelector('#secureLoginForm').addEventListener('submit', login);
  return overlay;
}

function showLogin(message = '') {
  let gate = document.querySelector('#secureGate') || buildLogin();
  gate.hidden = false;
  document.querySelector('.shell').classList.add('secure-locked');
  const err = document.querySelector('#secureError');
  err.textContent = message;
  setTimeout(() => document.querySelector('#securePassword')?.focus(), 50);
}

function hideLogin() {
  const gate = document.querySelector('#secureGate');
  if (gate) gate.hidden = true;
  document.querySelector('.shell').classList.remove('secure-locked');
}

async function login(event) {
  event.preventDefault();
  const button = document.querySelector('#secureLoginButton');
  const error = document.querySelector('#secureError');
  const password = document.querySelector('#securePassword').value;
  button.disabled = true;
  button.textContent = 'Checking…';
  error.textContent = '';
  try {
    const data = await window.HighlifeAPI.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password })
    });
    window.HighlifeAPI.token = data.token;
    document.querySelector('#securePassword').value = '';
    hideLogin();
    window.dispatchEvent(new CustomEvent('highlife-authenticated'));
  } catch (err) {
    error.textContent = err.message === 'Invalid login' ? 'That password was not accepted.' : `Could not sign in: ${err.message}`;
  } finally {
    button.disabled = false;
    button.textContent = 'Unlock toolkit';
  }
}

async function checkSession() {
  document.querySelector('.shell').classList.add('secure-locked');
  if (!window.HighlifeAPI.token) {
    showLogin();
    return;
  }
  try {
    await window.HighlifeAPI.request('/players');
    hideLogin();
    window.dispatchEvent(new CustomEvent('highlife-authenticated'));
  } catch {
    showLogin('Sign in to continue.');
  }
}

window.HighlifeLogout = function () {
  window.HighlifeAPI.token = '';
  showLogin('Signed out.');
};

buildLogin();
checkSession();
