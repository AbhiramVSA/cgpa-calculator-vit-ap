/**
 * The encoded grade payload, read from the URL fragment first.
 *
 * A fragment (`#data=...`) never leaves the browser: it isn't sent in the
 * request, so it can't end up in server or CDN logs. The query string
 * (`?data=...`) still works for links made by older app versions, but the
 * caller should move it into the fragment as soon as it has read it.
 */
export function payloadFromUrl(url: URL): { encoded: string | null; fromQuery: boolean } {
  const fragment = new URLSearchParams(url.hash.replace(/^#/, ""))
  const fromFragment = fragment.get("data") || fragment.get("payload")
  if (fromFragment) return { encoded: fromFragment, fromQuery: false }

  const fromQuery = url.searchParams.get("data") || url.searchParams.get("payload")
  return { encoded: fromQuery, fromQuery: !!fromQuery }
}

/** The path for a report whose payload rides in the fragment. */
export function reportPath(encoded: string): string {
  return `/report#data=${encodeURIComponent(encoded)}`
}
