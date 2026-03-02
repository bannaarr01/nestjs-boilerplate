import { Inject, Injectable } from '@nestjs/common';
import { MAIL_PROVIDER_TOKEN } from './mail.constants';
import { MailTemplateService } from './mail-template.service';
import { IMailProvider } from './providers/mail-provider.interface';
import { ErrorHandlerService } from '../common/services/error-handler.service';
import { SendMailInput, SendMailResult, SendTemplateInput } from './interfaces/mail.types';

@Injectable()
export class MailService {
   constructor(
    @Inject(MAIL_PROVIDER_TOKEN)
    private readonly mailProvider: IMailProvider,
    private readonly mailTemplateService: MailTemplateService,
    private readonly errorHandler: ErrorHandlerService
   ) {}

   async send(input: SendMailInput): Promise<SendMailResult> {
      try {
         return await this.mailProvider.send(input);
      } catch (error) {
         throw this.errorHandler.handleServiceError(error, MailService, '.send');
      }
   }

   async sendTemplate(input: SendTemplateInput): Promise<SendMailResult> {
      try {
         const html = this.mailTemplateService.render(input.templateName, input.templateData || {});

         return await this.send({
            to: input.to,
            subject: input.subject,
            html,
            text: input.textFallback,
            cc: input.cc,
            bcc: input.bcc,
            attachments: input.attachments
         });
      } catch (error) {
         throw this.errorHandler.handleServiceError(error, MailService, '.sendTemplate');
      }
   }
}


