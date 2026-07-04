/**
 * audio.js — phát nhạc nền ngẫu nhiên từ danh sách track.
 */
const TRACK_COUNT = 65;
const audioTracks = Array.from({ length: TRACK_COUNT }, (_, i) => `audio/${i + 1}.mp3`);

const currentAudio = new Audio();
currentAudio.volume = 0.5;

function playRandomTrack() {
  const track = audioTracks[Math.floor(Math.random() * audioTracks.length)];
  currentAudio.src = track;
  currentAudio.play().catch(() => {});
}

currentAudio.addEventListener('ended', () => setTimeout(playRandomTrack, 2000));

export function initAudio() {
  const toggleAudio = document.getElementById('toggleAudio');
  const volumeSlider = document.getElementById('volumeSlider');
  if (!toggleAudio || !volumeSlider) return;

  toggleAudio.addEventListener('click', () => {
    if (currentAudio.paused) {
      if (!currentAudio.src) playRandomTrack(); else currentAudio.play().catch(() => {});
      toggleAudio.classList.add('playing');
    } else {
      currentAudio.pause();
      toggleAudio.classList.remove('playing');
    }
  });

  volumeSlider.addEventListener('input', (e) => { currentAudio.volume = e.target.value; });
  currentAudio.volume = volumeSlider.value;

  window.addEventListener('beforeunload', () => currentAudio.pause());
}
