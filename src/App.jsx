import { useState, useEffect } from "react";
import { C, injectTheme } from "./lib/theme";
import { matchesAny } from "./lib/articles";
import { useProfiles, mkProfile } from "./hooks/useProfiles";
import { useNews } from "./hooks/useNews";
import { ArticleCard } from "./components/ArticleCard";
import { Sidebar } from "./components/Sidebar";

export default function App() {
  const [panel, setPanel] = useState(null);
  const [editingProfile, setEditingProfile] = useState(null);

  const { profiles, activeId, setActiveId, initialized, saveProfile, deleteProfile, activeProfile } = useProfiles();
  const { news, loading, error, fetchedAt, fetchNews, clearNews } = useNews();

  useEffect(() => { injectTheme(); }, []);

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

  const avoids = activeProfile?.avoids || [];
  const interests = activeProfile?.interests || [];
  const displayedNews = news
    .filter(a => !matchesAny(a, avoids))
    .map(a => ({ ...a, _highlighted: matchesAny(a, interests) }))
    .sort((a, b) => {
      if (a._highlighted !== b._highlighted) return a._highlighted ? -1 : 1;
      return new Date(b.publishedAt) - new Date(a.publishedAt);
    });
  const filteredCount = news.length - displayedNews.length;

  if (!initialized) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg, color: C.green, fontSize: 30 }}>·</div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Crimson Pro, serif" }}>

      <header style={{ position: "sticky", top: 0, zIndex: 100, background: C.bg, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ padding: "10px 16px 9px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <h1 style={{ margin: 0, fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 900, color: C.green, letterSpacing: -0.5 }}>IL GAZZETTINO</h1>
            <span className="gz-date" style={{ fontSize: 12, color: C.muted, letterSpacing: 1.1 }}>
              {new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}
            </span>
          </div>
          <button onClick={() => togglePanel("profiles")} title="Profili"
            style={{ background: panel === "profiles" ? C.greenDim : "none", border: `1px solid ${panel === "profiles" ? C.green + "44" : "transparent"}`, borderRadius: 6, color: panel === "profiles" ? C.green : C.muted, cursor: "pointer", fontSize: 18, padding: "6px 10px", minWidth: 46, minHeight: 46, display: "flex", alignItems: "center", justifyContent: "center" }}>☰</button>
        </div>
      </header>

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
              <p style={{ fontFamily: "Playfair Display, serif", fontSize: 22, color: C.text, marginBottom: 8 }}>Benvenuto nel Gazzettino</p>
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
              <span>{displayedNews.length} articoli</span>
              {filteredCount > 0 && <span style={{ color: C.danger }}>· {filteredCount} filtrati</span>}
              {interests.length > 0 && <span style={{ color: C.green }}>· ★ {displayedNews.filter(a => a._highlighted).length} in evidenza</span>}
            </div>
          )}

          {!loading && news.length === 0 && !error && activeProfile?.feeds?.length > 0 && (
            <div style={{ textAlign: "center", padding: "70px 20px" }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontSize: 42, color: C.green, opacity: 0.15, marginBottom: 16 }}>◈</div>
              <p style={{ fontFamily: "Playfair Display, serif", fontSize: 18, color: C.text, marginBottom: 7 }}>{activeProfile.name}</p>
              <p style={{ fontSize: 16, color: C.muted }}>Premi <span style={{ color: C.green }}>↻ Aggiorna</span> per caricare le notizie.</p>
            </div>
          )}

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
