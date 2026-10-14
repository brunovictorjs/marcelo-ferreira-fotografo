import type { SessionUser, UserDto } from '@mf/shared';
import type { User } from '../domain/user.js';

export const toUserDto = (user: User): UserDto => {
  const s = user.snapshot();
  return {
    id: s.id,
    name: s.name,
    email: s.email,
    role: s.role,
    status: s.status,
    isOwner: s.isOwner,
    lastAccessAt: s.lastAccessAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
  };
};

export const toSessionUser = (user: User): SessionUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isOwner: user.isOwner,
});
