import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { type AccessTokenPayload, AccessTokens, OneTimeTokens, PasswordHasher } from '../domain/ports.js';

const ROUNDS = 12;

@Injectable()
export class BcryptPasswordHasher extends PasswordHasher {
  /** Hash descartável para gastar o mesmo tempo quando o usuário não existe. */
  private readonly dummy = bcrypt.hashSync('dummy-password', ROUNDS);

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, ROUNDS);
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    if (!hash) {
      await bcrypt.compare(plain, this.dummy);
      return false;
    }
    return bcrypt.compare(plain, hash);
  }
}

@Injectable()
export class Sha256OneTimeTokens extends OneTimeTokens {
  generate(): { token: string; hash: string } {
    const token = randomBytes(32).toString('base64url');
    return { token, hash: this.hash(token) };
  }

  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

@Injectable()
export class JwtAccessTokens extends AccessTokens {
  constructor(
    private readonly jwt: JwtService,
    private readonly ttlHours: number,
  ) {
    super();
  }

  async issue(payload: AccessTokenPayload): Promise<{ token: string; expiresAt: Date }> {
    const expiresIn = this.ttlHours * 3600;
    const token = await this.jwt.signAsync({ ...payload }, { expiresIn });
    return { token, expiresAt: new Date(Date.now() + expiresIn * 1000) };
  }

  async verify(token: string): Promise<AccessTokenPayload | null> {
    try {
      const { sub, role } = await this.jwt.verifyAsync<AccessTokenPayload>(token);
      return { sub, role };
    } catch {
      return null;
    }
  }
}
