import { CameraIcon } from '@/components/icons';
import { cn } from '@/lib/utils';

/** Espaço reservado quando um projeto ainda não tem foto. */
export function PhotoPlaceholder({ label = 'Foto de capa', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 border border-line bg-ink-3 text-steel', className)}>
      <CameraIcon size={40} />
      <span className="text-[11px] font-semibold tracking-label text-fog uppercase">[{label}]</span>
    </div>
  );
}
