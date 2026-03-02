import { Injectable } from '@nestjs/common';
import { IMailProvider } from './mail-provider.interface';
import SendGrid, { MailDataRequired } from '@sendgrid/mail';
import { SendMailInput, SendMailResult } from '../interfaces/mail.types';

@Injectable()
export class SendGridMailProvider implements IMailProvider {
   constructor() {
      const apiKey = process.env.SENDGRID_API_KEY;
      if (!apiKey) {
         throw new Error('SENDGRID_API_KEY is required when MAIL_PROVIDER=sendgrid');
      }
      SendGrid.setApiKey(apiKey);
   }

   async send(input: SendMailInput): Promise<SendMailResult> {
      const from = process.env.MAIL_FROM_ADDRESS;
      if (!from) {
         throw new Error('MAIL_FROM_ADDRESS is required for sendgrid provider');
      }

      const mailData = {
         to: input.to,
         from,
         subject: input.subject,
         ...(input.text && { text: input.text }),
         ...(input.html && { html: input.html }),
         ...(!input.text && !input.html && { text: '' }),
         ...(input.cc && { cc: input.cc }),
         ...(input.bcc && { bcc: input.bcc }),
         ...(input.attachments && {
            attachments: input.attachments.map(attachment => ({
               content: attachment.content,
               filename: attachment.filename,
               type: attachment.type,
               disposition: attachment.disposition,
               content_id: attachment.contentId
            }))
         })
      } as MailDataRequired;

      const [response] = await SendGrid.send(mailData);

      return {
         messageId: response.headers['x-message-id'] as string | undefined
      };
   }
}


