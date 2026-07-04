/**
 * supabase-client.js — khởi tạo Supabase client 1 lần, dùng chung cho quotes.js
 * và bất kỳ module nào khác cần đọc/ghi dữ liệu.
 *
 * LƯU Ý: SUPABASE_ANON_KEY là "anon/public key", được thiết kế để lộ ra
 * client-side (khác hoàn toàn với API key bí mật như OpenRouter key) — Supabase
 * bảo vệ dữ liệu qua Row Level Security ở phía server, không qua việc giấu key.
 * Vẫn nên kiểm tra RLS policies của bảng `Quote` để chắc chắn client chỉ
 * insert/select được đúng thứ cho phép.
 */
const SUPABASE_URL = 'https://qfmtqtvxeancxlcmvtza.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbXRxdHZ4ZWFuY3hsY212dHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMTY4NTQsImV4cCI6MjA3MTU5Mjg1NH0.kyPxSzMCb0P3B9YnVkLB1hkopbtXmef7fu1lL6GhyQQ';

let client = null;

export function getSupabase() {
  if (client) return client;

  try {
    if (window.supabase) {
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      return client;
    }
    throw new Error('Không tìm thấy thư viện window.supabase');
  } catch (err) {
    console.warn('Supabase không khởi tạo được, dùng stub an toàn:', err.message);
    client = {
      from: () => ({ insert: () => Promise.resolve({ error: { message: 'Supabase đang bảo trì' } }) }),
      rpc: () => Promise.resolve({ data: [], error: null }),
    };
    return client;
  }
}
