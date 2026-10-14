import { Injectable } from '@nestjs/common';
import type {
  AcceptInviteInput,
  ForgotPasswordInput,
  LoginInput,
  LoginResponse,
  ResetPasswordInput,
  SessionUser,
} from '@mf/shared';
import { Clock, EventBus } from '../../../shared/application/ports.js';
import { NotFoundError, UnauthorizedError } from '../../../shared/domain/domain-errors.js';
import { AccessTokens, IdentityNotifier, OneTimeTokens, PasswordHasher, UserRepository } from '../domain/ports.js';
import type { User } from '../domain/user.js';
import { toSessionUser } from './user.mapper.js';

const INVALID_LOGIN = 'E-mail ou senha incorretos.';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: AccessTokens,
    private readonly clock: Clock,
  ) {}

  async execute(input: LoginInput): Promise<LoginResponse> {
    const user = await this.users.findByEmail(input.email);
    // Compara mesmo sem usuário (hash vazio), para não revelar pelo tempo de resposta quais e-mails existem.
    const ok = await this.hasher.compare(input.password, user?.passwordHash ?? '');
    if (!user || !user.isActive || !ok) throw new UnauthorizedError(INVALID_LOGIN, 'INVALID_CREDENTIALS');
    return this.startSession(user);
  }

  async startSession(user: User): Promise<LoginResponse> {
    user.recordLogin(this.clock.now());
    await this.users.save(user);
    const { token, expiresAt } = await this.tokens.issue({ sub: user.id, role: user.role });
    return { accessToken: token, expiresAt: expiresAt.toISOString(), user: toSessionUser(user) };
  }
}

@Injectable()
export class GetSessionUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(userId: string): Promise<SessionUser> {
    const user = await this.users.findById(userId);
    if (!user || !user.isActive) throw new UnauthorizedError();
    return toSessionUser(user);
  }
}

@Injectable()
export class AcceptInviteUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly oneTime: OneTimeTokens,
    private readonly clock: Clock,
    private readonly events: EventBus,
    private readonly login: LoginUseCase,
  ) {}

  /** Cria a senha e já devolve a sessão, para entrar direto no painel. */
  async execute(input: AcceptInviteInput): Promise<LoginResponse> {
    const user = await this.users.findByInviteTokenHash(this.oneTime.hash(input.token));
    if (!user) throw new NotFoundError('Convite', 'INVITE_NOT_FOUND');
    user.acceptInvite(await this.hasher.hash(input.password), this.clock.now());
    await this.users.save(user);
    await this.events.publish(user.pullEvents());
    return this.login.startSession(user);
  }
}

@Injectable()
export class RequestPasswordResetUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly oneTime: OneTimeTokens,
    private readonly notifier: IdentityNotifier,
    private readonly clock: Clock,
  ) {}

  /** Sempre responde OK, exista ou não o e-mail (evita enumeração de usuários). */
  async execute(input: ForgotPasswordInput): Promise<void> {
    const user = await this.users.findByEmail(input.email);
    if (!user) return;
    const { token, hash } = this.oneTime.generate();
    user.requestPasswordReset(hash, this.clock.now());
    await this.users.save(user);
    await this.notifier.sendPasswordReset(user, token);
  }
}

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly oneTime: OneTimeTokens,
    private readonly clock: Clock,
  ) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    const user = await this.users.findByResetTokenHash(this.oneTime.hash(input.token));
    if (!user) throw new NotFoundError('Link de redefinição', 'RESET_NOT_FOUND');
    user.resetPassword(await this.hasher.hash(input.password), this.clock.now());
    await this.users.save(user);
  }
}
