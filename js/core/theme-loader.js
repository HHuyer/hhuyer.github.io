/**
 * theme-loader.js
 * ----------------------------------------------------------------------
 * Manifest khai báo MỌI theme hiện có, nhưng KHÔNG import sẵn — mỗi theme
 * chỉ được tải (JS module + CSS nếu có) vào đúng lần đầu người dùng chọn nó.
 *
 * Thêm theme mới trong tương lai (kể cả rất nặng: canvas 3D, đồng hồ kiểu
 * riêng, animation riêng...) = thêm 1 dòng vào MANIFEST bên dưới. Không sửa
 * gì khác trong core hay index.html.
 * ----------------------------------------------------------------------
 */
import { ThemeEngine } from './theme-engine.js';

const MANIFEST = [
  { id: 'default', group: 'flat-themes', js: '../themes/flat-themes.js' },
  { id: 'cyberpunk', group: 'flat-themes', js: '../themes/flat-themes.js' },
  { id: 'ocean', group: 'flat-themes', js: '../themes/flat-themes.js' },
  { id: 'sunset', group: 'flat-themes', js: '../themes/flat-themes.js' },
  { id: 'matrix', group: 'flat-themes', js: '../themes/flat-themes.js' },
  { id: 'midautumn', group: 'midautumn', js: '../themes/midautumn.js', css: '../../css/theme-midautumn.css' },
  { id: 'dynamic', group: 'dynamic', js: '../themes/dynamic.js' },
];

const loadedGroups = new Set();
const loadedCss = new Set();

function loadCss(href) {
  if (loadedCss.has(href)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL(href, import.meta.url).href;
  document.head.appendChild(link);
  loadedCss.add(href);
}

async function ensureLoaded(id) {
  const entry = MANIFEST.find((m) => m.id === id);
  if (!entry) throw new Error(`Theme "${id}" không có trong manifest.`);
  if (entry.css) loadCss(entry.css);
  if (!loadedGroups.has(entry.group)) {
    await import(/* @vite-ignore */ new URL(entry.js, import.meta.url).href);
    loadedGroups.add(entry.group);
  }
}

export const ThemeLoader = {
  manifest: MANIFEST,

  /** Danh sách hiển thị trong Settings — không cần load module để biết tên/preview. */
  listAvailable() {
    return MANIFEST.map((m) => ({ id: m.id }));
  },

  /** Tải (nếu cần) rồi kích hoạt theme. Dùng hàm này thay vì ThemeEngine.activate trực tiếp. */
  async activate(id) {
    await ensureLoaded(id);
    ThemeEngine.activate(id);
  },
};
