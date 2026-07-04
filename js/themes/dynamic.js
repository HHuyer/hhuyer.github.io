/**
 * dynamic.js — theme lấy màu chủ đạo từ video nền đang phát.
 */
import { ThemeEngine } from '../core/theme-engine.js';

function luminance(r, g, b) { return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }
function adjust(rgb, factor) {
  return {
    r: Math.min(255, Math.max(0, rgb.r * factor)),
    g: Math.min(255, Math.max(0, rgb.g * factor)),
    b: Math.min(255, Math.max(0, rgb.b * factor)),
  };
}

function sampleVideoColor(video) {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  if (!canvas.width || !canvas.height) return null;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const size = Math.min(canvas.width, canvas.height) / 4;
  const x = (canvas.width - size) / 2;
  const y = (canvas.height - size) / 2;
  const data = ctx.getImageData(x, y, size, size).data;

  let r = 0, g = 0, b = 0, n = 0;
  const step = 10;
  for (let i = 0; i < data.length; i += 4 * step) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n++; }
  return { r: Math.floor(r / n), g: Math.floor(g / n), b: Math.floor(b / n) };
}

function applyFromColor(host, avg) {
  const lum = luminance(avg.r, avg.g, avg.b);
  const primary = lum > 0.3 ? adjust(avg, 0.6) : avg;
  const secondary = lum > 0.5 ? adjust(avg, 0.8) : adjust(avg, 1.2);
  const accent = lum < 0.3 ? adjust(avg, 1.8) : adjust(avg, 0.9);
  const textIsWhite = lum <= 0.5;

  host.setVars({
    '--primary-bg-color': `rgb(${primary.r},${primary.g},${primary.b})`,
    '--secondary-bg-color': `rgba(${secondary.r},${secondary.g},${secondary.b},0.15)`,
    '--primary-text-color': textIsWhite ? '#fff' : '#333',
    '--secondary-text-color': textIsWhite ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
    '--accent-color': `rgb(${accent.r},${accent.g},${accent.b})`,
    '--border-color': `rgba(${primary.r},${primary.g},${primary.b},0.3)`,
    '--input-bg-color': `rgba(${avg.r},${avg.g},${avg.b},0.1)`,
    '--shadow-color': 'rgba(0,0,0,0.4)',
    '--backdrop-blur-value': 'blur(7px)',
  });
}

ThemeEngine.register({
  id: 'dynamic',
  label: 'Dynamic Video',
  previewClass: 'preview-dynamic',

  activate(host) {
    const video = document.getElementById('bgVideo');
    if (!video) return;
    video.style.display = '';
    video.play?.().catch(() => {});

    const tryApply = () => {
      const avg = sampleVideoColor(video);
      if (avg) applyFromColor(host, avg);
    };

    if (video.readyState >= 2) tryApply();
    video.addEventListener('loadeddata', tryApply, { once: true });
    // Video nền được đổi ngẫu nhiên theo thời gian ở background.js —
    // cập nhật lại màu mỗi vài giây để theo kịp.
    host.setInterval(tryApply, 4000);
  },

  deactivate() {},
});
