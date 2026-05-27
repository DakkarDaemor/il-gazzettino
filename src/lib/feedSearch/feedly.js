import { CORS_PROXY } from "../../config";

export const feedlyProvider = {
  id: "feedly",
  label: "Feedly",
  async search(query) {
    const url = `https://cloud.feedly.com/v3/search/feeds?query=${encodeURIComponent(query)}&count=12&locale=it`;
    const res = await fetch(CORS_PROXY + encodeURIComponent(url));
    if (!res.ok) throw new Error(`Feedly ${res.status}`);
    const data = await res.json();
    return (data.results || []).map(r => ({
      url: r.feedId.replace(/^feed\//, ""),
      title: r.title || r.website || r.feedId,
      description: r.description || null,
      subscribers: r.subscribers ?? null,
      website: r.website || null,
    }));
  },
};
