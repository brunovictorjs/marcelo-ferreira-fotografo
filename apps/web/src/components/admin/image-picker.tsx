'use client';

import { ImageUp } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { errorMessage } from '@/lib/api/errors';
import { cn } from '@/lib/utils';
import { uploadImage } from './hooks';

/**
 * Botão que envia uma imagem para a API e devolve a URL pública.
 * O valor só é gravado quando o formulário dono for salvo.
 */
export function ImagePicker({
  folder,
  accept = 'image/jpeg,image/webp,image/png',
  onUploaded,
  label = 'Trocar foto',
  variant = 'button',
  hint,
  className,
}: {
  folder: 'site' | 'logos' | 'testimonials';
  accept?: string;
  onUploaded: (url: string) => void;
  label?: string;
  variant?: 'button' | 'drop';
  hint?: string;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handle = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const img = await uploadImage(file, folder);
      onUploaded(img.url);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const input = (
    <input ref={ref} type="file" accept={accept} hidden onChange={(e) => { void handle(e.target.files?.[0]); e.target.value = ''; }} />
  );

  if (variant === 'drop') {
    return (
      <>
        <button
          type="button"
          disabled={busy}
          onClick={() => ref.current?.click()}
          className={cn('flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-steel bg-ink p-4 hover:border-chalk', className)}
        >
          <ImageUp className="size-6" strokeWidth={1.5} aria-hidden />
          <span className="text-[13px] font-bold">{busy ? 'Enviando…' : label}</span>
          {hint && <span className="text-xs text-fog">{hint}</span>}
        </button>
        {input}
      </>
    );
  }

  return (
    <>
      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => ref.current?.click()} className={className}>
        {busy ? 'Enviando…' : label}
      </Button>
      {input}
    </>
  );
}
