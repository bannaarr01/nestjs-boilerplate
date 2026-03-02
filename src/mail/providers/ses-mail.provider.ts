import { Injectable, Logger } from '@nestjs/common';
import { IMailProvider } from './mail-provider.interface';
import { SendMailInput, SendMailResult } from '../interfaces/mail.types';

type SesSendResult = {
  MessageId?: string;
};

type SesClientLike = {
  send(command: unknown): Promise<SesSendResult>;
};

type SesModuleLike = {
  SESClient: new (config: Record<string, unknown>) => SesClientLike;
  SendEmailCommand: new (input: Record<string, unknown>) => unknown;
};

@Injectable()
export class SesMailProvider implements IMailProvider {
   private readonly logger = new Logger(SesMailProvider.name);
   private readonly sesClient: SesClientLike;
   private readonly sendEmailCommand: SesModuleLike['SendEmailCommand'];
   private readonly sourceEmail: string;

   constructor() {
      const sesModule = this.loadSesModule();
      const region = process.env.AWS_REGION;
      const sourceEmail = process.env.EMAIL_SOURCE || process.env.MAIL_FROM_ADDRESS;

      if (!region) {
         throw new Error('AWS_REGION is required when MAIL_PROVIDER=ses');
      }

      if (!sourceEmail) {
         throw new Error('EMAIL_SOURCE or MAIL_FROM_ADDRESS is required when MAIL_PROVIDER=ses');
      }

      const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
      const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
      const hasStaticCredentials = !!accessKeyId && !!secretAccessKey;

      this.sesClient = new sesModule.SESClient({
         region,
         ...(hasStaticCredentials
            ? {
               credentials: {
                  accessKeyId,
                  secretAccessKey
               }
            }
            : {})
      });

      this.sendEmailCommand = sesModule.SendEmailCommand;
      this.sourceEmail = sourceEmail;
   }

   async send(input: SendMailInput): Promise<SendMailResult> {
      if (input.attachments && input.attachments.length > 0) {
         throw new Error(
            'SES provider does not support attachments in this template. Use smtp/sendgrid or implement raw MIME.'
         );
      }

      const params = {
         Source: this.sourceEmail,
         Destination: {
            ToAddresses: this.toArray(input.to),
            ...(input.cc ? { CcAddresses: this.toArray(input.cc) } : {}),
            ...(input.bcc ? { BccAddresses: this.toArray(input.bcc) } : {})
         },
         Message: {
            Subject: {
               Data: input.subject,
               Charset: 'UTF-8'
            },
            Body: {
               ...(input.html
                  ? {
                     Html: {
                        Data: input.html,
                        Charset: 'UTF-8'
                     }
                  }
                  : {}),
               ...(input.text || !input.html
                  ? {
                     Text: {
                        Data: input.text || '',
                        Charset: 'UTF-8'
                     }
                  }
                  : {})
            }
         }
      };

      const command = new this.sendEmailCommand(params);
      const result = await this.sesClient.send(command);

      this.logger.log(`Email sent via SES: ${result.MessageId || 'unknown-message-id'}`);

      return {
         messageId: result.MessageId
      };
   }

   private toArray(value: string | string[]): string[] {
      return Array.isArray(value) ? value : [value];
   }

   private loadSesModule(): SesModuleLike {
      try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
         return require('@aws-sdk/client-ses') as SesModuleLike;
      } catch {
         throw new Error(
            'MAIL_PROVIDER=ses requires @aws-sdk/client-ses. Run: npm install @aws-sdk/client-ses'
         );
      }
   }
}


