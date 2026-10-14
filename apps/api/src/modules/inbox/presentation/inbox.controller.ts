import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { contactMessageSchema, type ListMessagesQuery, listMessagesQuerySchema } from '@mf/shared';
import { z } from 'zod';
import type { Actor } from '../../../shared/domain/domain-event.js';
import { CurrentActor, Public } from '../../../shared/presentation/auth.decorators.js';
import { ZodValidationPipe } from '../../../shared/presentation/zod-validation.pipe.js';
import { InboxUseCases } from '../application/inbox.use-cases.js';

const answeredSchema = z.object({ answered: z.boolean() });

@Controller('messages')
export class MessagesController {
  constructor(private readonly inbox: InboxUseCases) {}

  @Get()
  list(@Query(new ZodValidationPipe(listMessagesQuerySchema)) query: ListMessagesQuery) {
    return this.inbox.list(query.filter);
  }

  @Get('unread-count')
  async unread() {
    return { unreadMessages: await this.inbox.countUnread() };
  }

  @Post(':id/read')
  @HttpCode(200)
  read(@Param('id') id: string) {
    return this.inbox.markRead(id);
  }

  @Patch(':id/answered')
  answered(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(answeredSchema)) body: { answered: boolean },
    @CurrentActor() actor: Actor,
  ) {
    return this.inbox.setAnswered(id, body.answered, actor);
  }

  @Post(':id/archive')
  @HttpCode(204)
  async archive(@Param('id') id: string, @CurrentActor() actor: Actor) {
    await this.inbox.archive(id, actor);
  }
}

/** Formulário de contato do site. */
@Public()
@Controller('public/contact')
export class PublicContactController {
  constructor(private readonly inbox: InboxUseCases) {}

  @Throttle({ default: { limit: 5, ttl: 10 * 60_000 } })
  @Post()
  @HttpCode(202)
  async send(@Body(new ZodValidationPipe(contactMessageSchema)) body: z.output<typeof contactMessageSchema>) {
    await this.inbox.receive(body);
    return { ok: true };
  }
}
