// Lance la connexion Gmail ou Outlook (réservé aux admins de l'entreprise).
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getSession } from "@/lib/supabase/server";
import { signer } from "@/lib/crypto";
import { urlAutorisation } from "@/lib/mail/oauth";

export async function GET(request, { params }) {
  const { fournisseur } = await params;
  if (!["gmail", "microsoft"].includes(fournisseur)) return NextResponse.json({ erreur: "fournisseur inconnu" }, { status: 400 });
  const { user, membre } = await getSession();
  if (!user || membre?.role !== "admin") return NextResponse.redirect(new URL("/connexion", request.url));

  const nonce = randomBytes(16).toString("base64url");
  const state = signer({ e: membre.entreprise_id, u: user.id, f: fournisseur, n: nonce });
  const reponse = NextResponse.redirect(urlAutorisation(fournisseur, state));
  // Le nonce en cookie lie l'autorisation à CE navigateur (protection CSRF)
  reponse.cookies.set("relais_oauth", nonce, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/api/oauth" });
  return reponse;
}
