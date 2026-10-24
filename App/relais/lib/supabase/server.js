// Client Supabase de l'utilisateur connecté (la RLS s'applique).
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (liste) => {
        try { liste.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* Server Component */ }
      },
    },
  });
}

/** Utilisateur connecté + son appartenance (entreprise, rôle). */
export async function getSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, membre: null };
  const { data: membre } = await supabase
    .from("membres").select("id, role, prenom, entreprise_id, entreprises(nom)")
    .eq("user_id", user.id).maybeSingle();
  return { supabase, user, membre };
}
