// Retour de Google / Microsoft après autorisation : enregistre la boîte et ses jetons chiffrés.
import { NextResponse } from "next/server";
import { verifierSignature } from "@/lib/crypto";
import { echangerCode, adresseDuCompte } from "@/lib/mail/oauth";
import { adminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/supabase/server";
import { enregistrerSecret, journaliser } from "@/lib/pipeline";

export async function GET(request, { params }) {
  const { fournisseur } = await params;
  const url = new URL(request.url);
  const retour = (msg) => NextResponse.redirect(new URL(`/reglages/boites?${msg}`, request.url));

  const state = verifierSignature(url.searchParams.get("state"));
  const nonce = request.cookies.get("relais_oauth")?.value;
  if (!state || state.f !== fournisseur || !nonce || state.n !== nonce) return retour("erreur=lien-expire");
  if (url.searchParams.get("error")) return retour("erreur=autorisation-refusee");

  const { user, membre } = await getSession();
  if (!user || user.id !== state.u || membre?.entreprise_id !== state.e || membre.role !== "admin") return retour("erreur=session");

  try {
    const jetons = await echangerCode(fournisseur, url.searchParams.get("code"));
    if (!jetons.refresh_token) return retour("erreur=pas-de-jeton-longue-duree");
    const email = await adresseDuCompte(fournisseur, jetons.access_token);
    const db = adminClient();
    const { data: compte, error } = await db.from("comptes_mail")
      .upsert({ entreprise_id: state.e, fournisseur, email, libelle: email, statut: "actif", derniere_erreur: null },
        { onConflict: "entreprise_id,email" })
      .select("*").single();
    if (error) throw error;
    await enregistrerSecret(db, compte, jetons);
    await journaliser(db, state.e, "compte.ajoute", email, { fournisseur }, user.id);
    const rep = retour("ajoute=1");
    rep.cookies.delete({ name: "relais_oauth", path: "/api/oauth" });
    return rep;
  } catch {
    return retour("erreur=connexion-impossible");
  }
}
