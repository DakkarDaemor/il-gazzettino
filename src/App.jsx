import { useState, useEffect, useCallback } from "react";

// localStorage adapter (stessa interfaccia di window.storage degli artifact Claude)
const storage = {
  async get(key) {
    try { const v = localStorage.getItem(key); return v !== null ? { value: v } : null; } catch { return null; }
  },
  async set(key, value) {
    try { localStorage.setItem(key, value); return { key, value }; } catch { return null; }
  },
};

const GNEWS_BASE = "https://gnews.io/api/v4";
const MAX_DAILY = 100;
// In dev puoi hardcodare la key qui, ma in produzione usa un backend proxy
const ENV_KEY = import.meta.env.VITE_GNEWS_API_KEY || "";

const CATEGORIES = [
  { value: "", label: "Tutte" },
  { value: "general", label: "Generale" },
  { value: "world", label: "Mondo" },
  { value: "nation", label: "Nazionale" },
  { value: "business", label: "Business" },
  { value: "technology", label: "Tecnologia" },
  { value: "entertainment", label: "Intrattenimento" },
  { value: "sports", label: "Sport" },
  { value: "science", label: "Scienza" },
  { value: "health", label: "Salute" },
];

const COUNTRIES = [
  { value: "", label: "Tutto il mondo" },
  { value: "it", label: "🇮🇹 Italia" },
  { value: "us", label: "🇺🇸 USA" },
  { value: "gb", label: "🇬🇧 UK" },
  { value: "de", label: "🇩🇪 Germania" },
  { value: "fr", label: "🇫🇷 Francia" },
  { value: "es", label: "🇪🇸 Spagna" },
  { value: "br", label: "🇧🇷 Brasile" },
  { value: "au", label: "🇦🇺 Australia" },
  { value: "jp", label: "🇯🇵 Giappone" },
];

const LANGUAGES = [
  { value: "it", label: "Italiano" },
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
  { value: "pt", label: "Português" },
];

const TIME_RANGES = [
  { value: "24", label: "Ultime 24 ore" },
  { value: "72", label: "Ultimi 3 giorni" },
];

const C = {
  bg: "#0f0e0c", card: "#141210", cardHover: "#1c1916",
  gold: "#c9a84c", goldDim: "#3a2e10",
  text: "#e8e0d0", muted: "#8a7f6f", dim: "#5a5048",
  border: "#2e2a24",
  danger: "#e05c5c", success: "#5cb88c", warning: "#e0a03c",
};

function getTodayKey() { return new Date().toISOString().slice(0, 10); }

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (isNaN(h)) return "";
  if (h > 48) return `${Math.floor(h / 24)}g fa`;
  if (h >= 1) return `${h}h fa`;
  return `${Math.max(m, 1)}m fa`;
}

const mkProfile = (name = "Nuovo gazzettino") => ({
  id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
  name, keywords: "", category: "", country: "it", language: "it", timeRange: "24",
});

function UsageBar({ count }) {
  const pct = Math.min((count / MAX_DAILY) * 100, 100);
  const color = pct > 90 ? C.danger : pct > 70 ? C.warning : C.success;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <div style={{ width: 68, height: 5, background: "#2a2620", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.4s" }} />
      </div>
      <span style={{ fontSize: 11, color: C.muted, fontFamily: "Crimson Pro, serif" }}>{count}/{MAX_DAILY}</span>
    </div>
  );
}

function ArticleCard({ article }) {
  const [imgFailed, setImgFailed] = useState(false);
  const hasImg = article.image && !imgFailed;
  const domain = (() => { try { return new URL(article.url).hostname.replace("www.", ""); } catch { return ""; } })();
  return (
    <a href={article.url} target="_blank" rel="noopener noreferrer"
      style={{ display: "flex", flexDirection: "column", background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden", textDecoration: "none", transition: "border-color 0.2s, transform 0.2s, background 0.2s" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.background = C.cardHover; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.background = C.card; }}
    >
      {hasImg && (
        <div style={{ width: "100%", aspectRatio: "16/9", overflow: "hidden", flexShrink: 0 }}>
          <img src={article.image} alt="" onError={() => setImgFailed(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}
      {!hasImg && <div style={{ height: 2, background: `linear-gradient(90deg, ${C.gold}, transparent)` }} />}
      <div style={{ padding: "13px 15px 15px", display: "flex", flexDirection: "column", gap: 7, flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: C.gold, fontFamily: "Crimson Pro, serif", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
            {article.source?.name || domain || "Fonte"}
          </span>
          <span style={{ fontSize: 11, color: C.dim }}>{timeAgo(article.publishedAt)}</span>
        </div>
        <h3 style={{ margin: 0, fontFamily: "Playfair Display, serif", fontSize: 16, fontWeight: 700, color: C.text, lineHeight: 1.35 }}>{article.title}</h3>
        {article.description && (
          <p style={{ margin: 0, fontFamily: "Crimson Pro, serif", fontSize: 14, color: C.muted, lineHeight: 1.65, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {article.description}
          </p>
        )}
        <div style={{ marginTop: "auto", paddingTop: 7, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: C.dim }}>{domain}</span>
          <span style={{ fontSize: 12, color: C.gold }}>↗</span>
        </div>
      </div>
    </a>
  );
}

function ProfileEditor({ profile, onSave, onDelete, onCancel }) {
  const [form, setForm] = useState({ ...profile });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isNew = !!profile._isNew;
  const inp = { width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, padding: "8px 10px", color: C.text, fontFamily: "Crimson Pro, serif", fontSize: 14, outline: "none", boxSizing: "border-box" };
  const lbl = { display: "block", fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5, fontFamily: "Crimson Pro, serif" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label style={lbl}>Nome gazzettino</label>
        <input style={inp} value={form.name} onChange={e => set("name", e.target.value)} />
      </div>
      <div>
        <label style={lbl}>Parole chiave (separate da virgola)</label>
        <input style={inp} placeholder="es: intelligenza artificiale, Serie A" value={form.keywords} onChange={e => set("keywords", e.target.value)} />
        <span style={{ fontSize: 11, color: C.dim, marginTop: 4, display: "block" }}>Se vuoto usa categoria/paese.</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { lbl: "Categoria", key: "category", opts: CATEGORIES },
          { lbl: "Paese", key: "country", opts: COUNTRIES },
          { lbl: "Lingua", key: "language", opts: LANGUAGES },
          { lbl: "Periodo", key: "timeRange", opts: TIME_RANGES },
        ].map(({ lbl: l, key, opts }) => (
          <div key={key}>
            <label style={lbl}>{l}</label>
            <select style={{ ...inp, cursor: "pointer" }} value={form[key]} onChange={e => set(key, e.target.value)}>
              {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button onClick={() => onSave(form)} disabled={!form.name.trim()}
          style={{ flex: 1, background: form.name.trim() ? C.gold : C.dim, border: "none", borderRadius: 4, padding: "9px", color: C.bg, fontFamily: "Playfair Display, serif", fontSize: 13, fontWeight: 700, cursor: form.name.trim() ? "pointer" : "not-allowed" }}>
          Salva
        </button>
        <button onClick={onCancel}
          style={{ flex: 1, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 4, padding: "9px", color: C.muted, fontFamily: "Crimson Pro, serif", fontSize: 13, cursor: "pointer" }}>
          Annulla
        </button>
        {!isNew && (
          <button onClick={() => { if (window.confirm(`Eliminare "${profile.name}"?`)) onDelete(profile.id); }}
            style={{ background: "transparent", border: "1px solid #5a2020", borderRadius: 4, padding: "9px 12px", color: C.danger, cursor: "pointer", fontSize: 15 }}>✕</button>
        )}
      </div>
    </div>
  );
}

function SettingsPanel({ apiKey, usageToday, onSaveKey }) {
  const [temp, setTemp] = useState(apiKey);
  const pct = Math.min((usageToday / MAX_DAILY) * 100, 100);
  const barColor = pct > 90 ? C.danger : pct > 70 ? C.warning : C.success;
  const inp = { width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, padding: "8px 10px", color: C.text, fontFamily: "Crimson Pro, serif", fontSize: 13, outline: "none", boxSizing: "border-box" };
  const lbl = { display: "block", fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5, fontFamily: "Crimson Pro, serif" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <label style={lbl}>API Key GNews</label>
        <input type="password" style={inp} value={temp} onChange={e => setTemp(e.target.value)} placeholder="Incolla la tua API key" />
        <p style={{ fontSize: 11, color: C.dim, marginTop: 5 }}>
          Gratuita su <a href="https://gnews.io" target="_blank" rel="noopener noreferrer" style={{ color: C.gold }}>gnews.io</a> · 100 req/giorno
        </p>
        <button onClick={() => onSaveKey(temp)}
          style={{ width: "100%", marginTop: 2, background: C.gold, border: "none", borderRadius: 4, padding: "9px", color: C.bg, fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          Salva
        </button>
      </div>
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 18 }}>
        <label style={lbl}>Utilizzo oggi</label>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, marginBottom: 10 }}>
          <span style={{ fontFamily: "Playfair Display, serif", fontSize: 48, fontWeight: 900, lineHeight: 1, color: pct > 90 ? C.danger : C.text }}>{usageToday}</span>
          <span style={{ fontFamily: "Crimson Pro, serif", fontSize: 20, color: C.muted, paddingBottom: 6 }}>/{MAX_DAILY}</span>
        </div>
        <div style={{ height: 8, background: "#2a2620", borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
          <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 4, transition: "width 0.4s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.dim }}>
          <span>{MAX_DAILY - usageToday} rimanenti</span>
          <span>Reset a mezzanotte</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [apiKey, setApiKey] = useState(ENV_KEY);
  const [profiles, setProfiles] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usage, setUsage] = useState({ date: getTodayKey(), count: 0 });
  const [panel, setPanel] = useState(null);
  const [editingProfile, setEditingProfile] = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!document.getElementById("gz-fonts")) {
      const l = document.createElement("link");
      l.id = "gz-fonts"; l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Crimson+Pro:wght@300;400;600&display=swap";
      document.head.appendChild(l);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (!ENV_KEY) { const k = await storage.get("gz_apikey"); if (k) setApiKey(k.value); }
        const p = await storage.get("gz_profiles");
        if (p) { const parsed = JSON.parse(p.value); setProfiles(parsed); if (parsed.length > 0) setActiveId(parsed[0].id); }
        const u = await storage.get("gz_usage");
        if (u) { const parsed = JSON.parse(u.value); const today = getTodayKey(); setUsage(parsed.date === today ? parsed : { date: today, count: 0 }); }
      } catch {}
      setInitialized(true);
    })();
  }, []);

  const persist = useCallback(async (key, val) => {
    await storage.set(key, typeof val === "string" ? val : JSON.stringify(val));
  }, []);

  const usageToday = usage.date === getTodayKey() ? usage.count : 0;

  const incrementUsage = useCallback(async () => {
    const today = getTodayKey();
    const current = usage.date === today ? usage.count : 0;
    const next = { date: today, count: current + 1 };
    setUsage(next);
    await persist("gz_usage", next);
  }, [usage, persist]);

  const activeProfile = profiles.find(p => p.id === activeId);

  const fetchNews = useCallback(async (profile) => {
    if (!apiKey.trim()) { setError("API key mancante. Aprire le impostazioni (⚙)."); return; }
    if (usageToday >= MAX_DAILY) { setError("Limite giornaliero raggiunto (100/100)."); return; }
    setLoading(true); setError(""); setNews([]);
    try {
      const from = new Date(Date.now() - parseInt(profile.timeRange) * 3600000).toISOString().replace(/\.\d{3}Z$/, "Z");
      const q = (profile.keywords || "").trim();
      let url;
      if (q) {
        const p = new URLSearchParams({ q, lang: profile.language, from, max: "10", token: apiKey });
        if (profile.country) p.set("country", profile.country);
        url = `${GNEWS_BASE}/search?${p}`;
      } else {
        const p = new URLSearchParams({ lang: profile.language, max: "10", token: apiKey });
        if (profile.category) p.set("category", profile.category);
        if (profile.country) p.set("country", profile.country);
        url = `${GNEWS_BASE}/top-headlines?${p}`;
      }
      const res = await fetch(url);
      await incrementUsage();
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.errors?.[0] || `Errore HTTP ${res.status}`); }
      const data = await res.json();
      const articles = data.articles || [];
      setNews(articles);
      setFetchedAt(new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }));
      if (articles.length === 0) setError("Nessuna notizia trovata. Modifica il profilo.");
    } catch (e) { setError(e.message || "Errore di rete."); }
    finally { setLoading(false); }
  }, [apiKey, usageToday, incrementUsage]);

  const handleSaveProfiles = useCallback(async (p) => { setProfiles(p); await persist("gz_profiles", p); }, [persist]);

  const handleSaveProfile = useCallback(async (profile) => {
    const clean = { ...profile }; delete clean._isNew;
    const exists = profiles.some(p => p.id === clean.id);
    const next = exists ? profiles.map(p => p.id === clean.id ? clean : p) : [...profiles, clean];
    await handleSaveProfiles(next);
    if (!exists) setActiveId(clean.id);
    setEditingProfile(null);
  }, [profiles, handleSaveProfiles]);

  const handleDeleteProfile = useCallback(async (id) => {
    const next = profiles.filter(p => p.id !== id);
    await handleSaveProfiles(next);
    if (activeId === id) setActiveId(next[0]?.id || null);
    setEditingProfile(null); setNews([]);
  }, [profiles, activeId, handleSaveProfiles]);

  const handleSaveKey = useCallback(async (key) => { setApiKey(key); await persist("gz_apikey", key); setPanel(null); }, [persist]);
  const togglePanel = (p) => { setPanel(prev => prev === p ? null : p); setEditingProfile(null); };

  if (!initialized) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg, color: C.gold, fontSize: 24 }}>·</div>;

  const usagePct = Math.min((usageToday / MAX_DAILY) * 100, 100);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Crimson Pro, serif" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: C.bg, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ padding: "9px 20px 7px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <h1 style={{ margin: 0, fontFamily: "Playfair Display, serif", fontSize: 21, fontWeight: 900, color: C.gold, letterSpacing: -0.3 }}>IL GAZZETTINO</h1>
            <span style={{ fontSize: 10, color: C.dim, letterSpacing: 1.2 }}>
              {new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <UsageBar count={usageToday} />
            <div style={{ width: 1, height: 14, background: C.border }} />
            <button onClick={() => togglePanel("settings")} title="Impostazioni"
              style={{ background: panel === "settings" ? C.goldDim : "none", border: "none", color: panel === "settings" ? C.gold : C.muted, cursor: "pointer", fontSize: 15, padding: "3px 6px", borderRadius: 4 }}>⚙</button>
            <button onClick={() => togglePanel("profiles")} title="Profili"
              style={{ background: panel === "profiles" ? C.goldDim : "none", border: "none", color: panel === "profiles" ? C.gold : C.muted, cursor: "pointer", fontSize: 15, padding: "3px 6px", borderRadius: 4 }}>☰</button>
          </div>
        </div>
        {profiles.length > 0 && (
          <div style={{ padding: "5px 20px", display: "flex", alignItems: "center", gap: 5, overflowX: "auto" }}>
            {profiles.map(p => (
              <button key={p.id}
                onClick={() => { setActiveId(p.id); setNews([]); setError(""); setFetchedAt(null); }}
                onDoubleClick={() => { setEditingProfile(p); setPanel("profiles"); }}
                title="Doppio click per modificare"
                style={{ background: p.id === activeId ? C.gold : "transparent", color: p.id === activeId ? C.bg : C.muted, border: `1px solid ${p.id === activeId ? C.gold : C.border}`, borderRadius: 3, padding: "3px 13px", fontFamily: "Crimson Pro, serif", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s", flexShrink: 0 }}>
                {p.name}
              </button>
            ))}
            <button onClick={() => { setEditingProfile({ ...mkProfile(), _isNew: true }); setPanel("profiles"); }}
              style={{ background: "transparent", border: `1px dashed ${C.border}`, borderRadius: 3, padding: "3px 11px", color: C.dim, fontFamily: "Crimson Pro, serif", fontSize: 12, cursor: "pointer", flexShrink: 0 }}>+ Nuovo</button>
            {activeProfile && (
              <button onClick={() => fetchNews(activeProfile)} disabled={loading}
                style={{ marginLeft: "auto", background: loading ? C.border : C.gold, color: loading ? C.muted : C.bg, border: "none", borderRadius: 3, padding: "4px 16px", fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 13, cursor: loading ? "not-allowed" : "pointer", flexShrink: 0, transition: "all 0.15s" }}>
                {loading ? "…" : "↻ Aggiorna"}
              </button>
            )}
          </div>
        )}
      </header>

      <div style={{ display: "flex" }}>
        {panel && (
          <aside style={{ width: 290, flexShrink: 0, background: C.card, borderRight: `1px solid ${C.border}`, padding: 18, overflowY: "auto", maxHeight: "calc(100vh - 90px)", position: "sticky", top: 90 }}>
            {panel === "settings" && (
              <><h2 style={{ margin: "0 0 18px", fontFamily: "Playfair Display, serif", fontSize: 13, color: C.gold, textTransform: "uppercase", letterSpacing: 1 }}>Impostazioni</h2>
              <SettingsPanel apiKey={apiKey} usageToday={usageToday} onSaveKey={handleSaveKey} /></>
            )}
            {panel === "profiles" && (
              <><h2 style={{ margin: "0 0 16px", fontFamily: "Playfair Display, serif", fontSize: 13, color: C.gold, textTransform: "uppercase", letterSpacing: 1 }}>
                {editingProfile ? (editingProfile._isNew ? "Nuovo profilo" : "Modifica") : "Profili"}
              </h2>
              {editingProfile ? (
                <ProfileEditor profile={editingProfile} onSave={handleSaveProfile} onDelete={handleDeleteProfile} onCancel={() => setEditingProfile(null)} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {profiles.map(p => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", background: C.bg, borderRadius: 4, border: `1px solid ${p.id === activeId ? C.gold : C.border}` }}>
                      <div>
                        <div style={{ fontFamily: "Crimson Pro, serif", fontSize: 14, color: C.text }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: C.dim, marginTop: 1 }}>
                          {[p.keywords || CATEGORIES.find(c => c.value === p.category)?.label, COUNTRIES.find(c => c.value === p.country)?.label?.replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, "").trim(), `${p.timeRange}h`].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <button onClick={() => setEditingProfile(p)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 11, padding: "2px 6px" }}>Modifica</button>
                    </div>
                  ))}
                  <button onClick={() => setEditingProfile({ ...mkProfile(), _isNew: true })}
                    style={{ marginTop: 4, padding: "8px", background: "transparent", border: `1px dashed ${C.border}`, borderRadius: 4, color: C.muted, fontFamily: "Crimson Pro, serif", fontSize: 13, cursor: "pointer" }}>+ Aggiungi profilo</button>
                </div>
              )}</>
            )}
          </aside>
        )}

        <main style={{ flex: 1, padding: "20px 22px", minWidth: 0 }}>
          {!apiKey && (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontSize: 44, color: C.gold, marginBottom: 14, opacity: 0.5 }}>✦</div>
              <p style={{ fontFamily: "Playfair Display, serif", fontSize: 19, color: C.text, marginBottom: 8 }}>Benvenuto nel Gazzettino</p>
              <p style={{ fontSize: 15, color: C.muted, marginBottom: 22 }}>Configura la tua API key GNews per iniziare.</p>
              <button onClick={() => setPanel("settings")}
                style={{ background: C.gold, border: "none", borderRadius: 4, padding: "10px 26px", color: C.bg, fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Configura ⚙</button>
            </div>
          )}
          {apiKey && profiles.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontSize: 44, color: C.gold, marginBottom: 14, opacity: 0.4 }}>◈</div>
              <p style={{ fontFamily: "Playfair Display, serif", fontSize: 19, color: C.text, marginBottom: 8 }}>Nessun profilo ancora</p>
              <p style={{ fontSize: 15, color: C.muted, marginBottom: 22 }}>Crea il tuo primo gazzettino personalizzato.</p>
              <button onClick={() => { setEditingProfile({ ...mkProfile(), _isNew: true }); setPanel("profiles"); }}
                style={{ background: C.gold, border: "none", borderRadius: 4, padding: "10px 26px", color: C.bg, fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>+ Crea profilo</button>
            </div>
          )}
          {error && <div style={{ background: "#1e1010", border: "1px solid #5a2020", borderRadius: 4, padding: "11px 15px", color: "#e08080", fontSize: 14, marginBottom: 18 }}>{error}</div>}
          {loading && (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontSize: 13, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 18 }}>Raccolta notizie…</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 7 }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.gold, animation: `gzp 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
              </div>
              <style>{`@keyframes gzp{0%,100%{transform:scale(.8);opacity:.3}50%{transform:scale(1.3);opacity:1}}`}</style>
            </div>
          )}
          {fetchedAt && !loading && news.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: 12, color: C.dim }}>
              <span style={{ color: C.gold, fontSize: 9 }}>●</span>
              <span>Aggiornato alle {fetchedAt}</span><span>·</span>
              <span>{news.length} articoli</span>
              {activeProfile && <><span>·</span><span>{activeProfile.timeRange === "24" ? "ultime 24 ore" : "ultimi 3 giorni"}</span></>}
            </div>
          )}
          {!loading && news.length === 0 && !error && apiKey && activeProfile && (
            <div style={{ textAlign: "center", padding: "70px 20px", color: C.muted }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontSize: 36, color: C.gold, opacity: 0.2, marginBottom: 14 }}>◈</div>
              <p style={{ fontFamily: "Playfair Display, serif", fontSize: 15, color: C.text, marginBottom: 6 }}>{activeProfile.name}</p>
              <p style={{ fontSize: 14 }}>Premi <span style={{ color: C.gold }}>↻ Aggiorna</span> per caricare le notizie.</p>
            </div>
          )}
          {news.length > 0 && !loading && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(265px, 1fr))", gap: 14 }}>
              {news.map((article, i) => <ArticleCard key={i} article={article} />)}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
