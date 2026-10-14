'use client';

import { type ActivityDto, initials, type UserDto, type UserRole, USER_ROLE_LABEL } from '@mf/shared';
import { Check, Plus } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { AdminCard, FormField, PageHeader } from './admin-ui';
import { ConfirmButton } from './confirm-button';
import { useMutation } from './hooks';

const PERMISSIONS: [string, boolean][] = [
  ['Mensagens: ler e responder', true],
  ['Portfólio e projetos', true],
  ['Categorias', true],
  ['Serviços', true],
  ['Depoimentos', true],
  ['Configurações do site', true],
  ['Usuários e convites', false],
];

const formatWhen = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}, ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
};

export function UsersManager({ users, activity, meId }: { users: UserDto[]; activity: ActivityDto[]; meId: string }) {
  const { run, attempt, busy } = useMutation();
  const [inviting, setInviting] = useState(false);
  const [draft, setDraft] = useState({ name: '', email: '', role: 'EDITOR' as UserRole });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const invite = async () => {
    setErrors({});
    try {
      await run(() => api('/users/invite', { method: 'POST', json: draft }), `Convite enviado para ${draft.email}`);
      setDraft({ name: '', email: '', role: 'EDITOR' });
      setInviting(false);
    } catch (e) {
      if (e instanceof ApiError) setErrors({ ...e.fieldErrors(), form: e.issues?.length ? '' : e.message });
    }
  };

  return (
    <>
      <PageHeader eyebrow="Quem acessa o painel" title="Usuários" actions={<Button onClick={() => setInviting((v) => !v)}><Plus className="size-4" strokeWidth={2} aria-hidden />Convidar usuário</Button>} />
      <p className="max-w-[760px] text-sm leading-[22px] text-fog">
        Cada pessoa entra com o próprio e-mail e senha. O convite chega por e-mail com um link para criar a senha. Só administradores veem esta página.
      </p>

      {inviting && (
        <AdminCard title="Novo convite" className="border-line-strong">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            <FormField id="u-nome" label="Nome" error={errors.name}>
              <Input id="u-nome" placeholder="Nome completo" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
            </FormField>
            <FormField id="u-email" label="E-mail" error={errors.email}>
              <Input id="u-email" type="email" placeholder="pessoa@email.com" value={draft.email} onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))} />
            </FormField>
            <FormField id="u-perfil" label="Perfil">
              <select id="u-perfil" className="field h-11.5 py-0 text-[15px]" value={draft.role} onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value as UserRole }))}>
                <option value="EDITOR">Editor</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </FormField>
          </div>
          {errors.form && <p role="alert" className="text-sm text-[#ff8a80]">{errors.form}</p>}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setInviting(false)}>Cancelar</Button>
            <Button disabled={busy} onClick={() => void invite()}>Enviar convite</Button>
          </div>
        </AdminCard>
      )}

      <div className="relative overflow-x-auto rounded-xl border border-line">
        <table className="w-full border-collapse text-sm max-md:block lg:min-w-[860px]">
          <thead className="max-md:sr-only">
            <tr className="border-b border-line text-left">
              {['Usuário', 'Perfil', 'Situação', 'Último acesso'].map((h) => (
                <th key={h} scope="col" className="px-4 py-3.5 text-[11px] font-semibold tracking-label text-fog uppercase">{h}</th>
              ))}
              <th scope="col" className="px-4 py-3.5"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody className="max-md:block">
            {users.map((u) => {
              const locked = u.isOwner || u.id === meId;
              return (
                <tr key={u.id} className="border-b border-line hover:bg-ink-2 max-md:flex max-md:flex-col max-md:gap-3 max-md:p-4 max-md:last:border-b-0">
                  <td className="px-4 py-3.5 max-md:p-0">
                    <span className="flex items-center gap-3">
                      <span aria-hidden className="flex size-10 flex-none items-center justify-center rounded-full border border-line-strong text-xs font-extrabold">{initials(u.name)}</span>
                      <span className="flex flex-col gap-0.5">
                        <span className="font-bold">{u.name}{u.id === meId && ' (você)'}</span>
                        <span className="text-xs break-all text-fog">{u.email}</span>
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5 max-md:p-0">
                    {locked ? (
                      <Badge>{USER_ROLE_LABEL[u.role]}</Badge>
                    ) : (
                      <>
                        <label htmlFor={`role-${u.id}`} className="sr-only">Perfil de {u.name}</label>
                        <select
                          id={`role-${u.id}`}
                          className="field w-full px-3 py-2 text-[13px] md:w-[180px]"
                          value={u.role}
                          onChange={(e) => void attempt(() => api(`/users/${u.id}/role`, { method: 'PATCH', json: { role: e.target.value } }), 'Perfil atualizado')}
                        >
                          <option value="EDITOR">Editor</option>
                          <option value="ADMIN">Administrador</option>
                        </select>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3.5 max-md:p-0"><Badge variant={u.status === 'ACTIVE' ? 'default' : 'outline'}>{u.status === 'ACTIVE' ? 'Ativo' : 'Convite pendente'}</Badge></td>
                  <td className="px-4 py-3.5 text-[13px] text-fog max-md:p-0"><span className="md:sr-only">Último acesso: </span>{formatWhen(u.lastAccessAt)}</td>
                  <td className="px-4 py-3.5 text-right max-md:p-0 max-md:text-left">
                    <span className="inline-flex flex-wrap gap-2">
                      {u.status === 'INVITED' && (
                        <Button size="sm" variant="outline" onClick={() => void attempt(() => api(`/users/${u.id}/resend-invite`, { method: 'POST' }), `Convite reenviado para ${u.email}`)}>
                          Reenviar convite
                        </Button>
                      )}
                      {!locked && (
                        <ConfirmButton
                          trigger={<Button size="sm" variant="outline">Remover acesso</Button>}
                          title={`Remover o acesso de ${u.name}?`}
                          description="A pessoa sai do painel imediatamente. Você pode convidá-la de novo depois."
                          confirmLabel="Remover acesso"
                          onConfirm={() => attempt(() => api(`/users/${u.id}`, { method: 'DELETE' }), 'Acesso removido')}
                        />
                      )}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <AdminCard title="O que cada perfil pode fazer" className="min-w-0 flex-[999_1_520px]">
          <div className="relative overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th scope="col" className="py-2.5 text-[11px] font-semibold tracking-label text-fog uppercase">Área</th>
                  <th scope="col" className="px-2 py-2.5 text-center text-[11px] font-semibold tracking-label text-fog uppercase"><span className="sm:hidden">Admin</span><span className="max-sm:hidden">Administrador</span></th>
                  <th scope="col" className="px-2 py-2.5 text-center text-[11px] font-semibold tracking-label text-fog uppercase">Editor</th>
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map(([area, editor]) => (
                  <tr key={area} className="border-b border-line">
                    <th scope="row" className="py-3 text-left font-semibold">{area}</th>
                    <td className="px-2 py-3 text-center"><Check className="inline size-[18px]" strokeWidth={2} aria-label="Permitido" /></td>
                    <td className="px-2 py-3 text-center">
                      {editor ? <Check className="inline size-[18px]" strokeWidth={2} aria-label="Permitido" /> : <span className="text-xs text-fog">Sem<br className="sm:hidden" /> acesso</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
        <AdminCard title="Atividade recente" className="min-w-0 flex-[1_1_320px]">
          {activity.length ? (
            <ul className="flex flex-col gap-3.5 text-[13px] leading-5">
              {activity.map((a, i) => (
                <li key={a.id} className={i < activity.length - 1 ? 'flex flex-col gap-0.5 border-b border-line pb-3' : 'flex flex-col gap-0.5'}>
                  <span><strong>{a.actorName}</strong> {a.description}</span>
                  <span className="text-fog">{formatWhen(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-fog">Nada por aqui ainda.</p>
          )}
        </AdminCard>
      </div>
    </>
  );
}
