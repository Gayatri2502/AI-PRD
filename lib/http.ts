/** Never render a proxy's HTML error as application data. */
export async function readJSON(response: Response) {
  if (!response.headers.get("content-type")?.includes("application/json"))
    throw Error(
      response.status === 401
        ? "Your session has expired. Please sign in again."
        : "The service is temporarily unavailable. Please retry in a moment.",
    );
  let data;
  try {
    data = await response.json();
  } catch {
    throw Error("The service returned an unreadable response. Please retry.");
  }
  if (!response.ok)
    throw Error(
      response.status === 401
        ? "Your session has expired. Please sign in again."
        : data.error || "Unable to complete this request.",
    );
  return data;
}
