import { Injectable } from '@nestjs/common';
import type { ChangeUserRoleInput, InviteUserInput, UserDto } from '@mf/shared';
import { Clock, EventBus } from '../../../shared/application/ports.js';
import type { Actor } from '../../../shared/domain/domain-event.js';
import { ConflictError, NotFoundError } from '../../../shared/domain/domain-errors.js';
import { IdentityNotifier, OneTimeTokens, UserRepository } from '../domain/ports.js';
import { User } from '../domain/user.js';
import { toUserDto } from './user.mapper.js';

@Injectable()
export class ListUsersUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(): Promise<UserDto[]> {
    const list = await this.users.list();
    // Dono primeiro, depois ativos, depois convites pendentes.
    return list
      .sort((a, b) => Number(b.isOwner) - Number(a.isOwner) || Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name))
      .map(toUserDto);
  }
}

@Injectable()
export class InviteUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly oneTime: OneTimeTokens,
    private readonly notifier: IdentityNotifier,
    private readonly clock: Clock,
    private readonly events: EventBus,
  ) {}

  async execute(input: InviteUserInput, actor: Actor): Promise<UserDto> {
    if (await this.users.findByEmail(input.email)) {
      throw new ConflictError('Já existe um usuário com este e-mail.', 'EMAIL_TAKEN');
    }
    const { token, hash } = this.oneTime.generate();
    const user = User.invite(input, hash, this.clock.now(), actor);
    await this.users.save(user);
    await this.notifier.sendInvite(user, token, actor.name);
    await this.events.publish(user.pullEvents());
    return toUserDto(user);
  }
}

@Injectable()
export class ResendInviteUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly oneTime: OneTimeTokens,
    private readonly notifier: IdentityNotifier,
    private readonly clock: Clock,
    private readonly events: EventBus,
  ) {}

  async execute(userId: string, actor: Actor): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('Usuário');
    const { token, hash } = this.oneTime.generate();
    user.renewInvite(hash, this.clock.now(), actor);
    await this.users.save(user);
    await this.notifier.sendInvite(user, token, actor.name);
    await this.events.publish(user.pullEvents());
  }
}

@Injectable()
export class ChangeUserRoleUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly events: EventBus,
  ) {}

  async execute(userId: string, input: ChangeUserRoleInput, actor: Actor): Promise<UserDto> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('Usuário');
    user.changeRole(input.role, actor);
    await this.users.save(user);
    await this.events.publish(user.pullEvents());
    return toUserDto(user);
  }
}

@Injectable()
export class RemoveUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly events: EventBus,
  ) {}

  async execute(userId: string, actor: Actor): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('Usuário');
    user.markRemovedBy(actor);
    await this.users.delete(user.id);
    await this.events.publish(user.pullEvents());
  }
}

/** Usado pelo seed: cria o dono do site se ainda não existir nenhum usuário. */
@Injectable()
export class EnsureOwnerUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(owner: User): Promise<boolean> {
    if ((await this.users.count()) > 0) return false;
    await this.users.save(owner);
    return true;
  }
}
