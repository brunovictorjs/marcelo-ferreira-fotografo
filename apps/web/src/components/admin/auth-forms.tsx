'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { type ReactNode, useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  acceptInviteAction,
  forgotPasswordAction,
  type FormState,
  loginAction,
  resetPasswordAction,
} from '@/lib/actions/auth';
import { FormField } from './admin-ui';

function AuthCard({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-5 rounded-xl border border-line bg-ink-2 p-8">
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold tracking-label text-fog uppercase">{eyebrow}</span>
        <h1 className="text-[28px] leading-8 font-extrabold">{title}</h1>
      </div>
      {children}
    </div>
  );
}

function Feedback({ state }: { state: FormState }) {
  if (state.error) return <p role="alert" className="text-sm text-[#ff8a80]">{state.error}</p>;
  if (state.success) return <p role="status" className="text-sm text-mist">{state.success}</p>;
  return null;
}

export function LoginForm() {
  const params = useSearchParams();
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});
  const notice = params.get('senha')
    ? 'Senha alterada. Entre com a nova senha.'
    : params.get('expirada')
      ? 'Sua sessão expirou. Entre novamente.'
      : null;

  return (
    <>
      <AuthCard eyebrow="Painel do fotógrafo" title="Entrar">
        {notice && !state.error && <p role="status" className="text-sm text-mist">{notice}</p>}
        <form action={action} className="flex flex-col gap-5">
          <input type="hidden" name="next" value={params.get('next') ?? ''} />
          <FormField id="l-email" label="E-mail">
            <Input id="l-email" name="email" type="email" autoComplete="username" placeholder="voce@email.com" required />
          </FormField>
          <FormField id="l-senha" label="Senha">
            <Input id="l-senha" name="password" type="password" autoComplete="current-password" placeholder="Sua senha" required />
          </FormField>
          <Feedback state={state} />
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? 'Entrando…' : 'Entrar'}
          </Button>
          <Link href="/painel/esqueci-senha" className="text-center text-[13px] text-mist hover:text-white">
            Esqueci minha senha
          </Link>
        </form>
      </AuthCard>
      <p className="text-center text-[13px] leading-5 text-fog">Primeiro acesso? Use o link do convite enviado para o seu e-mail.</p>
    </>
  );
}

function NewPasswordForm({
  eyebrow,
  title,
  submit,
  serverAction,
}: {
  eyebrow: string;
  title: string;
  submit: string;
  serverAction: (s: FormState, f: FormData) => Promise<FormState>;
}) {
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [state, action, pending] = useActionState<FormState, FormData>(serverAction, {});

  if (!token) {
    return (
      <AuthCard eyebrow={eyebrow} title="Link inválido">
        <p className="text-sm text-fog">Este link está incompleto. Abra novamente o link recebido por e-mail.</p>
      </AuthCard>
    );
  }

  return (
    <AuthCard eyebrow={eyebrow} title={title}>
      <form action={action} className="flex flex-col gap-5">
        <input type="hidden" name="token" value={token} />
        <FormField id="p-senha" label="Nova senha" help="Mínimo de 8 caracteres.">
          <Input id="p-senha" name="password" type="password" autoComplete="new-password" minLength={8} required />
        </FormField>
        <FormField id="p-confirma" label="Confirme a senha">
          <Input id="p-confirma" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
        </FormField>
        <Feedback state={state} />
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? 'Salvando…' : submit}
        </Button>
      </form>
    </AuthCard>
  );
}

export const AcceptInviteForm = () => (
  <NewPasswordForm eyebrow="Convite para o painel" title="Crie sua senha" submit="Criar senha e entrar" serverAction={acceptInviteAction} />
);

export const ResetPasswordForm = () => (
  <NewPasswordForm eyebrow="Redefinir senha" title="Nova senha" submit="Salvar nova senha" serverAction={resetPasswordAction} />
);

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(forgotPasswordAction, {});
  return (
    <AuthCard eyebrow="Redefinir senha" title="Esqueci minha senha">
      <form action={action} className="flex flex-col gap-5">
        <p className="text-sm leading-6 text-fog">Informe o e-mail de acesso. Enviaremos um link para criar uma nova senha.</p>
        <FormField id="f-email" label="E-mail">
          <Input id="f-email" name="email" type="email" autoComplete="email" required />
        </FormField>
        <Feedback state={state} />
        <Button type="submit" size="lg" disabled={pending || !!state.success}>
          {pending ? 'Enviando…' : 'Enviar link'}
        </Button>
        <Link href="/painel/login" className="text-center text-[13px] text-mist hover:text-white">
          Voltar para o login
        </Link>
      </form>
    </AuthCard>
  );
}
