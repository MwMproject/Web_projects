// Rafraîchit la session à chaque requête et protège les pages.
// Un ouvrier qui ouvre une page "bureau" est renvoyé vers /terrain.
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PAGES_BUREAU = ["/tableau-de-bord", "/chantiers", "/devis", "/factures", "/clients", "/articles", "/stock", "/equipe", "/parametres"];

export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  if (!user && !path.startsWith("/connexion")) {
    return NextResponse.redirect(new URL("/connexion", request.url));
  }

  if (user && PAGES_BUREAU.some((p) => path.startsWith(p))) {
    const { data: membre } = await supabase
      .from("membres").select("role").eq("user_id", user.id).eq("actif", true).maybeSingle();
    if (membre?.role === "ouvrier") {
      return NextResponse.redirect(new URL("/terrain", request.url));
    }
  }
  // NB : la vraie protection des données reste la RLS dans la base.
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/).*)"],
};
