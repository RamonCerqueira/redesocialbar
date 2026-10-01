const zone = 'America/Bahia';
export function barDayKey(value: string | Date) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
export function barDateLabel(value: string, now = new Date()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data indisponível';
  const day = barDayKey(date);
  const yesterday = new Date(now.getTime() - 24 * 3600000);
  const label = day === barDayKey(now) ? 'Hoje' : day === barDayKey(yesterday) ? 'Ontem' : new Intl.DateTimeFormat('pt-BR', { timeZone: zone, day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  return `${label} às ${new Intl.DateTimeFormat('pt-BR', { timeZone: zone, hour: '2-digit', minute: '2-digit' }).format(date)}`;
}
export function barFullDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Data indisponível' : new Intl.DateTimeFormat('pt-BR', { timeZone: zone, dateStyle: 'long', timeStyle: 'short' }).format(date);
}
