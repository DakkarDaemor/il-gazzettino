export const storage = {
  async get(key) {
    try { const v = localStorage.getItem(key); return v !== null ? { value: v } : null; } catch { return null; }
  },
  async set(key, value) {
    try { localStorage.setItem(key, value); return { key, value }; } catch { return null; }
  },
};
