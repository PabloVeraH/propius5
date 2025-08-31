import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SendMailOptions, Transporter } from 'nodemailer';
import * as path from 'path';
import { promises as fs } from 'fs';
import * as Handlebars from 'handlebars';

export type MailSendOptions = {
  to: string | string[];
  subject: string;
  template?: string;                // nombre de archivo sin extensión (e.g. 'reset-password')
  variables?: Record<string, any>;  // variables para la plantilla
  html?: string;                    // alternativa a template
  text?: string;                    // opcional; si no se provee y hay html, se deriva
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: SendMailOptions['attachments'];
  headers?: SendMailOptions['headers'];
};

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;
  private readonly defaultFrom = process.env.MAIL_FROM || 'No Reply <no-reply@example.com>';
  private readonly templatesDir =
    process.env.MAIL_TEMPLATES_DIR || path.join(process.cwd(), 'src', 'modules', 'shared', 'mail', 'templates');
  private readonly templateCache = new Map<string, Handlebars.TemplateDelegate>();

  async onModuleInit(): Promise<void> {
    const host = process.env.MAIL_HOST;
    const port = parseInt(process.env.MAIL_PORT || '587', 10);
    const secure = (process.env.MAIL_SECURE || '').toLowerCase() === 'true' || port === 465;
    const user = process.env.MAIL_USER;
    const pass = process.env.MAIL_PASS;

    if (!host && process.env.NODE_ENV !== 'production') {
      // Fallback cómodo para desarrollo si no hay SMTP configurado
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      this.logger.warn(`Usando cuenta Ethereal para desarrollo: ${testAccount.user}`);
    } else if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: user && pass ? { user, pass } : undefined,
      });
    } else {
      throw new Error('MAIL_HOST no configurado y NODE_ENV=production: configura SMTP.');
    }

    try {
      await this.transporter.verify();
      this.logger.log('SMTP verificado correctamente');
    } catch (err) {
      this.logger.warn(`No se pudo verificar el transporte SMTP: ${String(err)}`);
    }
  }

  async send(opts: MailSendOptions): Promise<void> {
    if (!opts.to) throw new Error('Parámetro "to" es obligatorio');
    if (!opts.subject) throw new Error('Parámetro "subject" es obligatorio');

    let html = opts.html;
    let text = opts.text;

    if (!html && opts.template) {
      html = await this.renderTemplate(opts.template, opts.variables ?? {});
    }

    if (!text && html) {
      text = this.htmlToText(html);
    }

    const mail: SendMailOptions = {
      from: opts.from || this.defaultFrom,
      to: opts.to,
      subject: opts.subject,
      html,
      text,
      cc: opts.cc,
      bcc: opts.bcc,
      attachments: opts.attachments,
      headers: opts.headers,
    };

    const info = await this.transporter.sendMail(mail);

    // Si es Ethereal, muestra URL de previsualización en logs
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) this.logger.log(`Preview Ethereal: ${preview}`);
  }

  private async renderTemplate(name: string, variables: Record<string, any>): Promise<string> {
    const filePath = path.join(this.templatesDir, `${name}.hbs`);

    let tpl = this.templateCache.get(filePath);
    if (!tpl) {
      const source = await fs.readFile(filePath, 'utf8');
      tpl = Handlebars.compile(source, { noEscape: false });
      this.templateCache.set(filePath, tpl);
    }

    return tpl(variables);
  }

  // Conversión simple de HTML a texto plano sin dependencias extra
  private htmlToText(html: string): string {
    return html
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<\/(p|div|h[1-6]|li|br)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}