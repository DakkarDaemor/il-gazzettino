import { useState, useEffect, useCallback } from "react";

const storage = {
  async get(key) {
    try { const v = localStorage.getItem(key); return v !== null ? { value: v } : null; } catch { return null; }
  },
  async set(key, value) {
    try { localStorage.setItem(key, value); return { key, value }; } catch { return null; }
  },
};

const CORS_PROXY = "https://api.allorigins.win/raw?url=";

function parseFeed(xmlText, feedUrl) {
  const doc = new DOMParser().parseFromString(xmlText, "text/xml");
  if (doc.querySelector("parsererror")) throw new Error("Feed XML non valido");

  const isAtom = !!doc.querySelector("feed");
  const sourceName =
    doc.querySelector(isAtom ? "feed > title" : "channel > title")?.textContent?.trim() ||
    new URL(feedUrl).hostname.replace("www.", "");

  const entries = [...doc.querySelectorAll(isAtom ? "feed > entry" : "channel > item")];

  return entries.map(e => {
    const txt = (...sels) => { for (const s of sels) { const v = e.querySelector(s)?.textContent?.trim(); if (v) return v; } return ""; };

    const rawDesc = isAtom ? txt("content", "summary") : txt("description", "content\\:encoded");
    const div = document.createElement("div");
    div.innerHTML = rawDesc;
    const description = (div.textContent || "").replace(/\s+/g, " ").trim().slice(0, 280);

    let url = "";
    if (isAtom) url = e.querySelector("link[rel='alternate']")?.getAttribute("href") || e.querySelector("link:not([rel='enclosure'])")?.getAttribute("href") || txt("link");
    else url = txt("link");

    let image = e.querySelector("media\\:content")?.getAttribute("url") || e.querySelector("media\\:thumbnail")?.getAttribute("url") || null;
    if (!image) { const enc = e.querySelector("enclosure"); if (enc?.getAttribute("type")?.startsWith("image")) image = enc.getAttribute("url"); }
    if (!image) { const m = rawDesc.match(/<img[^>]+src=["']([^"']+)["']/i); if (m) image = m[1]; }

    return {
      title: txt("title"),
      url,
      publishedAt: isAtom ? txt("published", "updated") : txt("pubDate", "dc\\:date"),
      description,
      image,
      source: { name: sourceName },
    };
  });
}

/* ── Palette: nero + verde, massimo 6 valori ── */
const C = {
  bg:        "#000000",
  card:      "#0d0d0d",
  hover:     "#161616",
  green:     "#22c55e",
  greenDim:  "#071a0e",
  text:      "#ebebeb",
  muted:     "#888888",
  border:    "#1e1e1e",
  danger:    "#ef4444",
};

/* CSS globale iniettato una volta sola */
const GLOBAL_CSS = `
*,*::before,*::after{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{margin:0;background:#000;overflow-x:hidden}

/* ── Griglia articoli ── */
.gz-grid{display:grid;gap:10px;grid-template-columns:1fr}
@media(min-width:480px){.gz-grid{grid-template-columns:repeat(2,1fr)}}
@media(min-width:900px){.gz-grid{grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}}

/* ── Card: mobile=orizz, desktop=vert ── */
.gz-card{display:flex;flex-direction:row;background:#0d0d0d;border-radius:8px;overflow:hidden;text-decoration:none;transition:border-color .15s,transform .15s}
@media(min-width:900px){.gz-card{flex-direction:column}}
@media(hover:hover){.gz-card:hover{border-color:#22c55e!important;transform:translateY(-2px)}}

.gz-card-img{width:90px;height:90px;object-fit:cover;flex-shrink:0}
@media(min-width:900px){.gz-card-img{width:100%;height:auto;aspect-ratio:16/9}}

.gz-card-stripe{width:3px;flex-shrink:0;align-self:stretch}
@media(min-width:900px){.gz-card-stripe{width:100%;height:2px;align-self:auto}}

.gz-card-body{padding:10px 12px;display:flex;flex-direction:column;gap:5px;flex:1;min-width:0}
@media(min-width:900px){.gz-card-body{padding:13px 15px 15px;gap:8px}}

.gz-card-title{margin:0;font-family:'Playfair Display',serif;font-size:14px;font-weight:700;color:#ebebeb;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
@media(min-width:900px){.gz-card-title{font-size:16px;-webkit-line-clamp:3}}

.gz-card-desc{margin:0;font-family:'Crimson Pro',serif;font-size:12px;color:#888;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
@media(min-width:900px){.gz-card-desc{font-size:14px;line-height:1.65;-webkit-line-clamp:3}}

/* ── Sidebar: overlay mobile, pannello fisso desktop ── */
.gz-aside{position:fixed;inset:0;z-index:200;overflow-y:auto;background:#000;border-right:none}
@media(min-width:640px){.gz-aside{position:sticky;inset:auto;top:0;width:300px;flex-shrink:0;max-height:100vh;z-index:10;background:#0d0d0d;border-right:1px solid #1e1e1e}}

/* ── Header date: nascosta su mobile ── */
.gz-date{display:none}
@media(min-width:480px){.gz-date{display:inline}}

/* ── Tab profilo ── */
.gz-tab{min-height:36px;min-width:44px;transition:all .15s;white-space:nowrap;flex-shrink:0}

/* ── Bottone aggiorna ── */
.gz-refresh{min-height:36px;min-width:44px}

/* ── Input focus ── */
input:focus,textarea:focus{outline:none;border-color:#22c55e!important}

/* ── Scrollbar ── */
::-webkit-scrollbar{width:3px;height:3px}
::-webkit-scrollbar-track{background:#000}
::-webkit-scrollbar-thumb{background:#222;border-radius:2px}

/* ── Animazione loading ── */
@keyframes gzp{0%,100%{transform:scale(.8);opacity:.3}50%{transform:scale(1.3);opacity:1}}
`;

const SUGGESTED_FEEDS = [
  { label: "ANSA – Ultime notizie", url: "https://www.ansa.it/sito/notizie/cronaca/cronaca_rss.xml" },
  { label: "Repubblica", url: "https://www.repubblica.it/rss/homepage/rss2.0.xml" },
  { label: "BolognaToday", url: "https://www.bolognatoday.it/rss.xml" },
  { label: "il Resto del Carlino – Bologna", url: "https://www.ilrestodelcarlino.it/bologna/rss" },
  { label: "Corriere di Bologna", url: "https://corrieredibologna.corriere.it/rss.xml" },
];

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
  name,
  feeds: [],
  interests: [],
  avoids: [],
});

function ArticleCard({ article, highlighted }) {
  const [imgFailed, setImgFailed] = useState(false);
  const hasImg = article.image && !imgFailed;
  const domain = (() => { try { return new URL(article.url).hostname.replace("www.", ""); } catch { return ""; } })();
  const borderColor = highlighted ? C.green : C.border;

  return (
    <a href={article.url} target="_blank" rel="noopener noreferrer"
      className="gz-card"
      style={{ border: `1px solid ${borderColor}` }}>

      {hasImg
        ? <img src={article.image} alt="" className="gz-card-img" onError={() => setImgFailed(true)} />
        : <div className="gz-card-stripe" style={{ background: highlighted ? C.green : "#222" }} />
      }

      <div className="gz-card-body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
          <span style={{ fontSize: 10, color: C.green, fontFamily: "Crimson Pro, serif", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, lineHeight: 1.3 }}>
            {highlighted && "★ "}{article.source?.name || domain || "Fonte"}
          </span>
          <span style={{ fontSize: 10, color: C.muted, flexShrink: 0 }}>{timeAgo(article.publishedAt)}</span>
        </div>

        <h3 className="gz-card-title">{article.title}</h3>

        {article.description && (
          <p className="gz-card-desc">{article.description}</p>
        )}

        <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", paddingTop: 4 }}>
          <span style={{ fontSize: 10, color: "#333" }}>{domain}</span>
          <span style={{ fontSize: 11, color: C.green }}>↗</span>
        </div>
      </div>
    </a>
  );
}

function KeywordChips({ keywords, color, onRemove }) {
  if (!keywords.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
      {keywords.map(kw => (
        <span key={kw} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: C.bg, border: `1px solid ${color}44`, borderRadius: 20, padding: "3px 8px 3px 10px", fontSize: 12, color }}>
          {kw}
          {onRemove && (
            <button onClick={() => onRemove(kw)}
              style={{ background: "none", border: "none", color, cursor: "pointer", fontSize: 13, padding: "0 1px", lineHeight: 1, opacity: 0.7 }}>✕</button>
          )}
        </span>
      ))}
    </div>
  );
}

function KeywordSection({ label, color, keywords, onAdd, onRemove, placeholder }) {
  const [input, setInput] = useState("");
  const inp = { width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 10px", color: C.text, fontFamily: "Crimson Pro, serif", fontSize: 13, outline: "none", boxSizing: "border-box" };
  const lbl = { display: "block", fontSize: 11, color, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6, fontFamily: "Crimson Pro, serif" };

  const add = () => {
    const kw = input.trim().toLowerCase();
    if (!kw || keywords.includes(kw)) return;
    onAdd(kw);
    setInput("");
  };

  return (
    <div>
      <label style={lbl}>{label}</label>
      <div style={{ display: "flex", gap: 6 }}>
        <input style={{ ...inp, flex: 1, width: "auto" }}
          placeholder={placeholder}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()}
        />
        <button onClick={add}
          style={{ background: "transparent", border: `1px solid ${color}55`, borderRadius: 6, padding: "8px 13px", color, fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 14, cursor: "pointer", flexShrink: 0, minWidth: 44 }}>+</button>
      </div>
      <KeywordChips keywords={keywords} color={color} onRemove={onRemove} />
    </div>
  );
}

function ProfileEditor({ profile, onSave, onDelete, onCancel }) {
  const [form, setForm] = useState({
    ...profile,
    feeds: [...(profile.feeds || [])],
    interests: [...(profile.interests || [])],
    avoids: [...(profile.avoids || [])],
  });
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isNew = !!profile._isNew;

  const inp = { width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 12px", color: C.text, fontFamily: "Crimson Pro, serif", fontSize: 14, outline: "none", boxSizing: "border-box" };
  const lbl = { display: "block", fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6, fontFamily: "Crimson Pro, serif" };
  const divider = <div style={{ height: 1, background: C.border }} />;

  const addFeed = (url) => {
    const u = (url ?? newFeedUrl).trim();
    if (!u || form.feeds.includes(u)) return;
    setForm(f => ({ ...f, feeds: [...f.feeds, u] }));
    if (!url) setNewFeedUrl("");
  };

  const removeFeed = (url) => setForm(f => ({ ...f, feeds: f.feeds.filter(u => u !== url) }));
  const addKw = (list, kw) => { if (kw && !form[list].includes(kw)) setForm(f => ({ ...f, [list]: [...f[list], kw] })); };
  const removeKw = (list, kw) => setForm(f => ({ ...f, [list]: f[list].filter(k => k !== kw) }));

  const available = SUGGESTED_FEEDS.filter(s => !form.feeds.includes(s.url));

  const btn = (style) => ({
    border: "none", borderRadius: 6, padding: "11px 14px", fontFamily: "Playfair Display, serif",
    fontSize: 13, fontWeight: 700, cursor: "pointer", minHeight: 44, ...style,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={lbl}>Nome gazzettino</label>
        <input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      </div>

      {divider}

      <div>
        <label style={lbl}>Feed RSS</label>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <input style={{ ...inp, flex: 1, width: "auto" }}
            placeholder="https://esempio.it/rss.xml"
            value={newFeedUrl}
            onChange={e => setNewFeedUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addFeed()}
          />
          <button onClick={() => addFeed(undefined)}
            style={btn({ background: C.green, color: "#000", minWidth: 44 })}>+</button>
        </div>

        {form.feeds.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
            {form.feeds.map(url => (
              <div key={url} style={{ display: "flex", alignItems: "center", gap: 8, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 12px" }}>
                <span style={{ flex: 1, fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</span>
                <button onClick={() => removeFeed(url)}
                  style={{ background: "transparent", border: `1px solid ${C.danger}44`, borderRadius: 4, color: C.danger, cursor: "pointer", fontSize: 11, padding: "3px 8px", flexShrink: 0, minHeight: 28 }}>Rimuovi</button>
              </div>
            ))}
          </div>
        )}

        {available.length > 0 && (
          <div>
            <span style={{ ...lbl, marginBottom: 6 }}>Suggerimenti</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {available.map(s => (
                <button key={s.url} onClick={() => addFeed(s.url)}
                  style={{ background: "transparent", border: `1px dashed ${C.border}`, borderRadius: 6, padding: "9px 12px", color: C.muted, fontFamily: "Crimson Pro, serif", fontSize: 13, cursor: "pointer", textAlign: "left", minHeight: 40 }}>
                  + {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {divider}

      <KeywordSection
        label="★ Argomenti di interesse"
        color={C.green}
        keywords={form.interests}
        onAdd={kw => addKw("interests", kw)}
        onRemove={kw => removeKw("interests", kw)}
        placeholder="es. tecnologia, politica…"
      />

      <KeywordSection
        label="✕ Argomenti da evitare"
        color={C.danger}
        keywords={form.avoids}
        onAdd={kw => addKw("avoids", kw)}
        onRemove={kw => removeKw("avoids", kw)}
        placeholder="es. gossip, sport…"
      />

      {divider}

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => onSave(form)} disabled={!form.name.trim()}
          style={btn({ flex: 1, background: form.name.trim() ? C.green : "#222", color: form.name.trim() ? "#000" : C.muted, cursor: form.name.trim() ? "pointer" : "not-allowed" })}>
          Salva
        </button>
        <button onClick={onCancel}
          style={btn({ flex: 1, background: "transparent", border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer", fontWeight: 400, fontFamily: "Crimson Pro, serif" })}>
          Annulla
        </button>
        {!isNew && !confirmDelete && (
          <button onClick={() => setConfirmDelete(true)}
            style={btn({ background: "transparent", border: `1px solid ${C.danger}44`, color: C.danger, cursor: "pointer", minWidth: 44 })}>✕</button>
        )}
        {!isNew && confirmDelete && (
          <button onClick={() => onDelete(profile.id)}
            style={btn({ background: "#1a0606", border: `1px solid ${C.danger}`, color: C.danger, cursor: "pointer" })}>Sicuro?</button>
        )}
      </div>
      {confirmDelete && (
        <button onClick={() => setConfirmDelete(false)}
          style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 12, fontFamily: "Crimson Pro, serif", textAlign: "left", padding: 0 }}>← annulla eliminazione</button>
      )}
    </div>
  );
}

export default function App() {
  const [profiles, setProfiles] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [panel, setPanel] = useState(null);
  const [editingProfile, setEditingProfile] = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [initialized, setInitialized] = useState(false);

  /* Inietta CSS globale e font una sola volta */
  useEffect(() => {
    if (!document.getElementById("gz-global")) {
      const s = document.createElement("style");
      s.id = "gz-global";
      s.textContent = GLOBAL_CSS;
      document.head.appendChild(s);
    }
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
        const p = await storage.get("gz_profiles");
        if (p) {
          const parsed = JSON.parse(p.value);
          const migrated = parsed.map(pr => ({
            id: pr.id, name: pr.name,
            feeds: pr.feeds || [],
            interests: pr.interests || [],
            avoids: pr.avoids || [],
          }));
          setProfiles(migrated);
          if (migrated.length > 0) setActiveId(migrated[0].id);
        }
      } catch {}
      setInitialized(true);
    })();
  }, []);

  const persist = useCallback(async (key, val) => {
    await storage.set(key, typeof val === "string" ? val : JSON.stringify(val));
  }, []);

  const activeProfile = profiles.find(p => p.id === activeId);

  const fetchNews = useCallback(async (profile) => {
    if (!profile.feeds?.length) { setError("Aggiungi almeno un feed RSS al profilo."); return; }
    setLoading(true); setError(""); setNews([]);
    try {
      const results = await Promise.allSettled(
        profile.feeds.map(async (feedUrl) => {
          const res = await fetch(CORS_PROXY + encodeURIComponent(feedUrl));
          if (!res.ok) throw new Error("Feed non raggiungibile");
          const text = await res.text();
          return parseFeed(text, feedUrl);
        })
      );

      const articles = results
        .filter(r => r.status === "fulfilled")
        .flatMap(r => r.value)
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

      const failed = results.filter(r => r.status === "rejected").length;

      setNews(articles);
      setFetchedAt(new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }));

      if (articles.length === 0)
        setError(failed ? "Impossibile caricare i feed. Verifica gli URL." : "Nessuna notizia trovata.");
      else if (failed)
        setError(`${failed} feed non caricato/i.`);
    } catch (e) {
      setError(e.message || "Errore di rete.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSaveProfiles = useCallback(async (p) => {
    setProfiles(p); await persist("gz_profiles", p);
  }, [persist]);

  const handleSaveProfile = useCallback(async (profile) => {
    const clean = { ...profile }; delete clean._isNew;
    const exists = profiles.some(p => p.id === clean.id);
    const next = exists ? profiles.map(p => p.id === clean.id ? clean : p) : [...profiles, clean];
    await handleSaveProfiles(next);
    if (!exists) setActiveId(clean.id);
    setEditingProfile(null);
    setNews([]); setFetchedAt(null);
  }, [profiles, handleSaveProfiles]);

  const handleDeleteProfile = useCallback(async (id) => {
    const next = profiles.filter(p => p.id !== id);
    await handleSaveProfiles(next);
    if (activeId === id) setActiveId(next[0]?.id || null);
    setEditingProfile(null); setNews([]); setFetchedAt(null);
  }, [profiles, activeId, handleSaveProfiles]);

  const togglePanel = (p) => { setPanel(prev => prev === p ? null : p); setEditingProfile(null); };

  const matchesAny = (article, keywords) => {
    if (!keywords.length) return false;
    const text = `${article.title} ${article.description}`.toLowerCase();
    return keywords.some(kw => text.includes(kw));
  };

  const avoids = activeProfile?.avoids || [];
  const interests = activeProfile?.interests || [];
  const displayedNews = news
    .filter(a => !matchesAny(a, avoids))
    .map(a => ({ ...a, _highlighted: matchesAny(a, interests) }));
  const filteredCount = news.length - displayedNews.length;

  if (!initialized) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg, color: C.green, fontSize: 28 }}>·</div>
  );

  const asidePadding = { padding: "0 18px 24px" };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Crimson Pro, serif" }}>

      {/* ── Header ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: C.bg, borderBottom: `1px solid ${C.border}` }}>

        {/* Riga logo */}
        <div style={{ padding: "10px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <h1 style={{ margin: 0, fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 900, color: C.green, letterSpacing: -0.5 }}>IL GAZZETTINO</h1>
            <span className="gz-date" style={{ fontSize: 10, color: "#333", letterSpacing: 1.1 }}>
              {new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}
            </span>
          </div>
          <button onClick={() => togglePanel("profiles")} title="Profili"
            style={{ background: panel === "profiles" ? C.greenDim : "none", border: `1px solid ${panel === "profiles" ? C.green + "44" : "transparent"}`, borderRadius: 6, color: panel === "profiles" ? C.green : C.muted, cursor: "pointer", fontSize: 16, padding: "6px 10px", minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>☰</button>
        </div>

        {/* Riga profili + aggiorna */}
        {profiles.length > 0 && (
          <div style={{ padding: "6px 16px", display: "flex", alignItems: "center", gap: 6, overflowX: "auto" }}>
            {profiles.map(p => (
              <button key={p.id} className="gz-tab"
                onClick={() => { setActiveId(p.id); setNews([]); setError(""); setFetchedAt(null); }}
                onDoubleClick={() => { setEditingProfile(p); setPanel("profiles"); }}
                title="Doppio click per modificare"
                style={{ background: p.id === activeId ? C.green : "transparent", color: p.id === activeId ? "#000" : C.muted, border: `1px solid ${p.id === activeId ? C.green : C.border}`, borderRadius: 6, padding: "5px 14px", fontFamily: "Crimson Pro, serif", fontSize: 13, cursor: "pointer", fontWeight: p.id === activeId ? 600 : 400 }}>
                {p.name}
              </button>
            ))}
            <button className="gz-tab"
              onClick={() => { setEditingProfile({ ...mkProfile(), _isNew: true }); setPanel("profiles"); }}
              style={{ background: "transparent", border: `1px dashed ${C.border}`, borderRadius: 6, padding: "5px 12px", color: "#444", fontFamily: "Crimson Pro, serif", fontSize: 12, cursor: "pointer" }}>+ Nuovo</button>
            {activeProfile && (
              <button className="gz-refresh"
                onClick={() => fetchNews(activeProfile)} disabled={loading}
                style={{ marginLeft: "auto", background: loading ? C.border : C.green, color: loading ? C.muted : "#000", border: "none", borderRadius: 6, padding: "5px 18px", fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 13, cursor: loading ? "not-allowed" : "pointer", flexShrink: 0 }}>
                {loading ? "…" : "↻ Aggiorna"}
              </button>
            )}
          </div>
        )}
      </header>

      <div style={{ display: "flex" }}>

        {/* ── Sidebar / Overlay ── */}
        {panel && (
          <aside className="gz-aside">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 14px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: "inherit", zIndex: 1 }}>
              <h2 style={{ margin: 0, fontFamily: "Playfair Display, serif", fontSize: 13, color: C.green, textTransform: "uppercase", letterSpacing: 1.2 }}>
                {editingProfile ? (editingProfile._isNew ? "Nuovo profilo" : "Modifica") : "Profili"}
              </h2>
              <button onClick={() => { setPanel(null); setEditingProfile(null); }}
                style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: C.muted, cursor: "pointer", fontSize: 16, padding: "4px 10px", minWidth: 36, minHeight: 36 }}>✕</button>
            </div>

            <div style={asidePadding}>
              {editingProfile ? (
                <div style={{ paddingTop: 16 }}>
                  <ProfileEditor profile={editingProfile} onSave={handleSaveProfile} onDelete={handleDeleteProfile} onCancel={() => setEditingProfile(null)} />
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 14 }}>
                  {profiles.map(p => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", background: C.bg, borderRadius: 8, border: `1px solid ${p.id === activeId ? C.green : C.border}` }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "Crimson Pro, serif", fontSize: 14, color: C.text }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "#444", marginTop: 2 }}>
                          {p.feeds?.length ? `${p.feeds.length} feed` : "Nessun feed"}
                          {p.interests?.length > 0 && <span style={{ color: C.green }}> · ★{p.interests.length}</span>}
                          {p.avoids?.length > 0 && <span style={{ color: C.danger }}> · ✕{p.avoids.length}</span>}
                        </div>
                      </div>
                      <button onClick={() => setEditingProfile(p)}
                        style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: C.muted, cursor: "pointer", fontSize: 12, padding: "5px 10px", minHeight: 32, fontFamily: "Crimson Pro, serif" }}>Modifica</button>
                    </div>
                  ))}
                  <button onClick={() => setEditingProfile({ ...mkProfile(), _isNew: true })}
                    style={{ marginTop: 4, padding: "12px", background: "transparent", border: `1px dashed ${C.border}`, borderRadius: 8, color: C.muted, fontFamily: "Crimson Pro, serif", fontSize: 14, cursor: "pointer", minHeight: 46 }}>+ Aggiungi profilo</button>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* ── Contenuto principale ── */}
        <main style={{ flex: 1, padding: "16px", minWidth: 0 }}>

          {/* Welcome state */}
          {profiles.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontSize: 48, color: C.green, marginBottom: 16, opacity: 0.4 }}>✦</div>
              <p style={{ fontFamily: "Playfair Display, serif", fontSize: 20, color: C.text, marginBottom: 8 }}>Benvenuto nel Gazzettino</p>
              <p style={{ fontSize: 15, color: C.muted, marginBottom: 24 }}>Crea un profilo e aggiungi i feed RSS delle tue fonti preferite.</p>
              <button onClick={() => { setEditingProfile({ ...mkProfile(), _isNew: true }); setPanel("profiles"); }}
                style={{ background: C.green, border: "none", borderRadius: 8, padding: "12px 28px", color: "#000", fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 14, cursor: "pointer", minHeight: 48 }}>+ Crea profilo</button>
            </div>
          )}

          {/* No feeds state */}
          {activeProfile && !activeProfile.feeds?.length && !loading && (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontSize: 48, color: C.green, marginBottom: 16, opacity: 0.3 }}>◈</div>
              <p style={{ fontFamily: "Playfair Display, serif", fontSize: 20, color: C.text, marginBottom: 8 }}>{activeProfile.name}</p>
              <p style={{ fontSize: 15, color: C.muted, marginBottom: 24 }}>Nessun feed RSS configurato per questo profilo.</p>
              <button onClick={() => { setEditingProfile(activeProfile); setPanel("profiles"); }}
                style={{ background: C.green, border: "none", borderRadius: 8, padding: "12px 28px", color: "#000", fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 14, cursor: "pointer", minHeight: 48 }}>Aggiungi feed</button>
            </div>
          )}

          {/* Errore */}
          {error && (
            <div style={{ background: "#130808", border: `1px solid ${C.danger}44`, borderRadius: 8, padding: "12px 16px", color: "#f87171", fontSize: 14, marginBottom: 16 }}>{error}</div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontSize: 12, color: C.muted, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 20 }}>Raccolta notizie…</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, animation: `gzp 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
              </div>
            </div>
          )}

          {/* Barra stato */}
          {fetchedAt && !loading && displayedNews.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 14, fontSize: 11, color: "#444" }}>
              <span style={{ color: C.green, fontSize: 8 }}>●</span>
              <span>{fetchedAt}</span>
              <span>·</span>
              <span>{displayedNews.length} articoli</span>
              {filteredCount > 0 && <span style={{ color: C.danger }}>· {filteredCount} filtrati</span>}
              {interests.length > 0 && <span style={{ color: C.green }}>· ★ {displayedNews.filter(a => a._highlighted).length} in evidenza</span>}
            </div>
          )}

          {/* Prompt aggiorna */}
          {!loading && news.length === 0 && !error && activeProfile?.feeds?.length > 0 && (
            <div style={{ textAlign: "center", padding: "70px 20px" }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontSize: 40, color: C.green, opacity: 0.15, marginBottom: 16 }}>◈</div>
              <p style={{ fontFamily: "Playfair Display, serif", fontSize: 16, color: C.text, marginBottom: 6 }}>{activeProfile.name}</p>
              <p style={{ fontSize: 14, color: C.muted }}>Premi <span style={{ color: C.green }}>↻ Aggiorna</span> per caricare le notizie.</p>
            </div>
          )}

          {/* Griglia articoli */}
          {displayedNews.length > 0 && !loading && (
            <div className="gz-grid">
              {displayedNews.map((article, i) => (
                <ArticleCard key={i} article={article} highlighted={article._highlighted} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
