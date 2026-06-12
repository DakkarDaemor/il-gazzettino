import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { C } from "./lib/theme";
import { filterArticles } from "./lib/articles";
import { useProfiles, mkProfile } from "./hooks/useProfiles";
import { useNews } from "./hooks/useNews";
import { usePullToRefresh } from "./hooks/usePullToRefresh";
import { ArticleCard } from "./components/ArticleCard";
import { Sidebar } from "./components/Sidebar";

export default function App() {
  const [panel, setPanel] = useState(null);
  const [editingProfile, setEditingProfile] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
    else setSearchQuery("");
  }, [searchOpen]);

  const { profiles, activeId, setActiveId, initialized, saveProfile, deleteProfile, activeProfile } = useProfiles();
  const { news, loading, error, fetchedAt, fetchNews, clearNews } = useNews();

  const handleSaveProfile = async (profile) => {
    await saveProfile(profile);
    clearNews();
    setEditingProfile(null);
  };

  const handleDeleteProfile = async (id) => {
    await deleteProfile(id);
    clearNews();
    setEditingProfile(null);
  };

  const togglePanel = (p) => { setPanel(prev => prev === p ? null : p); setEditingProfile(null); };

  const doRefresh = useCallback(() => {
    if (activeProfile?.feeds?.length) fetchNews(activeProfile);
  }, [activeProfile, fetchNews]);

  const { dist, ready } = usePullToRefresh(doRefresh, loading || !activeProfile?.feeds?.length);

  const avoids = activeProfile?.avoids || [];
  const interests = activeProfile?.interests || [];
  const displayedNews = useMemo(
    () => filterArticles(news, interests, avoids),
    [news, interests, avoids]
  );
  const filteredCount = news.length - displayedNews.length;

  const visibleNews = useMemo(() => {
    if (!searchQuery.trim()) return displayedNews;
    const q = searchQuery.trim().toLowerCase();
    return displayedNews.filter(a =>
      a.title?.toLowerCase().includes(q) ||
      a.description?.toLowerCase().includes(q) ||
      a.source?.name?.toLowerCase().includes(q)
    );
  }, [displayedNews, searchQuery]);

  if (!initialized) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg, color: C.green, fontSize: 30 }}>·</div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Crimson Pro, serif" }}>

      <header style={{ position: "sticky", top: 0, zIndex: 100, background: C.bg, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ padding: "10px 16px 9px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <h1 style={{ margin: 0, fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>
              <span style={{ color: C.green }}>NOTIZI</span><span style={{ color: C.orange }}>AI</span>
            </h1>
            <span className="gz-date" style={{ fontSize: 12, color: C.muted, letterSpacing: 1.1 }}>
              {new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}
            </span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {displayedNews.length > 0 && (
              <button onClick={() => setSearchOpen(o => !o)} title="Cerca"
                style={{ background: searchOpen ? C.greenDim : "none", border: `1px solid ${searchOpen ? C.green + "44" : "transparent"}`, borderRadius: 6, color: searchOpen ? C.green : C.muted, cursor: "pointer", fontSize: 24, padding: "6px 10px", minWidth: 46, minHeight: 46, display: "flex", alignItems: "center", justifyContent: "center" }}>⌕</button>
            )}
            {activeProfile?.feeds?.length > 0 && (
              <button onClick={doRefresh} disabled={loading} title="Aggiorna"
                style={{ background: "none", border: "1px solid transparent", borderRadius: 6, color: loading ? C.border : C.muted, cursor: loading ? "not-allowed" : "pointer", fontSize: 18, padding: "6px 10px", minWidth: 46, minHeight: 46, display: "flex", alignItems: "center", justifyContent: "center" }}>↻</button>
            )}
            <button onClick={() => togglePanel("profiles")} title="Profili"
              style={{ background: panel === "profiles" ? C.greenDim : "none", border: `1px solid ${panel === "profiles" ? C.green + "44" : "transparent"}`, borderRadius: 6, color: panel === "profiles" ? C.green : C.muted, cursor: "pointer", fontSize: 18, padding: "6px 10px", minWidth: 46, minHeight: 46, display: "flex", alignItems: "center", justifyContent: "center" }}>☰</button>
          </div>
        </div>
        {searchOpen && (
          <div style={{ padding: "0 16px 10px", display: "flex", gap: 8, alignItems: "center" }}>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === "Escape" && setSearchOpen(false)}
              placeholder="Filtra articoli…"
              style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 12px", color: C.text, fontFamily: "Crimson Pro, serif", fontSize: 16, outline: "none" }}
            />
            {searchQuery && (
              <span style={{ fontSize: 13, color: C.muted, flexShrink: 0, whiteSpace: "nowrap" }}>
                {visibleNews.length} risultati
              </span>
            )}
            <button onClick={() => setSearchOpen(false)} title="Chiudi"
              style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 18, padding: "4px 8px", lineHeight: 1 }}>✕</button>
          </div>
        )}
      </header>

      {dist > 0 && (
        <div style={{ position: "fixed", top: 51, left: 0, right: 0, height: 38, zIndex: 99, display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, borderBottom: `1px solid ${ready ? C.green : C.border}`, pointerEvents: "none", transition: "border-color 0.1s" }}>
          <span style={{ color: ready ? C.green : C.muted, fontSize: 16, display: "inline-block", transform: `rotate(${Math.min(dist / 72 * 180, 180)}deg)`, transition: "color 0.1s" }}>↓</span>
        </div>
      )}

      <div style={{ display: "flex" }}>
        {panel && (
          <Sidebar
            profiles={profiles}
            activeId={activeId}
            activeProfile={activeProfile}
            editingProfile={editingProfile}
            setEditingProfile={setEditingProfile}
            onClose={() => { setPanel(null); setEditingProfile(null); }}
            onSaveProfile={handleSaveProfile}
            onDeleteProfile={handleDeleteProfile}
            onCreateNew={() => setEditingProfile({ ...mkProfile(), _isNew: true })}
            onSetActive={(id) => { setActiveId(id); clearNews(); }}
            onFetchNews={() => fetchNews(activeProfile)}
            loading={loading}
          />
        )}

        <main style={{ flex: 1, padding: "16px", minWidth: 0 }}>
          {profiles.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontSize: 50, color: C.green, marginBottom: 16, opacity: 0.4 }}>✦</div>
              <p style={{ fontFamily: "Playfair Display, serif", fontSize: 22, color: C.text, marginBottom: 8 }}>Benvenuto in NotiziAI</p>
              <p style={{ fontSize: 17, color: C.muted, marginBottom: 24 }}>Crea un profilo e aggiungi i feed RSS delle tue fonti preferite.</p>
              <button onClick={() => { setEditingProfile({ ...mkProfile(), _isNew: true }); setPanel("profiles"); }}
                style={{ background: C.green, border: "none", borderRadius: 8, padding: "13px 30px", color: "#000", fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 16, cursor: "pointer", minHeight: 50 }}>+ Crea profilo</button>
            </div>
          )}

          {activeProfile && !activeProfile.feeds?.length && !loading && (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontSize: 50, color: C.green, marginBottom: 16, opacity: 0.3 }}>◈</div>
              <p style={{ fontFamily: "Playfair Display, serif", fontSize: 22, color: C.text, marginBottom: 8 }}>{activeProfile.name}</p>
              <p style={{ fontSize: 17, color: C.muted, marginBottom: 24 }}>Nessun feed RSS configurato per questo profilo.</p>
              <button onClick={() => { setEditingProfile(activeProfile); setPanel("profiles"); }}
                style={{ background: C.green, border: "none", borderRadius: 8, padding: "13px 30px", color: "#000", fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 16, cursor: "pointer", minHeight: 50 }}>Aggiungi feed</button>
            </div>
          )}

          {error && (
            <div style={{ background: "#400", border: `1px solid ${C.danger}44`, borderRadius: 8, padding: "13px 17px", color: "#f87171", fontSize: 16, marginBottom: 16 }}>{error}</div>
          )}

          {loading && (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontSize: 14, color: C.muted, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 20 }}>Raccolta notizie…</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: C.green, animation: `gzp 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
              </div>
            </div>
          )}

          {fetchedAt && !loading && displayedNews.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 14, fontSize: 13, color: C.muted }}>
              <span style={{ color: C.green, fontSize: 9 }}>●</span>
              <span>{fetchedAt}</span>
              <span>·</span>
              <span>{visibleNews.length} articoli</span>
              {filteredCount > 0 && <span style={{ color: C.danger }}>· {filteredCount} filtrati</span>}
              {searchQuery.trim() && visibleNews.length < displayedNews.length && <span style={{ color: C.orange }}>· ricerca attiva</span>}
              {interests.length > 0 && !searchQuery.trim() && <span style={{ color: C.green }}>· ★ {displayedNews.filter(a => a._highlighted).length} in evidenza</span>}
            </div>
          )}

          {!loading && news.length === 0 && !error && activeProfile?.feeds?.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontFamily: "Playfair Display, serif", fontSize: 14, color: C.muted, textTransform: "uppercase", letterSpacing: 1.5 }}>
                  Fonti · {activeProfile.feeds.length}
                </span>
                <button onClick={doRefresh}
                  style={{ background: C.green, border: "none", borderRadius: 6, padding: "8px 18px", color: "#000", fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 14, cursor: "pointer", minHeight: 36 }}>
                  ↻ Carica notizie
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {activeProfile.feeds.map(feed => (
                  <div key={feed.url} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.border, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, color: C.text, fontFamily: "Crimson Pro, serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{feed.label}</div>
                      <div style={{ fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>{feed.url}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {visibleNews.length > 0 && !loading && (
            <div className="gz-grid">
              {visibleNews.map((article) => (
                <ArticleCard key={article.url} article={article} highlighted={article._highlighted} />
              ))}
            </div>
          )}

          {searchQuery.trim() && visibleNews.length === 0 && !loading && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: C.muted, fontFamily: "Playfair Display, serif", fontSize: 18 }}>
              Nessun articolo trovato per "<span style={{ color: C.text }}>{searchQuery}</span>"
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
