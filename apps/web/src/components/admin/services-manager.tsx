'use client';

import {
  formatPrice,
  type PriceMode,
  PRICE_MODE_LABEL,
  PRICE_MODES,
  parsePrice,
  SERVICE_ICON_LABEL,
  SERVICE_ICONS,
  type ServiceDto,
  type ServiceIcon as ServiceIconName,
} from '@mf/shared';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { ServiceIcon } from '@/components/icons';
import { ServiceCard } from '@/components/site/services-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { cn } from '@/lib/utils';
import { AdminCard, FormField, PageHeader } from './admin-ui';
import { ConfirmButton } from './confirm-button';
import { priceLine } from './price';
import { useMutation, useSortable } from './hooks';
import { SortableItem } from './sortable-item';

interface Form {
  name: string;
  description: string;
  includes: string;
  priceMode: PriceMode;
  price: string;
  icon: ServiceIconName;
  visible: boolean;
}

const toForm = (s: ServiceDto | null): Form => ({
  name: s?.name ?? 'Novo serviço',
  description: s?.description ?? '',
  includes: s?.includes.join('\n') ?? '',
  priceMode: s?.priceMode ?? 'ON_REQUEST',
  price: s?.priceCents != null ? formatPrice(s.priceCents) : '',
  icon: s?.icon ?? 'CAMERA',
  visible: s?.visible ?? false,
});

export function ServicesManager({ services }: { services: ServiceDto[] }) {
  const { run, attempt, busy } = useMutation();
  const [selectedId, setSelectedId] = useState<string | null>(services[0]?.id ?? null);
  const current = services.find((s) => s.id === selectedId) ?? null;
  const [form, setForm] = useState<Form>(() => toForm(current));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const sortable = useSortable(services, (ids) => void attempt(() => api('/services/order', { method: 'PUT', json: { ids } }), 'Ordem dos serviços salva'));

  const select = (s: ServiceDto | null) => {
    setSelectedId(s?.id ?? null);
    setForm(toForm(s));
    setErrors({});
  };
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const body = {
    name: form.name,
    description: form.description,
    includes: form.includes.split('\n').map((l) => l.trim()).filter(Boolean),
    priceMode: form.priceMode,
    priceCents: form.priceMode === 'ON_REQUEST' ? null : parsePrice(form.price),
    icon: form.icon,
    visible: form.visible,
  };

  const save = async () => {
    setErrors({});
    try {
      const saved = await run(
        () => api<ServiceDto>(current ? `/services/${current.id}` : '/services', { method: current ? 'PUT' : 'POST', json: body }),
        'Serviço salvo • o site já está atualizado',
      );
      if (saved) setSelectedId(saved.id);
    } catch (e) {
      if (e instanceof ApiError) setErrors(e.fieldErrors());
    }
  };

  const preview: ServiceDto = { id: 'preview', position: 0, ...body, description: body.description || null, priceCents: body.priceCents ?? null };

  return (
    <>
      <PageHeader
        eyebrow="Cardápio de serviços"
        title="Serviços"
        actions={<Button onClick={() => select(null)}><Plus className="size-4" strokeWidth={2} aria-hidden />Novo serviço</Button>}
      />
      <div className="flex flex-wrap items-start gap-6">
        <ul className="flex min-w-0 flex-[1_1_300px] flex-col gap-2.5">
          {sortable.list.map((s, i) => (
            <SortableItem
              key={s.id}
              selected={s.id === selectedId}
              onSelect={() => select(s)}
              title={s.name}
              subtitle={priceLine(s)}
              pill={<Badge variant={s.visible ? 'default' : 'outline'}>{s.visible ? 'No site' : 'Oculto'}</Badge>}
              dragProps={sortable.itemProps(s.id)}
              onMove={(d) => sortable.moveBy(s.id, d)}
              first={i === 0}
              last={i === sortable.list.length - 1}
            />
          ))}
          {!current && (
            <li className="rounded-xl border border-chalk bg-ink-3 p-4 text-sm font-bold">{form.name || 'Novo serviço'} <span className="font-normal text-fog">(não salvo)</span></li>
          )}
        </ul>

        <div className="flex min-w-0 flex-[999_1_460px] flex-col gap-6">
          <AdminCard
            title={current ? 'Editar serviço' : 'Novo serviço'}
            aside={
              <span className="flex items-center gap-2.5 text-[13px] text-fog">
                Visível no site
                <Switch checked={form.visible} onCheckedChange={(v) => set('visible', v)} aria-label="Mostrar este serviço no site" />
              </span>
            }
          >
            <FormField id="s-nome" label="Nome do serviço" error={errors.name}>
              <Input id="s-nome" value={form.name} onChange={(e) => set('name', e.target.value)} />
            </FormField>
            <FormField id="s-desc" label="Descrição curta" error={errors.description}>
              <Textarea id="s-desc" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
            </FormField>
            <FormField id="s-inc" label="O que está incluso (um item por linha)" error={errors.includes}>
              <Textarea id="s-inc" rows={3} value={form.includes} onChange={(e) => set('includes', e.target.value)} />
            </FormField>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
              <FormField id="s-modo" label="Exibição do preço">
                <select id="s-modo" className="field h-11.5 py-0 text-[15px]" value={form.priceMode} onChange={(e) => set('priceMode', e.target.value as PriceMode)}>
                  {PRICE_MODES.map((m) => <option key={m} value={m}>{PRICE_MODE_LABEL[m]}</option>)}
                </select>
              </FormField>
              <FormField id="s-preco" label="Valor (R$)" error={errors.priceCents}>
                <Input id="s-preco" inputMode="decimal" placeholder="0,00" disabled={form.priceMode === 'ON_REQUEST'} value={form.price} onChange={(e) => set('price', e.target.value)} />
              </FormField>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold tracking-label text-fog uppercase">Ícone</span>
              <div role="group" aria-label="Escolher ícone" className="flex flex-wrap gap-2">
                {SERVICE_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    aria-label={SERVICE_ICON_LABEL[icon]}
                    aria-pressed={form.icon === icon}
                    onClick={() => set('icon', icon)}
                    className={cn('flex size-11 items-center justify-center rounded-sm border bg-ink hover:border-chalk', form.icon === icon ? 'border-chalk' : 'border-line')}
                  >
                    <ServiceIcon icon={icon} size={20} />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap justify-between gap-3 border-t border-line pt-5">
              {current ? (
                <ConfirmButton
                  trigger={<Button variant="outline">Excluir</Button>}
                  title={`Excluir “${current.name}”?`}
                  description="O card sai do site. Projetos vinculados a este serviço ficam sem serviço."
                  onConfirm={async () => {
                    await attempt(() => api(`/services/${current.id}`, { method: 'DELETE' }), 'Serviço excluído');
                    select(services.find((s) => s.id !== current.id) ?? null);
                  }}
                />
              ) : (
                <span />
              )}
              <Button disabled={busy} onClick={() => void save()}>Salvar serviço</Button>
            </div>
          </AdminCard>

          <div className="flex flex-col gap-2.5">
            <span className="text-[11px] font-semibold tracking-label text-fog uppercase">Prévia do card no site</span>
            <div className="max-w-[360px]">
              <ServiceCard service={preview} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
