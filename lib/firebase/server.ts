import { cookies } from "next/headers";
import { authAdmin } from "./admin";
export { adminDB } from "./store";
import { adminDB } from "./store";
export async function currentUser() {
  const token = (await cookies()).get("__session")?.value;
  if (!token) throw Error("AUTH: Sign in to continue.");
  try {
    const user = await authAdmin().verifySessionCookie(token, true);
    return { id: user.uid, email: user.email };
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("CONFIG:")) throw e;
    throw Error("AUTH: Your session expired. Sign in again.");
  }
}
export async function ownBusiness(id: string, userId: string) {
  const { data, error } = await adminDB()
    .from("businesses")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  if (error || !data) throw Error("NOT_FOUND: Business not found.");
  return data;
}
export function checked<T>(result: { data: T; error: unknown }) {
  if (result.error) {
    if ((result.error as { code?: number }).code === 8)
      throw Error("LIMIT: Firebase database quota is exhausted. Your sign-in is valid, but workspace sync is temporarily unavailable. Retry after the quota resets or increase the Firebase quota.");
    if (
      result.error instanceof Error &&
      /^(CONFIG|LIMIT|AUTH|INPUT):/.test(result.error.message)
    )
      throw result.error;
    throw Error(
      "DATABASE: Unable to save or read this workspace. Check Firebase configuration and try again.",
    );
  }
  return result.data as NonNullable<T>;
}
