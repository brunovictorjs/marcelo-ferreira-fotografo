import type { UserRole, UserStatus } from '@mf/shared';
import { domainEvent, type Actor } from '../../../shared/domain/domain-event.js';
import { ConflictError, ForbiddenError, ValidationError } from '../../../shared/domain/domain-errors.js';
import { AggregateRoot, newId } from '../../../shared/domain/entity.js';

export interface UserProps {
  name: string;
  email: string;
  passwordHash: string | null;
  role: UserRole;
  status: UserStatus;
  isOwner: boolean;
  lastAccessAt: Date | null;
  inviteTokenHash: string | null;
  inviteExpiresAt: Date | null;
  resetTokenHash: string | null;
  resetExpiresAt: Date | null;
  createdAt: Date;
}

export const INVITE_TTL_HOURS = 72;
export const RESET_TTL_HOURS = 2;

const hoursFrom = (now: Date, hours: number) => new Date(now.getTime() + hours * 3_600_000);

/**
 * Pessoa com acesso ao painel. O dono (Marcelo) é sempre administrador
 * e não pode ser removido nem rebaixado.
 */
export class User extends AggregateRoot<UserProps> {
  static restore(id: string, props: UserProps): User {
    return new User(id, props);
  }

  static createOwner(input: { name: string; email: string; passwordHash: string }, now: Date): User {
    return new User(newId(), {
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      isOwner: true,
      lastAccessAt: null,
      inviteTokenHash: null,
      inviteExpiresAt: null,
      resetTokenHash: null,
      resetExpiresAt: null,
      createdAt: now,
    });
  }

  static invite(
    input: { name: string; email: string; role: UserRole },
    inviteTokenHash: string,
    now: Date,
    actor: Actor,
  ): User {
    const user = new User(newId(), {
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash: null,
      role: input.role,
      status: 'INVITED',
      isOwner: false,
      lastAccessAt: null,
      inviteTokenHash,
      inviteExpiresAt: hoursFrom(now, INVITE_TTL_HOURS),
      resetTokenHash: null,
      resetExpiresAt: null,
      createdAt: now,
    });
    user.record(domainEvent('identity.user.invited', actor, { userId: user.id, name: input.name, email: user.email }));
    return user;
  }

  get name() { return this.props.name; }
  get email() { return this.props.email; }
  get role() { return this.props.role; }
  get status() { return this.props.status; }
  get isOwner() { return this.props.isOwner; }
  get passwordHash() { return this.props.passwordHash; }
  get isActive() { return this.props.status === 'ACTIVE'; }

  renewInvite(inviteTokenHash: string, now: Date, actor: Actor): void {
    if (this.isActive) throw new ConflictError('Este usuário já ativou o acesso.', 'USER_ALREADY_ACTIVE');
    this.props.inviteTokenHash = inviteTokenHash;
    this.props.inviteExpiresAt = hoursFrom(now, INVITE_TTL_HOURS);
    this.record(domainEvent('identity.user.invite_resent', actor, { userId: this.id, name: this.name }));
  }

  acceptInvite(passwordHash: string, now: Date): void {
    if (this.isActive) throw new ConflictError('Este convite já foi usado.', 'INVITE_USED');
    if (!this.props.inviteExpiresAt || this.props.inviteExpiresAt < now) {
      throw new ValidationError('Este convite expirou. Peça um novo ao administrador.', 'INVITE_EXPIRED');
    }
    this.props.passwordHash = passwordHash;
    this.props.status = 'ACTIVE';
    this.props.inviteTokenHash = null;
    this.props.inviteExpiresAt = null;
    this.props.lastAccessAt = now;
    this.record(domainEvent('identity.user.activated', { id: this.id, name: this.name, role: this.role }, { userId: this.id }));
  }

  requestPasswordReset(resetTokenHash: string, now: Date): void {
    this.props.resetTokenHash = resetTokenHash;
    this.props.resetExpiresAt = hoursFrom(now, RESET_TTL_HOURS);
  }

  resetPassword(passwordHash: string, now: Date): void {
    if (!this.props.resetExpiresAt || this.props.resetExpiresAt < now) {
      throw new ValidationError('O link de redefinição expirou. Solicite outro.', 'RESET_EXPIRED');
    }
    this.props.passwordHash = passwordHash;
    this.props.resetTokenHash = null;
    this.props.resetExpiresAt = null;
    // Quem redefine a senha de um convite pendente também ativa o acesso.
    this.props.status = 'ACTIVE';
    this.props.inviteTokenHash = null;
    this.props.inviteExpiresAt = null;
  }

  recordLogin(now: Date): void {
    this.props.lastAccessAt = now;
  }

  changeRole(role: UserRole, actor: Actor): void {
    if (this.isOwner) throw new ForbiddenError('O perfil do dono do site não pode ser alterado.', 'OWNER_ROLE_LOCKED');
    if (this.id === actor.id) throw new ForbiddenError('Você não pode alterar o próprio perfil.', 'SELF_ROLE_CHANGE');
    if (role === this.role) return;
    this.props.role = role;
    this.record(domainEvent('identity.user.role_changed', actor, { userId: this.id, name: this.name, role }));
  }

  markRemovedBy(actor: Actor): void {
    if (this.isOwner) throw new ForbiddenError('O dono do site não pode ser removido.', 'OWNER_LOCKED');
    if (this.id === actor.id) throw new ForbiddenError('Você não pode remover o próprio acesso.', 'SELF_REMOVAL');
    this.record(domainEvent('identity.user.removed', actor, { userId: this.id, name: this.name }));
  }

  toActor(): Actor {
    return { id: this.id, name: this.name, role: this.role };
  }
}
