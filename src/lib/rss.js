export function parseFeed(xmlText, feedUrl) {
  const doc = new DOMParser().parseFromString(xmlText, "text/xml");
  if (doc.querySelector("parsererror")) throw new Error("Feed XML non valido");

  const isAtom = !!doc.querySelector("feed");
  const sourceName =
    doc.querySelector(isAtom ? "feed > title" : "channel > title")?.textContent?.trim() ||
    new URL(feedUrl).hostname.replace("www.", "");

  const entries = [...doc.querySelectorAll(isAtom ? "feed > entry" : "channel > item")];

  return entries.map(e => {
    const txt = (...sels) => { for (const s of sels) { const v = e.querySelector(s)?.textContent?.trim(); if (v) return v; } return ""; };

    const rawDesc = isAtom ? txt("content", "summary") : txt("description", "content\\:encoded");
    const div = document.createElement("div");
    div.innerHTML = rawDesc;
    const description = (div.textContent || "").replace(/\s+/g, " ").trim().slice(0, 280);

    let url = "";
    if (isAtom) url = e.querySelector("link[rel='alternate']")?.getAttribute("href") || e.querySelector("link:not([rel='enclosure'])")?.getAttribute("href") || txt("link");
    else url = txt("link");

    let image = e.querySelector("media\\:content")?.getAttribute("url") || e.querySelector("media\\:thumbnail")?.getAttribute("url") || null;
    if (!image) { const enc = e.querySelector("enclosure"); if (enc?.getAttribute("type")?.startsWith("image")) image = enc.getAttribute("url"); }
    if (!image) { const m = rawDesc.match(/<img[^>]+src=["']([^"']+)["']/i); if (m) image = m[1]; }

    return {
      title: txt("title"),
      url,
      publishedAt: isAtom ? txt("published", "updated") : txt("pubDate", "dc\\:date"),
      description,
      image,
      source: { name: sourceName },
    };
  });
}
