/**
 * midautumn.js
 * Theme "nặng" (mặt trăng to xoay, lồng đèn bay, sao lấp lánh, tự dò rằm
 * tháng 8 âm lịch) — minh hoạ theme phức tạp vẫn gọn nhờ dùng `host`:
 * mọi phần tử tạo ra qua host.addLayer() được engine tự gỡ khi đổi theme khác.
 *
 * Cần 2 thư viện ngoài: dayjs, solarlunar (load trong index.html qua CDN,
 * chỉ theme này dùng nên nếu muốn "lazy" có thể import động ở activate()).
 */
import { ThemeEngine } from '../core/theme-engine.js';

const VARS = {
  '--primary-bg-color': '#1b0a14',
  '--secondary-bg-color': 'rgba(255, 223, 117, 0.06)',
  '--primary-text-color': '#fff3d9',
  '--secondary-text-color': 'rgba(255, 210, 120, 0.85)',
  '--accent-color': '#ffb400',
  '--border-color': 'rgba(255, 180, 60, 0.18)',
  '--shadow-color': 'rgba(0, 0, 0, 0.5)',
  '--backdrop-blur-value': 'blur(6px)',
  '--input-bg-color': 'rgba(255, 200, 80, 0.06)',
};

const VARIANTS = [
  { name: 'classic', moonSize: 120, lanternCount: 6 },
  { name: 'golden', moonSize: 160, lanternCount: 9 },
  { name: 'mist', moonSize: 100, lanternCount: 5 },
  { name: 'festive', moonSize: 140, lanternCount: 12 },
];

const MOON_IMG = 'assets/GmBbExUXoAAvx4n.jpg';

function computeAverageColor(img, sampleSize = 40) {
  try {
    const c = document.createElement('canvas');
    c.width = sampleSize; c.height = sampleSize;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, c.width, c.height);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] > 16) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
    }
    if (!n) return { r: 200, g: 160, b: 80 };
    return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
  } catch { return { r: 200, g: 160, b: 80 }; }
}

function applyBloom(el, rgb, intensity = 1) {
  el.style.filter = `drop-shadow(0 0 ${12 * intensity}px rgba(${rgb.r},${rgb.g},${rgb.b},0.9))`;
  el.style.boxShadow = `0 0 ${20 * intensity}px rgba(${rgb.r},${rgb.g},${rgb.b},0.16), 0 30px 80px rgba(0,0,0,0.6)`;
}

function buildMoon(variant) {
  const moon = document.createElement('div');
  moon.className = 'mid-moon rotating';
  moon.setAttribute('role', 'img');
  moon.setAttribute('aria-label', 'Moon');
  moon.style.width = `${variant.moonSize}px`;
  moon.style.height = `${variant.moonSize}px`;
  moon.style.backgroundImage = `url("${MOON_IMG}")`;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = MOON_IMG;
  img.onload = () => applyBloom(moon, computeAverageColor(img), 0.9);

  return moon;
}

function buildLantern() {
  const l = document.createElement('div');
  l.className = 'lantern';
  const startLeft = Math.random() * 80 + 5;
  const startBottom = Math.random() * 10 + 2;
  l.style.left = `${startLeft}vw`;
  l.style.bottom = `${startBottom}vh`;
  l.style.animationDuration = `${(10 + Math.random() * 10).toFixed(1)}s`;
  l.style.animationDelay = `${(Math.random() * 4).toFixed(2)}s`;
  l.style.transform = `rotate(${(Math.random() - 0.5) * 12}deg)`;
  l.textContent = '中秋';
  l.addEventListener('animationend', () => l.remove());
  return l;
}

function buildStar() {
  const star = document.createElement('div');
  star.className = 'mid-star';
  star.style.left = `${Math.random() * 90 + 2}vw`;
  star.style.top = `${Math.random() * 40 + 2}vh`;
  star.style.animationDuration = `${(1.8 + Math.random() * 2.5).toFixed(2)}s`;
  star.style.animationDelay = `${(Math.random() * 2).toFixed(2)}s`;
  return star;
}

ThemeEngine.register({
  id: 'midautumn',
  label: 'Trung Thu',
  previewClass: 'preview-midautumn',

  activate(host) {
    host.setVars(VARS);

    const bgVideo = document.getElementById('bgVideo');
    if (bgVideo) { bgVideo.pause(); bgVideo.style.display = 'none'; }
    document.body.style.background = 'linear-gradient(180deg,#1b0a14 0%, #2a1220 100%)';

    const variant = VARIANTS[Math.floor(Math.random() * VARIANTS.length)];

    host.addLayer(buildMoon(variant));

    const lanternContainer = document.createElement('div');
    lanternContainer.className = 'lanterns';
    lanternContainer.style.position = 'absolute';
    lanternContainer.style.inset = '0';
    host.addLayer(lanternContainer);

    // Sinh lồng đèn liên tục theo nhịp, tự dừng khi theme bị deactivate
    // vì host.setInterval được engine clear giúp.
    const spawnBatch = () => {
      for (let i = 0; i < variant.lanternCount; i++) lanternContainer.appendChild(buildLantern());
      for (let i = 0; i < 8; i++) lanternContainer.appendChild(buildStar());
    };
    spawnBatch();
    host.setInterval(spawnBatch, 14000);
  },

  deactivate() {
    // Không cần dọn thủ công gì thêm: mọi layer do host.addLayer tạo ra
    // (mặt trăng, container lồng đèn) và interval đều được engine tự gỡ.
    document.body.style.background = '';
    const bgVideo = document.getElementById('bgVideo');
    if (bgVideo) { bgVideo.style.display = ''; bgVideo.play?.().catch(() => {}); }
  },
});

/** Tự bật theme Trung Thu nếu đang trong khoảng ±30 ngày quanh rằm tháng 8. */
export function checkAndAutoApplyMidAutumn() {
  try {
    if (!window.dayjs || !window.solarlunar) return false;
    const today = window.dayjs();
    const year = today.year();
    const candidates = [];
    [year - 1, year, year + 1].forEach((y) => {
      const solar = window.solarlunar.lunar2solar(y, 8, 15, false);
      if (solar && solar.cYear) {
        candidates.push(window.dayjs(`${solar.cYear}-${String(solar.cMonth).padStart(2, '0')}-${String(solar.cDay).padStart(2, '0')}`));
      }
    });
    return candidates.some((d) => Math.abs(today.diff(d, 'day')) <= 30);
  } catch (e) {
    console.warn('Mid-Autumn auto-check failed', e);
    return false;
  }
}
