'use client';

import {
  ABOUT_CHIP_MAX_LENGTH,
  ABOUT_CHIPS_MAX,
  type ClientLogo,
  SEO_DESCRIPTION_MAX,
  SEO_TITLE_MAX,
  type SiteSettings,
  type SiteSettingsDto,
} from '@mf/shared';
import { ChevronLeft, ChevronRight, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { DEFAULT_IMAGES, SITE_URL } from '@/lib/config';
import { AdminCard, FormField, PageHeader } from './admin-ui';
import { move, useMutation } from './hooks';
import { ImagePicker } from './image-picker';

const SECTIONS = [
  ['hero', 'Hero'],
  ['clientes', 'Logos de clientes'],
  ['sobre', 'Sobre mim'],
  ['contato', 'Contato'],
  ['metadados', 'Metadados (SEO)'],
] as const;

const strip = ({ updatedAt: _u, updatedByName: _n, ...s }: SiteSettingsDto): SiteSettings => s;
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));

export function SettingsEditor({ initial }: { initial: SiteSettingsDto }) {
  const { run, busy } = useMutation();
  const [saved, setSaved] = useState<SiteSettings>(() => strip(initial));
  const [s, setS] = useState<SiteSettings>(saved);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dirty = JSON.stringify(s) !== JSON.stringify(saved);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  /** Atualiza um campo de uma seção. */
  const patch = <K extends keyof SiteSettings>(section: K, value: Partial<SiteSettings[K]>) =>
    setS((cur) => ({ ...cur, [section]: { ...cur[section], ...value } }));

  const field = <K extends keyof SiteSettings>(section: K, key: keyof SiteSettings[K] & string) => ({
    value: String(s[section][key] ?? ''),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => patch(section, { [key]: e.target.value } as Partial<SiteSettings[K]>),
    'aria-invalid': !!errors[`${section}.${key}`] || undefined,
  });
  const err = (path: string) => errors[path];

  const save = async () => {
    setErrors({});
    try {
      const result = await run(() => api<SiteSettingsDto>('/site-settings', { method: 'PUT', json: s }), 'Configurações publicadas • o site já está atualizado');
      if (result) {
        const next = strip(result);
        setSaved(next);
        setS(next);
      }
    } catch (e) {
      if (e instanceof ApiError) setErrors(e.fieldErrors());
    }
  };

  const logos = s.clients.logos;
  const setLogos = (next: ClientLogo[]) => patch('clients', { logos: next });
  const chips = s.about.chips;
  const setChips = (next: string[]) => patch('about', { chips: next });

  return (
    <>
      <PageHeader eyebrow="Textos e imagens do site" title="Configurações do site" actions={<Button disabled={busy || !dirty} onClick={() => void save()}>Salvar e publicar</Button>} />
      <nav aria-label="Seções das configurações" className="flex flex-wrap gap-2">
        {SECTIONS.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="inline-flex min-h-9 items-center rounded-full border border-line px-3.5 text-[11px] font-semibold tracking-[0.14em] uppercase hover:border-chalk">
            {label}
          </a>
        ))}
      </nav>

      {/* HERO */}
      <AdminCard id="hero" title="Hero — abertura do site" description="O primeiro bloco que o visitante vê. A prévia ao lado atualiza enquanto você digita.">
        <div className="flex flex-wrap items-start gap-6">
          <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-4">
            <FormField id="h-kicker" label="Texto de apoio acima do título"><Input id="h-kicker" {...field('hero', 'kicker')} /></FormField>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
              <FormField id="h-l1" label="Título — linha 1"><Input id="h-l1" {...field('hero', 'line1')} /></FormField>
              <FormField id="h-l2" label="Linha 2 (cromada)" help="Até 2 palavras."><Input id="h-l2" {...field('hero', 'line2')} /></FormField>
            </div>
            <FormField id="h-script" label="Assinatura manuscrita"><Input id="h-script" {...field('hero', 'script')} /></FormField>
            <FormField id="h-text" label="Mensagem"><Textarea id="h-text" rows={3} {...field('hero', 'text')} /></FormField>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
              <FormField id="h-b1" label="Botão principal"><Input id="h-b1" {...field('hero', 'primaryButton')} /></FormField>
              <FormField id="h-b2" label="Botão secundário"><Input id="h-b2" {...field('hero', 'secondaryButton')} /></FormField>
              <FormField id="h-desde" label="Desde (ano)"><Input id="h-desde" inputMode="numeric" placeholder="Ex.: 2008" {...field('hero', 'since')} /></FormField>
              <FormField id="h-tag" label="Frase curta"><Input id="h-tag" {...field('hero', 'tagline')} /></FormField>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold tracking-label text-fog uppercase">Foto do hero</span>
              <div className="flex items-center gap-4">
                <span className="flex h-18 w-24 flex-none items-end justify-center overflow-hidden rounded-sm border border-line bg-ink">
                  <Image src={s.hero.imageUrl ?? DEFAULT_IMAGES.hero} alt="Foto atual do hero" width={96} height={86} className="h-auto w-full grayscale" />
                </span>
                <ImagePicker folder="site" onUploaded={(url) => patch('hero', { imageUrl: url })} />
                {s.hero.imageUrl && <Button size="sm" variant="ghost" onClick={() => patch('hero', { imageUrl: null })}>Usar a padrão</Button>}
              </div>
              <span className="text-xs text-fog">PNG com fundo transparente. O site aplica o preto e branco.</span>
            </div>
          </div>
          <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-2">
            <span className="text-[11px] font-semibold tracking-label text-fog uppercase">Prévia</span>
            <div className="flex items-end gap-2 overflow-hidden rounded-xl border border-line bg-ink pt-7 pl-7">
              <div className="flex min-w-0 flex-[1_1_60%] flex-col gap-3 pb-7">
                <span className="text-[10px] font-medium tracking-wide-label text-fog uppercase">{s.hero.kicker}</span>
                <span className="text-[32px] leading-[0.95] font-extrabold uppercase">
                  {s.hero.line1}
                  <br />
                  <span className="text-chrome">{s.hero.line2}</span>
                </span>
                <span className="font-script text-2xl text-mist">{s.hero.script}</span>
                <span className="text-[11px] leading-[17px] text-fog">{s.hero.text}</span>
                <span className="flex flex-wrap gap-1.5">
                  <span className="rounded-sm bg-chalk px-2.5 py-2 text-[9px] font-bold tracking-[0.08em] text-ink uppercase">{s.hero.primaryButton}</span>
                  <span className="rounded-sm border border-line-strong px-2.5 py-[7px] text-[9px] font-bold tracking-[0.08em] uppercase">{s.hero.secondaryButton}</span>
                </span>
              </div>
              <Image src={s.hero.imageUrl ?? DEFAULT_IMAGES.hero} alt="" width={300} height={270} className="h-auto w-[40%] flex-none grayscale" />
            </div>
          </div>
        </div>
      </AdminCard>

      {/* CLIENTES */}
      <AdminCard
        id="clientes"
        title="Logos de clientes e publicações"
        description="Faixa logo abaixo do hero. Use as setas para reordenar. As logos aparecem no site nas cores originais."
        aside={
          <span className="flex items-center gap-2.5 text-[13px] text-fog">
            Mostrar a faixa
            <Switch checked={s.clients.visible} onCheckedChange={(v) => patch('clients', { visible: v })} aria-label="Mostrar faixa de clientes no site" />
          </span>
        }
      >
        <FormField id="c-titulo" label="Título da faixa" className="max-w-[420px]"><Input id="c-titulo" {...field('clients', 'title')} /></FormField>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {logos.map((logo, i) => {
            const n = String(i + 1).padStart(2, '0');
            const update = (v: Partial<ClientLogo>) => setLogos(logos.map((l) => (l.id === logo.id ? { ...l, ...v } : l)));
            return (
              <li key={logo.id} className="flex flex-col gap-2.5 rounded-xl border border-line bg-ink p-3.5">
                <div className="flex h-18 items-center justify-center rounded-sm border border-dashed border-line bg-ink-2 p-2">
                  {logo.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- pode ser SVG
                    <img src={logo.imageUrl} alt={logo.name || `Logo ${n}`} className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-[10px] font-semibold tracking-[0.16em] text-fog">[LOGO {n}]</span>
                  )}
                </div>
                <label htmlFor={`logo-nome-${logo.id}`} className="sr-only">Nome do cliente {n}</label>
                <Input id={`logo-nome-${logo.id}`} className="h-9 text-[13px]" placeholder="Nome (texto alternativo)" value={logo.name} onChange={(e) => update({ name: e.target.value })} />
                <label htmlFor={`logo-link-${logo.id}`} className="sr-only">Link do cliente {n}</label>
                <Input id={`logo-link-${logo.id}`} type="url" className="h-9 text-[13px]" placeholder="Link (opcional)" value={logo.url} onChange={(e) => update({ url: e.target.value })} aria-invalid={!!err(`clients.logos.${i}.url`) || undefined} />
                {err(`clients.logos.${i}.url`) && <span className="text-xs text-[#ff8a80]">Link inválido (use https://…)</span>}
                <div className="flex items-center justify-between gap-2">
                  <ImagePicker folder="logos" accept="image/png,image/svg+xml,image/webp" label={logo.imageUrl ? 'Trocar' : 'Enviar'} onUploaded={(url) => update({ imageUrl: url })} />
                  <span className="flex gap-1">
                    <Button size="icon" variant="ghost" aria-label={`Mover logo ${n} para a esquerda`} disabled={i === 0} onClick={() => setLogos(move(logos, i, i - 1))}><ChevronLeft className="size-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label={`Mover logo ${n} para a direita`} disabled={i === logos.length - 1} onClick={() => setLogos(move(logos, i, i + 1))}><ChevronRight className="size-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label={`Remover logo ${n}`} onClick={() => setLogos(logos.filter((l) => l.id !== logo.id))}><Trash2 className="size-4" strokeWidth={1.5} /></Button>
                  </span>
                </div>
              </li>
            );
          })}
          <li>
            <ImagePicker
              variant="drop"
              folder="logos"
              accept="image/png,image/svg+xml,image/webp"
              label="Enviar logo"
              hint="PNG ou SVG com fundo transparente"
              className="h-full min-h-[200px] w-full"
              onUploaded={(url) => setLogos([...logos, { id: newId(), name: '', url: '', imageUrl: url }])}
            />
          </li>
        </ul>
      </AdminCard>

      {/* SOBRE */}
      <AdminCard id="sobre" title="Sobre mim" description="Seção em tema prata no meio da página.">
        <div className="flex flex-wrap items-start gap-6">
          <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-3">
            <span className="text-[11px] font-semibold tracking-label text-fog uppercase">Foto da seção</span>
            <div className="rounded-sm bg-silver px-4 pt-4">
              <Image src={s.about.imageUrl ?? DEFAULT_IMAGES.about} alt="Foto atual: Marcelo fotografando" width={400} height={460} className="h-auto w-full grayscale" />
            </div>
            <ImagePicker folder="site" className="justify-center" onUploaded={(url) => patch('about', { imageUrl: url })} />
            <span className="text-xs text-fog">Use uma foto diferente da do hero. PNG com fundo transparente, mínimo 1200 px.</span>
          </div>
          <div className="flex min-w-0 flex-[999_1_460px] flex-col gap-4">
            <FormField id="s-abertura" label="Abertura"><Input id="s-abertura" placeholder="Uma frase forte sobre quem você é" {...field('about', 'opening')} /></FormField>
            <FormField id="s-texto" label="Texto do Sobre mim" help={`${s.about.text.length} caracteres • linhas em branco viram parágrafos`}>
              <Textarea id="s-texto" rows={7} placeholder="Como começou, sua trajetória e como é ser fotografado por você." {...field('about', 'text')} />
            </FormField>
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold tracking-label text-fog uppercase">Chips (destaques curtos)</span>
              {chips.map((chip, i) => (
                <div key={i} className="flex items-center gap-2">
                  <label htmlFor={`chip-${i}`} className="sr-only">Chip {i + 1}</label>
                  <Input id={`chip-${i}`} maxLength={ABOUT_CHIP_MAX_LENGTH} value={chip} onChange={(e) => setChips(chips.map((c, j) => (j === i ? e.target.value : c)))} />
                  <Button size="icon" variant="ghost" className="size-11" aria-label={`Remover chip ${i + 1}`} onClick={() => setChips(chips.filter((_, j) => j !== i))}><X className="size-4" /></Button>
                </div>
              ))}
              {chips.length < ABOUT_CHIPS_MAX && (
                <Button size="sm" variant="outline" className="self-start" onClick={() => setChips([...chips, 'NOVO DESTAQUE'])}>+ Adicionar chip</Button>
              )}
              <span className="text-xs text-fog">Até {ABOUT_CHIPS_MAX} chips, {ABOUT_CHIP_MAX_LENGTH} caracteres cada.</span>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
              <FormField id="s-assin" label="Assinatura manuscrita"><Input id="s-assin" {...field('about', 'signature')} /></FormField>
              <FormField id="s-desde" label="Fotografando desde"><Input id="s-desde" inputMode="numeric" placeholder="Ano" {...field('about', 'since')} /></FormField>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold tracking-label text-fog uppercase">Prévia</span>
              <div className="flex flex-col gap-3 rounded-xl bg-silver p-6 text-coal">
                <span className="text-[15px] leading-[22px] font-medium">{s.about.opening || '[Abertura do Sobre mim]'}</span>
                <span className="text-[13px] leading-5 whitespace-pre-line text-graphite">{s.about.text || '[Texto do Sobre mim]'}</span>
                <span className="flex flex-wrap gap-2">
                  {chips.filter(Boolean).map((c, i) => (
                    <span key={i} className="rounded-full bg-coal px-3 py-2 text-[10px] font-semibold tracking-[0.12em] text-chalk uppercase">{c}</span>
                  ))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </AdminCard>

      {/* CONTATO */}
      <AdminCard id="contato" title="Contato e recebimento de mensagens" description="Os dados aparecem na seção Contato do site. Cada mensagem do formulário é enviada para o e-mail abaixo e fica salva em Mensagens.">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          <FormField id="ct-email" label="E-mail que recebe as mensagens" error={err('contact.recipientEmail') && 'E-mail inválido'}><Input id="ct-email" type="email" placeholder="voce@email.com" {...field('contact', 'recipientEmail')} /></FormField>
          <FormField id="ct-copia" label="Cópia para (opcional)"><Input id="ct-copia" placeholder="outros e-mails, separados por vírgula" {...field('contact', 'ccEmails')} /></FormField>
          <FormField id="ct-whats" label="WhatsApp"><Input id="ct-whats" type="tel" placeholder="(00) 00000-0000" {...field('contact', 'whatsapp')} /></FormField>
          <FormField id="ct-insta" label="Instagram"><Input id="ct-insta" placeholder="@usuario" {...field('contact', 'instagram')} /></FormField>
          <FormField id="ct-cidade" label="Cidade – UF"><Input id="ct-cidade" placeholder="Cidade – UF" {...field('contact', 'city')} /></FormField>
          <FormField id="ct-prazo" label="Prazo de resposta exibido"><Input id="ct-prazo" placeholder="Ex.: 24H" {...field('contact', 'responseTime')} /></FormField>
        </div>
      </AdminCard>

      {/* SEO */}
      <AdminCard id="metadados" title="Metadados (SEO e compartilhamento)" description="Como o site aparece no Google e quando o link é enviado no WhatsApp ou Instagram.">
        <div className="flex flex-wrap items-start gap-6">
          <div className="flex min-w-0 flex-[999_1_420px] flex-col gap-4">
            <FormField id="m-title" label="Título da página" help={`${s.seo.title.length} de ${SEO_TITLE_MAX} caracteres`}><Input id="m-title" maxLength={SEO_TITLE_MAX} {...field('seo', 'title')} /></FormField>
            <FormField id="m-desc" label="Descrição" help={`${s.seo.description.length} de ${SEO_DESCRIPTION_MAX} caracteres`}><Textarea id="m-desc" rows={3} maxLength={SEO_DESCRIPTION_MAX} {...field('seo', 'description')} /></FormField>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold tracking-label text-fog uppercase">Imagem de compartilhamento</span>
                <Image src={s.seo.shareImageUrl ?? DEFAULT_IMAGES.shareImage} alt={s.seo.shareImageUrl ? 'Imagem de compartilhamento atual' : 'Imagem de compartilhamento padrão'} width={400} height={210} className="aspect-[1200/630] w-full rounded-sm object-cover" />
                {!s.seo.shareImageUrl && <span className="text-xs text-fog">Usando a imagem padrão (logo sobre fundo preto).</span>}
                <ImagePicker variant="drop" folder="site" label={s.seo.shareImageUrl ? 'Trocar imagem' : 'Enviar imagem'} hint="1200 × 630 px" onUploaded={(url) => patch('seo', { shareImageUrl: url })} />
                {s.seo.shareImageUrl && <Button size="sm" variant="ghost" className="self-start" onClick={() => patch('seo', { shareImageUrl: null })}>Remover (usar padrão)</Button>}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold tracking-label text-fog uppercase">Ícone da aba (favicon)</span>
                <span className="flex items-center gap-3">
                  <Image src={s.seo.faviconUrl ?? DEFAULT_IMAGES.favicon} alt={s.seo.faviconUrl ? 'Favicon atual' : 'Favicon padrão'} width={48} height={48} className="size-12 rounded-sm" />
                  {!s.seo.faviconUrl && <span className="text-xs text-fog">Usando o ícone padrão (logo do site).</span>}
                </span>
                <ImagePicker variant="drop" folder="site" accept="image/png" label={s.seo.faviconUrl ? 'Trocar ícone' : 'Enviar ícone'} hint="PNG quadrado, 512 × 512 px" onUploaded={(url) => patch('seo', { faviconUrl: url })} />
                {s.seo.faviconUrl && <Button size="sm" variant="ghost" className="self-start" onClick={() => patch('seo', { faviconUrl: null })}>Remover (usar padrão)</Button>}
              </div>
            </div>
          </div>
          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2">
            <span className="text-[11px] font-semibold tracking-label text-fog uppercase">Prévia na busca</span>
            <div className="flex flex-col gap-1.5 rounded-xl bg-chalk p-5 font-[Arial,sans-serif] text-coal">
              <span className="text-xs text-graphite">{SITE_URL.replace(/^https?:\/\//, '')}</span>
              <span className="text-lg leading-6 text-[#1a0dab]">{s.seo.title}</span>
              <span className="text-[13px] leading-5 text-graphite">{s.seo.description}</span>
            </div>
          </div>
        </div>
      </AdminCard>

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line-strong bg-ink-3 px-5 py-4">
        <span className="text-[13px] text-mist">
          {dirty
            ? 'Você tem alterações não salvas.'
            : initial.updatedAt
              ? `Tudo salvo. Última publicação${initial.updatedByName ? ` por ${initial.updatedByName}` : ''}, ${new Date(initial.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}.`
              : 'Tudo salvo.'}
        </span>
        <span className="flex gap-3">
          <Button variant="outline" disabled={!dirty} onClick={() => { setS(saved); setErrors({}); }}>Descartar</Button>
          <Button disabled={busy || !dirty} onClick={() => void save()}>Salvar e publicar</Button>
        </span>
      </div>
    </>
  );
}
