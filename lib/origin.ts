/** Compare the browser Origin to the HTTP authority, not Next's internal bind URL. */
export function sameOrigin(req: Request) {
  try {
    const origin = new URL(req.headers.get("origin") || "");
    const host = req.headers.get("host") || new URL(req.url).host;
    return (
      origin.host === host &&
      (origin.protocol === "https:" ||
        (origin.protocol === "http:" &&
          ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname)))
    );
  } catch {
    return false;
  }
}
