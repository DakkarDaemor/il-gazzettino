import { feedlyProvider } from "./feedly";

export const FEED_SEARCH_PROVIDERS = [
  feedlyProvider,
  // aggiungere qui nuovi provider — devono esporre { id, label, search(query) }
];

export async function searchFeeds(query, providerId = FEED_SEARCH_PROVIDERS[0].id) {
  const provider = FEED_SEARCH_PROVIDERS.find(p => p.id === providerId);
  if (!provider) throw new Error(`Provider sconosciuto: ${providerId}`);
  return provider.search(query.trim());
}
