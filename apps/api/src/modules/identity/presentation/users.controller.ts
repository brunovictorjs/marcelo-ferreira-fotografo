import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import {
  type ChangeUserRoleInput,
  changeUserRoleSchema,
  type InviteUserInput,
  inviteUserSchema,
} from '@mf/shared';
import type { Actor } from '../../../shared/domain/domain-event.js';
import { CurrentActor, Roles } from '../../../shared/presentation/auth.decorators.js';
import { ZodValidationPipe } from '../../../shared/presentation/zod-validation.pipe.js';
import {
  ChangeUserRoleUseCase,
  InviteUserUseCase,
  ListUsersUseCase,
  RemoveUserUseCase,
  ResendInviteUseCase,
} from '../application/user-management.use-cases.js';

/** "Só administradores veem esta página." */
@Roles('ADMIN')
@Controller('users')
export class UsersController {
  constructor(
    private readonly listUsers: ListUsersUseCase,
    private readonly inviteUser: InviteUserUseCase,
    private readonly resendInvite: ResendInviteUseCase,
    private readonly changeRole: ChangeUserRoleUseCase,
    private readonly removeUser: RemoveUserUseCase,
  ) {}

  @Get()
  list() {
    return this.listUsers.execute();
  }

  @Post('invite')
  invite(@Body(new ZodValidationPipe(inviteUserSchema)) body: InviteUserInput, @CurrentActor() actor: Actor) {
    return this.inviteUser.execute(body, actor);
  }

  @Post(':id/resend-invite')
  @HttpCode(204)
  async resend(@Param('id') id: string, @CurrentActor() actor: Actor) {
    await this.resendInvite.execute(id, actor);
  }

  @Patch(':id/role')
  role(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(changeUserRoleSchema)) body: ChangeUserRoleInput,
    @CurrentActor() actor: Actor,
  ) {
    return this.changeRole.execute(id, body, actor);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @CurrentActor() actor: Actor) {
    await this.removeUser.execute(id, actor);
  }
}
