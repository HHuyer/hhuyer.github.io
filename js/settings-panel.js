/**
 * settings-panel.js — nút "Cài đặt" + panel chọn theme.
 * Danh sách theme hiển thị lấy từ ThemeLoader.manifest, nên khi thêm theme
 * mới trong theme-loader.js, panel này tự động có thêm lựa chọn.
 */
import { ThemeLoader } from './core/theme-loader.js';

const THEME_META = {
  default: { label: 'Mặc định', previewClass: 'preview-default' },
  cyberpunk: { label: 'Cyberpunk Neon', previewClass: 'preview-cyberpunk' },
  ocean: { label: 'Ocean Deep', previewClass: 'preview-ocean' },
  sunset: { label: 'Sunset Chill', previewClass: 'preview-sunset' },
  matrix: { label: 'Matrix Code', previewClass: 'preview-matrix' },
  midautumn: { label: 'Trung Thu', previewClass: 'preview-midautumn' },
  dynamic: { label: 'Dynamic Video', previewClass: 'preview-dynamic' },
};

function buildPanel() {
  const options = ThemeLoader.listAvailable().map(({ id }) => {
    const meta = THEME_META[id] || { label: id, previewClass: '' };
    return `
      <div class="theme-option" data-theme="${id}">
        <div class="theme-preview ${meta.previewClass}"></div>
        <span>${meta.label}</span>
      </div>`;
  }).join('');

  const wrapper = document.createElement('div');
  wrapper.id = 'settingsOverlay';
  wrapper.className = 'settings-overlay';
  wrapper.innerHTML = `
    <div id="settingsPanel" class="settings-panel">
      <h2>Tùy chỉnh Giao diện</h2>
      <div class="theme-options">${options}</div>
      <button id="closeSettings" class="settings-close-btn">Đóng</button>
    </div>`;
  document.body.appendChild(wrapper);
  return wrapper;
}

export function initSettingsPanel() {
  const settingsButton = document.createElement('button');
  settingsButton.id = 'settingsButton';
  settingsButton.className = 'nav-button';
  settingsButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l2-3.46c-.12-.22-.07-.49.12-.64l-2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
    </svg>
    Cài đặt`;
  document.querySelector('.nav-buttons')?.appendChild(settingsButton);

  const overlay = buildPanel();
  const closeBtn = overlay.querySelector('#closeSettings');
  const optionsContainer = overlay.querySelector('.theme-options');

  function open() { overlay.classList.add('show'); }
  function close() { overlay.classList.remove('show'); }

  settingsButton.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  function markSelected(id) {
    overlay.querySelectorAll('.theme-option').forEach((el) => {
      el.classList.toggle('selected', el.dataset.theme === id);
    });
  }

  optionsContainer.addEventListener('click', async (e) => {
    const option = e.target.closest('.theme-option');
    if (!option) return;
    await ThemeLoader.activate(option.dataset.theme);
    markSelected(option.dataset.theme);
  });

  document.addEventListener('theme:changed', (e) => markSelected(e.detail.id));
}
