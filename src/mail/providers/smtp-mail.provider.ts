import { Injectable } from '@nestjs/common';
import { IMailProvider } from './mail-provider.interface';
import { SendMailInput, SendMailResult } from '../interfaces/mail.types';
import { createTransport, SendMailOptions, Transporter } from 'nodemailer';

@Injectable()
export class SmtpMailProvider implements IMailProvider {
  private readonly transporter: Transporter;

  constructor() {
    this.transporter = createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: Number(process.env.SMTP_PORT || 1025),
      secure: process.env.SMTP_SECURE === 'true',
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
            }
          : undefined
    });
  }

  async send(input: SendMailInput): Promise<SendMailResult> {
    const from = process.env.MAIL_FROM_ADDRESS || 'no-reply@localhost';

    const mailOptions: SendMailOptions = {
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      cc: input.cc,
      bcc: input.bcc,
      attachments: input.attachments?.map(attachment => ({
        filename: attachment.filename,
        content: Buffer.from(attachment.content, 'base64'),
        contentType: attachment.type,
        contentDisposition: attachment.disposition === 'inline' ? 'inline' : 'attachment',
        cid: attachment.contentId
      }))
    };

    const response = await this.transporter.sendMail(mailOptions);
    return { messageId: response.messageId };
  }
}


