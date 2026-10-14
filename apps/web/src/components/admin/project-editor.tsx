'use client';

import {
  type CategoryDto,
  IMAGE_MAX_BYTES,
  type PhotoDto,
  type ProjectDetailDto,
  type ProjectInput,
  type ServiceDto,
  slugify,
  type TestimonialDto,
} from '@mf/shared';
import { ArrowLeft, Eye, Star, Trash2, Upload } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { SITE_URL } from '@/lib/config';
import { cn } from '@/lib/utils';
import { AdminCard, FormField, SwitchRow } from './admin-ui';
import { ConfirmButton } from './confirm-button';
import { useMutation, useSortable } from './hooks';

type Form = Required<{ [K in keyof ProjectInput]: NonNullable<ProjectInput[K]> }>;

const toForm = (p: ProjectDetailDto | null, categories: CategoryDto[]): Form => ({
  title: p?.title ?? '',
  slug: p?.slug ?? '',
  summary: p?.summary ?? '',
  client: p?.client ?? '',
  date: p?.date ?? '',
  location: p?.location ?? '',
  delivery: p?.delivery ?? '',
  team: p?.team ?? '',
  intro: p?.intro ?? '',
  challenge: p?.challenge ?? '',
  approach: p?.approach ?? '',
  result: p?.result ?? '',
  categoryId: p?.category.id ?? categories[0]?.id ?? '',
  serviceId: p?.service?.id ?? '',
  testimonialId: p?.testimonial?.id ?? '',
  featured: p?.featured ?? false,
});

const nativeSelect = 'field h-11.5 py-0 text-[15px]';

export function ProjectEditor({
  project,
  categories,
  services,
  testimonials,
}: {
  project: ProjectDetailDto | null;
  categories: CategoryDto[];
  services: ServiceDto[];
  testimonials: TestimonialDto[];
}) {
  const router = useRouter();
  const { run, attempt, busy } = useMutation();
  const [form, setForm] = useState<Form>(() => toForm(project, categories));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const isNew = !project;
  const published = project?.status === 'PUBLISHED';

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };

  const text = (key: keyof Form) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(key, e.target.value as never),
    'aria-invalid': !!errors[key] || undefined,
  });

  /** Salva os campos; `then` publica ou volta para rascunho. */
  const save = async (then: 'draft' | 'publish' | null) => {
    setErrors({});
    try {
      const body = { ...form, slug: form.slug || null, serviceId: form.serviceId || null, testimonialId: form.testimonialId || null };
      if (isNew) {
        const created = await run(() => api<ProjectDetailDto>('/projects', { method: 'POST', json: body }), 'Projeto criado • agora envie as fotos da galeria');
        setDirty(false);
        if (created) router.replace(`/painel/portfolio/${created.id}`);
        return;
      }
      await run(async () => {
        await api(`/projects/${project.id}`, { method: 'PUT', json: body });
        if (then === 'publish') await api(`/projects/${project.id}/publish`, { method: 'POST' });
        if (then === 'draft' && published) await api(`/projects/${project.id}/unpublish`, { method: 'POST' });
      }, then === 'publish' ? 'Projeto publicado • já está no seu portfólio' : then === 'draft' ? 'Rascunho salvo • não aparece no site' : 'Alterações salvas');
      setDirty(false);
    } catch (e) {
      if (e instanceof ApiError) setErrors(e.fieldErrors());
    }
  };

  const photoUrlPreview = `${SITE_URL.replace(/^https?:\/\//, '')}/portfolio/${form.slug || slugify(form.title) || 'endereco'}`;

  return (
    <div className="flex flex-col">
      <header className="z-20 border-b border-line bg-ink-2 md:sticky md:top-0">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-10">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon" className="size-11">
              <Link href="/painel/portfolio" aria-label="Voltar ao portfólio no painel">
                <ArrowLeft className="size-[18px]" strokeWidth={1.5} />
              </Link>
            </Button>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold tracking-label text-fog uppercase">
                Portfólio / {isNew ? 'Novo projeto' : 'Editar projeto'}
              </span>
              <span className="flex items-center gap-3 text-xl font-extrabold">
                {form.title || 'Sem título'}
                {!isNew && <Badge variant={published ? 'default' : 'outline'}>{published ? 'Publicado' : 'Rascunho'}</Badge>}
              </span>
            </div>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:gap-3 max-sm:[&>*]:flex-1">
            {!isNew && (
              <Button asChild variant="outline">
                <Link href={`/painel/portfolio/${project.id}/previa`} target="_blank">
                  <Eye className="size-4" strokeWidth={1.5} aria-hidden />
                  <span className="max-sm:sr-only">Pré-visualizar</span>
                </Link>
              </Button>
            )}
            {isNew ? (
              <Button disabled={busy} onClick={() => void save(null)}>Criar projeto</Button>
            ) : (
              <>
                <Button variant="outline" disabled={busy} onClick={() => void save('draft')}>Salvar rascunho</Button>
                <Button disabled={busy} onClick={() => void save('publish')}>
                  {published ? (<><span className="sm:hidden">Salvar</span><span className="max-sm:hidden">Salvar e manter publicado</span></>) : 'Publicar'}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-start gap-6 px-4 pt-8 pb-16 sm:px-10">
        {/* COLUNA PRINCIPAL */}
        <div className="flex min-w-0 flex-[999_1_600px] flex-col gap-6">
          <AdminCard title="Informações do projeto">
            <FormField id="p-titulo" label="Título" error={errors.title}>
              <Input id="p-titulo" {...text('title')} />
            </FormField>
            <FormField id="p-resumo" label="Resumo (aparece no card do portfólio)" error={errors.summary}>
              <Input id="p-resumo" placeholder="Uma ou duas frases sobre o projeto" {...text('summary')} />
            </FormField>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
              <FormField id="p-cliente" label="Cliente"><Input id="p-cliente" placeholder="Nome do cliente" {...text('client')} /></FormField>
              <FormField id="p-data" label="Data"><Input id="p-data" type="date" className="[color-scheme:dark]" {...text('date')} /></FormField>
              <FormField id="p-local" label="Local"><Input id="p-local" placeholder="Local – Cidade – UF" {...text('location')} /></FormField>
              <FormField id="p-entrega" label="Entrega"><Input id="p-entrega" placeholder="Nº de fotos, galeria, álbum" {...text('delivery')} /></FormField>
              <FormField id="p-equipe" label="Equipe" className="col-span-full"><Input id="p-equipe" placeholder="Fotografia, segundo fotógrafo, vídeo" {...text('team')} /></FormField>
            </div>
          </AdminCard>

          <AdminCard title="Descrição do projeto" description="É o texto que o visitante lê ao abrir o projeto. Deixe em branco o que não quiser mostrar.">
            <FormField id="p-intro" label="Introdução"><Textarea id="p-intro" rows={3} placeholder="Quem é o cliente, qual era o momento e por que ele te escolheu." {...text('intro')} /></FormField>
            <FormField id="p-desafio" label="01 — O desafio"><Textarea id="p-desafio" rows={3} placeholder="O que precisava ser resolvido." {...text('challenge')} /></FormField>
            <FormField id="p-abordagem" label="02 — A abordagem"><Textarea id="p-abordagem" rows={3} placeholder="Como você planejou e conduziu." {...text('approach')} /></FormField>
            <FormField id="p-resultado" label="03 — O resultado"><Textarea id="p-resultado" rows={3} placeholder="O que foi entregue e como o cliente usou." {...text('result')} /></FormField>
          </AdminCard>

          {project ? (
            <GalleryCard project={project} />
          ) : (
            <AdminCard title="Galeria">
              <p className="text-sm text-fog">Crie o projeto para começar a enviar as fotos.</p>
            </AdminCard>
          )}
        </div>

        {/* LATERAL */}
        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-6">
          <AdminCard title="Publicação">
            <SwitchRow title="Destaque na página inicial" help="Aparece entre os primeiros">
              <Switch checked={form.featured} onCheckedChange={(v) => set('featured', v)} aria-label="Destacar na página inicial" />
            </SwitchRow>
            <FormField id="p-url" label="Endereço da página" error={errors.slug} help={<span className="[overflow-wrap:anywhere]">{photoUrlPreview}</span>}>
              <Input id="p-url" className="text-[13px]" placeholder={slugify(form.title)} value={form.slug} onChange={(e) => set('slug', slugify(e.target.value))} />
            </FormField>
          </AdminCard>

          <AdminCard title="Organização">
            <FormField id="p-cat" label="Categoria (filtro do site)" error={errors.categoryId} help={<Link href="/painel/categorias" className="underline-offset-2 hover:underline">Gerenciar categorias</Link>}>
              <select id="p-cat" className={nativeSelect} value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FormField>
            <FormField id="p-serv" label="Serviço vinculado">
              <select id="p-serv" className={nativeSelect} value={form.serviceId} onChange={(e) => set('serviceId', e.target.value)}>
                <option value="">Nenhum</option>
                {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </FormField>
            <FormField id="p-dep" label="Depoimento exibido no projeto">
              <select id="p-dep" className={nativeSelect} value={form.testimonialId} onChange={(e) => set('testimonialId', e.target.value)}>
                <option value="">Nenhum</option>
                {testimonials
                  .filter((t) => !t.project || t.project.id === project?.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>{t.clientName} — {t.rating} estrelas</option>
                  ))}
              </select>
            </FormField>
          </AdminCard>

          {project && (
            <AdminCard title="Capa">
              {project.coverUrl ? (
                <Image src={project.coverUrl} alt="Capa atual" width={600} height={300} className="aspect-[16/8] w-full rounded-sm border-2 border-chalk object-cover" />
              ) : (
                <div className="flex aspect-[16/8] items-center justify-center rounded-sm border border-line bg-ink-3 text-[11px] font-semibold tracking-label text-fog uppercase">Sem fotos</div>
              )}
              <span className="text-xs leading-[18px] text-fog">A capa aparece no card do portfólio e no topo da página do projeto. Para trocar, toque na estrela de outra foto.</span>
            </AdminCard>
          )}

          {project && (
            <ConfirmButton
              trigger={<Button variant="outline">Excluir projeto</Button>}
              title="Excluir este projeto?"
              description="O projeto e todas as fotos da galeria serão apagados. Isso não pode ser desfeito."
              onConfirm={async () => {
                const ok = await attempt(() => api(`/projects/${project.id}`, { method: 'DELETE' }).then(() => true), 'Projeto excluído');
                if (ok) router.replace('/painel/portfolio');
              }}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

/** Galeria: upload múltiplo (arrastar ou clicar), capa, legenda, reordenação e exclusão. */
function GalleryCard({ project }: { project: ProjectDetailDto }) {
  const { run, attempt } = useMutation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [over, setOver] = useState(false);
  const sortable = useSortable(project.photos, (ids) =>
    void attempt(() => api(`/projects/${project.id}/photos/order`, { method: 'PUT', json: { ids } }), 'Ordem das fotos salva'),
  );

  const upload = async (files: File[]) => {
    const valid = files.filter((f) => /^image\/(jpeg|webp|png)$/.test(f.type) && f.size <= IMAGE_MAX_BYTES);
    if (valid.length < files.length) toast.error('Alguns arquivos foram ignorados (use JPG/WEBP/PNG de até 20 MB).');
    if (!valid.length) return;
    setUploading({ done: 0, total: valid.length });
    try {
      // Envia em lotes de 4 para mostrar progresso e não estourar limites do servidor.
      for (let i = 0; i < valid.length; i += 4) {
        const form = new FormData();
        valid.slice(i, i + 4).forEach((f) => form.append('files', f));
        await run(() => api(`/projects/${project.id}/photos`, { method: 'POST', form }));
        setUploading({ done: Math.min(i + 4, valid.length), total: valid.length });
      }
      toast.success(valid.length === 1 ? 'Foto enviada' : `${valid.length} fotos enviadas`);
    } catch {
      /* toast já exibido */
    } finally {
      setUploading(null);
    }
  };

  return (
    <AdminCard title="Galeria" description={`${project.photos.length} fotos • arraste para reordenar • a foto marcada com a estrela vira a capa`}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setOver(true); } }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { if (!e.dataTransfer.files.length) return; e.preventDefault(); setOver(false); void upload([...e.dataTransfer.files]); }}
        disabled={!!uploading}
        className={cn(
          'flex min-h-[140px] w-full flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed bg-ink p-4 transition-colors hover:border-chalk',
          over ? 'border-chalk' : 'border-steel',
        )}
      >
        <Upload className="size-7" strokeWidth={1.5} aria-hidden />
        <span className="text-sm font-bold tracking-[0.04em]">
          {uploading ? `Enviando ${uploading.done} de ${uploading.total}…` : 'Arraste as fotos aqui ou clique para enviar'}
        </span>
        <span className="text-xs text-fog">JPG, WEBP ou PNG • até 20 MB cada • o site gera as versões otimizadas</span>
      </button>
      <input ref={inputRef} type="file" accept="image/jpeg,image/webp,image/png" multiple hidden onChange={(e) => { void upload([...(e.target.files ?? [])]); e.target.value = ''; }} />

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] sm:gap-4">
        {sortable.list.map((photo, i) => (
          <PhotoTile key={photo.id} photo={photo} index={i} projectId={project.id} isCover={photo.id === (project.coverPhotoId ?? project.photos[0]?.id)} dragProps={sortable.itemProps(photo.id)} />
        ))}
      </ul>
    </AdminCard>
  );
}

function PhotoTile({
  photo,
  index,
  projectId,
  isCover,
  dragProps,
}: {
  photo: PhotoDto;
  index: number;
  projectId: string;
  isCover: boolean;
  dragProps: ReturnType<ReturnType<typeof useSortable>['itemProps']>;
}) {
  const { attempt } = useMutation();
  const [caption, setCaption] = useState(photo.caption ?? '');
  const n = String(index + 1).padStart(2, '0');

  const saveCaption = () => {
    if ((photo.caption ?? '') === caption) return;
    void attempt(() => api(`/projects/${projectId}/photos/${photo.id}`, { method: 'PATCH', json: { caption } }), 'Legenda salva');
  };

  return (
    <li {...dragProps} className="flex cursor-grab flex-col gap-2 data-[dragging]:opacity-40">
      <div className={cn('relative aspect-[4/3] overflow-hidden rounded-sm border bg-ink-3', isCover ? 'border-2 border-chalk' : 'border-line')}>
        <Image src={photo.thumbUrl} alt={`Foto ${n}`} fill sizes="240px" className="pointer-events-none object-cover" />
        {isCover && <Badge className="absolute top-2 left-2">Capa</Badge>}
        <span className="absolute top-2 right-2 flex gap-1.5">
          <Button
            size="icon"
            variant="ghost"
            aria-label={`Usar foto ${n} como capa`}
            aria-pressed={isCover}
            onClick={() => void attempt(() => api(`/projects/${projectId}/photos/${photo.id}/cover`, { method: 'POST' }), 'Capa atualizada')}
          >
            <Star className={cn('size-4', isCover && 'fill-current')} strokeWidth={1.5} />
          </Button>
          <ConfirmButton
            trigger={<Button size="icon" variant="ghost" aria-label={`Remover foto ${n}`}><Trash2 className="size-4" strokeWidth={1.5} /></Button>}
            title={`Remover a foto ${n}?`}
            description="O arquivo é apagado do armazenamento."
            confirmLabel="Remover"
            onConfirm={() => attempt(() => api(`/projects/${projectId}/photos/${photo.id}`, { method: 'DELETE' }), 'Foto removida')}
          />
        </span>
      </div>
      <label htmlFor={`leg-${photo.id}`} className="sr-only">Legenda da foto {n}</label>
      <Input id={`leg-${photo.id}`} value={caption} onChange={(e) => setCaption(e.target.value)} onBlur={saveCaption} placeholder="Legenda (opcional)" className="h-9 text-[13px]" />
    </li>
  );
}
