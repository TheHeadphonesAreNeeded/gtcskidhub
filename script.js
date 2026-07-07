const CONFIG = window.SKIDHUB_CONFIG || {
  progress: 0,
  modules: [],
  counterNamespace: "skidhub-default",
  counterKey: "waiting"
};

// --- typed terminal line ---
(function typeLine() {
  const el = document.getElementById('typedLine');
  const text = 'initializing skidhub...';
  let i = 0;

  function step() {
    if (i <= text.length) {
      el.textContent = text.slice(0, i);
      i++;
      setTimeout(step, 45);
    }
  }
  step();
})();

// --- render status panel from config.js ---
(function renderStatus() {
  const fill = document.getElementById('progressFill');
  const label = document.getElementById('progressLabel');
  const list = document.getElementById('modulesList');

  label.textContent = `${CONFIG.progress}%`;
  requestAnimationFrame(() => {
    setTimeout(() => {
      fill.style.width = `${CONFIG.progress}%`;
    }, 300);
  });

  const statusText = { ready: 'ready', building: 'building', locked: 'locked' };

  list.innerHTML = CONFIG.modules
    .map((m) => {
      const cls = m.status === 'ready' ? 'module--done'
        : m.status === 'building' ? 'module--active'
        : '';
      return `
        <li class="module ${cls}">
          <span class="module-dot"></span> ${m.name}
          <span class="module-tag">${statusText[m.status] || m.status}</span>
        </li>`;
    })
    .join('');
})();

// --- uptime clock, purely atmospheric ---
(function runClock() {
  const clockEl = document.getElementById('clock');
  const start = Date.now();

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function tick() {
    const elapsed = Math.floor((Date.now() - start) / 1000);
    const hrs = Math.floor(elapsed / 3600);
    const mins = Math.floor((elapsed % 3600) / 60);
    const secs = elapsed % 60;
    clockEl.textContent = `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }

  tick();
  setInterval(tick, 1000);
})();

// --- real, persistent waiting-list counter ---
// Uses countapi.xyz — a free hit-counter API, no signup/backend required.
// Each unique namespace+key pair is its own shared counter across all visitors.
// Change CONFIG.counterNamespace in config.js to something unique to you.
const COUNTER_BASE = 'https://api.countapi.xyz';

function formatCount(n) {
  return `${n.toLocaleString()} waiting`;
}

async function loadCount() {
  const el = document.getElementById('queueCount');
  try {
    const res = await fetch(`${COUNTER_BASE}/get/${CONFIG.counterNamespace}/${CONFIG.counterKey}`);
    if (!res.ok) throw new Error('counter unavailable');
    const data = await res.json();
    el.textContent = formatCount(data.value ?? 0);
  } catch (err) {
    el.textContent = '— waiting';
  }
}

async function incrementCount() {
  const el = document.getElementById('queueCount');
  try {
    const res = await fetch(`${COUNTER_BASE}/hit/${CONFIG.counterNamespace}/${CONFIG.counterKey}`);
    if (!res.ok) throw new Error('counter unavailable');
    const data = await res.json();
    el.textContent = formatCount(data.value ?? 0);
  } catch (err) {
    // Counter failing shouldn't block the actual signup.
  }
}

loadCount();

// --- notify form: real Netlify Forms submission ---
(function handleForm() {
  const form = document.getElementById('notifyForm');
  const status = document.getElementById('status');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = form.email.value.trim();
    if (!email) return;

    const body = new URLSearchParams(new FormData(form)).toString();

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    })
      .then(() => {
        status.textContent = `> queued ${email} for launch notification.`;
        form.reset();
        incrementCount();
      })
      .catch(() => {
        status.textContent = `> something went wrong — try again in a bit.`;
      });
  });
})();
