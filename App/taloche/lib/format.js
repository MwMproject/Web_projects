// Formats suisses : 1'234.50 CHF, 14.10.2026
const chf = new Intl.NumberFormat("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmtChf = (n) => `${chf.format(Number(n || 0))} CHF`;
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("fr-CH") : "—");
