/** Quem executou a ação (usuário do painel) — ou `null` para o visitante do site. */
export interface Actor {
  id: string;
  name: string;
  role: 'ADMIN' | 'EDITOR';
}

export interface DomainEvent<Payload extends object = Record<string, unknown>> {
  /** Ex.: "portfolio.project.published" */
  readonly name: string;
  readonly occurredAt: Date;
  readonly actor: Actor | null;
  readonly payload: Payload;
}

export function domainEvent<Payload extends object>(
  name: string,
  actor: Actor | null,
  payload: Payload,
): DomainEvent<Payload> {
  return { name, actor, payload, occurredAt: new Date() };
}
