/**
 * flat-themes.js
 * Các theme chỉ đổi màu (không decor riêng) — ví dụ cho theme "nhẹ".
 * Thêm 1 theme mới kiểu này: chỉ cần thêm 1 object vào mảng bên dưới.
 */
import { ThemeEngine } from '../core/theme-engine.js';

const FLAT_THEMES = [
  {
    id: 'default',
    label: 'Mặc định',
    previewClass: 'preview-default',
    vars: {
      '--primary-bg-color': '#000',
      '--secondary-bg-color': 'rgba(255, 255, 255, 0.05)',
      '--primary-text-color': '#fff',
      '--secondary-text-color': 'rgba(255, 255, 255, 0.7)',
      '--accent-color': '#2575fc',
      '--border-color': 'rgba(255, 255, 255, 0.2)',
      '--shadow-color': 'rgba(0, 0, 0, 0.3)',
      '--backdrop-blur-value': 'blur(6px)',
      '--input-bg-color': 'rgba(255, 255, 255, 0.1)',
    },
  },
  {
    id: 'cyberpunk',
    label: 'Cyberpunk Neon',
    previewClass: 'preview-cyberpunk',
    vars: {
      '--primary-bg-color': '#0a0014',
      '--secondary-bg-color': 'rgba(50, 0, 70, 0.2)',
      '--primary-text-color': '#e0f7fa',
      '--secondary-text-color': '#b3e5fc',
      '--accent-color': '#00e676',
      '--border-color': 'rgba(0, 230, 118, 0.3)',
      '--shadow-color': 'rgba(0, 0, 0, 0.5)',
      '--backdrop-blur-value': 'blur(8px)',
      '--input-bg-color': 'rgba(0, 230, 118, 0.1)',
    },
  },
  {
    id: 'ocean',
    label: 'Ocean Deep',
    previewClass: 'preview-ocean',
    vars: {
      '--primary-bg-color': '#001f3f',
      '--secondary-bg-color': 'rgba(0, 70, 130, 0.2)',
      '--primary-text-color': '#e0f2f7',
      '--secondary-text-color': '#a7d9eb',
      '--accent-color': '#00bcd4',
      '--border-color': 'rgba(0, 188, 212, 0.3)',
      '--shadow-color': 'rgba(0, 0, 0, 0.4)',
      '--backdrop-blur-value': 'blur(7px)',
      '--input-bg-color': 'rgba(0, 188, 212, 0.1)',
    },
  },
  {
    id: 'sunset',
    label: 'Sunset Chill',
    previewClass: 'preview-sunset',
    vars: {
      '--primary-bg-color': '#330d1a',
      '--secondary-bg-color': 'rgba(100, 20, 30, 0.2)',
      '--primary-text-color': '#fff',
      '--secondary-text-color': '#ffe0b2',
      '--accent-color': '#ff8a65',
      '--border-color': 'rgba(255, 138, 101, 0.3)',
      '--shadow-color': 'rgba(0, 0, 0, 0.45)',
      '--backdrop-blur-value': 'blur(5px)',
      '--input-bg-color': 'rgba(255, 138, 101, 0.1)',
    },
  },
  {
    id: 'matrix',
    label: 'Matrix Code',
    previewClass: 'preview-matrix',
    vars: {
      '--primary-bg-color': '#000',
      '--secondary-bg-color': 'rgba(0, 20, 0, 0.7)',
      '--primary-text-color': '#00ff41',
      '--secondary-text-color': '#8affaa',
      '--accent-color': '#00cc00',
      '--border-color': 'rgba(0, 204, 0, 0.4)',
      '--shadow-color': 'rgba(0, 0, 0, 0.6)',
      '--backdrop-blur-value': 'blur(4px)',
      '--input-bg-color': 'rgba(0, 204, 0, 0.15)',
    },
  },
];

FLAT_THEMES.forEach((theme) => {
  ThemeEngine.register({
    id: theme.id,
    label: theme.label,
    previewClass: theme.previewClass,
    activate(host) {
      host.setVars(theme.vars);
      // Theme phẳng dùng lại video nền mặc định -> đảm bảo nó đang hiện
      const bgVideo = document.getElementById('bgVideo');
      if (bgVideo) { bgVideo.style.display = ''; bgVideo.play?.().catch(() => {}); }
      document.body.style.background = '';
    },
    deactivate() {
      // Không tạo layer/ticker nào -> không cần dọn gì thêm.
    },
  });
});
