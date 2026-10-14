import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@mf/shared';
import type { Request } from 'express';
import { ForbiddenError, UnauthorizedError } from '../../../shared/domain/domain-errors.js';
import {
  type AuthenticatedRequest,
  IS_PUBLIC_KEY,
  ROLES_KEY,
} from '../../../shared/presentation/auth.decorators.js';
import { AccessTokens, UserRepository } from '../domain/ports.js';

/**
 * Guard global: toda rota exige token, exceto as marcadas com @Public().
 * O usuário é recarregado do banco a cada requisição, então remover o acesso
 * ou trocar o perfil vale imediatamente.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: AccessTokens,
    private readonly users: UserRepository,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const targets = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) return true;

    const req = ctx.switchToHttp().getRequest<Request & AuthenticatedRequest>();
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    const payload = token ? await this.tokens.verify(token) : null;
    if (!payload) throw new UnauthorizedError('Sessão expirada. Entre novamente.', 'SESSION_EXPIRED');

    const user = await this.users.findById(payload.sub);
    if (!user || !user.isActive) throw new UnauthorizedError('Acesso removido.', 'ACCESS_REVOKED');

    const roles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, targets);
    if (roles?.length && !roles.includes(user.role)) throw new ForbiddenError();

    req.actor = { ...user.toActor(), email: user.email, isOwner: user.isOwner };
    return true;
  }
}
