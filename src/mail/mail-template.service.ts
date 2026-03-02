import Mustache from 'mustache';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailTemplateService {
  private readonly templatesPath = process.env.MAIL_TEMPLATES_PATH || 'mail-templates';

  render(templateName: string, templateData: Record<string, unknown> = {}): string {
    const safeTemplateName = this.normalizeTemplateName(templateName);
    const fullPath = join(process.cwd(), this.templatesPath, `${safeTemplateName}.html`);
    const template = readFileSync(fullPath, 'utf-8');
    return Mustache.render(template, templateData);
  }

  private normalizeTemplateName(templateName: string): string {
    const normalized = templateName.trim().replace(/\\/g, '/').replace(/^\/+/, '');

    if (!normalized || normalized.includes('..') || !/^[a-zA-Z0-9/_-]+$/.test(normalized)) {
      throw new Error('Invalid mail template name');
    }

    return normalized;
  }
}

