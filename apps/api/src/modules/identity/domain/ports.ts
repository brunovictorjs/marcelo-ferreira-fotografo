import type { UserRole } from '@mf/shared';
import type { User } from './user.js';

export abstract class UserRepository {
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findByInviteTokenHash(hash: string): Promise<User | null>;
  abstract findByResetTokenHash(hash: string): Promise<User | null>;
  abstract list(): Promise<User[]>;
  abstract count(): Promise<number>;
  abstract save(user: User): Promise<void>;
  abstract delete(id: string): Promise<void>;
}

export abstract class PasswordHasher {
  abstract hash(plain: string): Promise<string>;
  abstract compare(plain: string, hash: string): Promise<boolean>;
}

/** Tokens de uso único (convite, redefinição de senha). Só o hash vai para o banco. */
export abstract class OneTimeTokens {
  abstract generate(): { token: string; hash: string };
  abstract hash(token: string): string;
}

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
}

export abstract class AccessTokens {
  abstract issue(payload: AccessTokenPayload): Promise<{ token: string; expiresAt: Date }>;
  abstract verify(token: string): Promise<AccessTokenPayload | null>;
}

/** E-mails transacionais do módulo de identidade. */
export abstract class IdentityNotifier {
  abstract sendInvite(user: User, token: string, invitedBy: string): Promise<void>;
  abstract sendPasswordReset(user: User, token: string): Promise<void>;
}
