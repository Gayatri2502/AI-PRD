import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = ["/dashboard", "/workspace", "/admin"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) { return request.cookies.get(name)?.value; },
      set(name: string, value: string, options: CookieOptions) { request.cookies.set({ name, value, ...options }); response = NextResponse.next({ request }); response.cookies.set({ name, value, ...options }); },
      remove(name: string, options: CookieOptions) { request.cookies.set({ name, value: "", ...options }); response = NextResponse.next({ request }); response.cookies.set({ name, value: "", ...options }); }
    }
  });
  const { data } = await supabase.auth.getUser();
  if (protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix)) && !data.user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
