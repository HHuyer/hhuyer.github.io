/**
 * main.js — entry point duy nhất. index.html chỉ cần
 *   <script type="module" src="js/main.js" defer></script>
 * Muốn thêm tính năng mới: viết module riêng, import + init ở đây.
 */
import { initGlobalErrorHandling, initPreloader, initMenu, initIdleUI } from './ui.js';
import { initBackgroundVideo, initClock } from './background.js';
import { initAudio } from './audio.js';
import { initChat } from './chat.js';
import { initQuotes } from './quotes.js';
import { initSettingsPanel } from './settings-panel.js';
import { ThemeLoader } from './core/theme-loader.js';
import { checkAndAutoApplyMidAutumn } from './themes/midautumn.js';

async function boot() {
  initGlobalErrorHandling();
  initPreloader();

  initBackgroundVideo();
  initClock();
  initAudio();
  initMenu();
  initIdleUI();
  initChat();
  initQuotes();
  initSettingsPanel();

  const saved = localStorage.getItem('selectedTheme');
  const autoMidAutumn = !saved && checkAndAutoApplyMidAutumn();
  await ThemeLoader.activate(autoMidAutumn ? 'midautumn' : (saved || 'default'));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
