import { C } from "../lib/theme";
import { ProfileEditor } from "./ProfileEditor";

export function Sidebar({ profiles, activeId, editingProfile, setEditingProfile, onClose, onSaveProfile, onDeleteProfile, onCreateNew }) {
  return (
    <aside className="gz-aside">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 14px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: "inherit", zIndex: 1 }}>
        <h2 style={{ margin: 0, fontFamily: "Playfair Display, serif", fontSize: 15, color: C.green, textTransform: "uppercase", letterSpacing: 1.2 }}>
          {editingProfile ? (editingProfile._isNew ? "Nuovo profilo" : "Modifica") : "Profili"}
        </h2>
        <button onClick={onClose}
          style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: C.muted, cursor: "pointer", fontSize: 17, padding: "4px 11px", minWidth: 38, minHeight: 38 }}>✕</button>
      </div>

      <div style={{ padding: "0 18px 24px" }}>
        {editingProfile ? (
          <div style={{ paddingTop: 16 }}>
            <ProfileEditor
              profile={editingProfile}
              onSave={onSaveProfile}
              onDelete={onDeleteProfile}
              onCancel={() => setEditingProfile(null)}
            />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 9, paddingTop: 14 }}>
            {profiles.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: C.bg, borderRadius: 8, border: `1px solid ${p.id === activeId ? C.green : C.border}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "Crimson Pro, serif", fontSize: 16, color: C.text }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
                    {p.feeds?.length ? `${p.feeds.length} feed` : "Nessun feed"}
                    {p.interests?.length > 0 && <span style={{ color: C.green }}> · ★{p.interests.length}</span>}
                    {p.avoids?.length > 0 && <span style={{ color: C.danger }}> · ✕{p.avoids.length}</span>}
                  </div>
                </div>
                <button onClick={() => setEditingProfile(p)}
                  style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: C.muted, cursor: "pointer", fontSize: 14, padding: "5px 11px", minHeight: 34, fontFamily: "Crimson Pro, serif", flexShrink: 0 }}>Modifica</button>
              </div>
            ))}
            <button onClick={onCreateNew}
              style={{ marginTop: 4, padding: "13px", background: "transparent", border: `1px dashed ${C.border}`, borderRadius: 8, color: C.muted, fontFamily: "Crimson Pro, serif", fontSize: 16, cursor: "pointer", minHeight: 48 }}>+ Aggiungi profilo</button>
          </div>
        )}
      </div>
    </aside>
  );
}
