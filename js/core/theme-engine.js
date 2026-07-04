/**
 * theme-engine.js
 * ----------------------------------------------------------------------
 * Bộ khung quản lý theme dạng "plugin". index.html và core code KHÔNG biết
 * chi tiết bên trong từng theme. Mỗi theme là 1 module độc lập implement:
 *
 *   {
 *     id: 'midautumn',
 *     label: 'Trung Thu',
 *     previewClass: 'preview-midautumn', // dùng cho khung xem trước trong Settings
 *     activate(host)   -> chạy khi theme được bật
 *     deactivate(host) -> BẮT BUỘC dọn sạch mọi thứ activate() đã tạo ra
 *   }
 *
 * `host` là API duy nhất theme được phép dùng để đụng vào trang:
 *   - host.setVars(obj)      set CSS custom properties (màu, blur, shadow...)
 *   - host.addLayer(el)      thêm 1 lớp decor (canvas/div) vào #theme-layer,
 *                            tự động bị gỡ khi theme deactivate
 *   - host.addTicker(fn)     đăng ký hàm chạy mỗi rAF, tự động huỷ khi
 *                            deactivate (dùng cho animation nặng, đồng hồ...)
 *   - host.setInterval(fn,ms) giống setInterval nhưng tự clear khi deactivate
 *   - host.storage           localStorage namespaced theo theme id
 *   - host.root               phần tử <body> (hiếm khi cần dùng trực tiếp)
 *
 * => Theme mới, dù nặng/nhiều animation, chỉ cần 1 file mới trong /js/themes/
 *    và 1 dòng import+register — không đụng index.html, không đụng theme khác.
 * ----------------------------------------------------------------------
 */

const registry = new Map();
let activeTheme = null;
let activeHost = null;

const DEFAULT_VARS = {
  '--primary-bg-color': '#000',
  '--secondary-bg-color': 'rgba(255, 255, 255, 0.05)',
  '--primary-text-color': '#fff',
  '--secondary-text-color': 'rgba(255, 255, 255, 0.7)',
  '--accent-color': '#2575fc',
  '--border-color': 'rgba(255, 255, 255, 0.2)',
  '--shadow-color': 'rgba(0, 0, 0, 0.3)',
  '--backdrop-blur-value': 'blur(6px)',
  '--input-bg-color': 'rgba(255, 255, 255, 0.1)',
};

function ensureLayerRoot() {
  let layer = document.getElementById('theme-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'theme-layer';
    layer.style.position = 'fixed';
    layer.style.inset = '0';
    layer.style.zIndex = 'var(--z-decor)';
    layer.style.pointerEvents = 'none';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
  }
  return layer;
}

function makeHost(themeId) {
  const createdLayers = [];
  const tickers = [];
  const intervals = [];
  let rafId = null;

  function tick(ts) {
    tickers.forEach((fn) => {
      try { fn(ts); } catch (e) { console.error(`[theme:${themeId}] ticker error`, e); }
    });
    if (tickers.length) rafId = requestAnimationFrame(tick);
  }

  return {
    root: document.body,

    setVars(vars) {
      Object.entries(vars).forEach(([k, v]) => {
        document.documentElement.style.setProperty(k, v);
      });
    },

    addLayer(el) {
      ensureLayerRoot().appendChild(el);
      createdLayers.push(el);
      return el;
    },

    addTicker(fn) {
      tickers.push(fn);
      if (rafId === null) rafId = requestAnimationFrame(tick);
    },

    setInterval(fn, ms) {
      const id = window.setInterval(fn, ms);
      intervals.push(id);
      return id;
    },

    storage: {
      get(key, fallback = null) {
        try {
          const raw = localStorage.getItem(`theme:${themeId}:${key}`);
          return raw === null ? fallback : JSON.parse(raw);
        } catch { return fallback; }
      },
      set(key, value) {
        try { localStorage.setItem(`theme:${themeId}:${key}`, JSON.stringify(value)); } catch {}
      },
    },

    // Gọi nội bộ bởi engine khi deactivate — theme không cần tự gọi.
    _cleanup() {
      createdLayers.forEach((el) => el.remove());
      createdLayers.length = 0;
      tickers.length = 0;
      intervals.forEach((id) => clearInterval(id));
      intervals.length = 0;
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    },
  };
}

export const ThemeEngine = {
  /** Đăng ký 1 theme module. Gọi 1 lần khi file theme được import. */
  register(themeDef) {
    if (!themeDef || !themeDef.id) throw new Error('Theme phải có id');
    registry.set(themeDef.id, themeDef);
  },

  list() {
    return Array.from(registry.values());
  },

  get(id) {
    return registry.get(id);
  },

  /** Kích hoạt theme theo id. Tự động deactivate theme trước đó (nếu có). */
  activate(id) {
    const def = registry.get(id);
    if (!def) {
      console.warn(`Theme "${id}" chưa được đăng ký, dùng "default".`);
      return this.activate('default');
    }

    if (activeTheme) {
      try { activeTheme.deactivate?.(activeHost); } catch (e) { console.error(e); }
      activeHost._cleanup();
      document.body.classList.remove(`theme-${activeTheme.id}`);
    }

    document.body.classList.add(`theme-${id}`);
    // Reset về mặc định trước, để theme mới không kế thừa biến của theme cũ
    Object.entries(DEFAULT_VARS).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));

    activeHost = makeHost(id);
    activeTheme = def;
    def.activate?.(activeHost);

    localStorage.setItem('selectedTheme', id);
    document.dispatchEvent(new CustomEvent('theme:changed', { detail: { id } }));
  },

  current() {
    return activeTheme?.id ?? null;
  },
};
