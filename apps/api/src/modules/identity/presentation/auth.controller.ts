import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  type AcceptInviteInput,
  acceptInviteSchema,
  type ForgotPasswordInput,
  forgotPasswordSchema,
  type LoginInput,
  loginSchema,
  type ResetPasswordInput,
  resetPasswordSchema,
} from '@mf/shared';
import type { Actor } from '../../../shared/domain/domain-event.js';
import { CurrentActor, Public } from '../../../shared/presentation/auth.decorators.js';
import { ZodValidationPipe } from '../../../shared/presentation/zod-validation.pipe.js';
import {
  AcceptInviteUseCase,
  GetSessionUserUseCase,
  LoginUseCase,
  RequestPasswordResetUseCase,
  ResetPasswordUseCase,
} from '../application/auth.use-cases.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly login: LoginUseCase,
    private readonly me: GetSessionUserUseCase,
    private readonly acceptInvite: AcceptInviteUseCase,
    private readonly requestReset: RequestPasswordResetUseCase,
    private readonly resetPassword: ResetPasswordUseCase,
  ) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  signIn(@Body(new ZodValidationPipe(loginSchema)) body: LoginInput) {
    return this.login.execute(body);
  }

  @Get('me')
  session(@CurrentActor() actor: Actor) {
    return this.me.execute(actor.id);
  }

  @Public()
  @Post('invite/accept')
  @HttpCode(200)
  accept(@Body(new ZodValidationPipe(acceptInviteSchema)) body: AcceptInviteInput) {
    return this.acceptInvite.execute(body);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('password/forgot')
  @HttpCode(204)
  async forgot(@Body(new ZodValidationPipe(forgotPasswordSchema)) body: ForgotPasswordInput) {
    await this.requestReset.execute(body);
  }

  @Public()
  @Post('password/reset')
  @HttpCode(204)
  async reset(@Body(new ZodValidationPipe(resetPasswordSchema)) body: ResetPasswordInput) {
    await this.resetPassword.execute(body);
  }
}
