// Rafraîchit la session Supabase et renvoie vers /connexion si besoin.
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIQUES = ["/connexion", "/api/taches", "/api/oauth"];

export async function middleware(request) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (liste) => {
        liste.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        liste.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const chemin = request.nextUrl.pathname;
  if (!user && !PUBLIQUES.some((p) => chemin.startsWith(p))) {
    return NextResponse.redirect(new URL("/connexion", request.url));
  }
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest).*)"] };
