import { C } from "../lib/theme";

export function KeywordChips({ keywords, color, onRemove }) {
  if (!keywords.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 7 }}>
      {keywords.map(kw => (
        <span key={kw} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: C.bg, border: `1px solid ${color}44`, borderRadius: 20, padding: "4px 9px 4px 11px", fontSize: 14, color }}>
          {kw}
          {onRemove && (
            <button onClick={() => onRemove(kw)}
              style={{ background: "none", border: "none", color, cursor: "pointer", fontSize: 15, padding: "0 1px", lineHeight: 1, opacity: 0.7 }}>✕</button>
          )}
        </span>
      ))}
    </div>
  );
}
