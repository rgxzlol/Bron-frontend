const MAPBOX_PLACEHOLDER = "your_mapbox_token_here";

export function getMapboxToken() {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim();
  if (!token || token === MAPBOX_PLACEHOLDER) return null;
  return token;
}

export function isMapboxConfigured() {
  return getMapboxToken() != null;
}
