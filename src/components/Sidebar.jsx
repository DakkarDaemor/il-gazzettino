import { useState, useEffect } from "react";
import { C } from "../lib/theme";
import { ProfileEditor } from "./ProfileEditor";

const btn = (style) => ({
  border: "none", borderRadius: 6, padding: "12px 15px", fontFamily: "Playfair Display, serif",
  fontSize: 15, fontWeight: 700, cursor: "pointer", minHeight: 46, ...style,
});

function mkEditForm(profile) {
  return {
    ...profile,
    feeds: [...(profile.feeds || [])],
    interests: [...(profile.interests || [])],
    avoids: [...(profile.avoids || [])],
  };
}

export function Sidebar({ profiles, activeId, activeProfile, editingProfile, setEditingProfile, onClose, onSaveProfile, onDeleteProfile, onCreateNew, onSetActive }) {
  const [form, setForm] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (editingProfile) {
      setForm(mkEditForm(editingProfile));
      setConfirmDelete(false);
    }
  }, [editingProfile]);

  const isNew = !!editingProfile?._isNew;
  const canSave = form?.name?.trim();

  return (
    <aside className="gz-aside" style={editingProfile ? { display: "flex", flexDirection: "column" } : {}}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 12px 6px", borderBottom: `1px solid ${C.border}`, background: "inherit", zIndex: 1, flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontFamily: "Playfair Display, serif", fontSize: 15, color: C.green, textTransform: "uppercase", letterSpacing: 1.2 }}>
          {editingProfile ? (isNew ? "Nuovo profilo" : "Modifica") : "Profili"}
        </h2>
        <button onClick={onClose}
          style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: C.muted, cursor: "pointer", fontSize: 17, padding: "4px 11px", minWidth: 38, minHeight: 38 }}>✕</button>
      </div>

      {editingProfile && form ? (
        <>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 8px" }}>
            <ProfileEditor form={form} onChange={setForm} />
          </div>

          <div style={{ flexShrink: 0, borderTop: `1px solid ${C.border}`, padding: "12px 18px", background: C.card }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => onSaveProfile(form)} disabled={!canSave}
                style={btn({ flex: 1, background: canSave ? C.green : "#222", color: canSave ? "#000" : C.muted, cursor: canSave ? "pointer" : "not-allowed" })}>
                Salva
              </button>
              <button onClick={() => setEditingProfile(null)}
                style={btn({ flex: 1, background: "transparent", border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer", fontWeight: 400, fontFamily: "Crimson Pro, serif" })}>
                Annulla
              </button>
              {!isNew && !confirmDelete && (
                <button onClick={() => setConfirmDelete(true)}
                  style={btn({ background: "transparent", border: `1px solid ${C.danger}55`, color: C.danger, cursor: "pointer", minWidth: 46 })}>✕</button>
              )}
              {!isNew && confirmDelete && (
                <button onClick={() => onDeleteProfile(editingProfile.id)}
                  style={btn({ background: "#1a0606", border: `1px solid ${C.danger}`, color: C.danger, cursor: "pointer" })}>Sicuro?</button>
              )}
            </div>
            {confirmDelete && (
              <button onClick={() => setConfirmDelete(false)}
                style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 14, fontFamily: "Crimson Pro, serif", textAlign: "left", padding: "6px 0 0" }}>← annulla eliminazione</button>
            )}
          </div>
        </>
      ) : (
        <div style={{ padding: "0 18px 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, paddingTop: 14 }}>
            {profiles.map(p => (
              <div key={p.id}
                onClick={() => { onSetActive(p.id); onClose(); }}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: C.bg, borderRadius: 8, border: `1px solid ${p.id === activeId ? C.green : C.border}`, cursor: "pointer" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "Crimson Pro, serif", fontSize: 16, color: p.id === activeId ? C.green : C.text }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
                    {p.feeds?.length ? `${p.feeds.length} feed` : "Nessun feed"}
                    {p.interests?.length > 0 && <span style={{ color: C.green }}> · ★{p.interests.length}</span>}
                    {p.avoids?.length > 0 && <span style={{ color: C.danger }}> · ✕{p.avoids.length}</span>}
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setEditingProfile(p); }}
                  style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: C.muted, cursor: "pointer", fontSize: 14, padding: "5px 11px", minHeight: 34, fontFamily: "Crimson Pro, serif", flexShrink: 0 }}>
                  Modifica
                </button>
              </div>
            ))}
            <button onClick={onCreateNew}
              style={{ marginTop: 4, padding: "13px", background: "transparent", border: `1px dashed ${C.border}`, borderRadius: 8, color: C.muted, fontFamily: "Crimson Pro, serif", fontSize: 16, cursor: "pointer", minHeight: 48 }}>
              + Aggiungi profilo
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
