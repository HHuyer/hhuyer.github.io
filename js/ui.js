/**
 * ui.js — menu hamburger, tự ẩn UI khi rảnh chuột, toast thông báo, preloader.
 */
export function initMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const navButtons = document.querySelector('.nav-buttons');
  const logo = document.querySelector('.logo');
  if (!menuToggle || !navButtons || !logo) return;

  menuToggle.addEventListener('click', () => {
    navButtons.classList.toggle('active');
    logo.classList.toggle('menu-active');
    menuToggle.classList.toggle('active');
    showUI();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      navButtons.classList.remove('active');
      logo.classList.remove('menu-active');
    }
  });

  document.addEventListener('click', (e) => {
    if (
      window.innerWidth <= 768 &&
      !navButtons.contains(e.target) &&
      !menuToggle.contains(e.target) &&
      navButtons.classList.contains('active')
    ) {
      navButtons.classList.remove('active');
      logo.classList.remove('menu-active');
    }
  });
}

let idleTimer;
export function showUI() {
  const navButtons = document.querySelector('.nav-buttons');
  if (window.innerWidth <= 768 && navButtons?.classList.contains('active')) {
    clearTimeout(idleTimer);
    return;
  }
  document.querySelectorAll('.nav-buttons, .logo, .audio-controls, #toggleChatBtn, #settingsButton, .menu-toggle')
    .forEach((el) => el.classList.remove('inactive'));
  clearTimeout(idleTimer);
  idleTimer = setTimeout(hideUI, 2000);
}

function hideUI() {
  document.querySelectorAll('.nav-buttons, .logo, .audio-controls, #toggleChatBtn, #settingsButton, .menu-toggle')
    .forEach((el) => el.classList.add('inactive'));
}

export function initIdleUI() {
  document.addEventListener('mousemove', showUI);
  document.addEventListener('click', showUI);
  document.addEventListener('keydown', showUI);
  idleTimer = setTimeout(hideUI, 2000);
}

let notifTimeout;
export function showNotification(msg, type = 'error') {
  let el = document.getElementById('floating-notification');
  if (!el) {
    el = document.createElement('div');
    el.id = 'floating-notification';
    document.body.appendChild(el);
  }
  el.className = `floating-notification ${type}`;
  el.innerHTML = `<strong>${type === 'error' ? 'Lỗi:' : 'Cảnh báo:'}</strong> ${msg}`;
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(notifTimeout);
  notifTimeout = setTimeout(() => el.classList.remove('show'), 5000);
}

export function initGlobalErrorHandling() {
  window.addEventListener('error', (e) => {
    if (e.message?.toLowerCase().includes('script error')) return;
    showNotification(e.message || 'Đã xảy ra lỗi không xác định', 'error');
    hidePreloader();
  });
  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason ? (e.reason.message || e.reason) : 'Không xác định';
    showNotification(`Lỗi xử lý: ${reason}`, 'error');
    hidePreloader();
  });
}

let preloaderHidden = false;
export function hidePreloader() {
  if (preloaderHidden) return;
  preloaderHidden = true;
  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.classList.add('hidden');
    setTimeout(() => preloader.remove(), 500);
  }
}

export function initPreloader() {
  const bar = document.getElementById('progressBar');
  const pct = document.getElementById('progressPercent');
  let value = 0;

  function updateUI() {
    if (bar) { bar.style.width = `${value.toFixed(1)}%`; bar.setAttribute('aria-valuenow', Math.round(value)); }
    if (pct) pct.textContent = `${Math.round(value)}%`;
  }

  function step() {
    if (preloaderHidden) return;
    if (value < 94) {
      value += Math.max(0.12, (94 - value) * 0.01);
      updateUI();
      requestAnimationFrame(step);
    }
  }
  requestAnimationFrame(step);

  window.addEventListener('load', () => {
    value = 100;
    updateUI();
    hidePreloader();
  });

  // Timeout an toàn: nếu vì lý do gì đó trang kẹt, vẫn hiện nội dung sau 12s.
  setTimeout(hidePreloader, 12000);
}
