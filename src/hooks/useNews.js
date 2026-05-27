import { useState, useCallback } from "react";
import { CORS_PROXY } from "../config";
import { parseFeed } from "../lib/rss";
import { deduplicate } from "../lib/articles";

export function useNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetchedAt, setFetchedAt] = useState(null);

  const fetchNews = useCallback(async (profile) => {
    if (!profile.feeds?.length) { setError("Aggiungi almeno un feed RSS al profilo."); return; }
    setLoading(true); setError(""); setNews([]);
    try {
      const results = await Promise.allSettled(
        profile.feeds.map(async (feedUrl) => {
          const res = await fetch(CORS_PROXY + encodeURIComponent(feedUrl));
          if (!res.ok) throw new Error("Feed non raggiungibile");
          const text = await res.text();
          return parseFeed(text, feedUrl);
        })
      );

      const articles = deduplicate(
        results
          .filter(r => r.status === "fulfilled")
          .flatMap(r => r.value)
          .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      );

      const failedHosts = results
        .map((r, i) => r.status === "rejected" ? profile.feeds[i] : null)
        .filter(Boolean)
        .map(u => { try { return new URL(u).hostname.replace("www.", ""); } catch { return u; } });

      setNews(articles);
      setFetchedAt(new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }));

      if (articles.length === 0)
        setError(failedHosts.length ? `Feed non raggiungibili: ${failedHosts.join(", ")}` : "Nessuna notizia trovata.");
      else if (failedHosts.length)
        setError(`Feed non caricati: ${failedHosts.join(", ")}`);
    } catch (e) {
      setError(e.message || "Errore di rete.");
    } finally {
      setLoading(false);
    }
  }, []);

  const clearNews = useCallback(() => {
    setNews([]);
    setError("");
    setFetchedAt(null);
  }, []);

  return { news, loading, error, fetchedAt, fetchNews, clearNews };
}
