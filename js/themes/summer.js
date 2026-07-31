/**
 * summer.js — theme "Summer" (mặc định của trang): mặt trời/trăng theo giờ
 * thực, hệ thời tiết (nắng/mây/mưa/tuyết/sương/bão) tự động hoặc thủ công,
 * SFX sóng biển + sấm sét, sao băng ban đêm...
 *
 * Toàn bộ logic gốc (~2500 dòng, tự chứa: canvas particles, audio, weather
 * API, day/night cycle) chạy nguyên vẹn bên trong 1 <iframe> riêng
 * (summer-frame.html) thay vì mổ xẻ và nhúng trực tiếp vào DOM chính.
 * Lý do:
 *   - File gốc dùng rất nhiều ID/biến toàn cục (#overlay, #time-display,
 *     startAudio(), v.v.) — nhúng thẳng dễ đụng độ với code khác của trang.
 *   - iframe cô lập hoàn toàn: deactivate() chỉ cần gỡ iframe là dọn sạch
 *     100% (audio, requestAnimationFrame loop, setInterval, canvas...)
 *     mà không cần export/patch lại từng hàm bên trong.
 *   - Nhạc nền chính (audio.js) và theme này có 2 hệ thống audio độc lập,
 *     chạy song song đúng như yêu cầu — không có nguy cơ 1 bên vô tình
 *     pause/can thiệp bên kia vì khác document.
 *
 * Bảng điều khiển thời tiết đầy đủ (nắng/mưa/tuyết/bão, đồng bộ giờ,
 * cường độ...) được GIỮ NGUYÊN chức năng nhưng ẩn kín đáo: chỉ hiện huy
 * hiệu nhỏ mờ ở góc dưới-phải của iframe, bấm vào mới mở — không quảng bá
 * ra UI chính, coi như "trứng phục sinh" cho người dùng tò mò.
 */
import { ThemeEngine } from '../core/theme-engine.js';

const VARS = {
  '--primary-bg-color': '#04101c',
  '--secondary-bg-color': 'rgba(90, 186, 200, 0.08)',
  '--primary-text-color': '#eaf6fb',
  '--secondary-text-color': 'rgba(200, 235, 245, 0.75)',
  '--accent-color': '#3ba7c4',
  '--border-color': 'rgba(90, 186, 200, 0.25)',
  '--shadow-color': 'rgba(0, 0, 0, 0.45)',
  '--backdrop-blur-value': 'blur(7px)',
  '--input-bg-color': 'rgba(90, 186, 200, 0.1)',
};

ThemeEngine.register({
  id: 'summer',
  label: 'Summer',
  previewClass: 'preview-summer',

  activate(host) {
    host.setVars(VARS);

    // Video nền + màu nền mặc định không cần thiết nữa: iframe tự vẽ toàn
    // bộ cảnh (trời, biển, cây, bờ cát) full màn hình.
    const bgVideo = document.getElementById('bgVideo');
    if (bgVideo) { bgVideo.pause(); bgVideo.style.display = 'none'; }
    document.body.style.background = '#000';

    const frame = document.createElement('iframe');
    frame.src = new URL('./summer-frame.html', import.meta.url).href;
    frame.title = 'Summer';
    frame.setAttribute('aria-hidden', 'true');
    frame.style.position = 'fixed';
    frame.style.inset = '0';
    frame.style.width = '100vw';
    frame.style.height = '100vh';
    frame.style.border = 'none';
    // Theme chỉ là background trang trí: không được chặn click/tương tác
    // với UI chính (nav, chat, settings...) nằm phía trên nó — trừ vùng
    // huy hiệu ẩn, nhưng huy hiệu đó không quan trọng bằng UI chính, nên
    // chấp nhận đánh đổi để UI chính luôn bấm được.
    frame.style.pointerEvents = 'none';
    frame.allow = 'autoplay';

    host.addLayer(frame);

    // Cho phép tương tác (mở bảng điều khiển ẩn, unlock audio) chỉ khi
    // người dùng chủ động rê chuột vào góc dưới-phải, nơi huy hiệu nằm —
    // bật lại pointer-events cho riêng iframe trong vùng đó bằng cách bật
    // toàn bộ khi hover gần góc, tắt khi rời đi.
    const HOTSPOT_SIZE = 64; // px, khớp với vị trí .weather-badge trong iframe
    function isNearHotspot(e) {
      const x = window.innerWidth - e.clientX;
      const y = window.innerHeight - e.clientY;
      return x >= 0 && x <= HOTSPOT_SIZE * 2 && y >= 0 && y <= HOTSPOT_SIZE * 2;
    }
    function onMove(e) {
      frame.style.pointerEvents = isNearHotspot(e) ? 'auto' : 'none';
    }
    document.addEventListener('mousemove', onMove);
    host._coastCleanupMove = () => document.removeEventListener('mousemove', onMove);
  },

  deactivate(host) {
    host._coastCleanupMove?.();
    document.body.style.background = '';
    const bgVideo = document.getElementById('bgVideo');
    if (bgVideo) { bgVideo.style.display = ''; bgVideo.play?.().catch(() => {}); }
    // iframe (và mọi audio/canvas/interval bên trong nó) bị gỡ tự động
    // bởi engine vì được thêm qua host.addLayer().
  },
});

/**
 * checkAndAutoApplyMidAutumn-style helper: id của theme mặc định trang.
 * main.js dùng giá trị này khi localStorage chưa có lựa chọn nào — xem
 * hướng dẫn cập nhật main.js đi kèm.
 */
export const DEFAULT_THEME_ID = 'summer';
