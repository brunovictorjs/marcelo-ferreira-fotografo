import { formatPrice, PRICE_MODE_LABEL, type ServiceDto } from '@mf/shared';
import { ServiceIcon } from '@/components/icons';
import { Reveal } from '@/components/motion/reveal';
import { SectionHeading } from './section-heading';

export function priceLabel(s: Pick<ServiceDto, 'priceMode' | 'priceCents'>) {
  if (s.priceMode === 'ON_REQUEST' || s.priceCents == null) return { label: 'Valor', value: 'Sob consulta' };
  return { label: PRICE_MODE_LABEL[s.priceMode], value: `R$ ${formatPrice(s.priceCents)}` };
}

/** Card de serviço — reaproveitado na prévia do painel. */
export function ServiceCard({ service }: { service: ServiceDto }) {
  const price = priceLabel(service);
  return (
    <article data-reveal className="flex flex-col gap-5 rounded-xl border border-line bg-ink-3 p-8">
      <ServiceIcon icon={service.icon} size={32} className="text-mist" />
      <h3 className="text-[22px] leading-7 font-bold uppercase">{service.name}</h3>
      {service.description && <p className="text-[15px] leading-[23px] text-fog">{service.description}</p>}
      {service.includes.length > 0 && (
        <ul className="flex flex-col gap-2 border-t border-line pt-5 text-sm leading-5 text-mist uppercase">
          {service.includes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      <div className="mt-auto flex flex-col gap-1">
        <span className="label-caps">{price.label}</span>
        <span className="text-[26px] font-extrabold uppercase">{price.value}</span>
      </div>
      <a
        href="#contato"
        className="inline-flex min-h-12 items-center justify-center rounded-sm border-2 border-line-strong px-4.5 text-[13px] font-bold tracking-[0.08em] uppercase transition-colors hover:border-chalk"
      >
        Solicitar orçamento
      </a>
    </article>
  );
}

export function ServicesSection({ services }: { services: ServiceDto[] }) {
  if (services.length === 0) return null;
  return (
    <section id="servicos" className="scroll-mt-20 border-t border-line bg-ink-2">
      <Reveal className="section-container flex flex-col gap-12 py-24 lg:py-32">
        <SectionHeading
          index="02"
          eyebrow="Serviços"
          title="O que eu faço"
          aside={
            <p data-reveal className="max-w-[420px] leading-6 text-fog">
              Cada trabalho começa com uma conversa. Escolha o serviço e peça seu orçamento personalizado.
            </p>
          }
        />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-6">
          {services.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      </Reveal>
    </section>
  );
}
