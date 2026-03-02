import { Injectable } from '@nestjs/common';
import { IMailProvider } from './mail-provider.interface';
import { LoggingService } from '../../logging/logging.service';
import { SendMailInput, SendMailResult } from '../interfaces/mail.types';

@Injectable()
export class ConsoleMailProvider implements IMailProvider {
   constructor(private readonly logger: LoggingService) {}

   async send(input: SendMailInput): Promise<SendMailResult> {
      this.logger.getLogger().info(`Console mail provider sent email: ${input.subject}`, {
         label: 'ConsoleMailProvider.send',
         to: Array.isArray(input.to) ? input.to.join(', ') : input.to
      });

      return {
         messageId: `console-${Date.now()}`
      };
   }
}


