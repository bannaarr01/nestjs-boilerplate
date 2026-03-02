import { SendMailInput, SendMailResult } from '../interfaces/mail.types';

export interface IMailProvider {
  send(input: SendMailInput): Promise<SendMailResult>;
}


