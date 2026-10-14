/** Gera um slug de URL a partir de um texto em português. */
export function slugify(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' e ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** 150000 -> "1.500" (sem centavos quando redondo) ou "1.500,50". */
export function formatPrice(cents: number): string {
  const value = cents / 100;
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/** "1.500,50" | "1500" -> 150050 */
export function parsePrice(input: string): number | null {
  const clean = input.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.');
  if (!clean) return null;
  const value = Number(clean);
  return Number.isFinite(value) ? Math.round(value * 100) : null;
}

export function initials(name: string): string {
  const words = name.replace(/[[\]]/g, '').trim().split(/\s+/);
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase();
}
