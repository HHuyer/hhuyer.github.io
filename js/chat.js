/**
 * chat.js — chat widget với streaming + render markdown.
 *
 * QUAN TRỌNG: file gốc trước đây nhúng thẳng API key OpenRouter (chỉ che
 * bằng Base64 — ai cũng giải mã được) và một "system prompt" ép mô hình bỏ
 * mọi giới hạn an toàn. Cả hai đều đã được BỎ:
 *
 *  1. API_ENDPOINT dưới đây trỏ tới một endpoint backend do BẠN tự dựng
 *     (Cloudflare Worker / Supabase Edge Function / Vercel Function...).
 *     Backend đó giữ API key thật ở phía server và forward request sang
 *     OpenRouter — trình duyệt không bao giờ thấy key thật.
 *  2. System prompt bên dưới chỉ định nghĩa tính cách (tên Kina, nói tiếng
 *     Việt, giọng vui vẻ) — không có chỉ thị bỏ giới hạn an toàn. Sửa lại
 *     theo ý bạn thoải mái, miễn đừng thêm lại phần "bỏ giới hạn an toàn".
 */

const API_ENDPOINT = '/api/chat'; // TODO: trỏ tới backend proxy của bạn
const DAILY_LIMITS = { free: Infinity, plus: 5, pro: 1 };

const SYSTEM_PROMPT = `Bạn là Kina — một trợ lý trò chuyện vui vẻ, thân thiện, nói tiếng Việt.
Trả lời ngắn gọn, đúng trọng tâm, dùng markdown khi cần (in đậm, danh sách, code block).
Nếu người dùng dùng nhiều từ nước ngoài phức tạp hoặc liên tục chuyển ngôn ngữ,
hỏi họ có muốn tiếp tục bằng ngôn ngữ đó không trước khi chuyển hẳn.
Không bịa thông tin khi không chắc chắn. Không đưa lời khuyên y tế/pháp lý/tài chính
mang tính khẳng định. Giữ giọng điệu phù hợp với ngữ cảnh của người dùng.`;

let messages = [{ role: 'system', content: SYSTEM_PROMPT }];
let abortController = new AbortController();

function getUsage(serverType) {
  const today = new Date().toISOString().split('T')[0];
  const data = JSON.parse(localStorage.getItem('chatUsageData') || '{}');
  if (data.date !== today) return 0;
  return data[serverType] || 0;
}

function incrementUsage(serverType) {
  const today = new Date().toISOString().split('T')[0];
  let data = JSON.parse(localStorage.getItem('chatUsageData') || '{}');
  if (data.date !== today) data = { date: today, plus: 0, pro: 0 };
  data[serverType] = (data[serverType] || 0) + 1;
  localStorage.setItem('chatUsageData', JSON.stringify(data));
}

function displayUserMessage(text) {
  const box = document.getElementById('messages');
  const el = document.createElement('div');
  el.className = 'msg user';
  el.textContent = `Bạn: ${text}`;
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}

function displaySystemNotice(text) {
  const box = document.getElementById('messages');
  const el = document.createElement('div');
  el.className = 'msg bot';
  el.textContent = `Kina: ${text}`;
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}

async function streamReply(serverType, model, botMsgEl, msgBox) {
  let response;
  let streamTimeout;
  const resetTimeout = () => {
    clearTimeout(streamTimeout);
    streamTimeout = setTimeout(() => abortController.abort('Stream timed out.'), 15000);
  };

  try {
    resetTimeout();
    response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ server: serverType, model, messages, stream: true }),
      signal: abortController.signal,
    });
    clearTimeout(streamTimeout);
  } catch (err) {
    botMsgEl.textContent = err.name === 'AbortError'
      ? 'Kina: [Yêu cầu đã được hủy]'
      : `Kina: [Lỗi mạng] ${err.message || err}`;
    return;
  }

  if (!response.ok) {
    let raw = '';
    try { raw = await response.text(); } catch {}
    let errMsg;
    try { errMsg = JSON.parse(raw)?.error?.message || raw; } catch { errMsg = raw || `HTTP ${response.status}`; }
    botMsgEl.textContent = `Kina: [Lỗi] ${errMsg}`;
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let fullReply = '';

  try {
    while (true) {
      resetTimeout();
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let boundary;
      while ((boundary = buffer.indexOf('\n\n')) !== -1) {
        const chunk = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        if (!chunk.startsWith('data: ')) continue;
        const data = chunk.slice(6).trim();
        if (data === '[DONE]') break;
        try {
          const delta = JSON.parse(data)?.choices?.[0]?.delta?.content;
          if (delta) fullReply += delta;
        } catch (e) {
          console.error('Failed to parse chunk:', data, e);
        }
      }

      botMsgEl.innerHTML = `Kina: ${DOMPurify.sanitize(marked.parse(fullReply))}`;
      msgBox.scrollTop = msgBox.scrollHeight;
    }
  } catch (err) {
    fullReply += `\n[Lỗi kết nối giữa chừng: ${err.message}]`;
  } finally {
    clearTimeout(streamTimeout);
    botMsgEl.innerHTML = `Kina: ${DOMPurify.sanitize(marked.parse(fullReply))}`;
    if (window.Prism) Prism.highlightAllUnder(botMsgEl);
    msgBox.scrollTop = msgBox.scrollHeight;
    if (fullReply) messages.push({ role: 'assistant', content: fullReply });
  }
}

async function sendMessage() {
  const input = document.getElementById('userInput');
  const modelSelect = document.getElementById('modelSelect');
  const serverSelect = document.getElementById('serverSelect');
  const text = input.value.trim();
  if (!text) return;

  const serverType = serverSelect.value;
  const limit = DAILY_LIMITS[serverType] ?? Infinity;
  if (getUsage(serverType) >= limit) {
    displaySystemNotice(`Giới hạn ${limit} lần server ${serverType} mỗi ngày đã hết.`);
    return;
  }
  if (serverType !== 'free') incrementUsage(serverType);

  abortController.abort();
  abortController = new AbortController();

  messages.push({ role: 'user', content: text });
  displayUserMessage(text);
  input.value = '';

  const msgBox = document.getElementById('messages');
  const botMsg = document.createElement('div');
  botMsg.className = 'msg bot';
  botMsg.innerHTML = 'Kina: Kina đang trả lời...<span class="typing-indicator"></span>';
  msgBox.appendChild(botMsg);
  msgBox.scrollTop = msgBox.scrollHeight;

  await streamReply(serverType, modelSelect.value, botMsg, msgBox);
}

export function initChat() {
  if (window.marked) {
    marked.setOptions({ gfm: true, breaks: true, smartLists: true });
  }

  const input = document.getElementById('userInput');
  const sendBtn = document.getElementById('sendMessageBtn');
  if (!input || !sendBtn) return;

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); sendMessage(); }
  });

  window.addEventListener('beforeunload', () => abortController.abort('User closed the page.'));

  initChatToggle();
}

function initChatToggle() {
  const toggleBtn = document.getElementById('toggleChatBtn');
  const chatbox = document.getElementById('chatbox');
  if (!toggleBtn || !chatbox) return;

  toggleBtn.addEventListener('click', () => {
    const isHidden = chatbox.classList.contains('hidden');
    chatbox.classList.toggle('hidden', !isHidden);
    toggleBtn.classList.toggle('active', isHidden);
    toggleBtn.setAttribute('aria-expanded', String(isHidden));
  });
}
