import { formatPrice, type ServiceDto } from '@mf/shared';

/** "A partir de R$ 1.500" | "R$ 800" | "Sob consulta" */
export function priceLine(s: Pick<ServiceDto, 'priceMode' | 'priceCents'>): string {
  if (s.priceMode === 'ON_REQUEST' || s.priceCents == null) return 'Sob consulta';
  return `${s.priceMode === 'FROM' ? 'A partir de ' : ''}R$ ${formatPrice(s.priceCents)}`;
}
