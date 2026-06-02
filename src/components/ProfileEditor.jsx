import { useState } from "react";
import { C } from "../lib/theme";
import { SUGGESTED_FEEDS } from "../config";
import { KeywordSection } from "./KeywordSection";
import { FeedSearchPanel } from "./FeedSearchPanel";

export function ProfileEditor({ profile, onSave, onDelete, onCancel }) {
  const [form, setForm] = useState({
    ...profile,
    feeds: [...(profile.feeds || [])],
    interests: [...(profile.interests || [])],
    avoids: [...(profile.avoids || [])],
  });
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isNew = !!profile._isNew;

  const inp = { width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 13px", color: C.text, fontFamily: "Crimson Pro, serif", fontSize: 16, outline: "none", boxSizing: "border-box" };
  const lbl = { display: "block", fontSize: 13, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6, fontFamily: "Crimson Pro, serif" };
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
    border: "none", borderRadius: 6, padding: "12px 15px", fontFamily: "Playfair Display, serif",
    fontSize: 15, fontWeight: 700, cursor: "pointer", minHeight: 46, ...style,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={lbl}>Nome NotiziAI</label>
        <input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      </div>

      {divider}

      <div>
        <label style={lbl}>Feed RSS</label>
        <div style={{ display: "flex", gap: 6, marginBottom: 9 }}>
          <input style={{ ...inp, flex: 1, width: "auto" }}
            placeholder="https://esempio.it/rss.xml"
            value={newFeedUrl}
            onChange={e => setNewFeedUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addFeed()}
          />
          <button onClick={() => addFeed(undefined)}
            style={btn({ background: C.green, color: "#000", minWidth: 46 })}>+</button>
        </div>

        {form.feeds.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 11 }}>
            {form.feeds.map(url => (
              <div key={url} style={{ display: "flex", alignItems: "center", gap: 8, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "9px 13px" }}>
                <span style={{ flex: 1, fontSize: 13, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</span>
                <button onClick={() => removeFeed(url)}
                  style={{ background: "transparent", border: `1px solid ${C.danger}55`, borderRadius: 4, color: C.danger, cursor: "pointer", fontSize: 13, padding: "4px 9px", flexShrink: 0, minHeight: 30 }}>Rimuovi</button>
              </div>
            ))}
          </div>
        )}

        <div>
          <span style={{ ...lbl, marginBottom: 6 }}>Cerca feed per argomento</span>
          <FeedSearchPanel existingFeeds={form.feeds} onAdd={addFeed} />
        </div>

        {available.length > 0 && (
          <div>
            <span style={{ ...lbl, marginBottom: 6 }}>Suggerimenti</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {available.map(s => (
                <button key={s.url} onClick={() => addFeed(s.url)}
                  style={{ background: "transparent", border: `1px dashed ${C.border}`, borderRadius: 6, padding: "10px 13px", color: C.muted, fontFamily: "Crimson Pro, serif", fontSize: 15, cursor: "pointer", textAlign: "left", minHeight: 42 }}>
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
            style={btn({ background: "transparent", border: `1px solid ${C.danger}55`, color: C.danger, cursor: "pointer", minWidth: 46 })}>✕</button>
        )}
        {!isNew && confirmDelete && (
          <button onClick={() => onDelete(profile.id)}
            style={btn({ background: "#1a0606", border: `1px solid ${C.danger}`, color: C.danger, cursor: "pointer" })}>Sicuro?</button>
        )}
      </div>
      {confirmDelete && (
        <button onClick={() => setConfirmDelete(false)}
          style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 14, fontFamily: "Crimson Pro, serif", textAlign: "left", padding: 0 }}>← annulla eliminazione</button>
      )}
    </div>
  );
}
