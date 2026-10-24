// Appelé toutes les 5 minutes par la tâche planifiée :
//   curl -X POST -H "Authorization: Bearer $RELAIS_SECRET_TACHES" https://app.exemple.ch/api/taches/synchro
import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { synchroniserCompte, analyserEnAttente } from "@/lib/pipeline";
import { autorise } from "@/lib/taches";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request) {
  if (!autorise(request)) return NextResponse.json({ erreur: "non autorisé" }, { status: 401 });
  const db = adminClient();
  const { data: comptes, error } = await db.from("comptes_mail").select("*").in("statut", ["actif", "erreur"]);
  if (error) return NextResponse.json({ erreur: "base indisponible" }, { status: 500 });

  let importes = 0;
  for (const compte of comptes) importes += (await synchroniserCompte(db, compte)).importes;
  const { analyses, plafonnees } = await analyserEnAttente(db, { limite: 40 });
  return NextResponse.json({ comptes: comptes.length, importes, analyses, plafonnees: plafonnees.length });
}
