import { useState } from "react";
import { C } from "../lib/theme";
import { KeywordSection } from "./KeywordSection";
import { FeedSearchPanel } from "./FeedSearchPanel";

export function ProfileEditor({ form, onChange }) {
  const [newFeedUrl, setNewFeedUrl] = useState("");

  const inp = { width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 13px", color: C.text, fontFamily: "Crimson Pro, serif", fontSize: 16, outline: "none", boxSizing: "border-box" };
  const labelStyle = { display: "block", fontSize: 13, color: C.label, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6, fontFamily: "Crimson Pro, serif" };
  const divider = <div style={{ height: 1, background: C.border, margin: "4px 0" }} />;

  const addFeed = (url, label) => {
    const u = (url ?? newFeedUrl).trim();
    if (!u || form.feeds.some(f => f.url === u)) return;
    let lbl = label?.trim() || "";
    if (!lbl) { try { lbl = new URL(u).hostname.replace("www.", ""); } catch { lbl = u; } }
    onChange({ ...form, feeds: [...form.feeds, { url: u, label: lbl }] });
    if (!url) setNewFeedUrl("");
  };

  const removeFeed = (url) => onChange({ ...form, feeds: form.feeds.filter(f => f.url !== url) });
  const addKw = (list, kw) => { if (kw && !form[list].includes(kw)) onChange({ ...form, [list]: [...form[list], kw] }); };
  const removeKw = (list, kw) => onChange({ ...form, [list]: form[list].filter(k => k !== kw) });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={labelStyle}>Nome profilo</label>
        <input style={inp} value={form.name} onChange={e => onChange({ ...form, name: e.target.value })} />
      </div>

      {divider}

      <div>
        <label style={labelStyle}>Feed RSS</label>
        <div style={{ display: "flex", gap: 6, marginBottom: 9 }}>
          <input style={{ ...inp, flex: 1, width: "auto" }}
            placeholder="https://esempio.it/rss.xml"
            value={newFeedUrl}
            onChange={e => setNewFeedUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addFeed()}
          />
          <button onClick={() => addFeed(undefined)}
            style={{ border: "none", borderRadius: 6, padding: "12px 15px", fontFamily: "Playfair Display, serif", fontSize: 15, fontWeight: 700, cursor: "pointer", minHeight: 46, background: C.green, color: "#000", minWidth: 46 }}>+</button>
        </div>

        {form.feeds.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 11 }}>
            {form.feeds.map(feed => (
              <div key={feed.url} style={{ display: "flex", alignItems: "center", gap: 8, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "9px 13px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{feed.label}</div>
                  <div style={{ fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>{feed.url}</div>
                </div>
                <button onClick={() => removeFeed(feed.url)}
                  style={{ background: "transparent", border: `1px solid ${C.danger}55`, borderRadius: 4, color: C.danger, cursor: "pointer", fontSize: 13, padding: "4px 9px", flexShrink: 0, minHeight: 30 }}>Rimuovi</button>
              </div>
            ))}
          </div>
        )}

        <div>
          <span style={{ ...labelStyle, marginBottom: 6 }}>Cerca feed per argomento</span>
          <FeedSearchPanel existingFeeds={form.feeds} onAdd={addFeed} />
        </div>
      </div>

      {divider}

      <KeywordSection
        label="★ Argomenti di interesse"
        color={C.green}
        keywords={form.interests}
        onAdd={kw => addKw("interests", kw)}
        onRemove={kw => removeKw("interests", kw)}
        placeholder='es. tecnologia, "serie A"…'
      />

      <KeywordSection
        label="✕ Argomenti da evitare"
        color={C.danger}
        keywords={form.avoids}
        onAdd={kw => addKw("avoids", kw)}
        onRemove={kw => removeKw("avoids", kw)}
        placeholder="es. gossip, sport…"
      />
    </div>
  );
}
