import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import type { Env } from '../../config/env.js';
import {
  AcceptInviteUseCase,
  GetSessionUserUseCase,
  LoginUseCase,
  RequestPasswordResetUseCase,
  ResetPasswordUseCase,
} from './application/auth.use-cases.js';
import {
  ChangeUserRoleUseCase,
  EnsureOwnerUseCase,
  InviteUserUseCase,
  ListUsersUseCase,
  RemoveUserUseCase,
  ResendInviteUseCase,
} from './application/user-management.use-cases.js';
import { AccessTokens, IdentityNotifier, OneTimeTokens, PasswordHasher, UserRepository } from './domain/ports.js';
import { EmailIdentityNotifier } from './infrastructure/email.identity-notifier.js';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository.js';
import { BcryptPasswordHasher, JwtAccessTokens, Sha256OneTimeTokens } from './infrastructure/security.adapters.js';
import { AuthController } from './presentation/auth.controller.js';
import { AuthGuard } from './presentation/auth.guard.js';
import { UsersController } from './presentation/users.controller.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        secret: config.get('JWT_SECRET', { infer: true }),
      }),
    }),
  ],
  controllers: [AuthController, UsersController],
  providers: [
    { provide: UserRepository, useClass: PrismaUserRepository },
    { provide: PasswordHasher, useClass: BcryptPasswordHasher },
    { provide: OneTimeTokens, useClass: Sha256OneTimeTokens },
    { provide: IdentityNotifier, useClass: EmailIdentityNotifier },
    {
      provide: AccessTokens,
      inject: [JwtService, ConfigService],
      useFactory: (jwt: JwtService, config: ConfigService<Env, true>) =>
        new JwtAccessTokens(jwt, config.get('JWT_EXPIRES_IN_HOURS', { infer: true })),
    },
    { provide: APP_GUARD, useClass: AuthGuard },
    LoginUseCase,
    GetSessionUserUseCase,
    AcceptInviteUseCase,
    RequestPasswordResetUseCase,
    ResetPasswordUseCase,
    ListUsersUseCase,
    InviteUserUseCase,
    ResendInviteUseCase,
    ChangeUserRoleUseCase,
    RemoveUserUseCase,
    EnsureOwnerUseCase,
  ],
  exports: [PasswordHasher, EnsureOwnerUseCase],
})
export class IdentityModule {}
