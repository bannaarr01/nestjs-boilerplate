export type MailAttachment = {
  filename: string;
  content: string;
  type?: string;
  disposition?: string;
  contentId?: string;
};

export type SendMailInput = {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: MailAttachment[];
};

export type SendTemplateInput = {
  to: string | string[];
  subject: string;
  templateName: string;
  templateData?: Record<string, unknown>;
  textFallback?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: MailAttachment[];
};

export type SendMailResult = {
  messageId?: string;
};
