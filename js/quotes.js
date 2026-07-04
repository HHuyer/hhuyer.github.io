/**
 * quotes.js — gửi trích dẫn + hiện trích dẫn ngẫu nhiên trôi nổi.
 * (Đã bỏ khối UI ẩn trùng lặp "quote-card" cũ và hàm loadQuotes() không
 * dùng tới trong bản gốc — chỉ giữ lại quote-footer-panel đang thật sự dùng.)
 */
import { getSupabase } from './core/supabase-client.js';

async function getUserIP() {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    if (!res.ok) return null;
    return (await res.json()).ip;
  } catch {
    return null;
  }
}

function spawnFloatingQuote(text) {
  const el = document.createElement('div');
  el.className = 'floating-quote';
  el.style.left = `${Math.random() * 60 + 5}vw`;
  el.style.bottom = `${Math.random() * 20 + 5}vh`;
  el.textContent = text;
  const dur = `${(8 + Math.random() * 6).toFixed(1)}s`;
  el.style.animation = `${Math.random() > 0.5 ? 'drift' : 'floatUp'} ${dur} linear forwards`;
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

export function initQuotes() {
  const supabase = getSupabase();

  const promptEl = document.getElementById('promptBubble');
  const footer = document.getElementById('quoteFooter');
  const textarea = document.getElementById('quote-content-input-footer');
  const submitBtn = document.getElementById('submit-quote-btn-footer');
  const feedback = document.getElementById('form-feedback-footer');
  if (!footer || !textarea || !submitBtn || !feedback) return;

  function openFooter() { footer.classList.add('open'); footer.setAttribute('aria-hidden', 'false'); textarea.focus(); }
  function closeFooter() { footer.classList.remove('open'); footer.setAttribute('aria-hidden', 'true'); }

  promptEl?.addEventListener('click', (e) => { e.stopPropagation(); openFooter(); });
  document.getElementById('closeQuoteFooter')?.addEventListener('click', (e) => { e.stopPropagation(); closeFooter(); });
  document.addEventListener('click', (e) => {
    if (footer.classList.contains('open') && !footer.contains(e.target) && !promptEl?.contains(e.target)) closeFooter();
  }, { passive: true });

  let scrollTriggered = false;
  window.addEventListener('scroll', () => {
    if (!scrollTriggered && window.scrollY > 20) { openFooter(); scrollTriggered = true; }
  }, { passive: true });

  if (promptEl) {
    requestAnimationFrame(() => promptEl.classList.add('show'));
    setTimeout(() => promptEl.classList.add('hide'), 4500);
    setTimeout(() => promptEl.remove(), 5200);
  }

  submitBtn.addEventListener('click', async () => {
    const content = textarea.value.trim();
    if (!content) {
      feedback.textContent = 'Vui lòng nhập nội dung.';
      feedback.className = 'feedback error';
      setTimeout(() => { feedback.textContent = ''; }, 2000);
      return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang lưu...';
    feedback.textContent = '';

    const ip = await getUserIP();
    const { error } = await supabase.from('Quote').insert([{ content, ip_address: ip }]);

    if (error) {
      console.error('Lỗi khi thêm quote:', error);
      feedback.textContent = 'Đã xảy ra lỗi. Vui lòng thử lại.';
      feedback.className = 'feedback error';
    } else {
      feedback.textContent = 'Lưu trích dẫn thành công!';
      feedback.className = 'feedback success';
      textarea.value = '';
      setTimeout(() => { closeFooter(); feedback.textContent = ''; }, 1500);
    }
    submitBtn.disabled = false;
    submitBtn.textContent = 'Lưu';
  });

  // Định kỳ lấy 1 quote ngẫu nhiên và cho trôi qua màn hình.
  setInterval(async () => {
    try {
      const { data } = await supabase.rpc('get_random_quote');
      if (data?.length) spawnFloatingQuote(data[0].content);
    } catch {
      /* bỏ qua lỗi định kỳ, không cần làm phiền người dùng */
    }
  }, 15000);
}
