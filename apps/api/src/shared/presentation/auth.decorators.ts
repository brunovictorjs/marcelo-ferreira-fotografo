import { createParamDecorator, type ExecutionContext, SetMetadata } from '@nestjs/common';
import type { UserRole } from '@mf/shared';
import type { Actor } from '../domain/domain-event.js';

export const IS_PUBLIC_KEY = 'auth:isPublic';
export const ROLES_KEY = 'auth:roles';

/** Rota aberta ao visitante do site (sem token). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Restringe a rota a perfis específicos. Sem o decorator, qualquer usuário logado acessa. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export interface AuthenticatedRequest {
  actor?: Actor & { email: string; isOwner: boolean };
}

/** Injeta o usuário autenticado (como Actor do domínio). */
export const CurrentActor = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  return req.actor;
});
