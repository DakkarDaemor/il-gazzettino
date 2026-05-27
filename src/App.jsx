import { useState, useEffect, useCallback } from "react";

const storage = {
  async get(key) {
    try { const v = localStorage.getItem(key); return v !== null ? { value: v } : null; } catch { return null; }
  },
  async set(key, value) {
    try { localStorage.setItem(key, value); return { key, value }; } catch { return null; }
  },
};

const RSS2JSON = "https://api.rss2json.com/v1/api.json";

const C = {
  bg: "#0f0e0c", card: "#141210", cardHover: "#1c1916",
  gold: "#c9a84c", goldDim: "#3a2e10",
  text: "#e8e0d0", muted: "#8a7f6f", dim: "#5a5048",
  border: "#2e2a24",
  danger: "#e05c5c", success: "#5cb88c",
};

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
  return (
    <a href={article.url} target="_blank" rel="noopener noreferrer"
      style={{ display: "flex", flexDirection: "column", background: C.card, border: `1px solid ${highlighted ? C.gold : C.border}`, borderRadius: 6, overflow: "hidden", textDecoration: "none", transition: "border-color 0.2s, transform 0.2s, background 0.2s" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.background = C.cardHover; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = highlighted ? C.gold : C.border; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.background = C.card; }}
    >
      {hasImg && (
        <div style={{ width: "100%", aspectRatio: "16/9", overflow: "hidden", flexShrink: 0 }}>
          <img src={article.image} alt="" onError={() => setImgFailed(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}
      {!hasImg && <div style={{ height: 2, background: `linear-gradient(90deg, ${highlighted ? C.gold : C.muted}, transparent)` }} />}
      <div style={{ padding: "13px 15px 15px", display: "flex", flexDirection: "column", gap: 7, flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: C.gold, fontFamily: "Crimson Pro, serif", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
            {highlighted && <span style={{ marginRight: 4 }}>★</span>}
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

function KeywordChips({ keywords, color, onRemove }) {
  if (!keywords.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
      {keywords.map(kw => (
        <span key={kw} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: C.bg, border: `1px solid ${color}33`, borderRadius: 20, padding: "2px 8px 2px 10px", fontSize: 12, color }}>
          {kw}
          {onRemove && (
            <button onClick={() => onRemove(kw)}
              style={{ background: "none", border: "none", color, cursor: "pointer", fontSize: 13, padding: 0, lineHeight: 1, opacity: 0.7 }}>✕</button>
          )}
        </span>
      ))}
    </div>
  );
}

function KeywordSection({ label, color, keywords, onAdd, onRemove, placeholder }) {
  const [input, setInput] = useState("");
  const inp = { width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, padding: "7px 10px", color: C.text, fontFamily: "Crimson Pro, serif", fontSize: 13, outline: "none", boxSizing: "border-box" };
  const lbl = { display: "block", fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5, fontFamily: "Crimson Pro, serif" };

  const add = () => {
    const kw = input.trim().toLowerCase();
    if (!kw || keywords.includes(kw)) return;
    onAdd(kw);
    setInput("");
  };

  return (
    <div>
      <label style={{ ...lbl, color }}>{label}</label>
      <div style={{ display: "flex", gap: 6 }}>
        <input style={{ ...inp, flex: 1, width: "auto" }}
          placeholder={placeholder}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()}
        />
        <button onClick={add}
          style={{ background: "transparent", border: `1px solid ${color}55`, borderRadius: 4, padding: "7px 11px", color, fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 13, cursor: "pointer", flexShrink: 0 }}>+</button>
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

  const inp = { width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, padding: "8px 10px", color: C.text, fontFamily: "Crimson Pro, serif", fontSize: 14, outline: "none", boxSizing: "border-box" };
  const lbl = { display: "block", fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5, fontFamily: "Crimson Pro, serif" };
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label style={lbl}>Nome gazzettino</label>
        <input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      </div>

      {divider}

      <div>
        <label style={lbl}>Feed RSS</label>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <input style={{ ...inp, width: "auto", flex: 1 }}
            placeholder="https://esempio.it/rss.xml"
            value={newFeedUrl}
            onChange={e => setNewFeedUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addFeed()}
          />
          <button onClick={() => addFeed(undefined)}
            style={{ background: C.gold, border: "none", borderRadius: 4, padding: "8px 12px", color: C.bg, fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 13, cursor: "pointer", flexShrink: 0 }}>+</button>
        </div>

        {form.feeds.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 10 }}>
            {form.feeds.map(url => (
              <div key={url} style={{ display: "flex", alignItems: "center", gap: 6, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, padding: "6px 10px" }}>
                <span style={{ flex: 1, fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</span>
                <button onClick={() => removeFeed(url)}
                  style={{ background: "transparent", border: `1px solid #5a2020`, borderRadius: 3, color: C.danger, cursor: "pointer", fontSize: 11, padding: "2px 7px", flexShrink: 0, fontFamily: "Crimson Pro, serif" }}>Rimuovi</button>
              </div>
            ))}
          </div>
        )}

        {available.length > 0 && (
          <div>
            <span style={{ ...lbl, marginBottom: 6 }}>Suggerimenti</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {available.map(s => (
                <button key={s.url} onClick={() => addFeed(s.url)}
                  style={{ background: "transparent", border: `1px dashed ${C.border}`, borderRadius: 4, padding: "6px 10px", color: C.muted, fontFamily: "Crimson Pro, serif", fontSize: 12, cursor: "pointer", textAlign: "left" }}>
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
        color={C.gold}
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

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button onClick={() => onSave(form)} disabled={!form.name.trim()}
          style={{ flex: 1, background: form.name.trim() ? C.gold : C.dim, border: "none", borderRadius: 4, padding: "9px", color: C.bg, fontFamily: "Playfair Display, serif", fontSize: 13, fontWeight: 700, cursor: form.name.trim() ? "pointer" : "not-allowed" }}>
          Salva
        </button>
        <button onClick={onCancel}
          style={{ flex: 1, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 4, padding: "9px", color: C.muted, fontFamily: "Crimson Pro, serif", fontSize: 13, cursor: "pointer" }}>
          Annulla
        </button>
        {!isNew && !confirmDelete && (
          <button onClick={() => setConfirmDelete(true)}
            style={{ background: "transparent", border: "1px solid #5a2020", borderRadius: 4, padding: "9px 12px", color: C.danger, cursor: "pointer", fontSize: 13, fontFamily: "Crimson Pro, serif" }}>Elimina</button>
        )}
        {!isNew && confirmDelete && (
          <button onClick={() => onDelete(profile.id)}
            style={{ background: "#3a1010", border: `1px solid ${C.danger}`, borderRadius: 4, padding: "9px 10px", color: C.danger, cursor: "pointer", fontSize: 12, fontFamily: "Playfair Display, serif", fontWeight: 700 }}>Sicuro?</button>
        )}
      </div>
      {confirmDelete && (
        <button onClick={() => setConfirmDelete(false)}
          style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontSize: 12, fontFamily: "Crimson Pro, serif", textAlign: "left", padding: 0 }}>← annulla eliminazione</button>
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
        const p = await storage.get("gz_profiles");
        if (p) {
          const parsed = JSON.parse(p.value);
          const migrated = parsed.map(pr => ({
            id: pr.id,
            name: pr.name,
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
          const url = `${RSS2JSON}?rss_url=${encodeURIComponent(feedUrl)}&count=20`;
          const res = await fetch(url);
          if (!res.ok) throw new Error("Feed non raggiungibile");
          const data = await res.json();
          if (data.status !== "ok") throw new Error(data.message || "Feed non valido");
          const sourceName = data.feed?.title || new URL(feedUrl).hostname.replace("www.", "");
          return data.items.map(item => ({
            title: item.title,
            url: item.link,
            publishedAt: item.pubDate,
            description: item.description
              ? item.description.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 280)
              : "",
            image: item.thumbnail || (item.enclosure?.type?.startsWith("image") ? item.enclosure.link : null) || null,
            source: { name: sourceName },
          }));
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

  const handleSaveProfiles = useCallback(async (p) => { setProfiles(p); await persist("gz_profiles", p); }, [persist]);

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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg, color: C.gold, fontSize: 24 }}>·</div>
  );

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
          <button onClick={() => togglePanel("profiles")} title="Profili"
            style={{ background: panel === "profiles" ? C.goldDim : "none", border: "none", color: panel === "profiles" ? C.gold : C.muted, cursor: "pointer", fontSize: 15, padding: "3px 6px", borderRadius: 4 }}>☰</button>
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
            <h2 style={{ margin: "0 0 16px", fontFamily: "Playfair Display, serif", fontSize: 13, color: C.gold, textTransform: "uppercase", letterSpacing: 1 }}>
              {editingProfile ? (editingProfile._isNew ? "Nuovo profilo" : "Modifica") : "Profili"}
            </h2>
            {editingProfile ? (
              <ProfileEditor profile={editingProfile} onSave={handleSaveProfile} onDelete={handleDeleteProfile} onCancel={() => setEditingProfile(null)} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {profiles.map(p => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", background: C.bg, borderRadius: 4, border: `1px solid ${p.id === activeId ? C.gold : C.border}` }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "Crimson Pro, serif", fontSize: 14, color: C.text }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: C.dim, marginTop: 1 }}>
                        {p.feeds?.length ? `${p.feeds.length} feed` : "Nessun feed"}
                        {p.interests?.length > 0 && <span style={{ color: C.gold }}> · ★{p.interests.length}</span>}
                        {p.avoids?.length > 0 && <span style={{ color: C.danger }}> · ✕{p.avoids.length}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                      <button onClick={() => setEditingProfile(p)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 3, color: C.muted, cursor: "pointer", fontSize: 11, padding: "2px 8px", fontFamily: "Crimson Pro, serif" }}>Modifica</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => setEditingProfile({ ...mkProfile(), _isNew: true })}
                  style={{ marginTop: 4, padding: "8px", background: "transparent", border: `1px dashed ${C.border}`, borderRadius: 4, color: C.muted, fontFamily: "Crimson Pro, serif", fontSize: 13, cursor: "pointer" }}>+ Aggiungi profilo</button>
              </div>
            )}
          </aside>
        )}

        <main style={{ flex: 1, padding: "20px 22px", minWidth: 0 }}>
          {profiles.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontSize: 44, color: C.gold, marginBottom: 14, opacity: 0.5 }}>✦</div>
              <p style={{ fontFamily: "Playfair Display, serif", fontSize: 19, color: C.text, marginBottom: 8 }}>Benvenuto nel Gazzettino</p>
              <p style={{ fontSize: 15, color: C.muted, marginBottom: 22 }}>Crea un profilo e aggiungi i feed RSS delle tue fonti preferite.</p>
              <button onClick={() => { setEditingProfile({ ...mkProfile(), _isNew: true }); setPanel("profiles"); }}
                style={{ background: C.gold, border: "none", borderRadius: 4, padding: "10px 26px", color: C.bg, fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>+ Crea profilo</button>
            </div>
          )}
          {activeProfile && !activeProfile.feeds?.length && !loading && (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontSize: 44, color: C.gold, marginBottom: 14, opacity: 0.4 }}>◈</div>
              <p style={{ fontFamily: "Playfair Display, serif", fontSize: 19, color: C.text, marginBottom: 8 }}>{activeProfile.name}</p>
              <p style={{ fontSize: 15, color: C.muted, marginBottom: 22 }}>Nessun feed RSS configurato per questo profilo.</p>
              <button onClick={() => { setEditingProfile(activeProfile); setPanel("profiles"); }}
                style={{ background: C.gold, border: "none", borderRadius: 4, padding: "10px 26px", color: C.bg, fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Aggiungi feed</button>
            </div>
          )}
          {error && (
            <div style={{ background: "#1e1010", border: "1px solid #5a2020", borderRadius: 4, padding: "11px 15px", color: "#e08080", fontSize: 14, marginBottom: 18 }}>{error}</div>
          )}
          {loading && (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontSize: 13, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 18 }}>Raccolta notizie…</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 7 }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.gold, animation: `gzp 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
              </div>
              <style>{`@keyframes gzp{0%,100%{transform:scale(.8);opacity:.3}50%{transform:scale(1.3);opacity:1}}`}</style>
            </div>
          )}
          {fetchedAt && !loading && displayedNews.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: 12, color: C.dim }}>
              <span style={{ color: C.gold, fontSize: 9 }}>●</span>
              <span>Aggiornato alle {fetchedAt}</span><span>·</span>
              <span>{displayedNews.length} articoli</span>
              {filteredCount > 0 && <span style={{ color: C.danger }}>· {filteredCount} filtrati</span>}
              {interests.length > 0 && <span style={{ color: C.gold }}>· ★ {displayedNews.filter(a => a._highlighted).length} in evidenza</span>}
            </div>
          )}
          {!loading && news.length === 0 && !error && activeProfile?.feeds?.length > 0 && (
            <div style={{ textAlign: "center", padding: "70px 20px", color: C.muted }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontSize: 36, color: C.gold, opacity: 0.2, marginBottom: 14 }}>◈</div>
              <p style={{ fontFamily: "Playfair Display, serif", fontSize: 15, color: C.text, marginBottom: 6 }}>{activeProfile.name}</p>
              <p style={{ fontSize: 14 }}>Premi <span style={{ color: C.gold }}>↻ Aggiorna</span> per caricare le notizie.</p>
            </div>
          )}
          {displayedNews.length > 0 && !loading && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(265px, 1fr))", gap: 14 }}>
              {displayedNews.map((article, i) => <ArticleCard key={i} article={article} highlighted={article._highlighted} />)}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
