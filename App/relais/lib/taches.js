// Protection des routes appelées par la tâche planifiée (cron).
import { timingSafeEqual } from "node:crypto";

export function autorise(request) {
  const attendu = process.env.RELAIS_SECRET_TACHES;
  if (!attendu || attendu.length < 32) return false;
  const recu = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(attendu), b = Buffer.from(recu);
  return a.length === b.length && timingSafeEqual(a, b);
}
