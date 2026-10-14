'use client';

import type { ContactSettings } from '@mf/shared';
import { Check } from 'lucide-react';
import { useActionState, useEffect, useRef, useState } from 'react';
import { InstagramIcon, MailIcon, PinIcon, WhatsappIcon } from '@/components/icons';
import { gsap, MOTION } from '@/components/motion/gsap';
import { Reveal } from '@/components/motion/reveal';
import { type FormState } from '@/lib/actions/auth';
import { sendContactAction } from '@/lib/actions/contact';
import { cn } from '@/lib/utils';

const onlyDigits = (s: string) => s.replace(/\D/g, '');

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="label-caps">
        {label}
      </label>
      {children}
      {error && (
        <span id={`${id}-erro`} className="text-[13px] text-[#ff8a80]">
          {error}
        </span>
      )}
    </div>
  );
}

/** "Vamos conversar?" — salva em Mensagens no painel e avisa Marcelo por e-mail. */
export function ContactSection({ contact, workTypes }: { contact: ContactSettings; workTypes: string[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendContactAction, {});
  const [sentKey, setSentKey] = useState(0);
  const successRef = useRef<HTMLDivElement>(null);
  const sent = state.success === 'ok' && sentKey === 0;
  const fe = state.fieldErrors ?? {};

  useEffect(() => {
    if (!sent || !successRef.current || !window.matchMedia(MOTION.ok).matches) return;
    gsap.from(successRef.current.children, { autoAlpha: 0, y: 24, stagger: 0.1 });
  }, [sent]);

  const channels = [
    contact.whatsapp && {
      icon: WhatsappIcon,
      label: `WhatsApp ${contact.whatsapp}`,
      href: `https://wa.me/55${onlyDigits(contact.whatsapp)}`,
    },
    contact.recipientEmail && { icon: MailIcon, label: contact.recipientEmail, href: `mailto:${contact.recipientEmail}` },
    contact.instagram && {
      icon: InstagramIcon,
      label: contact.instagram,
      href: `https://instagram.com/${contact.instagram.replace(/^@/, '')}`,
      lower: true,
    },
    contact.city && { icon: PinIcon, label: contact.city },
  ].filter(Boolean) as { icon: typeof MailIcon; label: string; href?: string; lower?: boolean }[];

  return (
    <section id="contato" className="scroll-mt-20 border-t border-line bg-ink-2">
      <Reveal className="section-container flex flex-wrap gap-16 py-24 lg:py-32">
        <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-8">
          <div className="flex flex-col gap-3">
            <span data-reveal className="label-caps">
              05 — Contato
            </span>
            <h2 data-reveal className="text-[clamp(48px,5vw,72px)] leading-[0.95] font-extrabold tracking-[-0.01em]">
              VAMOS
              <br />
              <span className="text-chrome">CONVERSAR?</span>
            </h2>
          </div>
          <p data-reveal className="max-w-[400px] leading-6 text-fog">
            Conte o que você imagina. Marcelo responde pessoalmente
            {contact.responseTime ? `, normalmente em até ${contact.responseTime}` : ''}.
          </p>
          <ul data-reveal className="flex flex-col gap-4 text-sm font-semibold tracking-[0.04em]">
            {channels.map(({ icon: Icon, label, href, lower }) => {
              const content = (
                <>
                  <span aria-hidden className="flex size-11 items-center justify-center rounded-full border border-line">
                    <Icon size={20} />
                  </span>
                  <span className={lower ? '' : 'uppercase'}>{label}</span>
                </>
              );
              return (
                <li key={label}>
                  {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-mist">
                      {content}
                    </a>
                  ) : (
                    <span className="flex items-center gap-3">{content}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div data-reveal className="min-w-0 flex-[1_1_520px] rounded-xl border border-line bg-ink p-6 sm:p-10">
          {sent ? (
            <div ref={successRef} role="status" className="flex min-h-[520px] flex-col items-start justify-center gap-5">
              <span aria-hidden className="flex size-16 items-center justify-center rounded-full border-2 border-line-strong">
                <Check className="size-7" strokeWidth={1.5} />
              </span>
              <span className="text-[40px] leading-none font-extrabold">MENSAGEM ENVIADA</span>
              <span className="font-script text-[40px] text-mist">obrigado pelo contato</span>
              <p className="max-w-[420px] leading-6 text-fog">
                Marcelo recebeu sua mensagem e vai responder pelo e-mail ou WhatsApp informado.
              </p>
              <button
                type="button"
                onClick={() => setSentKey((k) => k + 1)}
                className="min-h-12 rounded-sm border-2 border-line-strong px-5 text-[13px] font-bold tracking-[0.08em] uppercase hover:border-chalk"
              >
                Enviar outra mensagem
              </button>
            </div>
          ) : (
            <form key={sentKey} action={action} className="flex flex-col gap-5" noValidate>
              {/* Honeypot: invisível para pessoas, preenchido por robôs. */}
              <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
                <label htmlFor="c-site">Site</label>
                <input id="c-site" name="website" tabIndex={-1} autoComplete="off" />
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5">
                <Field id="c-nome" label="Nome" error={fe.name}>
                  <input id="c-nome" name="name" className="field" placeholder="Seu nome completo" autoComplete="name" required aria-invalid={!!fe.name} />
                </Field>
                <Field id="c-tel" label="WhatsApp" error={fe.phone}>
                  <input id="c-tel" name="phone" type="tel" className="field" placeholder="(00) 00000-0000" autoComplete="tel" />
                </Field>
              </div>
              <Field id="c-email" label="E-mail" error={fe.email}>
                <input id="c-email" name="email" type="email" className="field" placeholder="voce@email.com" autoComplete="email" required aria-invalid={!!fe.email} />
              </Field>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5">
                <Field id="c-tipo" label="Tipo de trabalho" error={fe.workType}>
                  <select id="c-tipo" name="workType" className="field" defaultValue={workTypes[0]}>
                    {[...workTypes, 'Outro'].map((w) => (
                      <option key={w}>{w}</option>
                    ))}
                  </select>
                </Field>
                <Field id="c-data" label="Data desejada" error={fe.desiredDate}>
                  <input id="c-data" name="desiredDate" type="date" className="field [color-scheme:dark]" />
                </Field>
              </div>
              <Field id="c-msg" label="Mensagem" error={fe.message}>
                <textarea
                  id="c-msg"
                  name="message"
                  rows={5}
                  className="field"
                  placeholder="Conte um pouco sobre o que você quer fotografar, local e quantidade de pessoas."
                  required
                  aria-invalid={!!fe.message}
                />
              </Field>
              {state.error && (
                <p role="alert" className="text-sm text-[#ff8a80]">
                  {state.error}
                </p>
              )}
              <button
                type="submit"
                disabled={pending}
                className={cn(
                  'min-h-14 rounded-sm bg-chalk text-sm font-bold tracking-[0.08em] text-ink uppercase transition-colors hover:bg-mist',
                  pending && 'opacity-70',
                )}
              >
                {pending ? 'Enviando…' : 'Enviar mensagem'}
              </button>
              <p className="text-[13px] leading-[18px] text-fog">Seus dados são usados apenas para responder este contato.</p>
            </form>
          )}
        </div>
      </Reveal>
    </section>
  );
}
