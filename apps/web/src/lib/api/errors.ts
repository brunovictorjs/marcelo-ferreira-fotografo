import type { ApiErrorBody } from '@mf/shared';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly issues: ApiErrorBody['issues'] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static async fromResponse(res: Response): Promise<ApiError> {
    const body = (await res.json().catch(() => null)) as Partial<ApiErrorBody> | null;
    return new ApiError(
      res.status,
      body?.code ?? 'HTTP_ERROR',
      body?.message ?? `Erro ${res.status}. Tente novamente.`,
      body?.issues ?? [],
    );
  }

  /** Mapa campo → mensagem, para exibir junto dos inputs. */
  fieldErrors(): Record<string, string> {
    return Object.fromEntries((this.issues ?? []).map((i) => [i.path, i.message]));
  }
}

export const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : 'Algo deu errado. Tente novamente.';
