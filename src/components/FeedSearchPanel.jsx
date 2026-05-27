import { useState } from "react";
import { C } from "../lib/theme";
import { FEED_SEARCH_PROVIDERS, searchFeeds } from "../lib/feedSearch/index";

function fmtSubscribers(n) {
  if (!n) return null;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k iscritti`;
  return `${n} iscritti`;
}

export function FeedSearchPanel({ existingFeeds, onAdd }) {
  const [query, setQuery] = useState("");
  const [providerId, setProviderId] = useState(FEED_SEARCH_PROVIDERS[0].id);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const inp = { width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "9px 11px", color: C.text, fontFamily: "Crimson Pro, serif", fontSize: 15, outline: "none", boxSizing: "border-box" };

  const doSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(false);
    try {
      const res = await searchFeeds(query, providerId);
      setResults(res);
      setSearched(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const available = results.filter(r => !existingFeeds.includes(r.url));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

      {FEED_SEARCH_PROVIDERS.length > 1 && (
        <div style={{ display: "flex", gap: 5 }}>
          {FEED_SEARCH_PROVIDERS.map(p => (
            <button key={p.id} onClick={() => setProviderId(p.id)}
              style={{ background: providerId === p.id ? C.greenDim : "transparent", border: `1px solid ${providerId === p.id ? C.green + "55" : C.border}`, borderRadius: 5, padding: "4px 11px", color: providerId === p.id ? C.green : C.muted, fontFamily: "Crimson Pro, serif", fontSize: 13, cursor: "pointer" }}>
              {p.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 6 }}>
        <input style={{ ...inp, flex: 1, width: "auto" }}
          placeholder="es. tecnologia, politica italiana…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && doSearch()}
        />
        <button onClick={doSearch} disabled={loading || !query.trim()}
          style={{ background: loading || !query.trim() ? C.border : C.green, color: loading || !query.trim() ? C.muted : "#000", border: "none", borderRadius: 6, padding: "9px 16px", fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 14, cursor: loading || !query.trim() ? "not-allowed" : "pointer", flexShrink: 0, minHeight: 40 }}>
          {loading ? "…" : "Cerca"}
        </button>
      </div>

      {error && (
        <div style={{ fontSize: 13, color: C.danger, padding: "7px 11px", background: "#400", borderRadius: 5 }}>{error}</div>
      )}

      {searched && available.length === 0 && !loading && (
        <div style={{ fontSize: 13, color: C.muted, padding: "7px 0" }}>Nessun risultato, o tutti i feed sono già aggiunti.</div>
      )}

      {available.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 280, overflowY: "auto" }}>
          {available.map(r => (
            <div key={r.url} style={{ display: "flex", alignItems: "center", gap: 9, background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "9px 12px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, color: C.text, fontFamily: "Crimson Pro, serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 2, flexWrap: "wrap" }}>
                  {r.website && <span style={{ fontSize: 12, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{r.website.replace(/^https?:\/\//, "")}</span>}
                  {fmtSubscribers(r.subscribers) && <span style={{ fontSize: 12, color: C.green }}>{fmtSubscribers(r.subscribers)}</span>}
                </div>
              </div>
              <button onClick={() => onAdd(r.url)}
                style={{ background: "transparent", border: `1px solid ${C.green}55`, borderRadius: 5, color: C.green, cursor: "pointer", fontSize: 16, fontWeight: 700, padding: "4px 13px", flexShrink: 0, minHeight: 32, fontFamily: "Playfair Display, serif" }}>+</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
