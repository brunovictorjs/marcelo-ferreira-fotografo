/**
 * Erros de domínio/aplicação. Não conhecem HTTP: o DomainExceptionFilter
 * traduz cada tipo para o status adequado.
 */
export abstract class DomainError extends Error {
  abstract readonly kind:
    | 'validation'
    | 'not_found'
    | 'conflict'
    | 'unauthorized'
    | 'forbidden';

  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends DomainError {
  readonly kind = 'validation' as const;
  constructor(message: string, code = 'VALIDATION_FAILED') {
    super(message, code);
  }
}

export class NotFoundError extends DomainError {
  readonly kind = 'not_found' as const;
  constructor(resource: string, code = 'NOT_FOUND') {
    super(`${resource} não encontrado(a).`, code);
  }
}

export class ConflictError extends DomainError {
  readonly kind = 'conflict' as const;
  constructor(message: string, code = 'CONFLICT') {
    super(message, code);
  }
}

export class UnauthorizedError extends DomainError {
  readonly kind = 'unauthorized' as const;
  constructor(message = 'Não autenticado.', code = 'UNAUTHORIZED') {
    super(message, code);
  }
}

export class ForbiddenError extends DomainError {
  readonly kind = 'forbidden' as const;
  constructor(message = 'Você não tem permissão para esta ação.', code = 'FORBIDDEN') {
    super(message, code);
  }
}
