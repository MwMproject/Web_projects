// Client Supabase "serveur" (clé service_role) : contourne la RLS.
// À n'utiliser QUE côté serveur : synchronisation, analyse IA, envoi, secrets.
import { createClient } from "@supabase/supabase-js";

let instance;
export function adminClient() {
  if (!instance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !cle) throw new Error("Configuration Supabase serveur manquante");
    instance = createClient(url, cle, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return instance;
}
