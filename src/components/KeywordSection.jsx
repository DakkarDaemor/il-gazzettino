import { useState } from "react";
import { C } from "../lib/theme";
import { KeywordChips } from "./KeywordChips";

function parseKeywords(raw) {
  const kws = [];
  let cur = "";
  let inQ = false;
  for (const ch of raw) {
    if (ch === '"') {
      inQ = !inQ;
    } else if (ch === "," && !inQ) {
      const k = cur.trim().toLowerCase();
      if (k) kws.push(k);
      cur = "";
    } else {
      cur += ch;
    }
  }
  const last = cur.trim().toLowerCase();
  if (last) kws.push(last);
  return kws;
}

export function KeywordSection({ label, color, keywords, onAdd, onRemove, placeholder }) {
  const [input, setInput] = useState("");

  const inp = { width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "9px 11px", color: C.text, fontFamily: "Crimson Pro, serif", fontSize: 15, outline: "none", boxSizing: "border-box" };
  const labelStyle = { display: "block", fontSize: 13, color, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6, fontFamily: "Crimson Pro, serif" };

  const addAll = () => {
    if (!input.trim()) return;
    parseKeywords(input).forEach(kw => {
      if (!keywords.includes(kw)) onAdd(kw);
    });
    setInput("");
  };

  const handleChange = (e) => {
    const val = e.target.value;
    let inQ = false;
    let lastComma = -1;
    for (let i = 0; i < val.length; i++) {
      if (val[i] === '"') inQ = !inQ;
      else if (val[i] === "," && !inQ) lastComma = i;
    }
    if (lastComma === -1) { setInput(val); return; }
    parseKeywords(val.slice(0, lastComma)).forEach(kw => {
      if (kw && !keywords.includes(kw)) onAdd(kw);
    });
    setInput(val.slice(lastComma + 1).trimStart());
  };

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: "flex", gap: 6 }}>
        <input style={{ ...inp, flex: 1, width: "auto" }}
          placeholder={placeholder}
          value={input}
          onChange={handleChange}
          onKeyDown={e => e.key === "Enter" && addAll()}
        />
        <button onClick={addAll}
          style={{ background: "transparent", border: `1px solid ${color}55`, borderRadius: 6, padding: "9px 14px", color, fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 16, cursor: "pointer", flexShrink: 0, minWidth: 46 }}>+</button>
      </div>
      <KeywordChips keywords={keywords} color={color} onRemove={onRemove} />
    </div>
  );
}
