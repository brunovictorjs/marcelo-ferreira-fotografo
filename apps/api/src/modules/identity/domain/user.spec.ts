import { User } from './user.js';

const now = new Date('2026-10-12T12:00:00Z');
const hours = (h: number) => new Date(now.getTime() + h * 3_600_000);
const admin = { id: 'admin', name: 'Marcelo Ferreira', role: 'ADMIN' as const };

const owner = () => User.createOwner({ name: 'Marcelo Ferreira', email: 'Marcelo@Example.com', passwordHash: 'h' }, now);
const invited = () => User.invite({ name: 'Filho Um', email: 'filho@example.com', role: 'EDITOR' }, 'token-hash', now, admin);

describe('User', () => {
  it('normaliza o e-mail e nasce como dono administrador ativo', () => {
    const u = owner();
    expect(u.email).toBe('marcelo@example.com');
    expect(u.role).toBe('ADMIN');
    expect(u.isActive).toBe(true);
  });

  it('o dono não pode ser removido nem ter o perfil alterado', () => {
    const u = owner();
    expect(() => u.markRemovedBy(admin)).toThrow(/dono/);
    expect(() => u.changeRole('EDITOR', admin)).toThrow(/dono/);
  });

  it('convite é aceito dentro do prazo e ativa o usuário', () => {
    const u = invited();
    expect(u.isActive).toBe(false);
    u.acceptInvite('nova-senha-hash', hours(24));
    expect(u.isActive).toBe(true);
    expect(u.snapshot().inviteTokenHash).toBeNull();
  });

  it('convite expirado é recusado', () => {
    expect(() => invited().acceptInvite('x', hours(73))).toThrow(/expirou/);
  });

  it('ninguém altera o próprio perfil', () => {
    const u = invited();
    expect(() => u.changeRole('ADMIN', { id: u.id, name: u.name, role: 'EDITOR' })).toThrow(/próprio perfil/);
  });

  it('redefinição de senha respeita o prazo de 2 horas', () => {
    const u = owner();
    u.requestPasswordReset('reset-hash', now);
    expect(() => u.resetPassword('x', hours(3))).toThrow(/expirou/);
    u.requestPasswordReset('reset-hash', now);
    u.resetPassword('novo-hash', hours(1));
    expect(u.passwordHash).toBe('novo-hash');
  });
});
