import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { CommonModule } from '../common/common.module';
import { MAIL_PROVIDER_TOKEN } from './mail.constants';
import { MailTemplateService } from './mail-template.service';
import { SesMailProvider } from './providers/ses-mail.provider';
import { SmtpMailProvider } from './providers/smtp-mail.provider';
import { ConsoleMailProvider } from './providers/console-mail.provider';
import { SendGridMailProvider } from './providers/sendgrid-mail.provider';

@Module({
  imports: [CommonModule],
  providers: [
    {
      provide: MAIL_PROVIDER_TOKEN,
      useFactory: (consoleProvider: ConsoleMailProvider) => {
        const provider = (process.env.MAIL_PROVIDER || 'console').toLowerCase();

        if (provider === 'sendgrid') {
          return new SendGridMailProvider();
        }

        if (provider === 'smtp') {
          return new SmtpMailProvider();
        }

        if (provider === 'ses') {
          return new SesMailProvider();
        }

        return consoleProvider;
      },
      inject: [ConsoleMailProvider]
    },
    ConsoleMailProvider,
    MailTemplateService,
    MailService
  ],
  exports: [MailService]
})
export class MailModule {}

