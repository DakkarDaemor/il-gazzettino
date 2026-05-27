export function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (isNaN(h)) return "";
  if (h > 48) return `${Math.floor(h / 24)}g fa`;
  if (h >= 1) return `${h}h fa`;
  return `${Math.max(m, 1)}m fa`;
}

export function matchesAny(article, keywords) {
  if (!keywords.length) return false;
  const text = `${article.title} ${article.description}`.toLowerCase();
  return keywords.some(kw => text.includes(kw));
}

function titleWords(title) {
  return new Set(
    title.toLowerCase().replace(/[^\wàèéìòù\s]/g, " ").split(/\s+/).filter(w => w.length > 3)
  );
}

export function deduplicate(articles) {
  const kept = [];
  for (const a of articles) {
    const wa = titleWords(a.title);
    const dupeIdx = kept.findIndex(k => {
      const wk = titleWords(k.title);
      const inter = [...wa].filter(w => wk.has(w)).length;
      const union = new Set([...wa, ...wk]).size;
      return union > 0 && inter / union >= 0.6;
    });
    if (dupeIdx === -1) {
      kept.push(a);
    } else {
      const existing = kept[dupeIdx];
      const aBetter = (!existing.image && a.image) ||
        (a.description.length > existing.description.length && existing.image === a.image);
      if (aBetter) kept[dupeIdx] = a;
    }
  }
  return kept;
}
