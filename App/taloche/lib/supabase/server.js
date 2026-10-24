// Client Supabase pour les Server Components, Server Actions et routes API.
// Il lit la session dans les cookies : la RLS s'applique avec l'utilisateur connecté.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Appelé depuis un Server Component : le middleware rafraîchit la session.
          }
        },
      },
    }
  );
}

// Renvoie l'utilisateur connecté et son appartenance (entreprise + rôle).
export async function getSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, membre: null };
  const { data: membre } = await supabase
    .from("membres")
    .select("id, role, prenom, nom, entreprise_id, entreprises(nom)")
    .eq("user_id", user.id)
    .eq("actif", true)
    .maybeSingle();
  return { supabase, user, membre };
}
