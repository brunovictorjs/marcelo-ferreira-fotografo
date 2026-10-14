import { Module } from '@nestjs/common';
import { SiteSettingsModule } from '../site-settings/site-settings.module.js';
import { InboxUseCases } from './application/inbox.use-cases.js';
import { ContactMessageRepository, InboxNotifier } from './domain/contact-message.js';
import { EmailInboxNotifier, PrismaContactMessageRepository } from './infrastructure/inbox.adapters.js';
import { MessagesController, PublicContactController } from './presentation/inbox.controller.js';

@Module({
  imports: [SiteSettingsModule],
  controllers: [MessagesController, PublicContactController],
  providers: [
    { provide: ContactMessageRepository, useClass: PrismaContactMessageRepository },
    { provide: InboxNotifier, useClass: EmailInboxNotifier },
    InboxUseCases,
  ],
})
export class InboxModule {}
