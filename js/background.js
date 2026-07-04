/**
 * background.js — video nền ngẫu nhiên + đồng hồ/thời gian đã ở trang.
 */
const VIDEO_SOURCES = [
  'video/bigbuckbunny.mp4',
  'video/elephantsdream.mp4',
  'video/sintel.mp4',
  'video/3.mov',
];

export function initBackgroundVideo() {
  const bgVideo = document.getElementById('bgVideo');
  if (!bgVideo) return;
  const src = VIDEO_SOURCES[Math.floor(Math.random() * VIDEO_SOURCES.length)];
  bgVideo.src = src;
  bgVideo.preload = 'metadata';
  bgVideo.load();
}

/**
 * initClock — đồng hồ hiện tại là bản đơn giản (giờ hệ thống + thời gian ở lại).
 * Muốn thêm "đồng hồ kiểu mới" (analog, đếm ngược sự kiện, đồng hồ mặt trăng...)
 * trong tương lai: viết thành 1 module riêng implement cùng interface
 * { mount(el), unmount() } và cho theme gọi qua host.addTicker, KHÔNG cần sửa
 * file này — xem js/clocks/ để biết ví dụ cách cắắm thêm loại đồng hồ mới.
 */
export function initClock() {
  const startTime = new Date();
  const currentTimeElem = document.getElementById('currentTime');
  const timeSpentElem = document.getElementById('timeSpent');
  if (!currentTimeElem) return;

  function update() {
    const now = new Date();
    currentTimeElem.textContent = now.toLocaleTimeString();

    const elapsedSec = Math.floor((now - startTime) / 1000);
    const minutes = Math.floor(elapsedSec / 60);
    const seconds = elapsedSec % 60;
    if (timeSpentElem) {
      const text = (minutes > 0 ? `${minutes} phút ` : '') + `${seconds} giây`;
      timeSpentElem.textContent = `Bạn đã ở đây: ${text}`;
    }
  }

  update();
  setInterval(update, 1000);
}
