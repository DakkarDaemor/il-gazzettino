import { useState, useEffect, useCallback } from "react";
import { storage } from "../lib/storage";

export const mkProfile = (name = "Nuovo gazzettino") => ({
  id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
  name,
  feeds: [],
  interests: [],
  avoids: [],
});

export function useProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const p = await storage.get("gz_profiles");
        if (p) {
          const parsed = JSON.parse(p.value);
          const migrated = parsed.map(pr => ({
            id: pr.id, name: pr.name,
            feeds: pr.feeds || [],
            interests: pr.interests || [],
            avoids: pr.avoids || [],
          }));
          setProfiles(migrated);
          if (migrated.length > 0) setActiveId(migrated[0].id);
        }
      } catch {}
      setInitialized(true);
    })();
  }, []);

  const persist = useCallback(async (next) => {
    await storage.set("gz_profiles", JSON.stringify(next));
  }, []);

  const saveProfile = useCallback(async (profile) => {
    const clean = { ...profile };
    delete clean._isNew;
    const exists = profiles.some(p => p.id === clean.id);
    const next = exists ? profiles.map(p => p.id === clean.id ? clean : p) : [...profiles, clean];
    setProfiles(next);
    await persist(next);
    if (!exists) setActiveId(clean.id);
  }, [profiles, persist]);

  const deleteProfile = useCallback(async (id) => {
    const next = profiles.filter(p => p.id !== id);
    setProfiles(next);
    await persist(next);
    if (activeId === id) setActiveId(next[0]?.id || null);
  }, [profiles, activeId, persist]);

  const activeProfile = profiles.find(p => p.id === activeId);

  return { profiles, activeId, setActiveId, initialized, saveProfile, deleteProfile, activeProfile };
}
