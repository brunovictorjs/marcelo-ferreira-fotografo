import { StarIcon } from '@/components/icons';

export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <div role="img" aria-label={`${rating} de 5 estrelas`} className={className ?? 'flex gap-1 text-mist'}>
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon key={i} size={16} filled={i < rating} />
      ))}
    </div>
  );
}
