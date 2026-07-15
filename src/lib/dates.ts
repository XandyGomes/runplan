const BRAZIL_TIME_ZONE = 'America/Sao_Paulo';

/**
 * Data de hoje (YYYY-MM-DD) no fuso do Brasil — não do navegador nem do servidor.
 * `new Date().toISOString().slice(0,10)` usa UTC: às 21h em Franca-SP (UTC-3) já é
 * meia-noite em UTC, então "hoje" virava "amanhã" a partir das 21h. Isso também
 * afetava rotas de servidor na Vercel, que rodam em UTC por padrão.
 */
export function todayISOInBrazil(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BRAZIL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  return `${map.year}-${map.month}-${map.day}`;
}
