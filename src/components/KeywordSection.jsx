import { useState } from "react";
import { C } from "../lib/theme";
import { KeywordChips } from "./KeywordChips";

export function KeywordSection({ label, color, keywords, onAdd, onRemove, placeholder }) {
  const [input, setInput] = useState("");

  const inp = { width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "9px 11px", color: C.text, fontFamily: "Crimson Pro, serif", fontSize: 15, outline: "none", boxSizing: "border-box" };
  const lbl = { display: "block", fontSize: 13, color, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6, fontFamily: "Crimson Pro, serif" };

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
          style={{ background: "transparent", border: `1px solid ${color}55`, borderRadius: 6, padding: "9px 14px", color, fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 16, cursor: "pointer", flexShrink: 0, minWidth: 46 }}>+</button>
      </div>
      <KeywordChips keywords={keywords} color={color} onRemove={onRemove} />
    </div>
  );
}
